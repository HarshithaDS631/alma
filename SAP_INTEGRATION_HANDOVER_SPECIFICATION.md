# Technical Integration Handover Document
## Integration: RVCE Alumni Network ⟷ SAP SLcM (Student Lifecycle Management)
**Document Version:** 1.0.0  
**Target System:** SAP SLcM / NetWeaver Gateway (IS-HER)  
**Consumer System:** RVCE Alumni Mobile & Web Application Backend (Node.js / Express)  
**Issuing Authority:** RVCE Alumni Network Development Team & RSST Media Cell  

---

### **Overview**
This specification provides the official **5-Point Technical Handover Package** required by the RVCE SAP Basis and ABAP Engineering Team to establish secure, automated communication between **SAP SLcM** and the **RVCE Alumni Application**.

---

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   5-POINT TECHNICAL HANDOVER SPECIFICATION                       │
│                                                                                  │
│   [1] Backend Server Static Public IPs (Firewall & Gateway Whitelist)            │
│   [2] Field Specifications & Data Schema (Data Types, Lengths, Keys)             │
│   [3] Exact OData URI Query Patterns ($filter, $select, $expand)                 │
│   [4] Request Volume, Concurrency & Polling Schedule (Cron Profile)              │
│   [5] Security & TLS Protocol Specifications (TLS 1.3, Auth Headers)             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## **1. Backend Server Static Public IPs (For Firewall Whitelisting)**

To establish inbound communication to the campus **SAP Web Dispatcher** or **SAP NetWeaver Gateway**, the RVCE Network & Security Administrator must whitelist the following outbound IP addresses:

| Environment | Server Description | Outbound Static IP / Hostname | Inbound Port |
| :--- | :--- | :--- | :--- |
| **Development / Staging** | Staging API Server | Contact network admin for exact static dev IP | `443` (HTTPS) |
| **Production API Host** | Vercel Enterprise / Cloud Host | Static Egress Proxy / NAT IP Range *(Specified in Appendix A)* | `443` (HTTPS) |
| **Local Campus Gateway (Optional)**| Intranet VPN / Reverse Proxy | `https://sap.rvce.edu.in` | `443` (HTTPS) |

### **Firewall & Routing Rules**
1. **Direction:** Outbound from Alumni API Server ➔ Inbound to SAP Web Dispatcher / Gateway.
2. **Protocol:** HTTPS (Port 443).
3. **No Inbound Ports Required on Alumni Server:** The Alumni App initiates all requests to SAP via REST/OData client calls. SAP is not required to open any inbound connections to our servers.
4. **URL Path Scope:** Access is only required for the specific service path:  
   `/sap/opu/odata/sap/ZSLCM_ALUMNI_SRV/*`

---

## **2. Field Specifications & Data Schema (Data Types, Lengths, Keys)**

The ABAP development team must configure the entity set named **`AlumniSet`** within the Gateway Service Builder (**Transaction `SEGW`**). Below is the exact data dictionary:

### **Entity Type: `AlumniRecord` | EntitySet: `AlumniSet`**

| Field Name | OData Property | EDM Data Type | Max Length | Key? | SAP SLcM Source Table & Field | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **USN** | `USN` | `Edm.String` | 15 | **YES** | `PIQST_ACAD-ST_NUM` / Student ID | `1RV19CS042` | University Seat Number (Primary Unique Key) |
| **Student ID** | `StudentId` | `Edm.String` | 12 | No | `HRP1000-OBJID` (Obj Type `ST`) | `50012948` | SAP Internal Student Object Number |
| **Full Name** | `FullName` | `Edm.String` | 80 | No | `BUT000-NAME_FIRST` + `NAME_LAST` | `Rahul Sharma` | Student full legal name |
| **College Email** | `CollegeEmail` | `Edm.String` | 80 | No | `ADR6-SMTP_ADDR` | `rahul.cs19@rvce.edu.in` | Official college-issued email |
| **Personal Email**| `PersonalEmail`| `Edm.String` | 80 | No | `ADR6` (Secondary Address) | `rahulsharma@gmail.com` | Personal email on student record |
| **Phone** | `MobilePhone` | `Edm.String` | 20 | No | `ADR2-TEL_NUMBER` | `+919876543210` | Student contact number |
| **Institution** | `Institution` | `Edm.String` | 60 | No | Campus / Org Unit Code | `RV College of Engineering` | Default: RV College of Engineering |
| **Degree** | `Degree` | `Edm.String` | 50 | No | `HRP1000` (Obj Type `SC`) | `Bachelor of Engineering (B.E.)`| Academic Program |
| **Department** | `Department` | `Edm.String` | 60 | No | `HRP1000` (Obj Type `CG` / `SM`)| `Computer Science and Engineering`| Branch / Department |
| **Admission Year**| `AdmissionYear`| `Edm.String` | 4 | No | `HRP1702` (Study Registration) | `2019` | Year student was enrolled |
| **Graduation Year**| `GraduationYear`| `Edm.String`| 4 | No | `HRP1737` (Completion Year) | `2023` | Passing / Graduation Year |
| **Graduation Status**| `GraduationStatus`|`Edm.String`| 15 | No | `HRP1737` Completion Flag | `COMPLETED` | Must confirm graduation (`COMPLETED` or `GRADUATED`)|

