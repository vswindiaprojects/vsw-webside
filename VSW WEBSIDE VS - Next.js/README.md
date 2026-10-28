# VSW Solutions Website

Next.js App Router frontend, Express API, and MySQL database. The existing React pages and components are kept in `01-FRONTEND/`, with the admin UI in `04-ADMIN/`.

## Account and admin pages

- Client login: `http://localhost:5180/login`
- Client registration: `http://localhost:5180/register`
- Client profile and inquiry history: `http://localhost:5180/account`
- Separate admin login and dashboard: `http://localhost:5180/admin/login`

The main header shows Login/Register to visitors and My Account/Logout to signed-in users. Customer registration cannot create an administrator account. The backend enforces customer and administrator roles on protected APIs.

## Files

```text
01-FRONTEND/
  components/AuthLayout.jsx
  components/ContactInquiry.jsx
  pages/Login.jsx
  pages/Register.jsx
  pages/UserDashboard.jsx
  services/AuthContext.jsx
  services/api.js
02-BACKEND/
  controllers/auth-mysql.js       Admin authentication
  controllers/users-mysql.js      Customer accounts and user management
  controllers/contact-mysql.js    Inquiry submission and administration
  routes/auth-mysql.js
  routes/users-mysql.js
  routes/contact-mysql.js
  middleware/auth-mysql.js        User/admin authorization
03-DATABASE/
  02-create-tables.sql
  05-customer-accounts.sql        One-time migration for the existing database
04-ADMIN/
  pages/AdminLogin.jsx
  pages/Admin.jsx
  pages/AdminUsers.jsx
  pages/AdminInquiries.jsx
```

The public site and existing services, projects, and visual design remain in place. Admin pages and customer pages use separate frontend files and separate backend role checks.

## Database setup

The existing MySQL database is named `vsw solution` and uses the `contact_inquiries` table.

For this existing database, run `03-DATABASE/05-customer-accounts.sql` **once** in MySQL Workbench. It creates the `users` table and adds account ownership and status fields to `contact_inquiries`. Do not run this migration after the updated `02-create-tables.sql`; the migration is only for an older, already-created inquiry table.

Then run `03-DATABASE/06-password-reset-otp.sql`, `07-account-dashboard.sql`, and `08-admin-dashboard.sql` once each. Migration 08 creates the missing Projects, Services, Company Information, CMS, Media, Documents, Contact Messages, and admin notifications tables, and extends existing inquiries for CRM management.

New databases should run `03-DATABASE/01-create-database.sql` followed by `03-DATABASE/02-create-tables.sql`.

## Environment and setup

1. Copy `02-BACKEND/.env.example` to `02-BACKEND/.env`. Configure MySQL, set a long random `JWT_SECRET`, and set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the first admin. Keep this file private.
2. Copy `.env.example` to `.env.local` if the backend runs somewhere other than `http://127.0.0.1:5001`, and set the server-only `API_BACKEND_URL`. The Next.js rewrites proxy `/api/*` and `/uploads/*` to the backend, so browser requests stay same-origin. `NEXT_PUBLIC_API_URL` is optional and only needed if you intentionally call a public API URL directly.
3. Install dependencies if needed:

   ```powershell
   npm install
   npm --prefix 02-BACKEND install
   ```

4. With MySQL running and the migration applied, create the initial admin:

   ```powershell
   npm run seed:admin
   ```

   The script stores a bcrypt password hash; it does not create public admin registration.

5. Start frontend and backend together:

   ```powershell
   npm run dev:all
   ```

   Or run `npm run frontend` and `npm run backend:dev` in separate terminals.

6. Verify the migration shell:

   ```powershell
   npm run lint
   npm run build
   npm start
   ```

## Test the flow

1. Open `/register`, create an account with a valid phone number and password of at least eight characters, then sign in from `/login`.
2. After sign-in, the header changes to My Account/Logout. `/account` shows the profile and the user's inquiries.
3. Sign out and visit `/#contact`. The inquiry form is replaced by Login/Register links. After login, the user returns to the contact form.
4. Submit an inquiry while signed in. The server associates it with the authenticated account; it ignores client-supplied user IDs.
5. Open `/admin/login` and sign in with the seeded admin credentials. The dashboard can view users and inquiries and update user/inquiry status. Password hashes are never returned by the user list.
6. Try an inquiry request without a user token and an admin API request with a customer token; both are rejected by the backend.

## Environment variables

Backend: `PORT`, `JWT_SECRET`, `FRONTEND_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `CONTACT_TABLE`, and SMTP settings for inquiry notifications. See `05-DOCUMENTATION/SETUP-GUIDE.md`.

Frontend: `API_BACKEND_URL` (server-only Next.js rewrite target), optional `NEXT_PUBLIC_API_URL` (public browser API origin).
