---
phase: 6
plan: 1
wave: 1
gap_closure: false
---

# Plan 6.1: Automated 20-Point Security Test Suite Execution

## Objective
Implement an automated end-to-end security verification test script (`scripts/securityAuditTest.js`) testing all 20 security checkpoints, including route protection, token validation, rate limiters, headers, and error masking.

## Context
- .gsd/SPEC.md
- backend/index.js
- scripts/securityAuditTest.js

## Tasks

<task type="auto">
  <name>Create and Run Automated Security Audit Test Suite</name>
  <files>
    scripts/securityAuditTest.js
  </files>
  <action>
    1. Create `scripts/securityAuditTest.js` using Node.js `http` and `supertest` to test:
       - Attempting to access `/api/activity` without admin token -> Expect 401/403
       - Attempting to access `/api/admin/backup` with regular admin token -> Expect 403
       - Attempting to access `/api/recommendations/endorse` without token -> Expect 401
       - Verification of security headers on responses (`x-content-type-options`, `x-frame-options`, `strict-transport-security`)
       - Verification of error masking on simulated 500 errors
       - Verification that hardcoded JWT secret is rejected
    2. Execute the test suite and verify all checks pass.
    AVOID: Manual spot checks without reproducible automated test scripts.
    USE: Deterministic automated assertions covering all 20 points.
  </action>
  <verify>
    node scripts/securityAuditTest.js
  </verify>
  <done>
    All security assertions pass with 100% success rate.
  </done>
</task>

<task type="auto">
  <name>Full Production Build & Release Artifact Generation</name>
  <files>
    AlumniNetwork.apk
    dist/
  </files>
  <action>
    1. Run syntax and lint checks: `node -c src/screens/DashboardScreen.js` and `npm run build`.
    2. Build Android Release APK: `cd android; .\gradlew.bat assembleRelease --no-daemon`.
    3. Copy output APK to root `./AlumniNetwork.apk`.
    4. Stage, commit, and push to `origin main` for Vercel auto-deployment.
  </action>
  <verify>
    Test-Path .\AlumniNetwork.apk
  </verify>
  <done>
    Web and Android release builds generated and deployed with zero errors.
  </done>
</task>

## Success Criteria
- [ ] Automated security audit script passes all assertions.
- [ ] Production web bundle exported and Vercel deployed.
- [ ] Production Android APK compiled at `./AlumniNetwork.apk`.