### **Data Sanitization & Formatting Rules**
* **USN:** Always uppercase, trimmed of leading/trailing spaces (Format: `^[1-4][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$`).
* **Emails:** Always lowercase, trimmed.
* **Graduation Status:** Only students whose status is marked as `COMPLETED` or `GRADUATED` in Infotype 1737 must be returned. Active, discontinued, or failed students should return an empty dataset or error status.

---

## **3. Exact OData URI Query Patterns ($filter, $select, $expand)**

Below are the exact HTTP request patterns the Node.js backend will execute against the SAP Gateway:

### **Query Pattern 1: Single Alumnus Real-Time Lookup by Key (USN)**
*Executed during user registration or USN verification:*
```http
GET /sap/opu/odata/sap/ZSLCM_ALUMNI_SRV/AlumniSet('1RV19CS042')?$format=json
```
* **HTTP Method:** `GET`
* **Response:** Single JSON entity object (`d: { ... }`).
* **Expected Result:** Immediate verification of student details and graduation status.

---

### **Query Pattern 2: Single Alumnus Verification via Filter**
*Alternative query format using `$filter`:*
```http
GET /sap/opu/odata/sap/ZSLCM_ALUMNI_SRV/AlumniSet?$filter=USN eq '1RV19CS042'&$format=json
```
* **HTTP Method:** `GET`
* **Response:** Array containing 1 object (`d: { results: [ ... ] }`).

---

### **Query Pattern 3: Alumnus Lookup by Email (Fallback Match)**
*Used when an alumnus signs in using college or personal email:*
```http
GET /sap/opu/odata/sap/ZSLCM_ALUMNI_SRV/AlumniSet?$filter=(CollegeEmail eq 'rahul.cs19@rvce.edu.in' or PersonalEmail eq 'rahulsharma@gmail.com')&$format=json
```

---

### **Query Pattern 4: Nightly Delta Batch Sync by Passing Year**
*Executed automatically by our backend cron job at 02:00 AM IST:*
```http
GET /sap/opu/odata/sap/ZSLCM_ALUMNI_SRV/AlumniSet?$filter=GraduationYear eq '2024' and GraduationStatus eq 'COMPLETED'&$top=500&$skip=0&$format=json
```
* **Pagination Parameters:**
  * `$top=500` (Page size of 500 records to protect SAP server memory).
  * `$skip=0`, `$skip=500`, `$skip=1000` (Iterative pagination until empty).

---

### **Query Pattern 5: Field Projection ($select)**
*Used to minimize network payload when only core verification is required:*
```http
GET /sap/opu/odata/sap/ZSLCM_ALUMNI_SRV/AlumniSet('1RV19CS042')?$select=USN,FullName,Degree,Department,GraduationYear,GraduationStatus&$format=json
```

---

## **4. Request Volume, Concurrency & Polling Schedule (Cron Profile)**

To protect SAP system resources and prevent interference with campus operational hours, the Alumni Application adheres to the following load profile:

```
Traffic Distribution Profile:
─────────────────────────────────────────────────────────────────────────────
Daytime (08:00 AM – 08:00 PM IST):  Low Real-time Volume (1–5 queries/min)
Nighttime (02:00 AM – 02:30 AM IST): Automated Batch Sync (500 records/page)
Peak Events (Convocation/Drives):    Max 5–10 requests/sec with Circuit Breaker
─────────────────────────────────────────────────────────────────────────────
```

### **1. Real-Time User Queries (Daytime Operations)**
* **Frequency:** Driven by user registration.
* **Volume:** Under normal usage: **1 to 5 queries per minute**.
* **Peak Event Concurrency:** Max **5 to 10 queries per second** (e.g., during campus convocation onboarding).
* **Caching Protection:** Once an alumnus is verified from SAP, their record is cached in our MongoDB database. **The same student is never queried in SAP twice.**

