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
    shareResumeViaEmail
} = require('../controllers/jobController');

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
