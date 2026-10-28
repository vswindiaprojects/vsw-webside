# VSW Solutions Website

React/Vite frontend, Express API, and MySQL database.

## Account and admin pages

- Client login: `http://localhost:5173/login`
- Client registration: `http://localhost:5173/register`
- Client profile and inquiry history: `http://localhost:5173/account`
- Separate admin login and dashboard: `http://localhost:5173/admin/login`

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

Apply `03-DATABASE/13-theme-customizer.sql`, `03-DATABASE/14-media-dimensions.sql`, `03-DATABASE/15-client-logos.sql`, and `03-DATABASE/16-project-counter.sql` once after the admin and media tables exist. In the admin workspace, open **Website Customizer** to edit a private draft, choose media from the Media Library, preview changes, then publish when ready. Draft settings do not affect the public website. Existing homepage sections can be reordered, hidden, and edited; FAQ, testimonials, and call-to-action sections can also be added. The **Client Logos** and **Project Counter** pages also keep private drafts until published; the counter board appears directly below Projects and supports verified statistics, animation timing, colours, and optional additional metrics. A compact read-only/publish-aware mirror of the counter settings is also available at `GET /api/counter-settings` (public), `PUT /api/counter-settings` (content editors, saves the draft), and `POST /api/counter-settings/publish` (publishers). The Media Library supports search, image/document filters, alt-text editing, dimensions, and replacing image files without changing their stored URLs. Configure `UPLOADS_DIR` to a persistent mounted disk path when deploying; otherwise uploaded logos and images may be lost when the hosting service replaces the application container.

New databases should run `03-DATABASE/01-create-database.sql` followed by `03-DATABASE/02-create-tables.sql`.

## Environment and setup

1. Copy `02-BACKEND/.env.example` to `02-BACKEND/.env`. Configure MySQL, set a long random `JWT_SECRET`, and set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the first admin. Keep this file private.
2. Set the root `.env` `VITE_API_URL` to the backend API, usually `http://localhost:5001/api`.
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

## Google sign-in

Google buttons are available on `/login` and `/register`. To enable them, create a **Web application** OAuth client in Google Cloud Console, add `http://localhost:5173` (and your deployed website origin) under Authorized JavaScript origins, then set the same client ID in the root `.env.local` as `VITE_GOOGLE_CLIENT_ID` and in `02-BACKEND/.env` as `GOOGLE_CLIENT_ID`. Restart the frontend and backend after setting these values. The client ID is public; do not put a client secret in frontend configuration.

The Google ID token is verified by the backend before a customer session is issued. Run `npm --prefix 02-BACKEND run migrate:google` once against each database that will accept Google sign-in; it has already been applied to this workspace's configured database.

Google OAuth's consent-screen **Audience** is not a directory of website accounts; it is used for OAuth app access and testing. This project uses custom MySQL-backed website accounts (including Google-linked accounts), not Firebase Authentication or Google Cloud Identity Platform. To see registered website users, sign in to `/admin/login` and open **Users**. The admin list reads the `users` table in the configured MySQL database.

## Test the flow

1. Open `/register`, create an account with a valid phone number and password of at least twelve characters, then sign in from `/login`.
2. After sign-in, the header changes to My Account/Logout. `/account` shows the profile and the user's inquiries.
3. Sign out and visit `/#contact`. The inquiry form is replaced by Login/Register links. After login, the user returns to the contact form.
4. Submit an inquiry while signed in. The server associates it with the authenticated account; it ignores client-supplied user IDs.
5. Open `/admin/login` and sign in with the seeded admin credentials. The dashboard can view users and inquiries and update user/inquiry status. Password hashes are never returned by the user list.
6. Try an inquiry request without a user token and an admin API request with a customer token; both are rejected by the backend.

## Environment variables

Backend: `PORT`, `JWT_SECRET`, `FRONTEND_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `CONTACT_TABLE`, and SMTP settings for inquiry notifications. See `05-DOCUMENTATION/SETUP-GUIDE.md`.

Frontend: `VITE_API_URL`.
