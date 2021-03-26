const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("./../security/guard");
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const Playlists = require("./../model/playlist");

/* Begin using environment variables */
dotenv.config();

/* Create Spotify API Object using secret keys */
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

router
  .route("/")
  .get(ensureAuthenticated, (req, res) => {
    res.render("search.ejs")
  })
  .post((req, res) => {
    /* Retrieve an access token needed to use Spotify API */
    spotifyApi.clientCredentialsGrant().then(
      function (data) {

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);

        /* Search for upto 3 Top tracks in the Spotify Database matching the user input */
        return spotifyApi.searchTracks(req.body.name, { limit: 3, offset: 0 });
      })
      .then(function (data) {

        // Store the results into a variable
        const firstPage = data.body.tracks.items;

        /* The song results page has an option to save a result to any playlist that the current user owns. 
        This query finds all such playlists where the creator (i.e. playlist username) is the same as the 
        logged in user(name). We then pass the list of playlists to EJS, which displays them on the website
        using a for loop to create a drop-down list*/
        Playlists.find({ username: req.user.username }, (err, list) => {
          if (err) {
            console.log(err);
          } else {
            /* Search is user input, links is search results and lists are user owned playlists */
            res.render("songResults.ejs", { search: req.body.name, links: firstPage, lists: list })
          }
        })
      }).catch(function (err) {
        console.log('Something went wrong:' + err);
      });
  })
module.exports = router;