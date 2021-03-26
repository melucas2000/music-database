const express = require("express");
const router = express.Router();
const path = require("path");
const User = require("../model/User");
const Log = require("../model/logs");
const bcrypt = require("bcryptjs");
const { registerValidation, loginValidation } = require("./../security/validation");
const passport = require("passport");
const Playlists = require("./../model/playlist");
const rateLimit = require("express-rate-limit");

/* Limiter middleware to limit requests made */
const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1mins
    max: 3, // max 3 requests in windowMs time
    message: "Maximum login attempts reached. Please try again later.",
});

/* All HTTPS for register and login related pages. */

// Homepage (Login)
router
    .route("/")
    .get((req, res) => {
        const url = req.protocol + '://' + req.get('host') + req.originalUrl;

        /* Localhost shows up as ::1 when requesting IP Address.
        But we cannot use req.ip when app is deployed to Heroku.
        This block saves the correct log when running locally*/
        if (req.ip == "::1") {
            const log = new Log({
                host: req.ip,
                resource: url,
                intent: "Access Homepage",
                time: Date.now()
            })

            log.save();
        } else {
            /* While this block saves the correct log using a different
            request method when app is accessed through Heroku etc. */
            const log = new Log({
                host: req.headers['x-forwarded-for'],
                resource: url,
                intent: "Access Homepage",
                time: Date.now()
            })
    
            log.save();
        }
        res.sendFile(path.resolve("pages/auth/login.html"));
    })

// Register
router
    .route("/register")
    .get((req, res) => {
        res.sendFile(path.resolve("pages/auth/register.html"));
    })
    .post(async (req, res) => {
        /* If user did not confirm that they are 18+ then do not bother with 
        input validation and simply return an error */
        if (req.body.tick != "checked") {
            return res.render("error.ejs", { error: "User must be 18+ to register" })
        }

        /* Proceed with registration only if validation has no errors.
        This line below passes registration details to our schema. Then
        we extract only the errors from the JSON object that it returns */
        const { error } = registerValidation(req.body);

        // If there is any validation error, display it to the user.
        if (error) {
            return res.render("error.ejs", { error: error.details[0].message })
        }

        // Check if email already exists.
        const emailExist = await User.findOne({ email: req.body.email });
        if (emailExist) {
            return res.render("error.ejs", { error: "Email already exists" })
        }

        // Check if username already exists.
        const userExists = await User.findOne({ username: req.body.username });
        if (userExists) {
            return res.render("error.ejs", { error: "Username already exists" })
        }

        /* If we reach this point, there are no validation erros and username and 
        email are unique. So we can move to saving their passwords now */

        // Hash the password with default salt complexity
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        /* Create new User object. We defined this MongoB model in models
        folder and imported it here. Note that we are storing the hashed 
        password, not plain text. */
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        });

        // Each new account gets its own private Liked Songs playlist.
        const play = new Playlists({
            username: req.body.username,
            playlistName: "Liked Songs",
            playlistPopularity: 0
        });

        // Save new user
        try {
            /* Use the mongoose save method to save the User object we created earlier.
            This saves it in our database online. */
            const savedUser = await user.save();
            console.log("Registration successful");

            /* We try to save rhe default Liked Songs playlist ONLY if we were able to 
            save the user without any errors, so this try statement is nested. */
            try {
                // Save the playlist and redirect user to login page.
                const savedList = await play.save();
                console.log("Default playlist created.");
                return res.redirect("/")
            } catch (error) {
                /* If playlist creation fails, we delete the newly created user too
                and prompt the user to create their account again. */
                console.log("Default playlist creation unsuccessful.")
                User.findOneAndDelete({ email: req.body.email }, function (err) {
                    if (err) console.log(err);
                    console.log("Deleted user since playlist failed");
                });
                return res.render("error.ejs", { error: "Registration failed. Please try again." })
            }
        } catch (error) {
            console.log("Registration unsuccessful");
            // res.status(400).send(error);
            return res.render("error.ejs", { error: "Registration failed. Please try again." })
        }
    })

// Login
router
    .route("/login")
    .get((req, res) => {
        res.redirect("/")
    })
    .post(loginLimiter, (req, res, next) => {
        //url for logger
        const url = req.protocol + '://' + req.get('host') + req.originalUrl;

        const { error } = loginValidation(req.body);
        if (error) {
            // If user input is invalid display the errors.
            console.log("Invalid input");
            return res.render("error.ejs", { error: error.details[0].message })
        }

        /* If there are no validation problems, we use Passport for
        authentication. We tell it to use the LocalStrategy we created,
        which essentially just matches the username & password from the database,
        and tell it to redirect users to their profile if successfull or error page
        if unsuccessful. */
        passport.authenticate("local", (err, user, info) => {
            if (err) { return next(err); }
            if (!user) {
                // If not authenticated, create log with success = false.
                if (req.ip == "::1") {
                    const log = new Log({
                        host: req.ip,
                        resource: url,
                        intent: "Login",
                        time: Date.now(),
                        success: false
                    })
                    log.save();
                } else {
                    const log = new Log({
                        host: req.headers['x-forwarded-for'],
                        resource: url,
                        intent: "Login",
                        time: Date.now(),
                        success: false
                    })
                    log.save();
                }
                // After logging, tell users about incorrect credentials.
                return res.render("error.ejs", { error: "Incorrect email or password" })
            }
            req.logIn(user, function (err) {
                if (err) { return next(err); }
                // If  authenticated, create log with success = true.
                if (req.ip == "::1") {
                    const log = new Log({
                        host: req.ip,
                        resource: url,
                        intent: "Login",
                        time: Date.now(),
                        success: true
                    })
                    log.save();
                } else {
                    const log = new Log({
                        host: req.headers['x-forwarded-for'],
                        resource: url,
                        intent: "Login",
                        time: Date.now(),
                        success: true
                    })
                    log.save();
                }
                return res.redirect("/user/profile");
            });
        })(req, res, next);
    })

// Logout
router
    .get("/logout", (req, res) => {
        /* Logout method provided by Passport module. It clears
        all user related data and starts a fresh state with no user
        information. Upon logout we redirect users to the login page */
        req.logOut();
        console.log("Logout successful");
        res.redirect("/");
    });

module.exports = router;