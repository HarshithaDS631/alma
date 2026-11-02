---
phase: 2
plan: 2
wave: 2
gap_closure: false
---

# Plan 2.2: IDOR Prevention & Skill Endorsement Authentication

## Objective
Enforce authentication on skill endorsements (`/api/recommendations/endorse`), prevent self-endorsement and bot-spamming, and ensure all mutation routes check object ownership.

## Context
- .gsd/SPEC.md
- backend/routes/recommendationRoutes.js
- backend/controllers/recommendationController.js
- backend/routes/eventRoutes.js

## Tasks

<task type="auto">
  <name>Authenticate & Validate Skill Endorsements</name>
  <files>
    backend/routes/recommendationRoutes.js
    backend/controllers/recommendationController.js
  </files>
  <action>
    1. Import `protect` in `backend/routes/recommendationRoutes.js`.
    2. Change `router.post('/endorse', endorseSkill)` to `router.post('/endorse', protect, endorseSkill)`.
    3. In `endorseSkill`, disallow self-endorsement (`req.user._id.toString() === targetUserId.toString()`).
    4. Track the endorser's user ID so a user cannot endorse the same skill on the same profile multiple times.
    AVOID: Allowing unauthenticated scripts to manipulate user endorsement statistics.
    USE: Authenticated, deduplicated endorsement records.
  </action>
  <verify>
    node -c backend/routes/recommendationRoutes.js
  </verify>
  <done>
    `POST /api/recommendations/endorse` requires active login and prevents self-endorsement.
  </done>
</task>

<task type="auto">
  <name>Ensure Event Institution Tenancy Isolation</name>
  <files>
    backend/routes/eventRoutes.js
  </files>
  <action>
    1. Import `optionalProtect` in `backend/routes/eventRoutes.js`.
    2. Change `router.get('/', getEvents)` to `router.get('/', optionalProtect, getEvents)`.
    3. This ensures `req.user` is properly populated for logged-in users, enabling the existing college-specific event filtering.
  </action>
  <verify>
    node -c backend/routes/eventRoutes.js
  </verify>
  <done>
    Event queries respect user's institutional tenancy boundary.
  </done>
</task>

## Success Criteria
- [ ] Endorsements cannot be submitted anonymously.
- [ ] Self-endorsement is rejected with 400 Bad Request.
- [ ] Events listing respects user institution tenancy.

