---
phase: 8
plan: 2
wave: 1
depends_on: []
---

# Plan 8.2: Alumni Employee Referral Request Hub ("Refer an RVite")

## Objective
Enable students and young alumni to request internal employee referrals from verified alumni working at top tech and enterprise firms, transforming job listings into a direct career mentorship pipeline.

## Context
- `backend/models/Job.js`
- `backend/controllers/jobController.js`
- `backend/routes/jobRoutes.js`
- `src/screens/JobsScreen.js`

## Tasks

<task type="auto">
  <name>Implement Employee Referral Request Backend Engine</name>
  <files>backend/models/Job.js, backend/controllers/jobController.js, backend/routes/jobRoutes.js</files>
  <action>
    - Extend `backend/models/Job.js` with `referralRequests`:
      `[{ candidate: ObjectId, pitch: String, resumeUrl: String, status: String, reviewedAt: Date, feedback: String, createdAt: Date }]`.
    - Implement `requestReferral(req, res)`: validates authenticated user is not the poster, validates required pitch/resume, adds referral request, emits notification to poster.
    - Implement `getIncomingReferralRequests(req, res)`: returns all referral requests for jobs posted by current user with populated candidate profile.
    - Implement `updateReferralStatus(req, res)`: allows poster to update status (`Endorsed`, `Needs Info`, `Declined`) with optional feedback.
    - Protect all endpoints with `protect` and rate limiting.
  </action>
  <verify>node -c backend/models/Job.js backend/controllers/jobController.js backend/routes/jobRoutes.js && node scripts/securityAuditTest.js</verify>
  <done>All modified backend files pass syntax checks and securityAuditTest suite passes 100%.</done>
</task>

<task type="auto">
  <name>Integrate Referral Request Flow into Jobs UI</name>
  <files>src/components/ReferralModal.js, src/screens/JobsScreen.js</files>
  <action>
    - Create `src/components/ReferralModal.js`:
      Provides an intuitive modal with candidate summary, 140-char elevator pitch, resume preview, and 1-tap submission.
    - On `src/screens/JobsScreen.js`:
      Add a prominent **"🤝 Ask an RVite for Referral"** button on job cards posted by alumni.
    - Add a **"Referral Requests"** tab for alumni posters to review incoming candidates with 1-tap "Endorse & Refer" action.
  </action>
  <verify>node -c src/components/ReferralModal.js src/screens/JobsScreen.js</verify>
  <done>Syntax check passes and components render smoothly with existing theme.</done>
</task>

## Success Criteria
- [ ] Candidates can submit targeted referral requests on alumni-posted job listings.
- [ ] Alumni posters can manage and review incoming requests with instant status feedback.
- [ ] All inputs are sanitized and protected against abuse.
