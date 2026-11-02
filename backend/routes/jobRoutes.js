const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getJobs,
    createJob,
    toggleSaveJob,
    applyToJob,
    getJobTracker,
    getPreferences,
    updatePreferences,
    getRecommendedJobs,
    getResumeBook,
    shareResumeViaEmail,
    requestReferral,
    getIncomingReferralRequests,
    getMySentReferralRequests,
    updateReferralStatus
} = require('../controllers/jobController');

// Employee Referral Hub ("Refer an RVite")
router.get('/referrals/incoming', protect, getIncomingReferralRequests);
router.get('/referrals/my-requests', protect, getMySentReferralRequests);
router.post('/:id/referrals', protect, requestReferral);
router.patch('/:id/referrals/:referralId', protect, updateReferralStatus);

// Core Job Endpoints
router.get('/', protect, getJobs);
router.post('/', protect, createJob);
router.post('/:id/save', protect, toggleSaveJob);
router.post('/:id/apply', protect, applyToJob);
router.get('/tracker', protect, getJobTracker);
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);
router.get('/recommended', protect, getRecommendedJobs);
router.get('/resume-book', protect, getResumeBook);
router.post('/resume-book/share', protect, shareResumeViaEmail);

module.exports = router;
