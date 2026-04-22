# Vercel Deploy

## Required Vercel Variables

Add these in `Project Settings -> Environment Variables`:

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

## Notes

- Vercel does not use your local `.env.local`.
- Add the variables for `Production`.
- Add them for `Preview` too if you want preview deployments to work.
- Redeploy after changing env vars.

## Common Failure

If you see:

`DATABASE_URL is not configured`

then `DATABASE_URL` is missing in Vercel or was added after the last deployment without a redeploy.
