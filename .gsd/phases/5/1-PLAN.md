---
phase: 5
plan: 1
wave: 1
gap_closure: false
---

# Plan 5.1: Fix CORS Wildcard Conflict & Inject Enterprise Security Headers

## Objective
Fix the invalid CORS configuration in `backend/vercel.json` (`Access-Control-Allow-Origin: *` with `credentials: true`), inject comprehensive HTTP security headers in root `vercel.json` and `copy-vercel-config.js`, mask production error messages, and block static access to sensitive files.

## Context
- .gsd/SPEC.md
- backend/vercel.json
- vercel.json
- copy-vercel-config.js
- backend/index.js

## Tasks

<task type="auto">
  <name>Fix CORS and Inject Security Headers into Vercel Configurations</name>
  <files>
    backend/vercel.json
    vercel.json
    copy-vercel-config.js
  </files>
  <action>
    1. In `backend/vercel.json`, remove hardcoded `"Access-Control-Allow-Origin": "*"` with `"Access-Control-Allow-Credentials": "true"`. Let the dynamic whitelist in `backend/index.js` handle credentialed CORS.
    2. In `vercel.json` and `copy-vercel-config.js`, add enterprise headers for all routes:
       - `X-Content-Type-Options: nosniff`
       - `X-Frame-Options: DENY`
       - `X-XSS-Protection: 1; mode=block`
       - `Referrer-Policy: strict-origin-when-cross-origin`
       - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
       - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
    3. Add rewrite deny rules to block web requests to `.env*`, `*.sql`, `.git*`, `scratch/`.
    AVOID: Wildcard origins on credentialed endpoints.
    USE: Explicit headers and dynamic origin validation.
  </action>
  <verify>
    node -e "const c = require('./vercel.json'); console.log('Headers configured:', Boolean(c.headers));"
  </verify>
  <done>
    CORS standard compliant and security headers configured for all web traffic.
  </done>
</task>

<task type="auto">
  <name>Mask Production Errors and Disable Express Fingerprinting</name>
  <files>
    backend/index.js
  </files>
  <action>
    1. In `backend/index.js`, call `app.disable('x-powered-by')`.
    2. Update global error handler:
       - In production (`NODE_ENV === 'production'`), mask 500 status messages to `'An unexpected server error occurred.'` to prevent leaking internal stack traces or database schema details.
       - Log the real error to server console for debugging.
  </action>
  <verify>
    node -c backend/index.js
  </verify>
  <done>
    No framework banner leaked and internal server errors masked in production.
  </done>
</task>

## Success Criteria
- [ ] Vercel responses include HSTS, nosniff, and frameguard headers.
- [ ] 500 errors conceal database stack traces in production.
- [ ] Direct requests to `.env` or `.sql` files return 404/403.

