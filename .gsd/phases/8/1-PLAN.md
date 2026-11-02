---
phase: 8
plan: 1
wave: 1
depends_on: []
---

# Plan 8.1: Digital Event Pass with Dynamic QR Code & Gate Scanner Check-in

## Objective
Implement digital event ticketing with signed QR passes for attendees and an in-app verification check-in scanner for organizers, transforming physical campus reunions and events into a seamless, modern experience.

## Context
- `backend/models/Event.js`
- `backend/controllers/eventController.js`
- `backend/routes/eventRoutes.js`
- `src/screens/EngageScreen.js`
- `src/screens/AdminEventsScreen.js`

## Tasks

<task type="auto">
  <name>Implement Digital Event Pass & Check-In Backend Engine</name>
  <files>backend/models/Event.js, backend/controllers/eventController.js, backend/routes/eventRoutes.js</files>
  <action>
    - Update `backend/models/Event.js` to store structured registrations:
      `registrations: [{ user: ObjectId, passToken: String, qrCode: String, checkedIn: Boolean, checkedInAt: Date, registeredAt: Date }]`.
    - Implement `getEventPass(req, res)`: generates cryptographically signed QR code containing event ID, attendee ID, and timestamp using `qrcode` library.
    - Implement `checkInAttendee(req, res)`: validates incoming pass token, prevents double check-ins, marks `checkedIn: true`, returns attendee profile.
    - Implement `getEventAttendance(req, res)`: returns stats (total registered, total checked in, remaining).
    - Protect check-in endpoints with `protect` and organizer/admin authorization.
  </action>
  <verify>node -c backend/models/Event.js backend/controllers/eventController.js backend/routes/eventRoutes.js && node scripts/securityAuditTest.js</verify>
  <done>All modified backend files pass syntax checks and securityAuditTest suite passes 100%.</done>
</task>

<task type="auto">
  <name>Build Digital Event Pass & QR Verification UI</name>
  <files>src/components/EventPassModal.js, src/screens/EngageScreen.js</files>
  <action>
    - Create `src/components/EventPassModal.js`:
      Renders an authentic, high-finish **Alumni Digital Boarding Pass** featuring college emblem, event name, attendee name, seat/gate info, and scannable QR code with a "Save Pass" action.
    - Integrate pass button on `src/screens/EngageScreen.js` for all registered events.
    - Add manual/camera check-in modal in `src/screens/AdminEventsScreen.js` allowing organizers to scan or paste a pass token to check in attendees.
  </action>
  <verify>node -c src/components/EventPassModal.js src/screens/EngageScreen.js</verify>
  <done>Component renders without syntax errors and integrates with existing theme system.</done>
</task>

## Success Criteria
- [ ] Registered attendees can open and view their secure Digital Event Pass with dynamic QR code.
- [ ] Organizers can verify and check in attendees in real time.
- [ ] 0 regressions in event registration or permissions.
