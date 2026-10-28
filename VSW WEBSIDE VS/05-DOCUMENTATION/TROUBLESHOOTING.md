# Troubleshooting

## Website does not open

Make sure the frontend is running:

```powershell
npm run frontend
```

Open `http://localhost:5173/`.

## Enquiry says Failed to fetch

1. Start the backend with `npm run backend`.
2. Confirm `VITE_API_URL=http://localhost:5001/api` in the root `.env`.
3. Open `http://localhost:5001/api/health`.
4. If the response says `Access denied`, correct `DB_PASSWORD` in `02-BACKEND/.env`.
5. If the database/table is missing, confirm the exact database name is `vsw solution` (including the space) and the table is `contact_inquiries`.
6. If the browser uses another localhost port, restart the backend; development CORS allows localhost ports.

## Database data check

Run `03-DATABASE/04-test-queries.sql` and inspect the newest rows in `contact_inquiries`.

## HTTP/HTTPS

Local development uses HTTP on both frontend and backend. Do not open the frontend as an HTTPS page while calling an HTTP API.
