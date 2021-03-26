const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    // IP address
    host: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    // Which url is being accessed
    resource: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },

    intent: {
        type: String,
        required: true,
        min: 3,
        max: 255
    },

    // Time when request was made
    time: {
        type: Date,
        required: true
    },

    success: {
        type: Boolean,
        required: false
    }
}, { collection: 'logs' });

module.exports = mongoose.model("Log", logSchema);