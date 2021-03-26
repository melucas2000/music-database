const express = require("express");
const router = express.Router();
const User = require("../model/User");
const async = require('async');
const crypto = require('crypto');
const dotenv = require('dotenv');
const sgMail = require('@sendgrid/mail')
const bcrypt = require("bcryptjs");

/* Begin using environment variables */
dotenv.config();

/* Secret key needed to use SENDGRID email feature */
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

router
    .route("/")
    .get((req, res) => {
        res.render("reset.ejs");
    })
    .post((req, res, next) => {
        /* Waterfall function which runs in steps.
        Stops wherever an error is encountered otherwise
        passes resulting values from one function to next */
        async.waterfall([
            // Create a random 20 character token using Node's crypto library
            function (done) {
                crypto.randomBytes(20, (err, res) => {
                    const token = res.toString("hex");

                    /* This function is "done" now. If there were any errors it will pass it to 
                    err and stop running the remaining functions. Otherwise the result of this
                    fuction will be passed to token variable, which can be used in the next function */
                    done(err, token);
                });
            },
            // If user is found, assign token to them.
            function (token, done) {
                /* Search for the email entered on the password reset page. Same error handling as before.
                If user is found, the user object gets assigned to user variable. */
                User.findOne({ email: req.body.email }, (err, user) => {
                    // If no email found, display error
                    if (!user) {
                        return res.render("error.ejs", {error: "The account does not exist"});
                    }

                    // Assign previously generated token to this user's resetPasswordToken field.
                    user.resetPasswordToken = token;

                    // Token expires in one hour from time of token creation. (3600000 ms = 1 hour)
                    user.resetPasswordExpires = Date.now() + 3600000;

                    // Save token and expiry time in the database.
                    user.save((err) => {
                        // If done without error, pass token and user to next function
                        done(err, token, user);
                    });
                });
            },
            // Now that user is found and their token generated, we create the message with reset link to be sent.
            function (token, user, done) {
                /* Contents of the email. Contains like to our website + the route at which the token can be used.
                Note: we use req.headers.host because this code will be deployed online and hostname can change
                depending on where it is hosted, if it is changed to a custom (paid) domain, etc. */
                const msg = {
                    to: user.email,
                    from: "f28cd-musicdb@protonmail.com",
                    subject: "Password Change Request",
                    text: "You are receiving this because you (or someone else) have requested a password reset for your account.\n\n" +
                        "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                        "http://" + req.headers.host + "/reset/" + token + "\n\n" +
                        "If you did not request this, please ignore this email and your password will remain unchanged.\n"
                }

                // Send the above message as email using SendGrid API
                sgMail
                    .send(msg)
                    .then(() => {
                        console.log('Password reset email sent')
                        res.render("note.ejs", {note: "Password reset link has been sent. Please check your Spam or Junk folder if you cannot find it."})
                    })
                    .catch((error) => {
                        console.error(error)
                    })
                // This was the last function for our reset procedure so need for the done function here.
            }
        ], 
        // This function is run whenever an error is encountered in any waterfall stages (acts like a catch statement).
        function (err) {
            if (err) return next(err);
            res.render("error.ejs", {error: "Could not proceed with your password reset. Please try again later."})
        });
    })

// Route for handling reset links containing tokens, i.e. when a user clicks on their reset link.
router
    .route("/:token")
    .get((req, res) => {
        /* Find user who has the same token AND it has not expired yet.
        We check expiry by seeing if there are any "resetPasswordExpires"
        tokens which are greater than the current time, which will only 
        happen if they haven't expired yet */
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
            // If user not found, redirect to login page
            if (!user) {
                console.log("Reset token invalid.")
                res.render("error.ejs", {error: "Reset token is invalid or has expired."})
            }
            // If user found, redirect them to new password page
            console.log("Reset token valid.")
            res.render("changePassword.ejs");
        });
    })
    .post(async function (req, res, next) {
        // Hash new password with default salt complexity
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Similar waterfall function as earlier.
        async.waterfall([
            function (done) {
                /* Because there is a possibility that the user does not use the reset link
                immediately, we check the token validity again before changing password. For security
                reasons, we only want them to be able to use it for a short time period (1 hour) after creation.
                If it expires the user can always create a new token. */

                // Find user with the same token as in the link, but it SHOULD NOT have expired
                User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                    if (!user) {
                        console.log("Reset token invalid.")
                        res.render("error.ejs", {error: "Reset token is invalid or has expired."})
                    }

                    /* If user is found, we update their (hashed) password and set all reset fields
                    to null since they have served their purpose */
                    user.password = hashedPassword;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;

                    // Save the changes and pass user object to next function
                    user.save(function (err) {
                        done(err, user);
                    });
                });
            },
            // Now that password has been changed, send an email confirmation.
            function (user, done) {
                // Create message
                const msg = {
                    to: user.email,
                    from: "f28cd-musicdb@protonmail.com",
                    subject: "Password Updated",
                    text: "Password update successful."
                }
                // Send message as email using SendGrid API
                sgMail
                    .send(msg)
                    .then(() => {
                        console.log('Password updated')
                        res.render("note.ejs", {note: "Password was updated successfully. Please proceed to Login."})
                    })
                    .catch((error) => {
                        console.error(error)
                    })
            }
        ], 
        // Catching errors in the waterfall function. Error causes reset procedure to stop and asks users to retry.
        function (err) {
            if (err) return next(err);
            res.render("error.ejs", {error: "Could not update password. Please try again later."})
        });
    });
module.exports = router;