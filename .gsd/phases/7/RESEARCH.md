# Phase 7 Research: Distributed Rate Limiting & Enterprise Scaling (Upstash Redis)

## 1. Technical Context & Objectives
- **Current State**: `backend/middleware/rateLimiter.js` uses `express-rate-limit` with default `MemoryStore`.
- **Constraint**: On Vercel, serverless lambdas are ephemeral and isolated. If a user or bot makes 10 requests that route to 10 distinct lambdas, in-memory counters each see 1 request, allowing distributed brute force to evade per-instance memory limits.
- **Goal**: Introduce distributed Redis rate-limiting state while guaranteeing 100% backward compatibility:
  - When Upstash Redis credentials (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) are configured, route rate-limiting and query caching through Upstash REST API.
  - When credentials are not configured (e.g. offline local development, CI test runs), gracefully fall back to local `MemoryStore` with zero errors.

## 2. Architecture Comparison

| Approach | Serverless Performance | TCP Connection Limits | Graceful Offline Fallback | Recommendation |
|---|---|---|---|---|
| **`ioredis` / TCP Redis** | High latency on cold starts (TCP handshake) | Exhausts connections quickly on high lambda concurrency | Requires complex reconnect listeners | ⚠️ Not optimal for serverless |
| **`@upstash/redis` (HTTP REST)** | Sub-15ms HTTP API call; connectionless | Unlimited concurrency (stateless HTTP/1.1 & HTTP/2) | Clean `try/catch` fallback to memory | ✅ Recommended for Vercel |

## 3. Implementation Blueprint

### Plan 7.1: Distributed Upstash Rate Limiter
- Create `backend/services/redisService.js`: Initializes `@upstash/redis` client if env credentials exist; exports `isRedisAvailable()`, `getRedisClient()`.
- Upgrade `backend/middleware/rateLimiter.js`: Wrap `authLimiter` and `apiLimiter` with an Upstash-backed sliding window counter when Redis is reachable, falling back to existing `express-rate-limit` memory store.

### Plan 7.2: High-Performance Cache Layer
- Implement `cacheMiddleware(durationSeconds)` in `backend/middleware/cacheMiddleware.js`.
- Apply caching to read-heavy endpoints:
  - `GET /api/recommendations/alumni` (300s TTL)
  - `GET /api/recommendations/jobs` (300s TTL)
  - `GET /api/events` (60s TTL)
- Add cache-busting hook on new user registration or event creation.
