---
phase: 7
plan: 2
wave: 2
depends_on: [7.1]
---

# Plan 7.2: High-Performance Directory & Recommendation Caching Layer

## Objective
Implement an optional Redis-backed caching middleware with TTL and cache-busting hooks for read-heavy API endpoints (alumni directory, job recommendations, campus events), reducing MongoDB Atlas query overhead and cutting endpoint latency under 50ms.

## Context
- `backend/services/redisService.js`
- `backend/routes/recommendationRoutes.js`
- `backend/routes/eventRoutes.js`

## Tasks

<task type="auto">
  <name>Implement Read-Through Cache Middleware</name>
  <files>backend/middleware/cacheMiddleware.js</files>
  <action>
    Create `backend/middleware/cacheMiddleware.js`:
    - Generate cache key based on `req.originalUrl` and optional tenant/user context.
    - Check Redis cache via `redisService.redisGet(key)`. If cache hit, return cached payload with header `X-Cache: HIT`.
    - If cache miss or Redis unavailable, intercept `res.json()`, store payload in Redis with specified TTL, and return with `X-Cache: MISS`.
  </action>
  <verify>node -c backend/middleware/cacheMiddleware.js</verify>
  <done>Syntax check passes and middleware exports valid Express handler.</done>
</task>

<task type="auto">
  <name>Attach Caching & Invalidation to Alumni and Event Routes</name>
  <files>backend/routes/recommendationRoutes.js, backend/routes/eventRoutes.js, backend/controllers/eventController.js</files>
  <action>
    - Attach `cacheMiddleware(300)` (5 minutes) to `GET /api/recommendations/alumni` and `GET /api/recommendations/jobs`.
    - Attach `cacheMiddleware(60)` (1 minute) to `GET /api/events`.
    - When a new event is created in `eventController.createEvent`, invalidate `cache:events:*`.
  </action>
  <verify>node -c backend/routes/recommendationRoutes.js backend/routes/eventRoutes.js backend/controllers/eventController.js && node scripts/securityAuditTest.js</verify>
  <done>Syntax check passes and all security assertions continue to pass without errors.</done>
</task>

## Success Criteria
- [ ] Read-heavy endpoints serve cached responses when Redis is active.
- [ ] Safe bypass occurs seamlessly when Redis is unconfigured.
- [ ] Cache invalidation triggers automatically on mutation.
