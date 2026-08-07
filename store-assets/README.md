# Store Assets — Screenshot & Graphic Requirements

Place all store screenshots and graphics in this directory before submission.

---

## Google Play Store Requirements

### Phone Screenshots (Required — minimum 2, maximum 8)
- **Resolution:** 1080 × 1920 px (portrait) or 1920 × 1080 px (landscape)
- **Format:** PNG or JPEG
- **Max file size:** 8 MB each

Capture these screens:
1. `android_01_welcome.png` — Welcome / Login screen
2. `android_02_dashboard.png` — Main Dashboard / Feed
3. `android_03_alumni_directory.png` — Alumni Directory search
4. `android_04_jobs.png` — Jobs & Internships listing
5. `android_05_mentorship.png` — Mentorship screen
6. `android_06_chat.png` — Real-time Chat
7. `android_07_events.png` — Events listing
8. `android_08_profile.png` — Profile screen

### Feature Graphic (Required)
- `feature_graphic.png`
- **Resolution:** 1024 × 500 px
- **Format:** PNG or JPEG
- **Content:** App name, logo, tagline — no device frames

### App Icon (Required — separate from adaptive icon)
- `play_store_icon.png`
- **Resolution:** 512 × 512 px
- **Format:** PNG (no alpha/transparency)

---

## Apple App Store Requirements

### iPhone 6.7" Screenshots (Required — iPhone 15 Pro Max)
- **Resolution:** 1290 × 2796 px (portrait)
- **Format:** PNG
- **Minimum:** 3 screenshots

Files:
1. `ios_6.7_01_welcome.png`
2. `ios_6.7_02_dashboard.png`
3. `ios_6.7_03_directory.png`
4. `ios_6.7_04_jobs.png`
5. `ios_6.7_05_chat.png`

### iPhone 6.5" Screenshots (Required — iPhone 14 Plus)
- **Resolution:** 1242 × 2688 px (portrait)
- Same content as 6.7" (can use same screenshots if sizes match)

### App Icon (Already handled by app.json)
- Must be 1024 × 1024 px
- No alpha channel
- Already configured in `./assets/images/icon.png`

---

## How to Capture Screenshots

### Using Expo Go (Fastest method — no build needed)
1. Run `npx expo start`
2. Open on your phone or emulator
3. Navigate to each screen
4. Take screenshot:
   - **Android emulator:** Ctrl+S or Camera button in emulator sidebar
   - **iPhone simulator:** Cmd+S
   - **Physical device:** Volume Down + Power button (Android) or Side + Volume Up (iPhone)

### Using Android Emulator (Pixel 7 Pro recommended)
1. Install Android Studio
2. Create AVD: Pixel 7 Pro, API 34
3. Run `npx expo start --android`
4. Screenshot via emulator toolbar

---

## Play Store Promotional Text Templates

### Short Description (80 chars)
```
Connect with RV alumni. Network, jobs, mentors & events in one app.
```

### What's New (for updates)
```
Version 1.0.0 — Initial release.
• Alumni directory with search and filters
• Job & internship listings
• Mentorship requests
• Real-time messaging
• Event management
• Push notifications
```

---

## Checklist

- [ ] `feature_graphic.png` (1024 × 500 px) — Play Store
- [ ] `play_store_icon.png` (512 × 512 px) — Play Store
- [ ] 4+ Android phone screenshots
- [ ] 3+ iPhone 6.7" screenshots
- [ ] 3+ iPhone 6.5" screenshots
