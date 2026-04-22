# Quick Deploy

## Required

```env
DATABASE_URL=postgresql://username:password@host/neondb?sslmode=require
APP_USERNAME=admin
APP_PASSWORD=replace-with-a-strong-password
AUTH_SECRET=replace-with-a-long-random-secret
```

## Steps

1. Push to GitHub
2. Import repo into Vercel
3. Add the required env vars
4. Redeploy
5. Open the site and log in

## Optional

If you want GitHub backup from inside the app:

```env
GITHUB_TOKEN=ghp_your_token
GITHUB_REPO=your_username/persis-indian-grill-expenses
GITHUB_BRANCH=main
```
