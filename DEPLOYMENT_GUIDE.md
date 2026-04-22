# Deployment Guide

This guide reflects the current application architecture:

- Neon Postgres for storage
- Login protection for the app
- Vercel for deployment
- Optional GitHub backup

## 1. Prerequisites

You need:

- a Neon database
- a Vercel account
- a GitHub repository for the project

Optional:

- a GitHub personal access token if you want the in-app GitHub backup feature

## 2. Required Environment Variables

Set these locally and in Vercel:

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

## 3. Local Verification

Before deploying:

```bash
npm install
npm run lint
npx next build --webpack
```

## 4. Deploy To Vercel

1. Push the repo to GitHub.
2. Import the repository into Vercel.
3. Add environment variables in `Project Settings -> Environment Variables`.
4. Redeploy.

Required variables in Vercel:

- `DATABASE_URL`
- `APP_USERNAME`
- `APP_PASSWORD`
- `AUTH_SECRET`

Optional variables in Vercel:

- `GITHUB_TOKEN`
- `GITHUB_REPO`
- `GITHUB_BRANCH`

## 5. Important Runtime Notes

- `.env.local` is only for your local machine.
- Vercel will not read your local `.env.local`.
- If `DATABASE_URL` is missing in Vercel, the app will fail at runtime.
- If the login variables are missing, login will fail.

## 6. Security Notes

- Use a long random value for `AUTH_SECRET`.
- Use a strong password for `APP_PASSWORD`.
- Do not commit secrets to Git.
- Protect Production and Preview environments separately if needed.

## 7. Database Behavior

- The app automatically creates the required tables on first use.
- Sales are stored in `sales`.
- Expenses and payouts are stored in `transactions`.

## 8. Optional GitHub Backup

If enabled, the app can export current month data to GitHub through `POST /api/save-to-github`.

This is a backup/export path only. It is not the primary database.
