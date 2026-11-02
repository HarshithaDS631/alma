---
phase: 1
plan: 2
wave: 2
gap_closure: false
---

# Plan 1.2: Password Hashing Standardization (Bcrypt 12 Rounds) & Git Secret Scan

## Objective
Standardize user, admin, and super admin password hashing on `bcryptjs` with 12 salt rounds, enforce 5-password history checking, and audit the repository for any leaked credentials.

## Context
- .gsd/SPEC.md
- backend/models/User.js
- backend/models/AdminUser.js
- backend/models/SuperAdminUser.js
- backend/utils/passwordHelper.js
- .gitignore

## Tasks

<task type="auto">
  <name>Standardize Bcrypt Salt Rounds to 12 across all Schemas</name>
  <files>
    backend/models/User.js
    backend/models/AdminUser.js
    backend/models/SuperAdminUser.js
    backend/utils/passwordHelper.js
  </files>
  <action>
    1. Update pre-save hooks in `User.js`, `AdminUser.js`, and `SuperAdminUser.js` from `bcrypt.genSalt(10)` to `bcrypt.genSalt(12)`.
    2. Ensure `comparePassword` uses `bcrypt.compare` asynchronously.
    3. Ensure password history tracking retains the last 5 salted hashes and checks against them on password updates.
    AVOID: Using fast or low work factors (10 rounds is becoming susceptible to hardware acceleration).
    USE: 12 work factor rounds adhering to OWASP recommendations.
  </action>
  <verify>
    node -e "const u = require('./backend/models/User'); console.log('User schema loaded');"
  </verify>
  <done>
    All user model schemas use 12 salt rounds.
  </done>
</task>

<task type="auto">
  <name>Audit .gitignore and Untracked Secrets</name>
  <files>
    .gitignore
  </files>
  <action>
    1. Review `.gitignore` to guarantee `.env*`, `*.pem`, `*.key`, `*.sql`, `*.log`, and `scratch/` are comprehensively ignored.
    2. Confirm no active production keys or connection strings are tracked by Git.
  </action>
  <verify>
    git check-ignore .env .env.local backend/.env
  </verify>
  <done>
    All secret and environment files are properly ignored.
  </done>
</task>

## Success Criteria
- [ ] User, Admin, and Super Admin models use 12 salt rounds.
- [ ] Git ignores all sensitive configurations and secrets.

