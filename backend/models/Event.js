const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['reunion', 'webinar', 'workshop', 'meetup'], 
        required: true 
    },
    institution: { type: String, required: true, default: 'RV College of Engineering' },
    image: { type: String },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    registrations: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        passToken: { type: String, required: true },
        qrCode: { type: String }, // Base64 Data URL
        checkedIn: { type: Boolean, default: false },
        checkedInAt: { type: Date },
        registeredAt: { type: Date, default: Date.now }
    }],
    maxCapacity: { type: Number },
    price: { type: Number, default: 0 }
}, { timestamps: true });

eventSchema.index({ institution: 1, date: 1 });
eventSchema.index({ 'registrations.passToken': 1 });

module.exports = mongoose.model('Event', eventSchema);
