const express = require('express');
const {
    getMentors,
    getMentees,
    registerMentorshipProfile,
    getMyMentorshipProfile,
    requestMentorship,
    getMyMentorships,
    updateMentorshipStatus
} = require('../controllers/mentorshipController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

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
