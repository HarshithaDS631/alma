const Institution = require('../models/Institution');
const Department = require('../models/Department');
const { logAdminAction } = require('../services/auditLogService');

// @desc    Get all active institutions
// @route   GET /api/v1/institutions
// @access  Public
exports.getInstitutions = async (req, res) => {
    try {
        const institutions = await Institution.find({ isActive: true }).select('name code domain logoUrl address settings');
        res.json({ success: true, count: institutions.length, data: institutions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get institution by ID
// @route   GET /api/v1/institutions/:id
// @access  Public
exports.getInstitutionById = async (req, res) => {
    try {
        const institution = await Institution.findById(req.params.id);
        if (!institution) {
            return res.status(404).json({ success: false, message: 'Institution not found' });
        }
        res.json({ success: true, data: institution });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create new institution
// @route   POST /api/v1/institutions
// @access  Super Admin
exports.createInstitution = async (req, res) => {
    try {
        const { name, code, domain, contactEmail, contactPhone, address, settings } = req.body;

        const existing = await Institution.findOne({ $or: [{ name }, { code: code?.toUpperCase() }] });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Institution name or code already exists' });
        }

        const institution = await Institution.create({
            name,
            code: code?.toUpperCase(),
            domain,
            contactEmail,
            contactPhone,
            address,
            settings
        });

        await logAdminAction({
            actor: req.user,
            actorRole: req.user.role,
            institution: institution._id,
            action: 'CREATE_INSTITUTION',
            targetId: institution._id,
            targetType: 'Institution',
            req,
            metadata: { name: institution.name, code: institution.code }
        });

        res.status(201).json({ success: true, data: institution });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update institution
// @route   PUT /api/v1/institutions/:id
// @access  Super Admin / Institution Admin
exports.updateInstitution = async (req, res) => {
    try {
        let institution = await Institution.findById(req.params.id);
        if (!institution) {
            return res.status(404).json({ success: false, message: 'Institution not found' });
        }

        institution = await Institution.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        await logAdminAction({
            actor: req.user,
            actorRole: req.user.role,
            institution: institution._id,
            action: 'UPDATE_INSTITUTION',
            targetId: institution._id,
            targetType: 'Institution',
            req,
            metadata: req.body
        });

        res.json({ success: true, data: institution });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get departments of an institution
// @route   GET /api/v1/institutions/:id/departments
// @access  Public
exports.getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({ institution: req.params.id, isActive: true });
        res.json({ success: true, count: departments.length, data: departments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create department in an institution
// @route   POST /api/v1/institutions/:id/departments
// @access  Institution Admin / Super Admin
exports.createDepartment = async (req, res) => {
    try {
        const { name, code, description, headOfDepartment } = req.body;
        const institutionId = req.params.id;

        const existing = await Department.findOne({ institution: institutionId, code: code?.toUpperCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Department code already exists in this institution' });
        }

        const department = await Department.create({
            institution: institutionId,
            name,
            code: code?.toUpperCase(),
            description,
            headOfDepartment
        });

        await logAdminAction({
            actor: req.user,
            actorRole: req.user.role,
            institution: institutionId,
            action: 'CREATE_DEPARTMENT',
            targetId: department._id,
            targetType: 'Department',
            req,
            metadata: { name: department.name, code: department.code }
        });

        res.status(201).json({ success: true, data: department });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
