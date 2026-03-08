const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    tender: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tender',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    photo: {
        type: String // path to uploaded photo
    },
    category: {
        type: String,
        enum: ['road damage', 'broken railing', 'structural crack', 'safety hazard', 'poor construction', 'bid anomaly', 'tender discrepancy', 'contractor misconduct', 'other'],
        required: [true, 'Please select an issue category']
    },
    location: {
        lat: Number,
        lng: Number
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
