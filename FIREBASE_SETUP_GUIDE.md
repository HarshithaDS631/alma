# Firebase Setup Guide for Alumni Network

This guide walks you through setting up Firebase for push notifications on both Android (FCM) and iOS (APNs).

---

## Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add Project**
3. Name it: `alumni-network`
4. Disable Google Analytics (optional)
5. Click **Create Project**

---

## Step 2 — Add Android App to Firebase

1. In Firebase Console, click **Add App** → select **Android** (🤖)
2. Enter package name: `com.mediacell.alumni`
3. Enter App nickname: `Alumni Network Android`
4. Click **Register App**
5. **Download `google-services.json`**
6. **Replace** the placeholder `google-services.json` in your project root with the downloaded file
7. Click **Next** → **Next** → **Continue to Console**

### Get SHA-1 Certificate Fingerprint (Required)

Run this command to get the SHA-1 for your keystore:

```bash
# Development / Expo Go (use this for now)
eas credentials

# OR manually via keytool if you have a local keystore:
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

Add the SHA-1 in Firebase Console:
- **Project Settings** → **Your Android App** → **Add Fingerprint** → Paste SHA-1

---

## Step 3 — Add iOS App to Firebase

1. In Firebase Console, click **Add App** → select **iOS** (🍎)
2. Enter bundle ID: `com.mediacell.alumni`
3. Enter App nickname: `Alumni Network iOS`
4. Click **Register App**
5. **Download `GoogleService-Info.plist`**
6. **Replace** the placeholder `GoogleService-Info.plist` in your project root with the downloaded file
7. Click **Next** → **Next** → **Continue to Console**

---

## Step 4 — Configure APNs for iOS Push Notifications

> [!IMPORTANT]
> This requires an Apple Developer account ($99/year).

1. Go to [https://developer.apple.com](https://developer.apple.com)
2. **Certificates, Identifiers & Profiles** → **Keys**
3. Click **+** → Check **Apple Push Notifications service (APNs)**
4. Name it: `Alumni Network APNs Key`
5. Download the `.p8` key file (download ONCE — cannot re-download)
6. Note the **Key ID** and **Team ID**

### Add APNs Key to Firebase:
1. Firebase Console → **Project Settings** → **Cloud Messaging** tab
2. Under **Apple app configuration**, click **Upload**
3. Upload your `.p8` file, enter Key ID and Team ID
4. Click **Save**

---

## Step 5 — Enable Cloud Messaging

1. Firebase Console → **Build** → **Cloud Messaging**
2. It should show as enabled automatically once apps are registered

---

## Step 6 — Verify in Your App

After filling in both config files, your app will automatically use Firebase for push notifications via `expo-notifications`.

The backend already uses Firebase Admin SDK (if configured). Verify your backend `.env` has:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-service-account-email
```

Get these from Firebase Console → **Project Settings** → **Service Accounts** → **Generate new private key**.

---

## Checklist

- [ ] Firebase project created
- [ ] Android app registered → `google-services.json` downloaded and replaced
- [ ] SHA-1 fingerprint added in Firebase Console
- [ ] iOS app registered → `GoogleService-Info.plist` downloaded and replaced
- [ ] APNs key generated and uploaded to Firebase (requires Apple Developer account)
- [ ] Backend Firebase Admin SDK credentials added to backend `.env`
