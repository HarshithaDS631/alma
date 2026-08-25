/**
 * Multi-Tenant Institution Isolation Middleware
 * Verifies that the user has permission to access the requested institution's data
 */
const institutionMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = (req.user.role || '').toUpperCase();

    // Super Admin has global access across all institutions
    if (userRole === 'SUPER ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SUPERADMIN') {
        return next();
    }

    // Determine target institution ID from params, body, or query
    const targetInstitutionId = req.params.institutionId || 
                                req.params.id || 
                                req.body.institutionId || 
                                req.body.institution || 
                                req.query.institutionId;

    if (!targetInstitutionId) {
        return next(); // Non-institution specific route
    }

    const userInstitution = req.user.institution ? (req.user.institution._id || req.user.institution).toString() : null;

    if (!userInstitution) {
        return res.status(403).json({ 
            message: 'Access Denied: User is not associated with any institution.' 
        });
    }

    if (userInstitution !== targetInstitutionId.toString()) {
        return res.status(403).json({ 
            message: 'Access Denied: You do not have permission to access resources from another institution.' 
        });
    }

    next();
};

module.exports = institutionMiddleware;
