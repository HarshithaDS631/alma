const AlumniVerification = require('../models/AlumniVerification');
const User = require('../models/User');
const { logAdminAction } = require('../services/auditLogService');

// @desc    Submit alumni verification request
// @route   POST /api/v1/verifications/request
// @access  Protected (Alumni / Student)
exports.submitVerificationRequest = async (req, res) => {
    try {
        const { institution, department, usnOrRollNo, graduationYear, degree, idProofDocumentUrl } = req.body;

        const existingPending = await AlumniVerification.findOne({
            user: req.user._id,
            status: 'PENDING'
        });

        if (existingPending) {
            return res.status(400).json({ 
                success: false, 
                message: 'You already have a pending verification request in review.' 
            });
        }

        const verification = await AlumniVerification.create({
            user: req.user._id,
            institution,
            department,
            usnOrRollNo,
            graduationYear,
            degree,
            idProofDocumentUrl,
            status: 'PENDING'
        });

        res.status(201).json({
            success: true,
            message: 'Verification request submitted successfully. Awaiting administrator review.',
            data: verification
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get user's current verification status
// @route   GET /api/v1/verifications/my-status
// @access  Protected (Alumni / Student)
exports.getMyVerificationStatus = async (req, res) => {
    try {
        const verification = await AlumniVerification.findOne({ user: req.user._id })
            .populate('institution', 'name code')
            .populate('department', 'name code')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: verification || { status: 'NOT_SUBMITTED' }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get pending verification requests (for Institution Admin)
// @route   GET /api/v1/verifications/pending
// @access  Protected (Institution Admin / Super Admin)
exports.getPendingVerifications = async (req, res) => {
    try {
        const query = { status: 'PENDING' };
        
        // Scope to admin's institution if not super admin
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'Super Admin' && req.user.institution) {
            query.institution = req.user.institution._id || req.user.institution;
        }

        const pendingList = await AlumniVerification.find(query)
            .populate('user', 'name email avatar headline')
            .populate('institution', 'name code')
            .populate('department', 'name code')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: pendingList.length, data: pendingList });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Review verification request (Approve / Reject)
// @route   PUT /api/v1/verifications/:id/review
// @access  Protected (Institution Admin / Super Admin)
exports.reviewVerification = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
        }

        const verification = await AlumniVerification.findById(req.params.id);
        if (!verification) {
            return res.status(404).json({ success: false, message: 'Verification record not found' });
        }

        verification.status = status;
        verification.reviewedBy = req.user._id;
        verification.reviewedAt = new Date();
        if (status === 'REJECTED') {
            verification.rejectionReason = rejectionReason || 'Information provided did not match records';
        }

        await verification.save();

        // If approved, update user's verification status and institution linkage
        if (status === 'APPROVED') {
            await User.findByIdAndUpdate(verification.user, {
                isVerified: true,
                institution: verification.institution,
                department: verification.department,
                usn: verification.usnOrRollNo,
                batch: verification.graduationYear
            });
        }

        // Record administrative action in AuditLog
        await logAdminAction({
            actor: req.user,
            actorRole: req.user.role,
            institution: verification.institution,
            action: status === 'APPROVED' ? 'APPROVE_ALUMNI' : 'REJECT_ALUMNI',
            targetId: verification.user,
            targetType: 'User',
            req,
            metadata: {
                verificationId: verification._id,
                usn: verification.usnOrRollNo,
                rejectionReason: verification.rejectionReason
            }
        });

        res.json({
            success: true,
            message: `Alumni verification request ${status.toLowerCase()} successfully`,
            data: verification
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
