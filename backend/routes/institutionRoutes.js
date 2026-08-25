const express = require('express');
const router = express.Router();
const {
    getInstitutions,
    getInstitutionById,
    createInstitution,
    updateInstitution,
    getDepartments,
    createDepartment
} = require('../controllers/institutionController');
const { protect } = require('../middleware/authMiddleware');
const { isSuperAdmin, isInstitutionAdmin } = require('../middleware/roleMiddleware');
const institutionMiddleware = require('../middleware/institutionMiddleware');

router.route('/')
    .get(getInstitutions)
    .post(protect, isSuperAdmin, createInstitution);

router.route('/:id')
    .get(getInstitutionById)
    .put(protect, isInstitutionAdmin, institutionMiddleware, updateInstitution);

router.route('/:id/departments')
    .get(getDepartments)
    .post(protect, isInstitutionAdmin, institutionMiddleware, createDepartment);

module.exports = router;
