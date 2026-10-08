# MySQL setup

1. Create the schema:

```bash
mysql -u root -p < database/schema.sql
```

2. Load portfolio and company data:

```bash
mysql -u root -p vsw_solutions < database/seed.sql
```

3. Create the initial admin securely from environment variables:

```bash
npm run seed:admin
```

The admin seed hashes `ADMIN_PASSWORD` with bcrypt and never stores plaintext passwords.
