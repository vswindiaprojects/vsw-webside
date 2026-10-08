# 01 - Frontend

This is the React/Vite website that visitors see.

- `main.jsx`: starts React.
- `pages/App.jsx`: public one-page website and responsive header.
- `pages/Login.jsx`, `pages/Register.jsx`, `pages/UserDashboard.jsx`: separate customer account pages.
- `components/AuthLayout.jsx`, `components/ContactInquiry.jsx`: shared account layout and login-gated inquiry form.
- `services/AuthContext.jsx`: customer session state used by the header and protected user pages.
- `services/api.js`: calls the backend API.
- `services/data.js`: fallback website data.
- `styles/styles.css`: existing website styling.
- `assets/`: reserved for images and icons.

The frontend never connects directly to MySQL. It uses `VITE_API_URL` to call the backend.

The VSW header shows Login/Register to visitors and My Account/Logout when a customer session is active. Admin access stays under `/admin/login` and its code remains in `04-ADMIN/`.
