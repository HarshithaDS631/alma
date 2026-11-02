const express = require('express');
const router = express.Router();
const {
    getRecommendedAlumni,
    getRecommendedJobs,
    getCareerInsights,
    endorseSkill
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

// Public & Authenticated Recommendation Routes (Cached with 300s TTL)
router.get('/alumni', cacheMiddleware(300, 'rec:alumni'), getRecommendedAlumni);
router.get('/jobs', cacheMiddleware(300, 'rec:jobs'), getRecommendedJobs);
router.get('/insights', cacheMiddleware(300, 'rec:insights'), getCareerInsights);
router.post('/endorse', protect, endorseSkill);

module.exports = router;
