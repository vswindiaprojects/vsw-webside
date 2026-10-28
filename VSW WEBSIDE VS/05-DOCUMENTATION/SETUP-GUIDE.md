# Setup Guide

## Required software

- Node.js and npm
- XAMPP MySQL or MySQL Server
- MySQL Workbench is optional

## Install packages

From the project root:

```powershell
npm install
npm --prefix 02-BACKEND install
```

## Configure environment

Copy the backend template:

```powershell
Copy-Item 02-BACKEND/.env.example 02-BACKEND/.env
```

This XAMPP MySQL installation accepts the local `root` user with a blank password. If you set a password later, store it only in `02-BACKEND/.env`, never in source code or a committed file.

Required values:

```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vsw solution
DB_USER=root
DB_PASSWORD=
CONTACT_TABLE=contact_inquiries
INQUIRY_RATE_LIMIT=60
INQUIRY_RECEIVER_EMAIL=vswindiaprojects@gmail.com
SMTP_HOST=your-provider-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=your-verified-sender@your-domain.com
```

Inquiry notification email settings belong only in `02-BACKEND/.env`. Configure them with SMTP credentials from your email provider; keep the sender address verified with that provider. The API saves each inquiry to MySQL first, then emails the configured recipient with the customer as Reply-To. If SMTP is unavailable or unconfigured, the saved inquiry remains successful and the backend logs the notification failure (including its inquiry ID).

The root `.env` contains only:

```env
VITE_API_URL=http://localhost:5001/api
```

For an existing customer database, apply migrations `03-DATABASE/06-password-reset-otp.sql`, `07-account-dashboard.sql`, and `08-admin-dashboard.sql` once each in MySQL Workbench. Migration 08 creates the missing admin content tables and extends inquiries for CRM fields. Do not apply migration 08 more than once.
