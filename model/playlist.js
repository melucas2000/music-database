const mongoose = require("mongoose");
const crypto = require('crypto');

const playlistSchema = new mongoose.Schema({
  // Creator of playlist. Same as account username.
  username: {
    type: String,
    min: 6,
    max: 255,
    required: true
  },
  // Name of the playlist.
  playlistName: {
    type: String,
    min: 3,
    max: 255,
    required: true
  },
  /* Playlist contains an Array of individual songs.
   Each song in the array has: */
  songs: [{
    // A unique song ID.
    songId: {
      type: String,
      min: 0,
      max: 255,
      required: true
    },
    // A song name.
    songName: {
      type: String,
      min: 0,
      max: 255,
      required: true
    },
    // A song artist.
    songArtist: {
      type: String,
      min: 0,
      max: 255,
      required: true
    },
    // A song album.
    songAlbum: {
      type: String,
      min: 0,
      max: 255,
      required: true
    },
    /* A field to count each time it's added to a playlist
     for use in calculating most popular song and such.
     Because we could not keep track of the number of times
     each song was played due to Spotify API limitations, 
     we do not end up using this field. Leaving it in schema 
     for sake of completeness. */
    songPopularity: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
  }],

  // Keeps track of how many times a playlist has been viewed.
  playlistPopularity: {
    type: Number,
    min: 0,
    required: true
  },

  /* When searching for public playlists, users have the option 
  to save them. In doing so, their usernames will be added to 
  this array. Field used to display saved public playlists on
  the user's profile page. */
  savedBy: [{
    username: {
      type: String,
      min: 6,
      max: 255,
      required: true
    }
  }],

  /* Each playlist gets a random 10 digit ID in hexadecimal format.
  Field uses node's crypto module to generate the ID, and it is
  sufficiently (pseudo)random and long enough to accommdate
  large number of playlists without overlapping.*/
  playlistId: {
    type: String,
    default: function () {
      return crypto.randomBytes(10).toString("hex");
    }
  },

  /* Privacy setting of the playlist. They are private (false) by 
  default, and changing them to public changes this field to True.*/
  visible: {
    type: Boolean,
    default: false
  }
}, { collection: "playlists" });

module.exports = mongoose.model("Playlists", playlistSchema);