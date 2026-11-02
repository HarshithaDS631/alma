---
phase: 2
plan: 1
wave: 1
gap_closure: false
---

# Plan 2.1: Admin Route Lockdown (`/api/activity` & `/api/admin/backup`)

## Objective
Enforce strict Role-Based Access Control (RBAC) on all administrative endpoints. Lock `/api/activity` to `adminOnly` so non-admin users cannot inspect system-wide audit logs, and restrict `/api/admin/backup` strictly to `superAdminOnly`.

## Context
- .gsd/SPEC.md
- backend/routes/activityRoutes.js
- backend/routes/adminRoutes.js
- backend/controllers/adminController.js
- backend/middleware/authMiddleware.js

## Tasks

<task type="auto">
  <name>Lock Activity Logs to Admins Only</name>
  <files>
    backend/routes/activityRoutes.js
  </files>
  <action>
    1. Import `adminOnly` from `../middleware/authMiddleware`.
    2. Change `router.get('/', protect, ...)` to `router.get('/', protect, adminOnly, ...)`.
    3. Keep `router.post('/track', protect, ...)` for client analytics logging.
    AVOID: Exposing user IPs and endpoints to general alumni users.
    USE: Explicit adminOnly guard on read operations.
  </action>
  <verify>
    node -c backend/routes/activityRoutes.js
  </verify>
  <done>
    `GET /api/activity` requires `adminOnly` privileges.
  </done>
</task>

<task type="auto">
  <name>Restrict Full Database Backups to Super Admin Only</name>
  <files>
    backend/routes/adminRoutes.js
    backend/controllers/adminController.js
  </files>
  <action>
    1. In `backend/routes/adminRoutes.js`, update route:
       `router.get('/backup', superAdminOnly, downloadFullDatabaseBackup);`
    2. In `backend/controllers/adminController.js`, scrub user passwords and twoFactorSecrets from the backup payload before streaming to client.
    AVOID: Allowing an institution admin to exfiltrate other institutions' user data.
    USE: SuperAdmin-only restriction and sensitive credential exclusion.
  </action>
  <verify>
    node -c backend/routes/adminRoutes.js
  </verify>
  <done>
    Only Super Admins can request full database backups.
  </done>
</task>

## Success Criteria
- [ ] Non-admin requests to `/api/activity` return 403 Forbidden.
- [ ] Non-super-admin requests to `/api/admin/backup` return 403 Forbidden.

