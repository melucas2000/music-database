const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Account Username.
    username: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    // Account Email.
    email: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    /* Account Password. Higher max limit to ensure sufficient 
    space available for hashed passwords, but not so much so
    that a user can create unending passwords.*/
    password: {
        type: String,
        required: true,
        min: 6,
        max: 1024
    },
    
    // Random token generated when a user requests a password reset.
    resetPasswordToken: {
        type: String,
        required: false
    },

    /* Stores the time one hour ahead from when reset token was created.
    Passwords can only be reset if this token has not expired, i.e. if the 
    reset link is used within one hour or creation */
    resetPasswordExpires: {
        type: Date,
        required: false
    }
}, {collection: 'users'});

module.exports = mongoose.model("User", userSchema);