# RVITM Alumni Network 🎓

Welcome to the RVITM Alumni Network platform! This application serves as a central hub for alumni to connect, share updates, post media, and network with their peers.

## 🚀 Live Links

- **Frontend Application (Live UI):** [https://alumni-app-nine.vercel.app](https://alumni-app-nine.vercel.app) 
- **Backend API Server:** [https://alma-test-three.vercel.app](https://alma-test-three.vercel.app)

> [!NOTE]
> **To the Repository Owner:** To fix the "About" link on the right side of the GitHub page, click the `⚙️` (Settings gear) icon in the "About" section on the right, and paste `https://alumni-app-nine.vercel.app` into the "Website" field!

## 📱 Features

- **Dynamic Post Creation**: Attach images, PDFs, and documents natively or via drag-and-drop.
- **Real-time Feed**: See updates, connect with alumni, and stay up to date.
- **Alumni Profiles**: View and customize your personal alumni profile.
- **Cross-Platform**: Built with Expo and React Native for Web, iOS, and Android support.

## 📊 Enterprise Production Flowchart

```mermaid
flowchart TD

%% ================= USER LAYER =================

A[Users]

A --> Alumni
A --> Student
A --> Admin
A --> SuperAdmin


%% ================= FRONTEND =================

subgraph Frontend["Frontend Layer"]

Mobile["Mobile Application<br/>React Native + Expo<br/>JavaScript"]

Web["Web Application<br/>React Native Web<br/>JavaScript"]

UI["UI Components<br/>Navigation<br/>Forms<br/>Dashboard<br/>Screens"]

State["State Management<br/>Redux Toolkit / React Hooks"]

end


Alumni --> Mobile
Student --> Mobile
Admin --> Web
SuperAdmin --> Web

Mobile --> UI
Web --> UI

UI --> State


%% ================= LEGAL CONSENT =================


subgraph Legal["Legal Compliance"]

Terms["Terms & Conditions"]

Privacy["Privacy Policy"]

Community["Community Guidelines"]

Data["Data Retention Policy"]

Delete["Account Deletion Policy"]

Cookie["Cookie Policy (Web)"]

end


UI --> Consent["User Consent Screen"]

Consent --> Terms
Consent --> Privacy
Consent --> Community
Consent --> Data
Consent --> Delete
Consent --> Cookie


Consent --> Authentication


%% ================= AUTH =================


subgraph Authentication["Authentication Layer"]

Signup["Register"]

EmailVerify["Email Verification"]

OTP["OTP Verification<br/>SendGrid"]

Password["Password Hashing<br/>bcrypt"]

JWT["JWT Access Token"]

Refresh["Refresh Token"]

RBAC["Role Based Access"]

end


Authentication --> Backend

Authentication --> Signup
Signup --> EmailVerify
EmailVerify --> OTP
OTP --> Password
Password --> JWT
JWT --> Refresh
Refresh --> RBAC



%% ================= BACKEND =================


subgraph Backend["Backend Server"]

Node["Node.js"]

Express["Express.js"]

Middleware["Security Middleware<br/>Helmet<br/>MongoSanitize<br/>CORS<br/>Rate Limiter"]

Controllers["Controllers"]

Services["Business Services"]

end


Backend --> Node

Node --> Express

Express --> Middleware

Middleware --> Controllers

Controllers --> Services



%% ================= MODULES =================


subgraph Modules["Application Modules"]

Profile["Alumni Profile"]

Network["Alumni Networking"]

Posts["Social Feed"]

Jobs["Jobs & Internship"]

Events["Events Management"]

Mentor["Mentorship"]

Donation["Donation & Support"]

Chat["Messaging"]

Reports["Reports"]

end


Services --> Profile
Services --> Network
Services --> Posts
Services --> Jobs
Services --> Events
Services --> Mentor
Services --> Donation
Services --> Chat
Services --> Reports



%% ================= REAL TIME =================


subgraph Communication["Real Time Services"]

Socket["Socket.io<br/>Live Chat"]

FCM["Firebase Cloud Messaging<br/>Push Notification"]

SendGrid["SendGrid<br/>OTP Emails"]

end


Services --> Socket
Services --> FCM
Services --> SendGrid



%% ================= DATABASE =================


subgraph Database["MongoDB Atlas (alumni_db)"]

UserDB[(Users Collection)]

ProfileDB[(Profiles)]

PostDB[(Posts)]

JobDB[(Jobs)]

EventDB[(Events)]

ChatDB[(Messages)]

NotificationDB[(Notifications)]

AuditDB[(Audit Logs)]

end


Services --> UserDB

Services --> ProfileDB

Services --> PostDB

Services --> JobDB

Services --> EventDB

Services --> ChatDB

Services --> NotificationDB

Services --> AuditDB



%% ================= FILE STORAGE =================


GridFS["MongoDB GridFS<br/>Images<br/>Certificates<br/>Resume<br/>Documents"]


Services --> GridFS



%% ================= ADMIN =================


subgraph AdminPanel["Admin Management"]

AdminDashboard["Admin Dashboard"]

Approve["Approve Alumni"]

Moderate["Content Moderation"]

EventManage["Event Management"]

UserManage["User Management"]

Analytics["Analytics"]

end


Admin --> AdminDashboard

AdminDashboard --> Approve

AdminDashboard --> Moderate

AdminDashboard --> EventManage

AdminDashboard --> UserManage

AdminDashboard --> Analytics



%% ================= SUPER ADMIN =================


subgraph SuperAdminPanel["Super Admin"]

College["College Management"]

AdminControl["Admin Management"]

System["System Configuration"]

Security["Security Monitoring"]

Subscription["Subscription Management"]

end


SuperAdmin --> College

SuperAdmin --> AdminControl

SuperAdmin --> System

SuperAdmin --> Security

SuperAdmin --> Subscription



%% ================= DEPLOYMENT =================


subgraph Deployment["Production Deployment"]

GitHub["GitHub Repository"]

CI["GitHub Actions CI/CD"]

Docker["Docker"]

AWS["AWS Cloud / Vercel"]

EC2["Backend Server"]

Mongo["MongoDB Atlas"]

Vercel["Vercel Hosting"]

SSL["HTTPS SSL"]

end


Frontend --> GitHub

Backend --> GitHub

GitHub --> CI

CI --> Docker

Docker --> EC2

EC2 --> AWS

Backend --> Mongo

Web --> Vercel

Vercel --> SSL



%% ================= STORE RELEASE =================


subgraph Stores["Application Release"]

Android["Expo EAS Build"]

PlayStore["Google Play Store"]

IOS["iOS Build"]

AppStore["Apple App Store"]

end


Mobile --> Android

Android --> PlayStore

Mobile --> IOS

IOS --> AppStore
```

## 🛠️ Production Implementation Stack

| Layer | Technology |
| :--- | :--- |
| **Mobile App** | React Native + Expo |
| **Web App** | React Native Web |
| **Language** | JavaScript / TypeScript |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB Atlas (`alumni_db`) |
| **File Storage** | MongoDB GridFS |
| **Authentication** | JWT + Refresh Token |
| **OTP / Email** | SendGrid |
| **Chat** | Socket.io |
| **Notifications** | Firebase Cloud Messaging |
| **Security** | Helmet + MongoSanitize + RateLimiter |
| **Hosting Frontend** | Vercel |
| **Hosting Backend** | AWS EC2 / Vercel |
| **CI/CD** | GitHub Actions |
| **Container** | Docker |
| **Mobile Release** | Expo EAS + Play Store + App Store |

| Layer | Technology | Status |
| ----- | ---------- | ------ |
| **Web Frontend** | React.js / Expo Web | ✅ Implemented & Deployed |
| **Mobile Frontend** | React Native / Expo (iOS & Android) | ✅ Implemented |
| **Backend** | Node.js + Express | ✅ Implemented |
| **Database** | MongoDB Atlas | ✅ Connected |
| **ODM** | Mongoose | ✅ Active |
| **Authentication** | JWT + bcrypt | ✅ Active |
| **Real-time Chat** | Socket.IO (WSS) | ✅ Active |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | ✅ Integrated |
| **Image/File Storage** | AWS S3 / Cloudinary / GridFS | ✅ Active |
| **Email** | Nodemailer | ✅ Active |
| **Version Control** | Git + GitHub | ✅ Synchronized |
| **CI/CD** | GitHub Actions | ✅ Configured |
| **Web Hosting** | Vercel (Frontend & Backend) | ✅ Live |
| **Mobile Distribution** | Google Play & App Store | ✅ Build Ready |
| **Monitoring** | Firebase Crashlytics & MongoDB Atlas Monitoring | ✅ Configured |

## 💻 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Frontend & Backend:
   ```bash
   npm start
   ```
