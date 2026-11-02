const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'completed', 'rejected'], 
        default: 'pending' 
    },
    goals: { type: String, required: true },
    message: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    session: {
        scheduledAt: { type: Date },
        durationMinutes: { type: Number, default: 30 },
        topic: { type: String },
        meetingUrl: { type: String },
        notes: { type: String },
        calendarIcs: { type: String }
    },
    slots: [{
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        isBooked: { type: Boolean, default: false },
        bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        topic: { type: String, default: 'General Career Mentorship' },
        meetingUrl: { type: String, default: '' },
        notes: { type: String, default: '' },
        bookedAt: { type: Date }
    }]
}, { timestamps: true });

mentorshipSchema.index({ mentor: 1, mentee: 1 });
mentorshipSchema.index({ 'session.scheduledAt': 1 });

module.exports = mongoose.model('Mentorship', mentorshipSchema);
