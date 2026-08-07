const express = require('express');
const router = express.Router();
const {
    getRecommendedAlumni,
    getRecommendedJobs,
    getCareerInsights,
    endorseSkill
} = require('../controllers/recommendationController');

// Public & Authenticated Recommendation Routes
router.get('/alumni', getRecommendedAlumni);
router.get('/jobs', getRecommendedJobs);
router.get('/insights', getCareerInsights);
router.post('/endorse', endorseSkill);

module.exports = router;