### **2. Automated Batch Synchronization (Nighttime Off-Peak)**
* **Cron Schedule:** Daily at **02:00:00 AM IST** (20:30 UTC).
* **Execution Duration:** Typically 2 to 4 minutes.
* **Batch Page Size:** 500 records per HTTP request (`$top=500`).
* **Delta Filtering:** The cron only fetches records where `GraduationYear` matches the current or recent graduation cycle.

### **3. Client Timeout & Circuit Breaker Policy**
* **Connection Timeout:** **6,000 milliseconds (6 seconds)**.
* **Retry Strategy:** Max 2 retries with exponential backoff (1s, 2s).
* **Graceful Fallback:** If SAP is undergoing maintenance or does not respond within 6 seconds, our backend automatically places the user in the **Manual Admin Approval Queue**. The user experience is never blocked.

---

## **5. Security & TLS Protocol Specifications (TLS 1.3, Auth Headers)**

All data transmissions between the Alumni Application backend and SAP SLcM are governed by enterprise security standards:

```
┌────────────────────────┐      HTTPS / TLS 1.3       ┌────────────────────────┐
│  Alumni Node.js API    ├───────────────────────────►│  SAP Web Dispatcher /   │
│  (Consumer Client)     │   Authorization: Basic/JWT │  NetWeaver Gateway     │
└────────────────────────┘                            └────────────────────────┘
```

### **1. Transport Layer Security (TLS)**
* **Protocol Version:** **TLS 1.2** or **TLS 1.3** mandatory. Unencrypted HTTP (Port 80) is strictly rejected.
* **Supported Cipher Suites:** Standard high-grade ciphers:
  * `TLS_AES_256_GCM_SHA384`
  * `TLS_CHACHA20_POLY1305_SHA256`
  * `ECDHE-RSA-AES128-GCM-SHA256`
* **Certificate Validation:** SAP Gateway must present a valid SSL certificate matching its public domain name (`sap.rvce.edu.in`). If a private enterprise PKI certificate is used, provide the Root CA `.pem` file to our team.

### **2. Authentication Mechanism**
We support either of the standard SAP Gateway authentication mechanisms:

#### **Method A: Technical Service User (HTTP Basic Auth — Recommended)**
* **Configuration:** Dedicated system user created in Transaction **`SU01`** (User Type `B` - System User).
* **Authorization Objects:**
  * `S_SERVICE`: Hash for `ZSLCM_ALUMNI_SRV`.
  * `S_RFC`: RFC execution privileges for SLcM function modules.
* **Request Header:**
  ```http
  Authorization: Basic <Base64_Encoded(Username:Password)>
  ```

#### **Method B: OAuth 2.0 (Client Credentials Grant)**
* **Token Endpoint:** `https://sap.rvce.edu.in/sap/bc/sec/oauth2/token`
* **Grant Type:** `client_credentials`
* **Request Header:**
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```

### **3. Standard HTTP Headers Sent by Alumni Backend**
Every request issued by our server includes:
```http
Host: sap.rvce.edu.in
User-Agent: RVCE-AlumniNetwork-API/1.0 (+https://alumni.rvce.edu.in)
Accept: application/json
Content-Type: application/json
X-Requested-With: XMLHttpRequest
Cache-Control: no-cache
```

### **4. Data Privacy & Compliance (DPDP Act 2023)**
* **Minimal Scope:** The integration only retrieves identity, department, and graduation year. **No student grades, GPA, fee payment records, or disciplinary notes are accessed or transmitted.**
* **Encryption at Rest:** All cached data in our MongoDB Atlas cluster is protected with **AES-256** database encryption.
* **Audit Logging:** Every query to SAP is logged with timestamp, USN queried, HTTP status code, and latency in our system audit log.

---

## **Summary Checklist for SAP Administrator Handover**

Please review and confirm receipt of these specifications:

- [x] **Item 1:** Egress IP whitelist requirements reviewed.
- [x] **Item 2:** Data dictionary & field mapping (`AlumniSet`) received.
- [x] **Item 3:** OData URI query and filter patterns received.
- [x] **Item 4:** Request volume and 02:00 AM cron schedule approved.
- [x] **Item 5:** TLS 1.3 and technical user authentication model confirmed.

---
**Prepared By:** Alumni Network Engineering Team  
**Institution:** RV College of Engineering / RSST Media Cell  
**Document File:** `SAP_INTEGRATION_HANDOVER_SPECIFICATION.md`
