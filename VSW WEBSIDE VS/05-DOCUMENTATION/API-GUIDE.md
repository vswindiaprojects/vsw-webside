# API Guide

## Enquiry submission

`POST http://localhost:5001/api/contact`

JSON body:

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "phone": "9876543210",
  "company": "Example Company",
  "service": "Project Management",
  "project_brief": "Please contact me about a project."
}
```

The API validates the fields, inserts one row into `contact_inquiries`, and returns JSON success or an error message.

## Customer password OTP

- `POST /api/users/password/reset/request` — request a code for the submitted account email; response text does not disclose whether the account exists.
- `POST /api/users/password/reset` — submit `email`, six-digit `otp`, and new `password`.
- `POST /api/users/password/change/request` — authenticated customer requests a code at their registered email.
- `POST /api/users/password/change` — authenticated customer submits `otp` and new `password`.

Codes expire after 10 minutes, are single-use, and allow at most five incorrect submissions. SMTP must be configured in the backend `.env` for delivery.

## Health check

Open `http://localhost:5001/api/health`. A successful response confirms that the API can connect to MySQL.

## Admin dashboard

Sign in with the configured admin credentials using `POST /api/auth/login`, then send the returned bearer token to protected endpoints. Admin routes are role checked in the backend.

- `GET /api/admin/dashboard` — live MySQL totals and recent inquiries, users, projects and admin notifications.
- `GET /api/admin/users?page=1&limit=20&search=&status=`; `GET /api/admin/users/:id`; `PUT|DELETE /api/admin/users/:id` — paginated customer management and inquiry history.
- `GET /api/admin/inquiries?page=1&limit=20&search=&status=&service=&from=&to=`; `GET|PUT /api/admin/inquiries/:id`; `POST /api/admin/inquiries/:id/notes` — CRM inquiry filters, status, budget, follow-up, assignment, archive and private notes.
- `/api/admin/projects` — GET, POST; `/:id` GET, PUT, DELETE (delete archives).
- `/api/admin/services` — GET, POST; `/:id` PUT, DELETE.
- `GET|PUT /api/admin/company` — update the public company profile used by the site.
- `GET|PUT /api/admin/content` — edit per-page JSON sections; `GET /api/content` is the public read-only CMS endpoint.
- `/api/admin/contacts` — GET, `PATCH /:id`, and `DELETE /:id`; `POST /api/contact/message` stores a public contact message and attempts an email notification.
- `/api/admin/media` — GET, multipart POST (image/PDF, 15 MB maximum), PATCH rename/metadata, DELETE file.
- `/api/admin/documents` — GET, POST to attach an uploaded PDF, PATCH status, DELETE.
- `/api/admin/admins` — super-admin role CRUD; roles are `super_admin`, `admin`, `manager`, `editor`, `support_staff`.
- `GET /api/admin/notifications`, `PATCH /:id/read`, `GET /api/admin/reports?from=&to=`, `GET /api/admin/settings` — alerts, date-range report data and secret-safe settings status.
