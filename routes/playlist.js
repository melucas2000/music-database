const express = require("express");
const router = express.Router();
const path = require("path");
const { ensureAuthenticated } = require("./../security/guard");
const Playlists = require("./../model/playlist");
const songSchema = require("./../model/songSchema");
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const rateLimit = require("express-rate-limit");

/* Limiter middleware to limit requests made */
const limiter = rateLimit({
  windowMs: 5000, // 5 seconds
  max: 1, // max 1 request in window set above
  message: "Maximum view requests reached. Please try again later.",
});

/* Begin using environment variables */
dotenv.config();

/* Create Spotify API Object using secret keys */
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

/* All Routes related to Playlists */

// For Searching Playlists
router
  .route("/")
  .get(ensureAuthenticated, (req, res) => {
    res.render("search.ejs");
  })
  .post((req, res) => {
    /* When a post request is received on the playlist search page,
    we search the Playlists collection for playlist creator (username),
    playlist name or playlist ID that match the provided user input.
    All of them need to be public playlists (so visible = true) to show
    up on results page */
    Playlists.find(
      {
        $or: [
          { username: req.body.playlistName, visible: true },
          { playlistName: req.body.playlistName, visible: true },
          { playlistId: req.body.playlistName, visible: true },
        ],
      },
      (err, list) => {
        if (err) {
          console.log(err);
        } else {
          /* If there are no playlists found, let the user know */
          if(list == null) {
            return res.render("note.ejs", {note: "No Playlists found."})
          }
          /* Otherwise display the found playlists by passing playlist name
          as title and list of playlists as links that will be rendered by EJS */
          res.render("playlist.ejs", {
            title: req.body.playlistName,
            links: list,
          });
        }
      }
    );
  });

/* For viewing a playlist.
We use the limiter middleware here because we do not want people
to refresh playlists continously and increase the view count */
router
  .route("/view/:id")
  /* This get request is divided into two parts. One to increment view count
and another to return playlist results */
  .get(limiter, ensureAuthenticated, (req, res) => {

  // Find Playlists where playlistID = :id param in url
  Playlists.findOne({ playlistId: req.params.id }, (err, play) => {
    if (err) {
      console.log(err);
    } else {
      /* If the current logged in user is not the same as the playlist creator,
      then increment the playlist view count by 1 */
      if (play.username != req.user.username) {
        Playlists.updateOne(
          { playlistId: req.params.id },
          { $inc: { playlistPopularity: 1 } }, (err, list) => {
            if (err) {
              console.log(err);
            } else {
              console.log("Increased playlist view count");
            }
          }
        );
      }
    }
  });

  /* Second part of Playlist GET requests. 
  * Our playlist page has a lot of situational features, e.g,
  Deleting a playlist which requires the logged in user to be the creator or
  following a public playlist where current user cannot be the creator and must
  not be following already (in which case Unfollow is displayed). To display these
  accordingly, we use several if-else statements to verify these conditions, which
  are then passed to our EJS template "IndividualPlaylist.ejs" file in views folder.
  It uses these conditions to show or hide Playlist management options */
  
  // Find playlist by ID again
  Playlists.findOne({ playlistId: req.params.id }, (err, list) => {
    if (err) {
      console.log(err);
    } else {
      /* If this is the first time viewing a playlist, the view count will be null or undefined.
      But we do not want to display empty space on our page. Instead, we display 0 if that
      is that case, otherwise the actual view count (popularity). */
      let count = 0;
      if ( list.playlistPopularity == null || list.playlistPopularity == undefined) {
        count = 0;
      } else {
        count = list.playlistPopularity;
      }

      /* First condition: True if playlist creator and current user are NOT same */
      const con1 = list.username != req.user.username;

      // Second condition: start with default false.
      let con2 = false;
      
      /* savedBy is an array of every user(name) who has saved this playlist.
      Access this playlist's savedBy array, go through every user and if current
      user is found to have saved this playlist, then set condition 2 to true */
      list.savedBy.forEach((user) => {
        if (user.username == req.user.username) {
          con2 = true;
        }
      });

      let con3 = false;
      /* If current user is not the creator of this playlist AND
      has NOT saved this playlist, set condition 3 to true.
      If true, show the "Follow Playlist" option otherwise 
      the "Unfollow Playlist" option. */
      if (con1 == true && con2 == false) {
        con3 = true;
      }


      let con4 = false;
      /* If current user IS the creator of this playlist AND
      the playlist name is "Liked Songs", which si the default one
      created for everyone at time of registration, set condition 4 to true.
      If this is true, do not display follow,unfollow and privacy options */
      if (con1 == false && list.playlistName != "Liked Songs") {
        con4 = true;
      }

      
      let con5 = false;
      /* If this playlist's creator is the same as the current user AND 
      this playlist is public, set condition 5 to true.
      Used to determine which privacy option to display for user. If true,
      show "Make playlist private" otherwise "Make playlist public" */
      if (list.username == req.user.username && list.visible == true) {
        con5 = true;
      }

      let con6 = false;
      /* If this playlist's creator is the same as the current user AND 
      this playlist is private AND it is not the default Liked Songs playlist,
      set condition6 to true.
      Used to determine whether to show Delete Playlist Option */
      if (
        list.username == req.user.username &&
        list.visible == false &&
        list.playlistName != "Liked Songs"
      ) {
        con6 = true;
      }
      // Pass the playlist details and contitions to EJS template.
      res.render("individualPlaylist.ejs", {
        title: list.playlistName,
        id: list.playlistId,
        links: list,
        views: count,
        visibility: list.visible,
        condition1: con3,
        condition2: con2,
        condition3: con4,
        condition4: con5,
        condition5: con6,
        host: req.headers.host,
      });
    }
  });
});

