# Account Deletion & Data Retention Policy

**Effective Date:** 7 August 2026  
**Last Updated:** 30 September 2026  
**Application Name:** Alumni Network  
**Operating Entity:** RV Educational Institutions  
**Support & Privacy Email:** [rvmediadevelopers@gmail.com](mailto:rvmediadevelopers@gmail.com)  
**Registered Location:** Bengaluru, Karnataka, India  
**Applicability:** Google Play Store Policy & Apple App Store Review Guideline 5.1.1(v)

---

## 1. Overview and Purpose

RV Educational Institutions respects your fundamental right to privacy, autonomy, and control over your digital personal data. In strict accordance with:
- **Apple App Store Review Guideline 5.1.1(v) (Account Deletion Requirement)**
- **Google Play User Data Policy (Delete Account URL Requirement)**
- **Digital Personal Data Protection Act (DPDPA), 2023 (India)**
- **General Data Protection Regulation (GDPR) Article 17 (Right to Erasure / Right to be Forgotten)**
- **California Consumer Privacy Act (CCPA)**

This document details the exact procedures for initiating permanent account deletion, the data destruction timeline, and our institutional data retention standards.

---

## 2. How to Request Account Deletion

You have multiple convenient, free, and accessible methods to permanently delete your Alumni Network account and associated data:

### Method A: In-App Self-Service Deletion (Instant & Recommended)
1. Open the **Alumni Network** app on your iOS, Android, or Web device.
2. Sign in to your verified account.
3. Tap the **Profile** tab in the bottom navigation bar.
4. Tap the **Settings** icon (⚙️ gear symbol in the top-right corner).
5. Select **Login & Security** (or navigate to the **Danger Zone** section).
6. Tap **Delete Account**.
7. Confirm the prompt: *"Are you sure you want to permanently delete your Alumni Network account and all associated data? This action cannot be undone."*
8. Authenticate with your password or verification code.
9. Your account will be immediately deactivated and scheduled for permanent database purge.

### Method B: Web Portal Deletion Request Form
If you no longer have access to the mobile application or have uninstalled it:
1. Visit our dedicated web portal deletion page:  
   **[https://alma-orpin-delta.vercel.app/delete-account.html](https://alma-orpin-delta.vercel.app/delete-account.html)**
2. Provide your registered email address and full name.
3. Complete the email verification challenge.
4. Your deletion request will be processed immediately.

### Method C: Email Request to the Data Protection & Grievance Officer
You can submit a formal written request by emailing:  
**To:** [rvmediadevelopers@gmail.com](mailto:rvmediadevelopers@gmail.com)  
**Subject:** `Account & Personal Data Erasure Request - [Your Full Name]`  
**Content Required:**
- Registered institutional / personal email address
- Associated Batch Year & Department (for verification)
- Explicit statement requesting permanent account and data deletion

Our data privacy team will acknowledge your request within **24 hours** and complete full deletion within **7 business days**.

---

## 3. Scope of Data Subject to Deletion

Upon initiation of an account deletion request, the following data categories are **permanently and irreversibly destroyed**:

| Data Category | Specific Elements Deleted | Timeline |
|---|---|---|
| **Identity & Authentication** | Full name, email address, password hashes (bcrypt), 2FA secret keys, backup codes | Immediate |
| **Active Sessions** | JWT refresh tokens, active mobile session cookies, biometric tokens, device identifiers | Immediate |
| **Profile & Portfolio** | Profile photo, uploaded resumes (PDFs), LinkedIn URL, bio, skills, company, graduation batch | Immediate |
| **Social Content & Posts** | All authored posts, shared media, event registrations, likes, and published comments | Within 48 hours |
| **Direct Messaging** | Private 1-to-1 chat records, mentorship request threads, and connection links | Within 48 hours |
| **Push Notifications** | Firebase Cloud Messaging (FCM) device registration tokens | Immediate |

---

## 4. Limited Retention Exceptions (Statutory & Security)

In strict compliance with international legal standards (DPDPA 2023, GDPR Article 17(3), and CERT-In directions), certain minimal metadata may be temporarily retained under isolated, pseudonymized security partitions:

1. **Security & Audit Logs:** System activity audit records (e.g., security timestamps, IP address logs of prior logins) are retained in read-only encrypted archives for up to **180 days** strictly for cyber-incident forensics and compliance with Indian cybersecurity regulations (CERT-In directives). These logs do not contain personal credentials or profile details.
2. **Financial / Transactional Records:** If any paid event ticketing or donation occurred, basic billing receipts are retained for up to statutory accounting requirements (as mandated by applicable taxation laws).
3. **Institutional Academic Records:** Deleting your Alumni Network account does **NOT** alter or delete your official university academic records (e.g., transcripts, degrees granted, official graduation rolls) maintained independently in RV Educational Institutions' registrar databases.

---

## 5. Third-Party Service Providers Notification

Upon executing your account deletion, our automated data controller triggers deletion routines across our integrated third-party infrastructure processors:
- **MongoDB Atlas:** Hard delete of all user document schemas and associated collection records.
- **Google Firebase:** Revocation of authentication tokens and FCM device endpoints.
- **SendGrid / SMTP:** Suppression and removal of the email address from transactional notification lists.
- **Cloud Media Storage (GridFS / S3):** Permanent deletion of avatar images and resume PDF files.

---

## 6. Confirmation of Deletion

Once the erasure process is finalized, a final confirmation email is dispatched to your registered address confirming:
- The date and timestamp of account termination.
- Confirmation of complete personal data purging across all primary databases.
- De-registration from all institutional communication channels.

---

## 7. Contact Information

For any questions, appeals, or concerns regarding our Data Deletion and Retention policies, please contact:

**Data Protection & Grievance Officer**  
RV Educational Institutions  
RV Vidyanikethan Post, Mysuru Road, Bengaluru - 560059, Karnataka, India  
**Official Email:** [rvmediadevelopers@gmail.com](mailto:rvmediadevelopers@gmail.com)  
**Website:** [https://alma-orpin-delta.vercel.app](https://alma-orpin-delta.vercel.app)
