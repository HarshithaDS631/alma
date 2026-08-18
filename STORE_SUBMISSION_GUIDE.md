# App Store & Play Store — Store Listing Submission Guide

Prepared for **Alumni Network** — `com.mediacell.alumni`

---

## App Identity

| Field | Value |
|:---|:---|
| **App Name** | Alumni Network |
| **Package / Bundle ID** | `com.mediacell.alumni` |
| **Developer Name** | RV Educational Institutions |
| **Contact Email** | rvmediadevelopers@gmail.com |
| **Version** | 1.0.0 |
| **Category** | Education / Social Networking |
| **Privacy Policy URL** | Host your `PRIVACY_POLICY.md` publicly (e.g. GitHub Pages or your website) |
| **Terms URL** | Host your `TERMS_AND_CONDITIONS.md` publicly |

---

## Short Description (80 characters max — Play Store)

```
Connect with RV alumni. Network, find jobs, mentors & events.
```

## Full Description (4000 characters max)

```
Alumni Network is the official networking platform for students and alumni of RV Educational Institutions.

Whether you are a recent graduate looking for your first job, an experienced professional wanting to give back through mentorship, or an admin managing alumni engagement — this app is built for you.

FEATURES:

✅ Alumni Directory
Browse and search the complete alumni directory filtered by batch, degree, industry, and location. Connect with the right people instantly.

✅ Social Feed
Share your career milestones, achievements, project updates, and professional insights with your alumni community. Like, comment, and engage with posts from your peers.

✅ Jobs & Internships
Discover job openings and internship opportunities posted by fellow alumni and institutional partners. Apply directly or get referred by alumni insiders.

✅ Mentorship
Request mentorship from experienced alumni professionals or offer your expertise to current students. Build meaningful professional relationships.

✅ Events & Webinars
Stay updated on alumni reunions, tech talks, career fairs, and institutional events. RSVP and get notified ahead of time.

✅ Real-Time Messaging
Chat securely with alumni and peers in real-time. Messages are delivered instantly via WebSocket technology.

✅ Push Notifications
Never miss a message, job update, or event. Get instant push notifications powered by Firebase Cloud Messaging.

✅ Multi-Institution Support
The platform supports multiple RV institutions under unified Super Admin management.

✅ Secure & Private
Your data is encrypted in transit and at rest. Role-based access control ensures only verified alumni can access the platform.

SUPPORTED USERS:
• Students & Alumni
• Institution Administrators
• Super Administrators

Alumni Network is built with React Native + Expo for seamless performance on both iOS and Android.

Made with ❤️ by RV Educational Institutions, Bengaluru.
```

---

## Keywords (App Store — 100 characters max, comma separated)

```
alumni,network,college,mentor,jobs,career,events,chat,education,university
```

---

## Screenshots Required

### Google Play Store
| Type | Count |
|:---|:---|
| Phone screenshots | 2–8 screenshots (16:9 or 9:16 ratio) |
| 7-inch tablet | Optional but recommended |
| 10-inch tablet | Optional but recommended |
| Feature graphic | 1024 × 500 px JPG/PNG |
| App icon | 512 × 512 px PNG (no alpha) |

### Apple App Store
| Type | Count |
|:---|:---|
| iPhone 6.7" display | At least 3 screenshots required |
| iPhone 6.5" display | At least 3 screenshots required |
| iPad Pro 12.9" | Required if tablet support declared |
| App icon | 1024 × 1024 px PNG (no alpha) |

---

## Age Rating

| Store | Rating |
|:---|:---|
| **Google Play** | Teen (13+) |
| **Apple App Store** | 12+ |

**Content Declarations:**
- Social networking features: Yes
- User generated content: Yes
- Chat/messaging: Yes
- No violence, adult content, gambling, or drugs

---

## Data Safety (Google Play) — Required Declarations

