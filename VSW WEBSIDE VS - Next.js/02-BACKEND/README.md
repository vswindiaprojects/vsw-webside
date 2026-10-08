# 02 - Backend

This is the Node.js/Express API.

- `server.js`: starts the API on `PORT`.
- `routes/auth-mysql.js` and `controllers/auth-mysql.js`: separate admin sign-in/session endpoints.
- `routes/users-mysql.js` and `controllers/users-mysql.js`: customer registration, login, profile, inquiry history, and admin user management.
- `controllers/password-otp.js`: email OTP password reset and authenticated password change.
- `routes/contact-mysql.js` and `controllers/contact-mysql.js`: customer-only inquiry submission plus admin inquiry listing/status updates.
- `routes/admin-mysql.js` and `controllers/admin-mysql.js`: role-protected dashboard data, user/inquiry/project/service/company/content/media/document/contact/admin management, notifications, reports, and settings.
- `middleware/auth-mysql.js`: enforces separate USER and admin token roles on the backend.
- `routes/content-mysql.js`: public read-only endpoint for website CMS content.
- `config/db.js`: reusable MySQL connection pool.
- `config/mailer.js`: backend-only SMTP sender shared by inquiry and password emails.
- `middleware/`: validation, authentication, and error logging.
- `.env`: local database settings; never commit this file.

The APIs use `CONTACT_TABLE=contact_inquiries` and `DB_NAME=vsw solution` (the existing local database name includes a space). Customer registration and password updates use bcrypt password hashes. Customer tokens cannot access admin routes.

Inquiry submission saves the authenticated customer's inquiry to MySQL, then sends an HTML notification to `INQUIRY_RECEIVER_EMAIL` (default: `vswindiaprojects@gmail.com`). Password reset/change codes use the same SMTP configuration and are sent to the customer's registered email. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM_EMAIL` in `02-BACKEND/.env`. OTPs expire after 10 minutes, are one-time, and are stored only as keyed hashes. SMTP errors are logged.

## Setup

1. Copy `.env.example` to `.env`, set the MySQL credentials, and use a random `JWT_SECRET` of at least 32 characters.
2. For an existing database, run `03-DATABASE/05-customer-accounts.sql` once. See the database README for fresh-database setup.
3. From the repository root, run `npm run seed:admin` to create the initial admin using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the backend `.env`.
4. Apply `03-DATABASE/08-admin-dashboard.sql` once to the existing database.
5. Apply `03-DATABASE/10-session-revocation.sql` once, or run `npm run migrate:sessions` from this folder. Existing users will need to sign in again after the migration.
6. Apply `03-DATABASE/11-admin-activity-log.sql` once, or run `npm run migrate:audit` from this folder.
7. Start the API with `npm run backend:dev` (or `npm run backend` for normal mode).

Customer routes include `/api/users/register`, `/api/users/login`, `/api/users/logout`, `/api/users/me/dashboard`, `/api/users/me`, `/api/users/me/inquiries`, `/api/users/me/notifications`, `/api/users/me/settings`, and the password OTP routes documented in `05-DOCUMENTATION/API-GUIDE.md`. Admin sign-in remains `/api/auth/login`; the dashboard endpoints are under `/api/admin`. Admin permissions and inquiry ownership are enforced by role and owner ID on the backend. Customer/admin tokens expire after eight hours; session versions revoke tokens on logout, password changes, and relevant account changes. The browser stores bearer tokens in localStorage, so prevent script injection and use HTTPS in deployment. Uploads accept image and PDF files up to 15 MB and are stored under `02-BACKEND/uploads` (ignored by Git). Configure database and SMTP credentials only in this backend `.env` file.

Successful admin writes and admin login/logout are recorded in `admin_activity_logs` without request bodies. Run `npm run security:smoke` from this folder to check unauthenticated access, role separation, generic login errors, login throttling, session-version rejection, and available account ownership cases without printing customer data.
