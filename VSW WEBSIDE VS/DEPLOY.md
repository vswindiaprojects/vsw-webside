# VSW Website Deployment (Vercel + Railway)

Frontend -> Vercel | Backend -> Railway | Database -> Railway MySQL (data exported from XAMPP)

Repository: https://github.com/vswindiaprojects/vsw-webside

```
VSW WEBSIDE VS/                 <- Vercel root directory (Vite app)
VSW WEBSIDE VS/02-BACKEND/      <- Railway root directory (Express API)
```

---

## 0. Database export (already done)

The local XAMPP database `vsw solution` is exported to:

```
C:\Users\HP\Downloads\vsw_solution.sql
```

Re-export after any content change:

```cmd
"C:\xampp\mysql\bin\mysqldump.exe" -u root --single-transaction --skip-lock-tables --routines --triggers --default-character-set=utf8mb4 --no-tablespaces "vsw solution" > C:\Users\HP\Downloads\vsw_solution.sql
```

---

## 1. Railway: MySQL

1. https://railway.app -> New Project -> Deploy MySQL
2. Open the MySQL service -> `Connect` -> enable **Public Networking** (TCP Proxy)
3. Copy the public URL, it looks like:
   `mysql://root:PASSWORD@monorail.proxy.rlwy.net:PORT/railway`
4. Import the dump from your PC (XAMPP has the mysql client):

```cmd
"C:\xampp\mysql\bin\mysql.exe" -h monorail.proxy.rlwy.net -P PORT -u root -pPASSWORD railway < C:\Users\HP\Downloads\vsw_solution.sql
```

Replace `PORT` and `PASSWORD` with the values from the URL. Verify:

```cmd
"C:\xampp\mysql\bin\mysql.exe" -h monorail.proxy.rlwy.net -P PORT -u root -pPASSWORD railway -e "SHOW TABLES;"
```

You should see 24 tables (admins, projects, services, website_content, ...).

---

## 2. Railway: Backend

1. Same Railway project -> `+ Create` -> `GitHub Repo` -> `vswindiaprojects/vsw-webside`
2. Service -> `Settings` -> `Source` -> **Root Directory**:
   `VSW WEBSIDE VS/02-BACKEND`
3. `Settings` -> `Networking` -> **Generate Domain** (public HTTPS URL)

### Variables (backend service -> Variables)

Use **Add Reference** for the DB values so Railway injects them automatically:

| Variable | Value |
| --- | --- |
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `DB_NAME` | `${{MySQL.MYSQLDATABASE}}` |

Manual variables:

```
NODE_ENV=production
JWT_SECRET=<long random string, 64+ chars>
ADMIN_EMAIL=vswindiaprojects@gmail.com
ADMIN_PASSWORD=Vswindia@2026!
FRONTEND_URL=https://your-vercel-app.vercel.app
UPLOADS_DIR=uploads
INQUIRY_RECEIVER_EMAIL=vswindiaprojects@gmail.com
```

`FRONTEND_URL` can hold several comma separated origins:
`https://your-app.vercel.app,https://www.yourdomain.com`

Check: `GET https://<backend-domain>/api/health` must return
`{"success":true,"database":"mysql",...}`

---

## 3. Vercel: Frontend

1. https://vercel.com -> Add New -> Project -> import `vswindiaprojects/vsw-webside`
2. Configure:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `VSW WEBSIDE VS` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. Environment Variables:

```
VITE_API_URL=https://<backend-domain>.up.railway.app/api
```

`vercel.json` already handles SPA routing.

4. Deploy -> copy the Vercel URL.

---

## 4. Connect both directions

1. Railway backend -> Variables -> set `FRONTEND_URL` to the Vercel URL -> redeploy
2. Vercel -> Environment Variables -> make sure `VITE_API_URL` points to Railway -> redeploy

---

## 5. Custom domain (Vercel)

1. Vercel project -> Settings -> Domains -> add `yourdomain.com` and `www.yourdomain.com`
2. At the domain registrar:
   - `A` record `@` -> the IP Vercel shows
   - `CNAME` record `www` -> `cname.vercel-dns.com`
3. After DNS is verified, update Railway `FRONTEND_URL` with the custom domain and redeploy.

Optional: backend custom domain `api.yourdomain.com` (Railway -> Settings -> Networking -> Custom Domain, then `CNAME` to the Railway target).

---

## Notes / gotchas

- Railway MySQL private URL (`*.railway.internal`) works only between Railway services. Use it for the backend, never for imports.
- Railway backend filesystem is ephemeral: uploaded media in `02-BACKEND/uploads` is lost on redeploy. Existing site images are in `public/images` (served by Vercel) so the site is fine.
- Keep `02-BACKEND/.env` out of git (already in `.gitignore`).
- Admin login: `vswindiaprojects@gmail.com` / `Vswindia@2026!`