/* Route used to follow a playlist.
When "Follow" button is pressed, users are redirected here.
Follow option only appears on invidual playlist page. When we are 
on that page, we already have that playlist's ID. So when we click follow there,
we can include its ID in the redirected URL too so the new route (this one) knows 
which playlist we are talking about. */
router
  .route("/follow/:id")
  .get(ensureAuthenticated, (req, res) => {
  const username = req.user.username;

  // Find playlist with the the :id and update its savedBy array with the current user
  Playlists.updateOne(
    { playlistId: req.params.id },
    { $push: { savedBy: { username } } },
    (err, list) => {
      if (err) {
        console.log(err);
      } else {
        // After updating, redirect them to their profile
        res.redirect("/user/profile");
      }
    }
  );
});

// Route for unfollowing playlists. Similar logic as above.
router
  .route("/unfollow/:id")
  .get(ensureAuthenticated, (req, res) => {
  const username = req.user.username;
  //Find playlist by :id and from its savedBy array REMOVE the current user.
  Playlists.updateOne(
    { playlistId: req.params.id },
    { $pull: { savedBy: { username } } },
    (err, list) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/user/profile");
      }
    }
  );
});

/* Route for deleting a playlist. Not shown on every page, depends on conditions 
discussed above. Similar logic to previous routes. */
router
  .route("/delete/:id")
  .get(ensureAuthenticated, (req, res) => {
    // Find playlist by :id and delete it from our collection.
  Playlists.deleteOne({ playlistId: req.params.id })
    .then((success) => {
      console.log("playlist deleted");
      // redirect user to profile
      res.redirect("/user/profile");
    })
    .catch((err) => {
      console.log(err);
    });
});

/* Route for liking songs.
When a user searches for a song, the results page will include a Like option.
Clicking that will redirect to this route and automatically fill the parameters 
with their details since we already have all these song details on the results page */
router
  .route("/like/:id/:name/:artist/:album/:pop")
  .get(ensureAuthenticated, (req, res) => {
    /* Create a song object using the information received from the url.
    Using song object because these fields have their own types and requirements so 
    the user cannot enter a url with random information for these and expect that in their liked songs */
    const likedSong = new songSchema({
      songId: req.params.id,
      songName: req.params.name,
      songArtist: req.params.artist,
      songAlbum: req.params.album,
      songPopularity: req.params.pop,
    });

    // Find the Liked Songs playlist of the current user and add the song to it
    Playlists.updateOne(
      { username: req.user.username, playlistName: "Liked Songs" },
      { $push: { songs: likedSong } },
      { setDefaultsOnInsert: true, upsert: true },
      (err, success) => {
        if (err) {
          console.log(err);
        } else {
          // Redirect them to profile
          console.log("Liked song");
          res.redirect("/user/profile");
        }
      }
    );
  });

// Route for saving a song to a specefic playlist. Details sent in similar manner as previous routes.
router
  .route("/save/:id/:name/:artist/:album/:pop")
  .post(ensureAuthenticated, (req, res) => {
    // Create song object
    const likedSong = new songSchema({
      songId: req.params.id,
      songName: req.params.name,
      songArtist: req.params.artist,
      songAlbum: req.params.album,
      songPopularity: req.params.pop,
    });

    /* On the songs result page, user sees a drop down list containing all their public and private playlists.
    Here, we find that specefic playlist user their username and selected playlist option. Then we add the above
    song into it. */
    Playlists.updateOne(
      { username: req.user.username, playlistName: req.body.selectedPlaylist },
      { $push: { songs: likedSong } },
      { setDefaultsOnInsert: true, upsert: true },
      (err, success) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Added song");
          res.redirect("/user/profile");
        }
      }
    );
  });

// Route for creating new playlists. Shows available options.
router.route("/new").get(ensureAuthenticated, (req, res) => {
  res.render("playlistOptions.ejs");
});

