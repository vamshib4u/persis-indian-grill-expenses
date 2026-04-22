# Quick Start Deployment

Use this if you want the shortest path to a working deployment.

## 1. Create Neon Database

Copy your Neon connection string.

Example:

```env
DATABASE_URL=postgresql://username:password@host/neondb?sslmode=require
```

## 2. Push The Repo

```bash
git push origin main
```

## 3. Import Into Vercel

Create a new Vercel project from the GitHub repository.

## 4. Add Required Environment Variables

In Vercel, add:

```env
DATABASE_URL=postgresql://username:password@host/neondb?sslmode=require
APP_USERNAME=admin
APP_PASSWORD=replace-with-a-strong-password
AUTH_SECRET=replace-with-a-long-random-secret
```

Optional:

```env
GITHUB_TOKEN=ghp_your_token
GITHUB_REPO=your_username/persis-indian-grill-expenses
GITHUB_BRANCH=main
```

## 5. Redeploy

After saving the environment variables, redeploy the project.

## 6. Open The App

You will be redirected to `/login`.

Sign in using:

- `APP_USERNAME`
- `APP_PASSWORD`

## 7. Done

The app is now running with:

- Neon Postgres
- protected login
- Vercel deployment

No Google Sheets setup is required.
