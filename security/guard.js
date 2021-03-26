/* Middleware function that can be added before any Express
request that can only be processed for authenticated users.
The Passport module provides the isAuthenticated method for 
every request once it has been initialized. If authenticated,
we move to the next middleware (usually the request-response 
callback) otherwise we prompt the user to login instead. */
module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        console.log("Please log in to view this page");
        res.render("error.ejs", { error: "Please log in to view this page" })
    }
}