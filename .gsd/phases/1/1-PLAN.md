---
phase: 1
plan: 1
wave: 1
gap_closure: false
---

# Plan 1.1: Centralize JWT Secret Management & Boot Environment Validation

## Objective
Eliminate all hardcoded fallback secrets (`'super_secret_jwt_key_rvce_alumni_2026_xyz'` and `'alumni_platform_secure_captcha_secret_2026'`) from the codebase, centralize cryptographic secret handling in `backend/config/jwt.js`, and implement pre-flight environment variable validation on server boot.

## Context
- .gsd/SPEC.md
- backend/index.js
- backend/middleware/authMiddleware.js
- backend/controllers/authController.js
- backend/controllers/firebaseAuthController.js
- backend/services/captchaService.js

## Tasks

<task type="auto">
  <name>Create Centralized JWT Config & Remove Fallback Secrets</name>
  <files>
    backend/config/jwt.js
    backend/index.js
    backend/middleware/authMiddleware.js
    backend/controllers/authController.js
    backend/controllers/firebaseAuthController.js
    backend/middleware/activityLogger.js
    backend/services/captchaService.js
  </files>
  <action>
    1. Create `backend/config/jwt.js` exporting `getJwtSecret()`, `signToken(payload, options)`, and `verifyToken(token)`.
    2. In production (`NODE_ENV === 'production'`), if `process.env.JWT_SECRET` is unset or fewer than 32 characters, throw a fatal error halting execution.
    3. In development/test, fallback to a crypto-generated secure random string if unset.
    4. Remove all hardcoded string `'super_secret_jwt_key_rvce_alumni_2026_xyz'` across all controllers, middleware, and services.
    5. Update `verifyToken` in `authMiddleware.js` to verify against the single authorized secret only.
    AVOID: Keeping fallback secret arrays that allow legacy forged tokens.
    USE: Single strict cryptographic verification source.
  </action>
  <verify>
    node -e "const { getJwtSecret } = require('./backend/config/jwt'); console.log('Secret loaded successfully');"
  </verify>
  <done>
    Zero occurrences of 'super_secret_jwt_key_rvce_alumni_2026_xyz' in backend/
  </done>
</task>

<task type="auto">
  <name>Implement Boot-Time Environment Variable Validator</name>
  <files>
    backend/config/validateEnv.js
    backend/index.js
  </files>
  <action>
    1. Create `backend/config/validateEnv.js` to validate required variables: `MONGO_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`.
    2. Warn clearly on optional services (SMTP, Cloudinary, Firebase) without breaking serverless boots.
    3. Call `validateEnv()` at the very top of `backend/index.js` immediately after `dotenv.config()`.
    AVOID: Silent failures when critical database or auth keys are missing.
    USE: Explicit fail-fast logging.
  </action>
  <verify>
    node -e "require('./backend/config/validateEnv')(); console.log('Env validated');"
  </verify>
  <done>
    Server validates environment integrity on boot.
  </done>
</task>

## Success Criteria
- [ ] No hardcoded JWT secrets in git-tracked backend files.
- [ ] Centralized JWT signing and verification active.
- [ ] Pre-flight environment check runs on boot.