// Route for creating new public playlist
router
  .route("/new/public")
  .get(ensureAuthenticated, (req, res) => {
    // Open "Create new Public Playlist" page and take name as input
    res.render("newPlay.ejs", { type: "Public" });
  })
  .post(ensureAuthenticated, (req, res) => {
    if (req.body.playlistName == "") {
      // If no name entered, return error
      return res.render("error.ejs", { error: "Failed to create playlist. Please enter a valid name." })
    }

    /* Otherwise create a new playlist, where curret user is creator(username field), playlistName is 
    user input, visibility is true and other options are default values (like ID field has a function creating a random ID) */
    Playlists.updateOne(
      { username: req.user.username, playlistName: req.body.playlistName },
      { $set: { visible: true } },
      { setDefaultsOnInsert: true, upsert: true },
      (err, success) => {
        if (err) {
          console.log(err);
        } else {
          console.log("created new empty public playlist");
        }
        res.redirect("/user/profile");
      }
    );
  });

/* Route for changing public playlist to private. Receieve playlist ID in url like before.
Not checking for username = creator here because we already did that in the conditions above.
This option only shows up when the user IS the creator. */
router
  .route("/change/toPrivate/:id")
  .get(ensureAuthenticated, (req, res) => {
  // Find playlist by :id and set its visibility to false to make it private
  Playlists.updateOne(
    { playlistId: req.params.id },
    { $set: { visible: false } },
    (err, success) => {
      if (err) {
        console.log(err);
      } else {
        console.log("changed to private playlist");
      }
      // redirect to profile
      res.redirect("/user/profile");
    }
  );
});

/* Route for changing private playlist to public. Receieve playlist ID in url like before. */
router.route("/change/toPublic/:id").get(ensureAuthenticated, (req, res) => {
  // Find playlist by :id and change visibility to false to make it private.
  Playlists.updateOne(
    { playlistId: req.params.id },
    { $set: { visible: true } },
    (err, success) => {
      if (err) {
        console.log(err);
      } else {
        console.log("changed to public playlist");
      }
      res.redirect("/user/profile");
    }
  );
});

// Route for creating new private playlist
router
  .route("/new/private")
  .get(ensureAuthenticated, (req, res) => {
    // Open "Create new Private Playlist" page and take name as input
    res.render("newPlay.ejs", { type: "Private" });
  })
  .post(ensureAuthenticated, (req, res) => {
    if (req.body.playlistName == "") {
      // error if no playlist name given
      return res.render("error.ejs", { error: "Failed to create playlist. Please enter a valid name." })
    }

    /* Otherwise create a new playlist, where curret user is creator(username field), playlistName is 
    user input, visibility is false and other options are default values (like ID field has a function creating a random ID) */
    Playlists.updateOne(
      { username: req.user.username, playlistName: req.body.playlistName },
      { $set: { visible: false } },
      { setDefaultsOnInsert: true, upsert: true },
      (err, success) => {
        if (err) {
          console.log(err);
        } else {
          console.log("created new empty private playlist");
        }
        res.redirect("/user/profile");
      }
    );
  });

// Route for choosing themed playlists options
router.route("/new/themed").get(ensureAuthenticated, (req, res) => {
  res.sendFile(path.resolve("pages/auth/playlistGeneration.html"));
});

// Route where all the selected themed playlist options are sent after submission
router
  .route("/new/themed/create")
  .post(ensureAuthenticated, (req, res) => {

  // Connect to Spotify API 
  spotifyApi.clientCredentialsGrant().then(
    function (data) {
      // Save the access token so that it's used in future calls
      spotifyApi.setAccessToken(data.body['access_token']);
      if (req.body.region != "NA") {
        /* If a region is selected, search for Spotify playlists
        in the choosen region by category, which is the genre user selected. 
        We return the top playlist so limit is 1 */
        return spotifyApi.getPlaylistsForCategory(req.body.genre, {
          country: req.body.region,
          limit: 1,
          offset: 0
        })
      } else {
        // If no region is selected, we search in similar way but without region filter.
        return spotifyApi.getPlaylistsForCategory(req.body.genre, {
          limit: 1,
          offset: 0
        })
      }
    })
    .then(function (data) {
      // Assign search result to this variable
      const firstPage = data.body;

      // Extract top playlist from result (having index 0)
      const play = firstPage.playlists.items[0];

      // Pass the playlist name and ID to EJS page for it to display.
      res.render("homePlay.ejs",
        { title: req.body.playListName, id: play.id })
    })
    .catch(err => console.log(err))
});

// Route for getting Top 50 Songs.
router.route("/top50").get(ensureAuthenticated, (req, res) => {
  // Send to EJS template the title and ID of the playlist. 
  // ID taken from Spotify application directly.
  res.render("homePlay.ejs", {
    title: "Top 50 (Global)",
    id: "37i9dQZEVXbMDoHDwVN2tF",
  });
});

// Route for getting New Songs.
router.route("/newReleases").get(ensureAuthenticated, (req, res) => {
  // Send to EJS template the title and ID of the playlist. 
  // ID taken from Spotify application directly.
  res.render("homePlay.ejs", {
    title: "New Releases",
    id: "37i9dQZF1DX4W3aJJYCDfV",
  });
});

module.exports = router;
