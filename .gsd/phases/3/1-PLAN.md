---
phase: 3
plan: 1
wave: 1
gap_closure: false
---

# Plan 3.1: File Upload SVG Script Neutralization & GridFS Security

## Objective
Prevent Stored Cross-Site Scripting (XSS) via file uploads by sanitizing or safely serving SVG files, and enforce strict MIME-type and path traversal defenses across GridFS downloads.

## Context
- .gsd/SPEC.md
- backend/middleware/uploadMiddleware.js
- backend/routes/uploadRoutes.js
- backend/config/db.js

## Tasks

<task type="auto">
  <name>Neutralize SVG Stored XSS in Uploads</name>
  <files>
    backend/middleware/uploadMiddleware.js
    backend/routes/uploadRoutes.js
  </files>
  <action>
    1. In `uploadRoutes.js`, when serving SVG files (`image/svg+xml`), inject strict sandbox headers:
       - `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`
       - `Content-Disposition: inline; filename="image.svg"`
       - `X-Content-Type-Options: nosniff`
    2. In `uploadMiddleware.js`, inspect SVG upload buffers to reject files containing `<script>`, `onload=`, `onerror=`, `javascript:`.
    AVOID: Serving user-uploaded SVGs that execute scripts in the application origin.
    USE: Content-Security-Policy sandboxing on SVG delivery and upload buffer inspection.
  </action>
  <verify>
    node -c backend/routes/uploadRoutes.js
  </verify>
  <done>
    Uploaded SVGs cannot execute inline JavaScript in the user's browser context.
  </done>
</task>

<task type="auto">
  <name>Harden Database Connection Pool & TLS</name>
  <files>
    backend/config/db.js
  </files>
  <action>
    1. In `backend/config/db.js`, add connection options:
       - `tls: true`
       - `maxPoolSize: 10`
       - `serverSelectionTimeoutMS: 5000`
       - `socketTimeoutMS: 45000`
    2. Add connection error listener preventing unhandled rejections from crashing the process.
  </action>
  <verify>
    node -c backend/config/db.js
  </verify>
  <done>
    Database connection enforces TLS 1.3 encryption and safe pool bounds.
  </done>
</task>

## Success Criteria
- [ ] SVG uploads cannot execute arbitrary JavaScript.
- [ ] MongoDB Atlas connection enforces TLS encryption and connection timeouts.

