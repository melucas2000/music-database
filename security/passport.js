const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./../model/User");

module.exports = function (passport) {
    /* The Passport module supports many "Strategies", which are essentially authentication methods.
    For example, we can authenticate users using Facebook, Twitter, Gmail, Outlook among others. But
    we use regular username & password combination instead. This is called a LocalStrategy in Passport. */
    passport.use(
        /* Tell Passport module that we will use a combination of email and password for logging in,
        then use those details to search the database */
        new LocalStrategy({ usernameField: "email", passwordField: "password" }, (email, password, done) => {
            // Search for user in database using their email first
            User.findOne({ email: email })
                .then(user => {
                    /* If no user is found with that email, notify the user.
                    To further safeguard the user, we actually do not tell them whether
                    the problem lies with the email or password as that would make it easier
                    for a hacker to focus all their effort into just one field */
                    if (!user) {
                        console.log("No email found")

                        /* Tell passport we are done authenticating. Null indicates no other 
                        runtime errors while false indicates that the authentication failed. */
                        return done(null, false);
                    }

                    /* If the email exists in the database, we proceed to compare the given 
                    password with the one stored in our database. The stored one is hashed
                    of course, so we use BCrypt's compare method for it. */
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) throw err;

                        // If the username and password combination match:
                        if (isMatch) {
                            /* We tell Passport it is done authenticating, with no other erros and
                            and a successfull authentication, in which case it attaches the user object
                            and passes it to the next middleware. */
                            return done(null, user);
                        } else {

                            /* If password does not match, tell Passport there were no errors but 
                            authentication failed */
                            return done(null, false,);
                        }
                    });
                })
                .catch(err => console.log(err));
        })
    );

    // Passport methods to save current user details in session

    /* Serializing saves the user id (one created by MongoDB) and 
    saves it to pass to every subsequent request. This is also what
    maintains the same user "sessions" or "states" while using the website. */
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    /* Deserializing enables Express to use the ID stored earlier
    to find the user from the database and return all their details
    in the request body so other parts of the website can access them.
    For example, when trying to access a protected route, the ensureAuthenticated
    method will authenticate users again using their ID password and this is how
    we can access that data only on server side. */
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
}