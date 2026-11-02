const express = require('express');
const {
    getMentors,
    getMentees,
    registerMentorshipProfile,
    getMyMentorshipProfile,
    requestMentorship,
    getMyMentorships,
    updateMentorshipStatus,
    getAvailableSlots,
    setAvailabilitySlots,
    bookMentorshipSlot,
    getMyBookedSessions
} = require('../controllers/mentorshipController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

// 1-on-1 Availability Slots & Calendar Sync (Plan 8.3)
router.get('/slots/:mentorId', optionalProtect, getAvailableSlots);
router.post('/slots', protect, setAvailabilitySlots);
router.post('/slots/book', protect, bookMentorshipSlot);
router.get('/sessions/my', protect, getMyBookedSessions);

// Public / Authenticated directory listings
router.get('/mentors', getMentors);
router.get('/mentees', getMentees);

// Profile registrations (Dual-track mentor and mentee)
router.post('/register', protect, registerMentorshipProfile);
router.get('/profile/me', protect, getMyMentorshipProfile);

// Connection requests & management
router.post('/request', protect, requestMentorship);
router.get('/my', protect, getMyMentorships);
router.put('/:id', protect, updateMentorshipStatus);

module.exports = router;
