# Custom Employee Portal with Zoho One Integration

A centralized, enterprise-grade employee portal featuring **Role-Based Access Control (RBAC)**, **Prisma ORM with SQLite**, a **React + Vite dashboard**, and **single-sign-on integration with Zoho One applications** (Zoho People, Zoho CRM, Zoho Desk, and Zoho Books).

> **Core Philosophy**: Employees authenticate against *this custom portal* using standard corporate credentials and never need individual Zoho usernames or passwords. The backend acts as an authenticated security proxy and service account orchestrator, ensuring strict server-side authorization and safeguarding OAuth credentials.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Folder Structure](#5-folder-structure)
6. [Database Schema & Relational Models](#6-database-schema--relational-models)
7. [Role-Based Access Control (RBAC) Explanation](#7-role-based-access-control-rbac-explanation)
8. [Authentication & Session Handling](#8-authentication--session-handling)
9. [Zoho OAuth Integration Guide](#9-zoho-oauth-integration-guide)
10. [Environment Variables Reference](#10-environment-variables-reference)
11. [Installation & Local Setup](#11-installation--local-setup)
12. [Database Setup & Seeding](#12-database-setup--seeding)
13. [How to Run Backend & Frontend](#13-how-to-run-backend--frontend)
14. [Demo Login Credentials](#14-demo-login-credentials)
15. [API Endpoints Reference](#15-api-endpoints-reference)
16. [Security Considerations](#16-security-considerations)
17. [How Zoho Integration Works Under the Hood](#17-how-zoho-integration-works-under-the-hood)
18. [Troubleshooting & FAQs](#18-troubleshooting--faqs)
19. [Interview Demonstration Walkthrough](#19-interview-demonstration-walkthrough)

---

## 1. Project Overview

In traditional organizations, managing individual Zoho accounts across various departments (HR, Sales, Support, Finance) can become fragmented, expensive, and a security risk. This project solves that by establishing a **centralized employee portal**:
- Employees sign into a unified, secure web portal.
- The portal checks the user's role on the backend.
- The portal presents only the specific Zoho applications authorized for their department:
  - **HR** &rarr; Zoho People
  - **Sales** &rarr; Zoho CRM
  - **Support** &rarr; Zoho Desk
  - **Finance** &rarr; Zoho Books
  - **Admin** &rarr; All Applications + Full Administrative Console
- Access is strictly validated on the backend — an HR employee cannot invoke the Zoho Books API even if they construct the request manually.

---

## 2. Features

- 🔐 **Secure Authentication**: Password hashing with `bcryptjs` (salt rounds: 10) and stateless signed `jsonwebtoken` (JWT).
- 🛡️ **Server-Enforced RBAC**: Reusable backend RBAC service and middlewares (`requireRole`, `requirePermission`) that load roles directly from the database.
- 📦 **Dynamic Application Catalog**: `GET /api/zoho/apps` filters and returns only authorized apps.
- 🔄 **Server-Side Zoho OAuth Service Account**: Employees never possess or input Zoho secrets; backend automatically requests and caches access tokens using a single refresh token.
- 📋 **Comprehensive Audit Logging**: Tracks successful/failed logins, role modifications, employee creation/deletion, application launches, and unauthorized access attempts with client IP addresses.
- 👑 **Admin Console**: Full management interface for Users, Roles, Permissions, and live System Audit Logs.
- ⚡ **Interview Ready**: One-click demo login buttons on the login screen and an in-navbar role switcher for rapid testing during technical interviews.
- ⏱️ **Session Security**: JWT expiration handling and a 30-minute frontend inactivity timer with automatic session expiration alerts.

---

## 3. System Architecture

```
                                  +---------------------------------------+
                                  |         EMPLOYEE BROWSER              |
                                  |   (React + Vite Single Page App)     |
                                  +-------------------+-------------------+
                                                      |
                                    HTTPS Bearer JWT  |
                                                      v
                                  +---------------------------------------+
                                  |        NODE.JS / EXPRESS BACKEND      |
                                  |                                       |
                                  |  - Helmet & CORS Headers              |
                                  |  - Express Rate Limiter (Brute-Force) |
                                  |  - JWT Authentication Middleware      |
                                  |  - Server-Side RBAC Enforcement       |
                                  |  - Centralized Error Handling         |
                                  |  - Audit Logging Service              |
                                  +---------+-------------------+---------+
                                            |                   |
                     Database Queries (ORM) |                   | Server-to-Server OAuth
                                            v                   v
                        +-----------------------+     +-------------------------------+
                        |     SQLITE DATABASE   |     |      ZOHO ONE CLOUD (OAuth)   |
                        |     (via Prisma)      |     |                               |
                        |                       |     |  1. accounts.zoho.com/token   |
                        |  - users              |     |     (Exchange Refresh Token)  |
                        |  - roles              |     |  2. Live APIs:                |
                        |  - permissions        |     |     - Zoho People             |
                        |  - user_roles         |     |     - Zoho CRM                |
                        |  - role_permissions   |     |     - Zoho Desk               |
                        |  - audit_logs         |     |     - Zoho Books              |
                        +-----------------------+     +-------------------------------+
```

### Data Flow Diagram:
```
Employee -> React frontend -> Node/Express backend -> JWT Authentication -> Database RBAC Validation -> Zoho Service -> Zoho Live API
```

---

## 4. Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios (with Bearer token interceptor and 401 response handler)
- **Icons**: Lucide React
- **Styling**: Modern, responsive Vanilla CSS with custom design tokens, dark/light contrast, glassmorphism, and responsive CSS Grid/Flexbox (no external CSS framework bloat).

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database ORM**: Prisma ORM
- **Database Engine**: SQLite (`dev.db` for instant local setup)
- **Security**:
  - `bcryptjs`: Secure one-way password hashing
  - `jsonwebtoken`: Signed stateless bearer tokens
  - `helmet`: Secure HTTP headers
  - `cors`: Controlled cross-origin access
  - `express-rate-limit`: Rate limiting on login to defend against brute-force attacks
  - `dotenv`: Secure environment variable management

---

## 5. Folder Structure

```
employee-portal/
├── backend/
│   ├── src/
│   │   ├── config/             # Config loader (env vars) & Zoho apps catalog
│   │   ├── controllers/        # Auth, Zoho proxy, and Admin business logic
│   │   ├── database/           # Prisma client singleton
│   │   ├── middleware/         # Auth verification, RBAC guard, and error handlers
│   │   ├── routes/             # Express route definitions (/auth, /zoho, /admin)
│   │   ├── services/           # RBAC queries, Audit Logger, and Zoho OAuth service
│   │   └── app.js              # Express app assembly
│   ├── prisma/
│   │   ├── schema.prisma       # Relational models & SQLite configuration
│   │   └── seed.js             # Initial roles, permissions, and 5 demo accounts
│   ├── .env.example            # Backend environment template
│   ├── .env                    # Local environment variables
│   ├── package.json
│   └── server.js               # Backend entry point (port 5000)
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, AppCard, ProtectedRoute, UserModal, RoleModal
│   │   ├── context/            # AuthContext (token, user, inactivity timer)
│   │   ├── pages/              # LoginPage, DashboardPage, AdminDashboardPage, ZohoProxyView
│   │   ├── services/           # Axios API instance with interceptors
│   │   ├── App.jsx             # React Router routing
│   │   ├── index.css           # Modern design system & styles
│   │   └── main.jsx            # React root mount
│   ├── index.html
│   ├── vite.config.js          # Vite configuration with backend proxy
│   ├── .env.example            # Frontend environment template
│   ├── .env                    # Frontend environment variables
│   └── package.json
│
├── .gitignore                  # Git ignore rules (.env, node_modules, SQLite files)
├── package.json                # Root convenience scripts
└── README.md                   # Comprehensive documentation
```

---

## 6. Database Schema & Relational Models

The relational schema is configured in `backend/prisma/schema.prisma` with primary keys, unique constraints, and foreign key cascades:

```
+-------------+         +------------------+         +-------------+
|    User     |         |     UserRole     |         |    Role     |
+-------------+         +------------------+         +-------------+
| id (PK)     |<------->| id (PK)          |<------->| id (PK)     |
| name        | 1     N | userId (FK)      | N     1 | name (UQ)   |
| email (UQ)  |         | roleId (FK)      |         | description |
| passwordHash|         +------------------+         | createdAt   |
| isActive    |           (Unique: userId,           +------+------+
| createdAt   |                    roleId)                  | 1
| updatedAt   |                                             |
+------+------+                                             | N
       | 1                                           +------+------+
       |                                             |RolePermission|
       | N                                           +-------------+
+------+------+                                      | id (PK)     |
|  AuditLog   |                                      | roleId (FK) |
+-------------+                                      | permId (FK) |
| id (PK)     |                                      +------+------+
| userId (FK) |                                (Unique: roleId, permId)
| action      |                                             | N
| resource    |                                             | 1
| details     |                                      +------+------+
| ipAddress   |                                      | Permission  |
| createdAt   |                                      +-------------+
+-------------+                                      | id (PK)     |
                                                     | name (UQ)   |
                                                     | description |
                                                     | createdAt   |
                                                     +-------------+
```

### Constraint Rules Enforced:
1. `@@unique([userId, roleId])`: Prevents duplicate role assignments.
2. `@@unique([roleId, permissionId])`: Prevents duplicate permission assignments.
3. `AuditLog.userId` is nullable with `onDelete: SetNull` so logs remain intact even if an employee account is permanently deleted.

---

## 7. Role-Based Access Control (RBAC) Explanation

### Role-to-Application Matrix:
| Role | Department | Authorized Zoho Service | Required Permission |
| :--- | :--- | :--- | :--- |
| **HR** | Human Resources | **Zoho People** | `VIEW_ZOHO_PEOPLE` |
| **Sales** | Sales & CRM | **Zoho CRM** | `VIEW_ZOHO_CRM` |
| **Support** | Customer Support | **Zoho Desk** | `VIEW_ZOHO_DESK` |
| **Finance** | Accounting | **Zoho Books** | `VIEW_ZOHO_BOOKS` |
| **Admin** | Administration | **All Applications** + Admin Console | All Permissions |

### Reusable RBAC Service (`backend/src/services/rbacService.js`):
Rather than checking strings passed in from the client, every authorization check queries the SQLite database directly:
- `getUserRoles(userId)`: Resolves active roles.
- `getUserPermissions(userId)`: Flattens all permissions linked to the user's roles.
- `hasRole(userId, roleName)`: Verifies role membership.
- `hasPermission(userId, permissionName)`: Returns true if the user possesses the permission or is an `Admin`.

---

## 8. Authentication & Session Handling

1. **Login Flow (`POST /api/auth/login`)**:
   - Accepts email and password.
   - Verified against `users` table via `bcrypt.compare`.
   - Checks `isActive === true`.
   - Issues a signed JWT containing `{ id, email, name }` with a configured expiry (default: `1h`).
   - Writes `LOGIN_SUCCESS` (or `LOGIN_FAILED`) to `AuditLog`.
2. **Current User Profile (`GET /api/auth/me`)**:
   - Validates Bearer token via `authenticateToken` middleware.
   - Refreshes roles and permissions from database.
3. **Session Expiry Detection**:
   - The Axios interceptor intercepts HTTP 401 responses and dispatches a session expiry event.
   - The user is redirected to `/login` with the alert: *"Your session has expired. Please log in again."*
4. **Inactivity Timeout**:
   - If the user is idle (no mouse/keyboard interaction) for 30 minutes, `AuthContext` safely clears the session token and prompts re-authentication.

---

## 9. Zoho OAuth Integration Guide

### Step 1: Open Zoho API Console
1. Log in to [Zoho API Console](https://api-console.zoho.com/).
2. Click **Add Client** and select **Self Client** (recommended for server-to-server backend integrations).

### Step 2: Generate Zoho Credentials
1. Copy the generated **Client ID** and **Client Secret**.
2. Click the **Generate Code** tab.
3. In Scope, provide the scopes for your integrated apps:
   ```text
   ZohoPeople.forms.ALL,ZohoCRM.modules.ALL,Desk.tickets.ALL,ZohoBooks.fullaccess.ALL
   ```
4. Choose an expiry time and generate the grant code.

### Step 3: Generate Refresh Token
Run a one-time curl request to exchange the grant code for a permanent `refresh_token`:
```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "code=YOUR_GRANT_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=authorization_code"
```
Copy the returned `refresh_token`.

### Step 4: Configure `backend/.env`
Open `backend/.env` and paste your credentials:
```env
ZOHO_CLIENT_ID="1000.XXXXXXXXXX"
ZOHO_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
ZOHO_REFRESH_TOKEN="1000.xxxxxxxxxxxxxxxx.xxxxxxxx"
ZOHO_ACCOUNTS_URL="https://accounts.zoho.com"
ZOHO_API_BASE_URL="https://www.zohoapis.com"
```

> [!NOTE]
> If you do not have active Zoho API credentials, **the portal still functions completely!** The backend will return a clean, descriptive `HTTP 503 Service Unavailable` explaining that credentials need to be set in `.env`, rather than crashing or faking fake data.

---

## 10. Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port the Express server listens on | `5000` |
| `DATABASE_URL` | SQLite database file path | `"file:./dev.db"` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | `"secure_key"` |
| `JWT_EXPIRES_IN` | Token validity duration | `"1h"` |
| `ZOHO_CLIENT_ID` | Zoho OAuth Application Client ID | `""` |
| `ZOHO_CLIENT_SECRET` | Zoho OAuth Application Client Secret | `""` |
| `ZOHO_REFRESH_TOKEN` | Zoho Service Account Refresh Token | `""` |
| `ZOHO_ACCOUNTS_URL` | Zoho Accounts OAuth URL | `"https://accounts.zoho.com"` |
| `ZOHO_API_BASE_URL` | Zoho Cloud REST API Base URL | `"https://www.zohoapis.com"` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base endpoint for the backend API | `"http://localhost:5000/api"` |

---

## 11. Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher

### Install Dependencies:

```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Install Frontend Dependencies
cd ../frontend
npm install
```

---

## 12. Database Setup & Seeding

From the `backend/` directory:

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Push Schema to SQLite (Creates dev.db and all tables)
npm run prisma:push

# Run Seed Script (Creates roles, permissions, and 5 demo accounts)
npm run prisma:seed
```

---

## 13. How to Run Backend & Frontend

### Running the Backend:
```bash
cd backend
npm start
```
The backend will launch at: **http://localhost:5000** (Health check: `http://localhost:5000/api/health`)

### Running the Frontend:
In a separate terminal window:
```bash
cd frontend
npm run dev
```
The frontend Vite server will launch at: **http://localhost:3000**

---

## 14. Demo Login Credentials

All seeded accounts share the same demo password: **`Password123!`**

| Role | Email | Default Password | Accessible Zoho Application |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `Password123!` | **All 4 Applications** + Admin Console |
| **HR** | `hr@company.com` | `Password123!` | **Zoho People** only |
| **Sales** | `sales@company.com` | `Password123!` | **Zoho CRM** only |
| **Support** | `support@company.com` | `Password123!` | **Zoho Desk** only |
| **Finance** | `finance@company.com` | `Password123!` | **Zoho Books** only |

> **Pro Tip**: The Login page features **One-Click Quick Login Buttons** for all 5 roles. You don't even need to type them out!

---

## 15. API Endpoints Reference

### Authentication Routes (`/api/auth`)
- `POST /api/auth/login`: Authenticate with `{ email, password }`. Returns JWT and user payload. (Rate limited to 20 requests/15m).
- `GET /api/auth/me`: Get profile and fresh database permissions for active Bearer token.
- `POST /api/auth/logout`: Server-side audit log entry for user sign-out.

### Zoho Routes (`/api/zoho`)
- `GET /api/zoho/apps`: Returns dynamically authorized applications based on the user's role.
- `POST /api/zoho/launch/:appKey`: Records `ZOHO_APP_ACCESSED` audit log and returns application launch URL.
- `GET /api/zoho/status`: *(Admin only)* Checks Zoho OAuth configuration and token cache health.
- `GET /api/zoho/people/*`: *(Requires VIEW_ZOHO_PEOPLE)* Proxies request to Zoho People API.
- `GET /api/zoho/crm/*`: *(Requires VIEW_ZOHO_CRM)* Proxies request to Zoho CRM API.
- `GET /api/zoho/desk/*`: *(Requires VIEW_ZOHO_DESK)* Proxies request to Zoho Desk API.
- `GET /api/zoho/books/*`: *(Requires VIEW_ZOHO_BOOKS)* Proxies request to Zoho Books API.

### Admin Management Routes (`/api/admin`) *(Requires Admin Role)*
- `GET /api/admin/users`: List all users with assigned roles.
- `POST /api/admin/users`: Register a new employee with hashed password and role assignment.
- `PUT /api/admin/users/:id`: Edit employee details, password, active state, or role.
- `DELETE /api/admin/users/:id`: Permanently delete employee account.
- `GET /api/admin/roles`: List roles, assigned users count, and permissions.
- `POST /api/admin/roles`: Create a custom role.
- `PUT /api/admin/roles/:id`: Update role name, description, and permission mappings.
- `DELETE /api/admin/roles/:id`: Delete a custom role (built-in roles are protected).
- `GET /api/admin/permissions`: List all available granular permissions.
- `GET /api/admin/audit-logs`: Paginated, filterable security and activity audit logs.

---

## 16. Security Considerations

1. **Zero Secret Leakage**:
   - `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, and access tokens are strictly confined to the backend server memory.
   - Frontend bundles contain zero OAuth secrets.
2. **Password Hashing**:
   - Passwords are encrypted using `bcryptjs` with salt round factor 10. Plaintext passwords are never stored or logged.
3. **Database-Driven Authorization**:
   - The frontend role claims are never trusted for protected backend actions. Every request verifies permissions directly against SQLite tables.
4. **Rate Limiting**:
   - The `/api/auth/login` endpoint is wrapped with `express-rate-limit` to prevent credential brute-forcing.
5. **Security HTTP Headers**:
   - `helmet` is configured to sanitize headers, guard against clickjacking, and inject security protections.
6. **Parameterized ORM Queries**:
   - Prisma ORM automatically prepares and parameterizes all SQL queries, preventing SQL Injection vulnerabilities.

---

## 17. How Zoho Integration Works Under the Hood

1. When the backend needs to call a Zoho API on behalf of an authorized employee, it invokes `zohoService.getAccessToken()`.
2. The service checks its internal memory cache:
   - If an unexpired access token exists (with at least a 60-second buffer), it returns the token instantly.
   - If the token is expired or absent, it makes a server-side `POST` to `https://accounts.zoho.com/oauth/v2/token` using the configured `ZOHO_REFRESH_TOKEN`.
3. The newly acquired access token is cached alongside its TTL timestamp.
4. The service makes the authorized HTTP request to Zoho with the header: `Authorization: Zoho-oauthtoken <access_token>`.
5. The result is returned to the user, and an audit log (`ZOHO_API_REQUEST`) is recorded.

---

## 18. Troubleshooting & FAQs

#### Q1: What happens if I don't have Zoho credentials yet?
**A**: The application works completely without them! When you click "API Proxy", the server returns a clear `HTTP 503` status indicating that `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, and `ZOHO_REFRESH_TOKEN` are pending in `backend/.env`. All RBAC checks still execute and block unauthorized roles with `HTTP 403`.

#### Q2: What if I get an "Account Deactivated" error?
**A**: Log in with `admin@company.com`, navigate to **Admin Console &rarr; Users**, and toggle the employee's status back to **Active**.

#### Q3: How do I reset or reseed the database?
**A**: Run `npx prisma db push --force-reset && node prisma/seed.js` inside the `backend/` directory.

---

## 19. Interview Demonstration Walkthrough

Follow this 5-minute flow to demonstrate all core competencies during an interview:

1. **Demonstrate Login & Role Differentiation**:
   - Open `http://localhost:3000`.
   - Click the **HR** demo button &rarr; log in &rarr; Observe that **only Zoho People** is visible.
   - Use the navbar Quick Switcher or log out and log in as **Finance** &rarr; Observe that **only Zoho Books** is visible.
   - Log in as **Sales** &rarr; Observe that **only Zoho CRM** is visible.
   - Log in as **Support** &rarr; Observe that **only Zoho Desk** is visible.
2. **Demonstrate Backend RBAC Enforcement (Not Just UI Hiding)**:
   - While logged in as **HR**, click on the **API Proxy** button.
   - Show that an HR employee can access the People proxy route, but attempting to access `/api/zoho/books` triggers a genuine `HTTP 403 Forbidden` from the backend.
3. **Demonstrate Admin Governance**:
   - Log in as **Admin** (`admin@company.com`).
   - Notice that **all 4 applications** are available on the dashboard.
   - Click **Admin Console** in the top navigation bar:
     - **Users Tab**: Create a new employee with a role, edit details, or toggle active status.
     - **Roles Tab**: View roles and custom permission mappings.
     - **Permissions Tab**: Review granular permission keys.
     - **Audit Logs Tab**: Inspect the real-time activity stream showing login events, IP addresses, and timestamps.
     - **Zoho Health Tab**: Showcase the zero-credential OAuth architecture status.
