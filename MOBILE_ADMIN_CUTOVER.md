# Mobile Admin Cutover & Final Architecture Report

**Status:** COMPLETE & VERIFIED  
**Cutover Gate:** OPEN (Passed 2026-09-03)  
**Legacy Mobile Admin UI:** PERMANENTLY REMOVED FROM `client/`

---

## 1. Executive Summary & Gate Status

The standalone Admin web application (`admin/`) has completed independent deployment, strict role verification, exact CORS authorization, direct SPA routing, and end-to-end single-use student impersonation validation. 

The Mobile Admin Cutover Gate was officially declared **OPEN** and verified prior to local destructive removal of legacy code:
```text
MOBILE ADMIN CUTOVER GATE OPEN — STANDALONE TEST DEPLOYMENT VERIFIED
```

Following gate approval, all legacy Admin pages, components, routes, API hooks, and obsolete translation keys were completely removed from `client/`. The Sanabel mobile application (`client/`) is now dedicated strictly to students, teachers, and parents.

---

## 2. Final System Architecture

```text
client/ (Web & Capacitor Mobile: iOS / Android)
├── Solo User (Child, Teenager, Adult)
├── School Student
├── Teacher
├── Parent
├── Safe Student Impersonation Landing (/impersonate)
└── Admin Console Handoff Screen (/admin-redirect) — NO ADMIN UI

admin/ (Web Console)
├── School Admin (Scoped by Admins.organizationId)
└── Super Admin (Global scope, organizationId: null)

server/ (Railway Express API)
└── Shared backend API & WebSocket services

MySQL (Railway MySQL-8E5S)
└── Shared transactional database (14 applied Sequelize migrations)
```

---

## 3. Verified Deployed Infrastructure & Endpoints

* **Standalone Admin Web Console:** `https://temporary-swift-marsh-3qyyrbm.vercel.app`
* **Sanabel Client Application:** `https://sanabel-tau.vercel.app`
* **Production API Backend:** `https://sanabelserver-production.up.railway.app`

### Environment Variables Contract
* **`client/.env.production`**:
  * `VITE_API_BASE_URL=https://sanabelserver-production.up.railway.app`
  * `VITE_ADMIN_APP_URL=https://temporary-swift-marsh-3qyyrbm.vercel.app`
* **`admin/.env.production`**:
  * `VITE_API_BASE_URL=https://sanabelserver-production.up.railway.app`
  * `VITE_CLIENT_APP_URL=https://sanabel-tau.vercel.app`
  * `VITE_ENVIRONMENT_LABEL=TEST`

---

## 4. Staging CORS Configuration & Policy

Railway environment variable `CORS_ORIGINS` is configured with strict, non-wildcard origins:
```text
https://sanabel-tau.vercel.app,https://temporary-swift-marsh-3qyyrbm.vercel.app,http://localhost:5173,http://localhost:5174,http://localhost:8100,capacitor://localhost,http://localhost
```

* **Wildcards:** Strictly forbidden (`*`, `*.vercel.app`, and `*.up.railway.app` are rejected).
* **Unknown Origin Verification:** Verified via automated tests — untrusted origins return HTTP 403 Forbidden with `Origin not allowed by CORS`.
* **Staging Note:** For final production public release, staging-only and local development origins (`http://localhost:*`) should undergo final audit.

---

## 5. Mobile Admin Behavior & Handoff Screen

An Admin account is **not** a supported mobile role. 

1. **Authentication Flow (`Login.tsx`):**
   * Upon login, if `response.data.data.user.role === "Admin"`, the application immediately performs `history.replace("/admin-redirect")`.
   * Unnecessary student/teacher/parent state initialization, profile fetching (`refreshUserData`), gameplay context providers, and tutorial evaluations are completely bypassed.
2. **Cold App Startup (`SplashScreen.tsx`):**
   * If a stored session is evaluated with `role === "Admin"`, the user is immediately routed to `/admin-redirect`.
3. **Route Interception (`App.tsx`):**
   * Any direct attempt to navigate to `/admin`, `/admin/home`, `/admin/userdata`, or `/admin/*` redirects to `/admin-redirect`.
4. **Admin Console Handoff Screen (`AdminRedirectScreen.tsx`):**
   * **Arabic:**
     * العنوان: "هذا الحساب يستخدم لوحة الإدارة"
     * الوصف: "يمكنك إدارة المدرسة أو المنصة من خلال لوحة الإدارة المخصصة."
     * [ فتح لوحة الإدارة ] -> يفتح `VITE_ADMIN_APP_URL` في نافذة جديدة.
     * [ تسجيل الخروج ] -> مسح بيانات الاعتماد والعودة لصفحة تسجيل الدخول.
   * **English:**
     * Title: "This account uses the Admin Console"
     * Subtitle: "Manage your school or the platform from the dedicated Admin Console."
     * [ Open Admin Console ] -> Opens `VITE_ADMIN_APP_URL` in new window.
     * [ Sign out ] -> Clears auth tokens and redirects to `/login`.
   * **Safe Fallback:** If `VITE_ADMIN_APP_URL` is missing or unconfigured, the button is disabled and a clear configuration notice is rendered. The app does not crash and does not fall back to `localhost`.

---

## 6. Preserved Features

### Cross-Origin Student Impersonation
* Initiated exclusively from the standalone Admin console (`POST /admin/students/:id/impersonate`).
* Issues an opaque, single-use, 64-hex SHA-256 handoff code (`ttlSeconds: 90`). Zero JWTs are exposed in the handoff URL.
* Client receives the code at `/impersonate?code=...`, clears URL query parameters immediately upon read, and calls `POST /users/impersonation/exchange`.
* Code reuse is strictly rejected with HTTP 409 `CODE_ALREADY_USED` via atomic database updates.
* Client renders `ImpersonationBanner.tsx` with student context and a prominent "Return to Admin" action.

### Recharts & Data Visualization
* `recharts` is preserved in `client/package.json` and remains code-split/lazy loaded in `StudentProgress.tsx`.

### Vector Asset Optimization
* `client/src/icons/lock.svg` is preserved as a vector graphic (677 bytes) rather than the legacy 3.76 MB embedded raster.

---

## 7. Removed Legacy Artifacts Summary

* **46 files deleted** in `client/src/pages/admin/**` (13,300 lines of legacy code removed).
* `AdminRoute.tsx` and `AdminNavbar.tsx` removed from `client/src/components/`.
* `xlsx` removed from `client/package.json` dependencies.
* 628 obsolete Admin translation keys removed from `client/src/languages/` (314 Arabic, 314 English).
* `cypress/e2e/admin_user_data_crud.cy.ts` deleted and replaced with `cypress/e2e/admin_cutover.cy.ts`.
* Total client production JS bundle decreased from 5,042 KB raw down to 2,651 KB raw (entry chunk gzip: 987 KB).
