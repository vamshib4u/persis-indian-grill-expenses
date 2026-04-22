# Neon + Vercel Setup

This app now stores sales and transactions in **Neon Postgres** through `DATABASE_URL` and protects access with a login backed by environment variables.

## 1. Create the Neon database

1. Create a Neon project.
2. Copy the connection string from the Neon dashboard.
3. It should look similar to:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

## 2. Configure local development

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` in `.env.local`.
3. Add login credentials:

```env
APP_USERNAME=admin
APP_PASSWORD=replace-with-a-strong-password
AUTH_SECRET=replace-with-a-long-random-secret
```

## 3. Run locally

```bash
npm install
npm run dev
```

The schema is created automatically the first time an API route touches the database. No manual migration step is required for the current version.

## 4. Add the variable in Vercel

1. Open your Vercel project.
2. Go to `Settings -> Environment Variables`.
3. Add `DATABASE_URL`.
4. Redeploy the project.

## 5. Recommended Vercel flow

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Add `DATABASE_URL` from Neon.
4. Add `APP_USERNAME`, `APP_PASSWORD`, and `AUTH_SECRET`.
5. Add any optional `GITHUB_*` variables if you use the GitHub backup feature.
6. Deploy.

## Notes

- The app no longer relies on browser-only `localStorage` or Google Sheets for primary data.
- Sales are stored in the `sales` table.
- Expenses and payouts are stored in the `transactions` table.
- Middleware protects the application and API routes behind a login session.
