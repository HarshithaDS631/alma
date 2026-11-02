# SPEC.md — Application Security Hardening Specification

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: Requirements and scope locked for the 20-Point Security Hardening initiative.

## Vision
Transform the Alumni Network platform (Express / MongoDB Atlas backend and React Native / Expo web frontend) into a fortified, enterprise-compliant educational institutional platform adhering to OWASP Top 10, NIST SP 800-63B, and CIS Security benchmarks, eliminating all vulnerabilities across the 20 required security checkpoints.

## Goals
1. **Cryptographic & Secrets Fortification** — Eliminate all hardcoded JWT/captcha secret fallbacks, validate environment variables on boot, enforce bcrypt 12 salt rounds, and scrub git history.
2. **Strict Access Control & IDOR Defense** — Lock `/api/activity` to `adminOnly`, `/api/admin/backup` to `superAdminOnly`, authenticate skill endorsements, and enforce institutional tenancy boundaries.
3. **Deep Input Sanitization & XSS Elimination** — Prevent NoSQL operator injections (`$gt`, `$ne`, `$where`) across bodies, query params, and URL params; eliminate SVG XSS in file uploads.
4. **Resilient Rate Limiting & Anti-Abuse** — Enable rate limiters on production Vercel edge, covering login, registration, OTP, OAuth, and token refresh.
5. **Network Hardening & Information Concealment** — Fix invalid CORS wildcard credentials in `backend/vercel.json`, inject standard HTTP security headers (HSTS, CSP, nosniff, DENY), mask 500 error stack traces in production, and deny static access to `.env*`, `.git*`, and `.sql` dumps.
6. **Zero-Mistake Empirical Verification** — Validate through automated test suites, syntax checks, web export, and Android release APK builds.

## Non-Goals (Out of Scope)
- Rewriting backend architecture from Express to another framework.
- Modifying business features or UI aesthetics unrelated to security hardening.
- Breaking existing authenticated user sessions unnecessarily.

## Constraints
- **Zero Regressions**: Existing login, registration, job posting, directory, and real-time chat functionality must continue working without disruption.
- **Serverless Compatibility**: Must execute seamlessly in both long-running Node.js clusters and Vercel serverless functions.
- **Cross-Platform**: Web (Expo static export) and Mobile (Android Release APK) must remain fully buildable.

## Success Criteria
- [ ] No hardcoded secrets exist anywhere in the codebase.
- [ ] Server refuses to start in production if mandatory env variables are missing.
- [ ] All admin routes reject unauthenticated and non-admin requests with 401/403.
- [ ] `POST /api/recommendations/endorse` requires active authentication.
- [ ] File uploads reject or neutralize malicious SVG script tags.
- [ ] Rate limiting is active on all auth routes in production.
- [ ] `vercel.json` provides A+ rated HTTP security headers.
- [ ] Error responses never leak database error details or stack traces.
- [ ] Full automated test suite passes with zero errors.
- [ ] Production Android APK and web bundle build with zero errors.

---

*Last updated: 2026-11-02*

