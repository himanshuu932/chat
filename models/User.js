const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    about: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    dp: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
    date: {
        type: Date,
        default: Date.now
    },
    groups: {
        type: [String],
        default: []
    },
    chats: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('User', UserSchema);
