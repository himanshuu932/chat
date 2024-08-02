const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    admin: { type: [String], required: true },
    members: { type: [String], required: true },
    password: { type: String, required: true },
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
