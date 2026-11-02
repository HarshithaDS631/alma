---
phase: 4
plan: 1
wave: 1
gap_closure: false
---

# Plan 4.1: Edge Rate Limiter Optimization & Full Auth Surface Protection

## Objective
Activate rate limiting across all production deployments (including Vercel serverless environments), eliminate the Vercel bypass in `rateLimiter.js`, and attach rate limiting to all OAuth, Google, Apple, LinkedIn, and refresh token endpoints.

## Context
- .gsd/SPEC.md
- backend/middleware/rateLimiter.js
- backend/routes/authRoutes.js
- backend/routes/firebaseAuthRoutes.js

## Tasks

<task type="auto">
  <name>Remove Vercel Rate Limit Bypass & Add Robust Edge Key Generator</name>
  <files>
    backend/middleware/rateLimiter.js
  </files>
  <action>
    1. Remove `skip: () => Boolean(process.env.VERCEL)` from `authLimiter`.
    2. Configure a reliable `keyGenerator` in `rateLimiter.js` extracting the true client IP from `req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip`.
    3. Ensure rate limiter headers (`RateLimit-Limit`, `RateLimit-Remaining`) conform to standard draft RFC.
    AVOID: Disabling rate limiting on serverless platforms because of shared instance concerns.
    USE: Client IP parsing combined with standard express-rate-limit memory/store.
  </action>
  <verify>
    node -c backend/middleware/rateLimiter.js
  </verify>
  <done>
    `authLimiter` active on all platforms including Vercel.
  </done>
</task>

<task type="auto">
  <name>Attach Rate Limiters to All OAuth & Token Routes</name>
  <files>
    backend/routes/authRoutes.js
    backend/routes/firebaseAuthRoutes.js
  </files>
  <action>
    1. In `backend/routes/authRoutes.js`, attach `authLimiter` to:
       - `POST /google`
       - `POST /linkedin`
       - `POST /facebook`
       - `POST /apple`
       - `POST /refresh-token`
       - `POST /oauth`
       - `POST /check-email`
    2. In `backend/routes/firebaseAuthRoutes.js`, attach `authLimiter` to:
       - `POST /verify-token`
  </action>
  <verify>
    node -c backend/routes/authRoutes.js
  </verify>
  <done>
    All authentication surfaces are shielded against brute-force attacks and credential stuffing.
  </done>
</task>

## Success Criteria
- [ ] Brute-force attacks against OAuth and token endpoints are throttled.
- [ ] Rate limiting operates on Vercel without skipping.

