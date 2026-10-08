# Project Overview

VSW Solutions is a React website with an Express API and MySQL enquiry storage.

## Technology

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- Package manager: npm
- Admin: React page at `/admin`

## Data flow

`01-FRONTEND/pages/App.jsx`

-> `01-FRONTEND/services/api.js`

-> `POST /api/contact`

-> `02-BACKEND/routes/contact-mysql.js`

-> `02-BACKEND/controllers/contact-mysql.js`

-> `vsw solution.contact_inquiries`
