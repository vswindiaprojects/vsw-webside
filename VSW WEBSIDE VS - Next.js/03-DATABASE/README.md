# 03 - Database

This folder contains SQL for the existing MySQL database.

Database: `vsw solution` (existing local database name; it includes a space)

User table: `users` (passwords are stored as bcrypt hashes)

Inquiry table: `contact_inquiries` (each new inquiry is connected to its account through `user_id`)

Password OTPs are stored in `password_reset_otps` as keyed hashes with an expiry and failed-attempt counter; raw codes are emailed and never stored.

The website does not connect directly to MySQL. The flow is:

`Frontend form -> user token -> POST /api/contact -> Express backend -> MySQL -> contact_inquiries`

## Files

- `01-create-database.sql`: safely ensures the exact database name exists.
- `02-create-tables.sql`: creates users and linked inquiries for a new database.
- `05-customer-accounts.sql`: one-time migration for an existing database that already has `contact_inquiries`.
- `06-password-reset-otp.sql`: one-time migration for the customer password reset/change OTP flow.
- `07-account-dashboard.sql`: additive account dashboard fields, inquiry messages, notifications, settings and activity tables.
- `08-admin-dashboard.sql`: adds the missing project, service, company, CMS, media, document, contact-message and admin-notification tables, then extends inquiries with assignment, budget, follow-up, archive and CRM statuses.
- `09-seed-current-services.sql`: safely inserts the five service options already used by the public website when the admin services table is empty.
- `10-session-revocation.sql`: adds session versions used to revoke customer and admin JWTs on logout, password changes and account/role changes.
- `11-admin-activity-log.sql`: stores successful administrator mutations without request bodies or secrets.
- `03-sample-data.sql`: intentionally inserts nothing, so real enquiries are not duplicated.
- `04-test-queries.sql`: read-only checks.
- `legacy/`: original project SQL kept for reference; do not import it for the existing one-table setup.

For a new database, run `01-create-database.sql` followed by `02-create-tables.sql`. For an existing database, run `05-customer-accounts.sql` once if customer accounts have not yet been migrated, then run `06-password-reset-otp.sql`, `07-account-dashboard.sql`, and `08-admin-dashboard.sql` once each. Apply `09-seed-current-services.sql` after migration eight; it is idempotent and can be rerun safely. Apply `10-session-revocation.sql` once after the `users` and `admins` tables exist, then apply `11-admin-activity-log.sql`. Migrations eight and ten reuse existing tables; apply them once after those base tables exist.

Run SQL from MySQL Workbench or the MySQL command line. Never put a MySQL password in these files.