| Data Type | Collected | Shared | Required |
|:---|:---|:---|:---|
| Name | ✅ Yes | ❌ No | Yes (account) |
| Email address | ✅ Yes | ❌ No | Yes (account) |
| User ID | ✅ Yes | ❌ No | Yes |
| Photos | ✅ Yes | ❌ No | Profile / posts |
| App interactions | ✅ Yes | ❌ No | Analytics |
| Messages | ✅ Yes | ❌ No | Chat feature |
| Device identifiers | ✅ Yes | ❌ No | FCM push |

**Security practices to declare:**
- Data is encrypted in transit: ✅ Yes (HTTPS/TLS)
- Users can request data deletion: ✅ Yes

---

## App Privacy (Apple App Store) — Required Declarations

| Data | Usage |
|:---|:---|
| Name, Email | Account creation |
| Photos/Camera | Profile pictures, post uploads |
| Device ID | Push notifications |
| User content | Posts, messages |

Privacy Nutrition Label: **Data Linked to You**

---

## iOS App Store Information

| Field | Value |
|:---|:---|
| Primary Category | Education |
| Secondary Category | Social Networking |
| Encryption | No (ITSAppUsesNonExemptEncryption = false) |
| Export Compliance | No export restrictions |
| Content Rights | Developer-owned content |
| Age Rating | 12+ |

---

## Legal Documents — Hosted URLs Needed

You must host these at a **publicly accessible URL** before submission:

1. **Privacy Policy** → Required by both stores. Host your `PRIVACY_POLICY.md` at a URL like:
   - `https://github.com/HarshithaDS631/alma/blob/main/PRIVACY_POLICY.md`

2. **Terms & Conditions** → Required by Apple. Host `TERMS_AND_CONDITIONS.md` similarly.

3. **Community Guidelines** → Recommended. Host `COMMUNITY_GUIDELINES.md`.

---

## Review Notes for App Reviewers

Include these notes in both store submission review fields:

```
This is a verified alumni networking application for RV Educational Institutions in Bengaluru, India.

TEST ACCOUNT FOR REVIEW:
Email: reviewer@example.com
Password: ReviewPass123!

This account has been pre-approved with Alumni role access so the reviewer
can explore all features without needing institutional approval.

Key features to review:
1. Alumni Directory (search/filter alumni)
2. Social Feed (post creation with images)
3. Jobs listing
4. Mentorship requests
5. Real-time messaging (Chat screen)
6. Notifications
7. Legal screen (Terms, Privacy, Community Guidelines, Data Rights)

The app requires institutional email verification and admin approval for
new registrations. The test account bypasses this flow for review purposes.
```

---

## Pre-submission Checklist

### Technical
- [ ] `eas build --platform android --profile production` — generate `.aab`
- [ ] `eas build --platform ios --profile production` — generate `.ipa`
- [ ] Test on physical Android device
- [ ] Test on iPhone (or Simulator with correct iOS version)
- [ ] Verify all API endpoints respond correctly in production
- [ ] Confirm Push Notifications work end-to-end (FCM + APNs)
- [ ] Confirm Socket.io real-time chat works in production
- [ ] Verify account deletion flow works

### Legal
- [ ] Privacy Policy hosted at public URL
- [ ] Terms & Conditions hosted at public URL
- [ ] Community Guidelines hosted at public URL
- [ ] Age rating completed in both stores
- [ ] Data safety questionnaire completed (Play Store)
- [ ] App Privacy nutrition label filled (App Store)

### App Store Specific
- [ ] Apple Developer account active ($99/year)
- [ ] App created in App Store Connect
- [ ] Certificates & provisioning profiles configured
- [ ] APNs (Apple Push Notification) key configured in Firebase
- [ ] 3+ screenshots per device size uploaded

### Play Store Specific
- [ ] Google Play Developer account active ($25 one-time fee)
- [ ] App created in Google Play Console
- [ ] `google-services.json` added to project root
- [ ] SHA-1 fingerprint registered in Firebase Console
- [ ] App signing configured in Play Console
- [ ] Feature graphic (1024 × 500 px) uploaded
- [ ] 2+ phone screenshots uploaded
