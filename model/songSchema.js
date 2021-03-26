const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({

  // Unique song ID.
  songId:{
    type: String,
    min: 0,
    max: 255,
    required: true
  },
  // Actual song name.
  songName:{
    type:String,
    min:0,
    max:255,
    required: true
  },
  // Song Artist/
  songArtist:{
    type: String,
    min:0,
    max:255,
    required: true
  },
  // Song Album.
  songAlbum:{
    type: String,
    min:0,
    max:255,
    required: true
  },
  /* A field to count each time it's added to a playlist
    for use in calculating most popular song and such.
    Because we could not keep track of the number of times
    each song was played due to Spotify API limitations, 
    we do not end up using this field. Leaving it in schema 
    for sake of completeness. */
  songPopularity:{
    type: Number,
    min:0,
    required: true
  },

}, {collection: "songs"});

module.exports = mongoose.model("Songs", songSchema);