# Security Architecture & Data Protection Whitepaper

**Application:** Alumni Network  
**Institution:** RV Educational Institutions  
**Target Environment:** Production (Mobile & Web)  
**Date of Audit & Implementation:** 30 September 2026  
**Auditor / Engineering Team:** MediaCell / RV Educational Institutions  

---

## 1. Executive Summary

This document describes the multi-layered security architecture, threat model mitigations, and compliance controls implemented across the **Alumni Network** platform. All identified vulnerabilities and loopholes have been audited and remediated to ensure institutional-grade data protection, confidentiality, integrity, and availability.

---

## 2. Threat Vector Remediation Summary

| Vulnerability / Threat | Risk Severity | Status | Remediation Implemented |
|---|---|---|---|
| **Weak JWT Secret Fallback (`'secret'`)** | **CRITICAL** | **FIXED** | Completely removed `'secret'` string across all microservices, controllers, Socket.IO handlers, and middleware. Enforced strong cryptographic secret keys (`JWT_SECRET`). |
| **Exposed OTPs in API Responses (`demoOtp`)** | **CRITICAL** | **FIXED** | Stripped `demoOtp` from all API responses (`sendOtp`, `sendLoginOtp`, `otpDispatcher`). OTP codes are now delivered exclusively via verified out-of-band email and SMS/WhatsApp channels. |
| **Brute-Force Attacks on Auth Endpoints** | **HIGH** | **FIXED** | Applied strict rate limiters across `/register`, `/verify-otp`, `/login-otp`, `/reset-password`, and 2FA login verification endpoints. |
| **Credential Leakage in Server Audit Logs** | **HIGH** | **FIXED** | Configured automated masking in `activityLogger.js` to scrub all sensitive parameters (`password`, `otp`, `twoFactorCode`, `twoFactorToken`, `secret`, `token`, `refreshToken`, `apiKey`) before persisting to MongoDB Atlas. |
| **Path Traversal on GridFS File Lookups** | **MEDIUM** | **FIXED** | Added path normalization and alphanumeric filename sanitization (`path.basename().replace(/[^a-zA-Z0-9._-]/g, '')`) with strict MIME-type sniffing prevention (`nosniff`). |
| **Session Invalidation on Password Reset** | **HIGH** | **FIXED** | Implemented cascade revocation: resetting a password now immediately destroys all existing active refresh tokens, forcing re-authentication across all devices. |
| **Incomplete Account Deletion Cleanup** | **HIGH** | **FIXED** | Enhanced `deleteAccount` to cascade delete refresh tokens, posts, session cookies, and immediately blacklist the active JWT token. |
| **NoSQL Injection Vulnerabilities** | **HIGH** | **PROTECTED** | Enforced `express-mongo-sanitize` on all incoming request bodies and query parameters. |
| **HTTP Security Headers** | **MEDIUM** | **PROTECTED** | Configured `helmet` with Cross-Origin Resource Policies, frameguard (clickjacking prevention), and XSS protections. |

---

## 3. Cryptographic Standards

1. **Password Hashing:**
   - Algorithm: **bcrypt** with `genSalt(10)`
   - Salt generation: Individual per-user cryptographically random salts
   - Enforced 5-Password History: Prevents reuse of the last 5 previous passwords.
2. **Session Security (JWT):**
   - Signature: HMAC-SHA256 with 256-bit institutional secret.
   - Access Token Lifetime: 7 days.
   - 2FA Temporary Token Lifetime: 5 minutes.
   - Revocation: In-memory and database-backed `TokenBlacklist` tracking logged-out and deleted tokens.
3. **Data in Transit:**
   - TLS 1.3 / HTTPS strictly enforced across Vercel and MongoDB Atlas connection pools.
4. **Data at Rest:**
   - MongoDB Atlas volume encryption (AES-256).

---

## 4. Multi-Tenant Institution Isolation

1. **Role-Based Access Control (RBAC):**
   - Roles: `Alumni`, `Admin`, `Super Admin`.
   - Admin operations are strictly isolated by `institution` scope. An Admin from RVCE cannot view, approve, or alter student records from RVITM or RVCA.
   - Only `Super Admin` has multi-tenant oversight permissions.
2. **Ownership Enforcement:**
   - Posts, resumes, comments, and profile edits require strict user ID ownership verification or administrative override permissions.

---

## 5. Ongoing Monitoring & Incident Response

- Real-time logging of user and administrative actions into immutable `ActivityLog` collections in MongoDB Atlas.
- Automatic rate-limit tracking to block distributed denial-of-service (DDoS) and brute-force bot sweeps.
- Dedicated security contact for responsible disclosure: [rvmediadevelopers@gmail.com](mailto:rvmediadevelopers@gmail.com).
