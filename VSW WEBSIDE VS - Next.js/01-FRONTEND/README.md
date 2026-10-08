# 01 - Frontend

These are the original React components and client-side business logic, retained for the Next.js App Router frontend.

- `main.jsx`: original Vite entry point, retained for reference; Next.js mounts `pages/App.jsx` through `app/[[...path]]/page.jsx`.
- `pages/App.jsx`: public one-page website, responsive header, and existing path-based page selection.
- `pages/Login.jsx`, `pages/Register.jsx`, `pages/UserDashboard.jsx`: separate customer account pages.
- `components/AuthLayout.jsx`, `components/ContactInquiry.jsx`: shared account layout and login-gated inquiry form.
- `services/AuthContext.jsx`: customer session state used by the header and protected user pages.
- `services/api.js`: calls the backend API.
- `services/data.js`: fallback website data.
- `styles/styles.css`: existing website styling.
- `assets/`: reserved for images and icons.

The frontend never connects directly to MySQL. It uses the same-origin `/api` and `/uploads` paths; Next.js rewrites them to the server-only `API_BACKEND_URL`. `NEXT_PUBLIC_API_URL` is optional for deployments that intentionally use a direct public API URL.

The VSW header shows Login/Register to visitors and My Account/Logout when a customer session is active. Admin access stays under `/admin/login` and its code remains in `04-ADMIN/`.
