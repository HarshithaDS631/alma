const express = require('express');
const { 
    getStats, 
    getEmailStats, 
    getPendingUsers, 
    approveUser, 
    rejectUser, 
    updateUserRole, 
    checkMatch, 
    getAllMessages, 
    exportUserData, 
    downloadFullDatabaseBackup, 
    getAllSessions,
    checkSapStatus,
    triggerSapSync
} = require('../controllers/adminController');
const { protect, adminOnly, superAdminOnly } = require('../middleware/authMiddleware');
const { syncStudents } = require('../controllers/syncController');
const router = express.Router();

// All admin routes must be protected and restricted to admin/super admin
router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/email-stats', getEmailStats);
router.get('/pending-users', getPendingUsers);
router.get('/messages', getAllMessages);
router.get('/backup', downloadFullDatabaseBackup);
router.get('/sessions', getAllSessions);
router.put('/users/:id/approve', approveUser);
router.delete('/users/:id/reject', rejectUser);
router.get('/users/:id/check-match', checkMatch);
router.get('/users/:id/export', exportUserData);

// SAP SLcM Integration routes
router.get('/sap/status', checkSapStatus);
router.post('/sap/sync', superAdminOnly, triggerSapSync);

// Role updating is only for Super Admins in our controller logic, but we can protect it here as well
router.put('/users/:id/role', superAdminOnly, updateUserRole);

// Sync students from RVCE Google Sheet
router.post('/sync-students', adminOnly, syncStudents);

module.exports = router;
