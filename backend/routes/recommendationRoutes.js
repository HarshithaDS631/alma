const express = require('express');
const router = express.Router();
const {
    getRecommendedAlumni,
    getRecommendedJobs,
    getCareerInsights,
    endorseSkill
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

// Public & Authenticated Recommendation Routes
router.get('/alumni', getRecommendedAlumni);
router.get('/jobs', getRecommendedJobs);
router.get('/insights', getCareerInsights);
router.post('/endorse', protect, endorseSkill);

module.exports = router;
