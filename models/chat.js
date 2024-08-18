const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    users:{ type: [String], required: true },
    members: { type: [String], required: true },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
    messages: [
        {
            timestamp: { type: String, required: true },
            userName: { type: String, required: true },
            text: { type: String, required: true },
            excluded: { type: [String], default: [] } // Ensure this is an array of strings
        }
    ]
});


module.exports = mongoose.model('chats', chatSchema);
