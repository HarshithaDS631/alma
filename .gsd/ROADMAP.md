---
milestone: Security Fortification (20/20 Checkpoints)
version: 1.1.0
updated: 2026-11-02T10:50:00+05:30
---

# Roadmap

> **Current Phase:** Phase 6 — Full Security Audit, Web Export & Android APK Release
> **Status:** ✅ Complete & Verified (17/17 automated test assertions passed)

## Must-Haves (from SPEC)
- [x] Eliminate hardcoded JWT & CAPTCHA fallback keys (`Items 1, 4`)
- [x] Enforce environment variable pre-flight validation on server boot (`Item 2`)
- [x] Protect all admin & audit routes with strict RBAC (`Items 3, 5`)
- [x] Require authentication for all user mutation endpoints (`Items 4, 5`)
- [x] Neutralize SVG XSS & enforce recursive NoSQL injection sanitization (`Items 6, 7`)
- [x] Activate rate limiters in production on Vercel (`Item 8`)
- [x] Fix CORS configuration and inject enterprise HTTP security headers (`Items 10, 11`)
- [x] Mask 500 server errors & block static access to sensitive files (`Items 9, 12, 15`)
- [x] Standardize bcrypt hashing with 12 salt rounds & 5-password history (`Item 17`)
- [x] Execute automated security verification test suite & produce verified APK (`Items 19, 20`)

---

## Phases

### Phase 1: Cryptographic Integrity & Secrets Management
**Status:** ✅ Complete  
**Objective:** Eliminate hardcoded secret fallbacks, validate env variables, harden token verification, and calibrate bcrypt password hashing.  
**Requirements:** Checkpoints 1, 2, 4, 17, 18  

**Plans:**
- [x] Plan 1.1: Centralize JWT Secret Management & Boot Environment Validation
- [x] Plan 1.2: Password Hashing Standardization (Bcrypt 12 Rounds) & Git Secret Scan

---

### Phase 2: Access Control, RBAC & IDOR Prevention
**Status:** ✅ Complete  
**Objective:** Lock unprivileged access to audit logs, restrict database backups to Super Admins, protect endorsements, and verify multi-tenant isolation.  
**Depends on:** Phase 1  
**Requirements:** Checkpoints 3, 5, 9  

**Plans:**
- [x] Plan 2.1: Admin Route Lockdown (`/api/activity` & `/api/admin/backup`)
- [x] Plan 2.2: IDOR Prevention & Skill Endorsement Authentication

---

### Phase 3: Input Sanitization, NoSQL & XSS Defense
**Status:** ✅ Complete  
**Objective:** Sanitize file uploads against SVG XSS, enforce recursive NoSQL injection stripping, and secure MongoDB Atlas connection options.  
**Depends on:** Phase 2  
**Requirements:** Checkpoints 6, 7, 16  

**Plans:**
- [x] Plan 3.1: File Upload SVG Script Neutralization & GridFS Security
- [x] Plan 3.2: Recursive NoSQL Input Sanitizer & MongoDB TLS Enforcements

---

### Phase 4: Rate Limiting & Anti-Abuse
**Status:** ✅ Complete  
**Objective:** Enable production rate limiting on Vercel and apply rate limiting to all auth, OAuth, and token refresh endpoints.  
**Depends on:** Phase 3  
**Requirements:** Checkpoint 8  

**Plans:**
- [x] Plan 4.1: Edge Rate Limiter Optimization & Full Auth Surface Protection

---

### Phase 5: Network Security, CORS, Headers & Information Leakage
**Status:** ✅ Complete  
**Objective:** Rectify CORS configuration in `backend/vercel.json`, inject enterprise security headers in web export, mask production 500 errors, and deny access to sensitive files.  
**Depends on:** Phase 4  
**Requirements:** Checkpoints 10, 11, 12, 15  

**Plans:**
- [x] Plan 5.1: Fix CORS Wildcard Conflict & Inject Enterprise Security Headers
- [x] Plan 5.2: Production Error Masking & Sensitive File Deny Rewrites

---

### Phase 6: Full Security Audit, Web Export & Android APK Release
**Status:** ✅ Complete  
**Objective:** Run automated security regression test suite, verify clean dependencies, build web bundle, generate Android release APK, and deploy.  
**Depends on:** Phase 5  
**Requirements:** Checkpoints 13, 14, 19, 20  

**Plans:**
- [x] Plan 6.1: Automated 20-Point Security Test Suite Execution
- [x] Plan 6.2: Full Production Web Export, Android APK Build & Deployment
