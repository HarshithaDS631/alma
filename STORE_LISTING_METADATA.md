# 📱 Official Store Listing Metadata for RV Alumni Network

This document provides the exact copy-paste information for submitting your app to **Apple App Store Connect** and **Google Play Console**.

---

## 1. Google Play Console (Android) Listing

### App Details
* **App Name:** `RV Alumni Network` *(Max 30 characters)*
* **Short Description:** `Official alumni, career & mentorship platform for RV Institutions.` *(Max 80 characters)*
* **Full Description:**
```text
Welcome to the official RV Educational Institutions Alumni Network. 

Connect with thousands of graduates, faculty members, and current students across RV institutions. Expand your professional network, find career opportunities, access exclusive mentorship, and stay up to date with institutional milestones and reunions.

KEY FEATURES:
🎓 Verified Alumni Directory: Search and connect with alumni across batches, departments, domains, and global locations.
💼 Career & Job Hub: Explore verified job openings, internship opportunities, and direct alumni referrals.
🤝 Mentorship & Networking: Find experienced alumni mentors in your field or volunteer to guide aspiring students and juniors.
📅 Events & Reunions: Stay informed about batch reunions, guest lectures, webinars, and cultural events.
💬 Direct & Group Messaging: Engage in conversations, share updates, and collaborate on initiatives.
🛡️ Secure & Verified: Institutional verification ensures a trusted, authentic community for all members.

Join your alumni community today and stay connected with the RV legacy wherever you are in the world.
```

### Categorization & Contact
* **Application Type:** `App`
* **Category:** `Education` (Secondary: `Social`)
* **Tags / Keywords:** `Alumni`, `Education`, `Career`, `Networking`, `Mentorship`, `Jobs`
* **Contact Email:** `alumni@rvei.edu.in` *(or your primary support email)*
* **Privacy Policy URL:** `https://alma-orpin-delta.vercel.app/privacy-policy`

---

## 2. Apple App Store Connect (iOS) Listing

### App Information
* **App Name:** `RV Alumni Network` *(Max 30 characters)*
* **Subtitle:** `Official Alumni & Career Hub` *(Max 30 characters)*
* **Primary Category:** `Education`
* **Secondary Category:** `Social Networking`
* **Promotional Text:** `Connect with fellow alumni, discover career opportunities, and mentor students from RV Educational Institutions.`
* **Keywords:** `alumni,rvce,rvei,education,jobs,mentorship,career,college,networking,students` *(Max 100 characters)*
* **Support URL:** `https://alma-orpin-delta.vercel.app`
* **Marketing URL:** `https://alma-orpin-delta.vercel.app`
* **Privacy Policy URL:** `https://alma-orpin-delta.vercel.app/privacy-policy`

### App Review Information (Mandatory Demo Account)
* **Sign-In Required:** `Yes`
* **User Name / Email:** `reviewer@rvei.edu.in`
* **Password:** `Reviewer@2026!`
* **Review Notes:** `This app is the official community portal for RV Educational Institutions alumni, students, and faculty. Use the provided demo credentials to access directory, jobs, events, and mentorship modules.`

---

## 3. Data Safety & Privacy Declarations

---

### A. Google Play Console — Data Safety Form Responses

When completing the **App content > Data safety** questionnaire in Google Play Console, select the following exact answers:

#### 1. Data Collection and Security
* **Does your app collect or share any of the required user data types?** `Yes`
* **Is all of the user data collected by your app encrypted in transit?** `Yes` *(Encrypted using HTTPS TLS 1.3 / SSL)*
* **Do you provide a way for users to request that their data be deleted?** `Yes`
* **Account Deletion URL (Mandatory by Google Play):** `https://alma-orpin-delta.vercel.app/delete-account.html`
* **Does your app allow users to create an account?** `Yes`
* **Can users delete their account and associated data directly within the app?** `Yes` *(Profile > Settings > Delete Account)*

#### 2. Specific Data Types Collected (Select "Yes" for the following):

