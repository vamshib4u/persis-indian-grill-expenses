# Persis Indian Grill Expenses

A private revenue and expense management app for Persis Indian Grill. The application is built with Next.js, stores data in Neon Postgres, and is protected by a login before any page or API route can be accessed.

## Current Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Neon Postgres
- Cookie-based app login using environment variables
- Optional GitHub backup export

## What The App Does

- Track daily sales
- Track expenses
- Track payouts
- Show monthly and yearly summaries
- Export CSV and JSON files
- Save a backup snapshot to GitHub

## Current Architecture

- Primary database: Neon Postgres via `DATABASE_URL`
- App protection: middleware + secure session cookie
- Required credentials:
  - `APP_USERNAME`
  - `APP_PASSWORD`
  - `AUTH_SECRET`
- Optional backup:
  - `GITHUB_TOKEN`
  - `GITHUB_REPO`
  - `GITHUB_BRANCH`

Google Sheets is no longer part of the live application flow.

## Required Environment Variables

Create `.env.local` with:

```env
DATABASE_URL=postgresql://username:password@host/neondb?sslmode=require
APP_USERNAME=admin
APP_PASSWORD=replace-with-a-strong-password
AUTH_SECRET=replace-with-a-long-random-secret
```

Optional GitHub backup:

```env
GITHUB_TOKEN=ghp_your_token
GITHUB_REPO=your_username/persis-indian-grill-expenses
GITHUB_BRANCH=main
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Add the required environment variables to `.env.local`.

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

5. Sign in using `APP_USERNAME` and `APP_PASSWORD`.

The database schema is created automatically when the app first connects to the database.

## Deployment

The main deployment path is:

1. Push the repo to GitHub
2. Import it into Vercel
3. Add the required environment variables in Vercel
4. Redeploy

See these docs:

- `NEON_VERCEL_SETUP.md`
- `QUICK_START_DEPLOYMENT.md`
- `DEPLOYMENT_GUIDE.md`
- `VERCEL_DEPLOY.md`

## Main Routes

- `/dashboard`
- `/sales`
- `/expenses`
- `/payouts`
- `/transactions`
- `/login`

## Main API Routes

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/bootstrap`
- `PUT /api/bootstrap`
- `GET/POST/PUT/DELETE /api/sales`
- `GET/POST/PUT/DELETE /api/transactions`
- `GET /api/expenses`
- `GET /api/payouts`
- `POST /api/save-to-github`

## Notes

- The app is no longer browser-local-only.
- The app is no longer publicly accessible by default.
- The app no longer depends on Google Sheets for persistence.

## Verification

The current repo verifies successfully with:

```bash
npm run lint
npx next build --webpack
```
