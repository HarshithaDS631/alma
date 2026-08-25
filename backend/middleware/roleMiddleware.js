/**
 * Role-Based Access Control (RBAC) Middleware
 * Accepts allowed roles and validates against req.user.role
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userRole = (req.user.role || '').toUpperCase().replace(/\s+/g, '_');
        const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase().replace(/\s+/g, '_'));

        // Handle variations (e.g. "SUPER_ADMIN" or "SUPERADMIN" or "SUPER ADMIN")
        const isAuthorized = normalizedAllowedRoles.some(role => {
            return userRole === role || 
                   userRole.includes(role) || 
                   (role === 'SUPER_ADMIN' && (userRole === 'SUPERADMIN' || userRole === 'SUPER_ADMIN')) ||
                   (role === 'INSTITUTION_ADMIN' && (userRole === 'ADMIN' || userRole === 'INSTITUTION_ADMIN'));
        });

        if (!isAuthorized) {
            return res.status(403).json({ 
                message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]` 
            });
        }

        next();
    };
};

module.exports = {
    requireRole,
    isSuperAdmin: requireRole('SUPER_ADMIN'),
    isInstitutionAdmin: requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN'),
    isAlumni: requireRole('ALUMNI', 'STUDENT', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
};
