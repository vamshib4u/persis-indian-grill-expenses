# Deployment And Storage Summary

## Current State

- Primary storage: Neon Postgres
- Access control: login required
- Deployment target: Vercel
- Optional backup: GitHub export

## No Longer True

- Data is not stored only in browser localStorage
- Google Sheets is not part of the active persistence flow

## Current Required Environment Variables

```env
DATABASE_URL=postgresql://username:password@host/neondb?sslmode=require
APP_USERNAME=admin
APP_PASSWORD=replace-with-a-strong-password
AUTH_SECRET=replace-with-a-long-random-secret
```

## Optional Backup Variables

```env
GITHUB_TOKEN=ghp_your_token
GITHUB_REPO=your_username/persis-indian-grill-expenses
GITHUB_BRANCH=main
```

## Recommended Deployment Path

1. Push to GitHub
2. Import into Vercel
3. Add env vars
4. Redeploy
5. Log in and use the app
