const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    displayName: String,
    photoURL: String,
    role: {
        type: String,
        enum: ['user', 'admin', 'volunteer'],
        default: 'user'
    },
    metadata: {
        lastLogin: Date,
        createdAt: Date,
        updatedAt: Date
    }
});

module.exports = mongoose.model('User', userSchema);