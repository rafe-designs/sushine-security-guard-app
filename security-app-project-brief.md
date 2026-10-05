# Project Brief: Security Personnel Management App

## 1. Overview
A mobile app for a security firm's field personnel (Guards and Supervisors) to clock in/out, stay verified at their assigned post, log incidents in real time, and give admins full visibility into shifts and incidents.

**Platforms:** iOS + Android (cross-platform, with React Native)
**Users:** Personnel (Guard, Supervisor), Admin (web and in-app dashboard)

---

## 2. User Roles
| Role | Access |
|---|---|
| Guard | Homepage features, profile, settings |
| Supervisor | Same as Guard + team-level visibility (recommended addition, see §5) |
| Admin | Full dashboard: all shifts, all incidents, personnel management |

---

## 3. Core Flows

### 3.1 Authentication
- Sign up: name, phone/email, password, employee ID (assigned by admin), designation
- Sign in: email/phone + password; consider OTP or biometric (Face ID/fingerprint) unlock for daily use
- Forgot password / reset flow
- Account approval: new sign-ups pending admin approval before first login (prevents unauthorized access)

### 3.2 Homepage (post-login) — Steps 2–4 live here
**a) Location Tracking**
- GPS check-in against assigned site geofence
- Continuous or interval-based location ping while on shift
- Alert (to admin) if guard leaves the geofenced radius
- Map view showing current position relative to assigned post

**b) Clock In / Clock Out**
- Single tap Clock In / Clock Out button
- Auto-capture timestamp + GPS location at both events
- Running shift timer visible while clocked in
- Total hours calculated automatically; (flags for early leave, late arrival, missed clock-out for admin)

**c) Incident Logging**
- "Report Incident" button always accessible from homepage
- Fields: incident type (theft, trespassing, medical, altercation, equipment fault, other), description, timestamp (auto), GPS location (auto)
- Photo/video attachment capability
- Severity/priority tagging (low/medium/high/emergency)
- Option to notify admin/supervisor immediately for high-severity incidents

### 3.3 Photo Capture — Uniform Verification
- In-app camera capture (disable gallery upload to prevent old/fake photos)
- Uniform detection: on-device or server-side image check (basic version: manual admin review queue; advanced version: AI/ML model trained to detect uniform elements e.g. vest color, badge, logo)
- Auto-reject flow: if uniform not detected, show rejection reason and prompt retake
- Store approved photos with clock-in record as proof of duty compliance

### 3.4 Profile Page
- Designation selector: Guard / Supervisor
- Profile picture upload
- Personal details: name, contact info, employee ID, assigned site(s)
- Certifications/licenses (if applicable — common in security industry)
- Emergency contact info

### 3.5 Settings
- Notification preferences (push, SMS, email)
- Language selection
- Privacy/location permission management
- Dark/light mode
- Change password
- Logout
- App version / support contact

### 3.6 Admin Dashboard
- View all personnel: status (on/off duty), current location, designation
- View all shift logs: clock in/out times, total hours, site, flags (late, absent, geofence breach)
- View all incident reports: filterable by site, date, severity, personnel
- Approve/reject pending sign-ups
- Assign/reassign personnel to sites
- Export reports (CSV/PDF) for payroll or compliance
- Broadcast messages/alerts to all or selected personnel

---

## 4. Recommended Additions (not in original list)

1. **Panic/SOS button** — one-tap emergency alert with live location, critical for guard safety.
2. **Push notifications** — shift reminders, geofence breach alerts, incident acknowledgments, broadcast messages.
3. **Offline mode** — cache clock-in/out and incident data when signal is poor (common on remote sites), auto-sync when back online.
4. **Shift scheduling** — admin assigns shifts/rosters in advance; personnel see upcoming shifts on homepage.
5. **Audit trail / activity log** — immutable log of all actions (clock events, incident edits) for legal/compliance defensibility.
6. **In-app messaging or call-to-admin** — direct line for non-emergency questions.
7. **Break/patrol checkpoints** — QR code or NFC tag scanning at patrol points to prove rounds were completed.
8. **Data privacy & consent** — explicit consent screen for location tracking, given continuous GPS monitoring of employees (also a likely legal requirement depending on jurisdiction).
9. **Multi-site assignment** — for personnel or supervisors covering more than one site.
10. **Analytics dashboard** — trends in incidents by site/time, attendance patterns, for admin decision-making.

---

## 5. Suggested Screen List (for UX/UI tool)

1. Splash/Onboarding
2. Sign Up
3. Sign In
4. Forgot Password
5. Data/Location Tracking Consent (post sign-up, one-time)
6. Pending Approval
7. Homepage (map + clock in/out + incident button + status)
8. Clock In — Uniform Photo Capture
9. Clock In — Rejected Photo (retake prompt)
10. Incident Report Form
11. Incident Report Confirmation
12. SOS/Panic Confirmation
13. Profile
14. Edit Profile / Designation Selector
15. Settings
16. Shift History (personal)
17. Notifications
18. Admin: Dashboard Home
19. Admin: Personnel List
20. Admin: Shift Logs
21. Admin: Incident Reports
22. Admin: Pending Approvals
23. Admin: Site/Roster Management

---

## 6. Confirmed Decisions
- **Oversight:** Admin-only. Supervisors get the same homepage/profile/settings access as Guards, with no elevated visibility over other personnel.
- **Uniform verification:** Rule-based check or manual admin review (not a full AI/ML model) — keeps the initial build simpler and cheaper.
- **Geofencing:** 100m radius around the assigned site. A breach both logs the event and sends an automatic real-time alert to admin.
- **Region of operation:** Nigeria — see §7 for related compliance notes.

## 7. Nigeria-Specific Compliance Notes
- **Nigeria Data Protection Act (NDPA) 2023 / NDPR:** continuous GPS tracking and photo capture of employees counts as personal data processing. You'll need a clear, signed consent/notice for personnel (ideally at sign-up) covering what's tracked, why, retention period, and who can access it.
- **Data localization/storage:** confirm with legal counsel whether personnel data (location logs, photos) needs to be stored on servers within Nigeria or has any cross-border transfer restrictions under NDPA.
- **Labor law:** Nigerian labor regulations don't currently mandate specific rules on employee location tracking, but documenting consent and having a clear internal policy reduces disputes over surveillance claims.
- **Recommendation:** add a one-time consent screen during sign-up (see updated screen list, §5) referencing your internal data/privacy policy, and retain an audit trail of who consented and when.
