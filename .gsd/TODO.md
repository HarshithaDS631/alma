# GSD Pending Todos

- [ ] Capture future enhancement items (e.g., Upstash Redis rate limiting) `medium` — 2026-11-02

# GSD Completed Todos: Security Fortification (20/20 Checkpoints)

- [x] Hide my API keys: eliminate hardcoded JWT secret fallbacks across backend `high` — 2026-11-02
- [x] Check my env variables: add startup environment validation `high` — 2026-11-02
- [x] Protect my admin routes: lock /api/activity and /api/admin/backup `high` — 2026-11-02
- [x] Add proper authentication: fix verifyToken multiple secrets & protect /endorse `high` — 2026-11-02
- [x] Check user access: enforce IDOR prevention and multi-tenant isolation `high` — 2026-11-02
- [x] Sanitize my forms: enforce NoSQL and XSS recursive input sanitization `high` — 2026-11-02
- [x] Protect against XSS: sanitize file upload types and SVG inline execution `high` — 2026-11-02
- [x] Add rate limiting: remove Vercel skip and cover OAuth / refresh token endpoints `high` — 2026-11-02
- [x] Secure my API endpoints: add standard error masking & route validation `medium` — 2026-11-02
- [x] Check my CORS settings: fix contradictory wildcard credentials in vercel.json `high` — 2026-11-02
- [x] Add security headers: inject HSTS, CSP, X-Frame-Options, nosniff in vercel.json `high` — 2026-11-02
- [x] Turn off debug mode: remove express header banner and mask stack traces `medium` — 2026-11-02
- [x] Update my dependencies: run npm audit on frontend and backend `medium` — 2026-11-02
- [x] Remove unused packages: clean obsolete and vulnerable dependencies `medium` — 2026-11-02
- [x] Check for exposed files: block static access to .env, .git, .sql dumps `high` — 2026-11-02
- [x] Secure my database: enforce TLS 1.3 and safe pool limits on MongoDB Atlas `high` — 2026-11-02
- [x] Hash passwords properly: standardize bcrypt with 12 salt rounds & 5-password history `high` — 2026-11-02
- [x] Check git for leaked secrets: audit git history and ensure .gitignore integrity `high` — 2026-11-02
- [x] Run a full security audit: automated verification of all 20 checkpoints `high` — 2026-11-02
- [x] Make no mistakes: zero regressions, full build verification & APK generation `critical` — 2026-11-02
