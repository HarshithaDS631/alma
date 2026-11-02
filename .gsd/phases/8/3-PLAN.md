---
phase: 8
plan: 3
wave: 2
depends_on: [8.1, 8.2]
---

# Plan 8.3: 1-on-1 Mentorship Slot Booking with Calendar Invite Sync

## Objective
Enable alumni mentors to publish structured availability slots and allow students to book 30-minute 1-on-1 advisory calls with automated meeting links and calendar (.ics) sync.

## Context
- `backend/models/Mentorship.js`
- `backend/models/MentorshipProfile.js`
- `backend/controllers/mentorshipController.js`
- `backend/routes/mentorshipRoutes.js`
- `src/screens/MentorshipScreen.js`

## Tasks

<task type="auto">
  <name>Implement Mentorship Slot Scheduling & Calendar Backend</name>
  <files>backend/models/Mentorship.js, backend/controllers/mentorshipController.js, backend/routes/mentorshipRoutes.js</files>
  <action>
    - Extend `backend/models/Mentorship.js` with session scheduling:
      `slots: [{ startTime: Date, endTime: Date, isBooked: Boolean, bookedBy: ObjectId, topic: String, meetingUrl: String, notes: String }]`.
    - Implement `setAvailabilitySlots(req, res)`: allows mentors to publish open time slots.
    - Implement `getAvailableSlots(req, res)`: returns unbooked future slots for a mentor.
    - Implement `bookMentorshipSlot(req, res)`: books a slot, generates a secure video call room URL, and generates an RFC 5545 `.ics` iCalendar invite string.
    - Implement `getMyBookedSessions(req, res)`: returns upcoming sessions for both mentors and mentees.
  </action>
  <verify>node -c backend/models/Mentorship.js backend/controllers/mentorshipController.js backend/routes/mentorshipRoutes.js && node scripts/securityAuditTest.js</verify>
  <done>All modified backend files pass syntax checks and security test suite passes 100%.</done>
</task>

<task type="auto">
  <name>Integrate Mentorship Booking UI into Mentorship Screen</name>
  <files>src/components/MentorshipBookingModal.js, src/screens/MentorshipScreen.js</files>
  <action>
    - Create `src/components/MentorshipBookingModal.js`:
      Displays mentor's open date/time slots, agenda dropdown (Mock Interview, Resume Review, Higher Studies, Career Switch), and a 1-tap "Book Session & Add to Calendar" button.
    - Update `src/screens/MentorshipScreen.js`:
      Add a "Book 1-on-1 Session" action on mentor cards.
      Display an "Upcoming Sessions" carousel with 1-click meeting join and calendar export.
  </action>
  <verify>node -c src/components/MentorshipBookingModal.js src/screens/MentorshipScreen.js</verify>
  <done>Syntax check passes and components integrate with existing theme.</done>
</task>

## Success Criteria
- [ ] Mentors can publish available time slots.
- [ ] Mentees can select a slot and book a 1-on-1 call with topic agenda.
- [ ] Calendar invite download/sync works seamlessly across web and mobile.

