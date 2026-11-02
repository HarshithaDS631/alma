---
phase: 7
plan: 1
wave: 1
depends_on: []
---

# Plan 7.1: Distributed Upstash Redis Rate Limiting with Fallback

## Objective
Implement distributed rate limiting across Vercel serverless function instances using Upstash Redis HTTP REST client with graceful in-memory fallback, ensuring distributed brute-force protection across all lambdas without breaking local dev or offline tests.

## Context
- `backend/middleware/rateLimiter.js`
- `backend/config/validateEnv.js`
- `.gsd/phases/7/RESEARCH.md`

## Tasks

<task type="auto">
  <name>Create Redis Service Client Adapter with Safe Fallback</name>
  <files>backend/services/redisService.js</files>
  <action>
    Create `backend/services/redisService.js`:
    - Inspect `process.env.UPSTASH_REDIS_REST_URL` and `process.env.UPSTASH_REDIS_REST_TOKEN`.
    - Provide `getRedisClient()`, `isRedisConfigured()`, and safe wrapper methods (`redisGet`, `redisSet`, `redisIncrWithExpiry`).
    - Catch all network errors and log diagnostic warnings without throwing or crashing requests.
  </action>
  <verify>node -e "const redis = require('./backend/services/redisService'); console.log('Redis available:', redis.isRedisConfigured())"</verify>
  <done>Returns boolean status without runtime exceptions when environment credentials are unset.</done>
</task>

<task type="auto">
  <name>Upgrade Rate Limiter Middleware to Support Distributed Store</name>
  <files>backend/middleware/rateLimiter.js</files>
  <action>
    Update `backend/middleware/rateLimiter.js`:
    - Incorporate distributed sliding window / fixed window check via `redisService`.
    - If Redis is configured, increment and enforce IP-based rate limits globally across all serverless instances.
    - If Redis is unconfigured or encounters an error, seamlessly execute the existing Express in-memory limiter.
    - Preserve existing response headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`).
  </action>
  <verify>node -c backend/middleware/rateLimiter.js && node scripts/securityAuditTest.js</verify>
  <done>Syntax check passes and 100% of existing securityAuditTest assertions continue passing.</done>
</task>

## Success Criteria
- [ ] Distributed Redis client initialized when credentials exist.
- [ ] In-memory fallback handles local/test environments with zero configuration.
- [ ] All security tests pass with 0 regressions.