| Data Type | Collected? | Shared? | Processing | Purpose | Required / Optional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Personal Info > Name** | `Yes` | `No` | Ephemeral: No | `App Functionality`, `Account Management` | `Required` |
| **Personal Info > Email Address** | `Yes` | `No` | Ephemeral: No | `App Functionality`, `Account Management` | `Required` |
| **Personal Info > Phone Number** | `Yes` | `No` | Ephemeral: No | `App Functionality`, `Account Management` | `Optional` |
| **Personal Info > User IDs** | `Yes` | `No` | Ephemeral: No | `App Functionality`, `Account Management` | `Required` (internal database ID) |
| **Photos & Videos > Photos** | `Yes` | `No` | Ephemeral: No | `App Functionality` (profile avatar & post photos) | `Optional` |
| **Messages > In-App Messages** | `Yes` | `No` | Ephemeral: No | `App Functionality` (peer alumni chat) | `Optional` |
| **App Activity > User Interactions** | `Yes` | `No` | Ephemeral: No | `Analytics`, `App Functionality` | `Optional` |
| **Device or other IDs** | `Yes` | `No` | Ephemeral: No | `App Functionality` (Push notification token) | `Optional` |

> [!NOTE]
> **Data Sharing**: Select **"No"** to all questions asking if you share data with third parties. RV Alumni Network **does not sell, rent, or broker user data** to third-party advertisers.

---

### B. Apple App Store Connect — App Privacy Nutrition Labels

Under **App Store Connect > App Privacy**, complete the questionnaire with these exact selections:

#### 1. Data Collection Declaration
* **Do you or your third-party partners collect data from this app?** `Yes`

#### 2. Data Types Collected & Declared:
1. **Contact Info**:
   * **Name**: Collected, Linked to User Identity, Not used for Tracking. (Purpose: `App Functionality`)
   * **Email Address**: Collected, Linked to User Identity, Not used for Tracking. (Purpose: `App Functionality`, `Account Management`)
   * **Phone Number**: Collected, Linked to User Identity, Not used for Tracking. (Purpose: `App Functionality` — optional)
2. **User Content**:
   * **Photos or Videos**: Collected, Linked to User Identity, Not used for Tracking. (Purpose: `App Functionality` — avatars & posts)
   * **Customer Support**: Collected, Linked to User Identity. (Purpose: `Customer Support`)
   * **Other User Content**: Collected (In-app direct messages & community posts).
3. **Identifiers**:
   * **User ID**: Collected, Linked to User Identity, Not used for Tracking. (Purpose: `App Functionality`)
   * **Device ID**: Collected for push notification dispatch via Expo / APNs.
4. **Usage Data**:
   * **Product Interaction**: Launching features, connecting with mentors. (Purpose: `Analytics`, `App Functionality`)

#### 3. Tracking Declaration
* **Do you use data to track the user across apps and websites owned by other companies?** `No`
* *(The app does NOT include advertising SDKs, IDFA tracking, or third-party ad brokers).*

---

### C. App Content, Age Rating & Permissions

#### 1. Target Audience & Content Rating
* **Target Age Group:** `18 and older` (Alumni, faculty, graduating college students)
* **Could your app appeal to children under 13?** `No`
* **Social / Interaction Features:** `Yes` (Users can post updates, comment, and send direct messages to fellow verified alumni)
* **User Content Moderation:** Built-in reporting system (`Report Post / User`), user blocking (`Block Member`), and administrator review panel.
* **Apple Age Rating:** `12+` or `17+` (Unrestricted Web Access: `No`, User-Generated Content: `Frequent/Intense Social Features`).

#### 2. Device Permissions Justification (Android & iOS)
* **Camera / Photos (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`):**
  * *Reason:* "Allow RV Alumni Network to access your camera and photo library so you can set your profile picture and share event photos with your alumni community."
* **Notifications (`POST_NOTIFICATIONS`):**
  * *Reason:* "Stay notified about mentorship requests, batch reunion updates, and direct messages."

---

### D. Mandatory Compliance URLs for Submission
* **Privacy Policy URL:** `https://alma-orpin-delta.vercel.app/privacy-policy` *(or `https://alma-orpin-delta.vercel.app/privacy-policy.html`)*
* **Terms of Service URL:** `https://alma-orpin-delta.vercel.app/terms-of-service` *(or `https://alma-orpin-delta.vercel.app/terms-of-service.html`)*
* **Account Deletion Request URL:** `https://alma-orpin-delta.vercel.app/delete-account.html`
* **Community Guidelines URL:** `https://alma-orpin-delta.vercel.app/community-guidelines.html`
* **Support Email:** `alumniaffairs@rvei.edu.in` / `alumni@rvei.edu.in`

