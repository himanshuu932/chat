const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    admin: { type: [String], required: true },
    members: { type: [String], required: true },
    password: { type: String, required: true },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' }, // Updated type
    messages: [
        {
            timestamp: { type: String, required: true },
            userName: { type: String, required: true },
            text: { type: String, required: true }
        }
    ] // Initialize messages as an empty array if needed
});

// Static method to update the imageId for a group

groupSchema.statics.updateImageId = async function(groupId, imageId) {
    try {
        const result = await this.findByIdAndUpdate(
            groupId,
            { imageId: imageId },
            { new: true } // Return the updated document
        );
        return result;
    } catch (error) {
        throw new Error('Error updating imageId: ' + error.message);
    }
};

module.exports = mongoose.model('Group', groupSchema);
