const express = require('express');
const router = express.Router();
const {
    submitVerificationRequest,
    getMyVerificationStatus,
    getPendingVerifications,
    reviewVerification
} = require('../controllers/verificationController');
const { protect } = require('../middleware/authMiddleware');
const { isInstitutionAdmin } = require('../middleware/roleMiddleware');

router.post('/request', protect, submitVerificationRequest);
router.get('/my-status', protect, getMyVerificationStatus);
router.get('/pending', protect, isInstitutionAdmin, getPendingVerifications);
router.put('/:id/review', protect, isInstitutionAdmin, reviewVerification);

module.exports = router;
