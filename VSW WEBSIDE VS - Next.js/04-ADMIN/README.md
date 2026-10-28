# 04 - Admin

The admin dashboard is loaded at `/admin`.

- `pages/AdminLogin.jsx`: separate admin-only sign-in page.
- `pages/Admin.jsx`: protected admin sign-in and workspace shell.
- `pages/AdminWorkspace.jsx`: database-backed statistics, recent records, CRUD forms, inquiry filters, company/CMS editor, media/documents, admin roles, reports, notifications and settings.
- `pages/AdminUsers.jsx`: legacy user list component; the workspace now uses paginated user APIs with profile, inquiry history, edit, status and safe delete actions.
- `pages/AdminInquiries.jsx`: view submitted inquiries and update their status.
- It uses the same frontend API service in `01-FRONTEND/services/api.js`.
- Contact enquiries are read from the existing `contact_inquiries` table through the backend.

Admin access requires a backend-issued admin token. The backend rejects customer tokens and applies role permissions to every admin API. Database credentials never belong in this folder. Admin routes are documented in `05-DOCUMENTATION/API-GUIDE.md`.
