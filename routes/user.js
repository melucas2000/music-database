const express = require("express");
const router = express.Router();
const path = require("path");
const { ensureAuthenticated } = require("./../security/guard");
const Playlists = require("./../model/playlist");

/* All User related Routes */

// User Profile
router
    .route("/profile")
    .get(ensureAuthenticated, (req, res) => {
        /* Find playlists where creator(username) is same as current logged in user OR
        public playlists (visible=true) which were saved by the logged in user. */
        Playlists
            .find().or([{ username: req.user.username  }, { savedBy: { $elemMatch: { username: req.user.username } }, visible: true }])
            /* Then send all the resulting playlists to the profile page using EJS, where it
            loops over the list of playlists and displays them individually. */
            .then(lists => { res.render("profile.ejs", { links: lists, user: req.user.username, host: req.headers.host }); })
            .catch(error => { console.log(error); })
    });

// User Homepage
router
    .route("/home")
    .get(ensureAuthenticated, (req, res) => {
        res.sendFile(path.resolve("pages/auth/home.html"));
    });


module.exports = router;