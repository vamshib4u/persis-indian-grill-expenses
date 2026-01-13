# Vercel Deployment Step-by-Step Guide for Persis Grill

## Framework Selection: **Next.js**

When deploying to Vercel, your app uses **Next.js** framework (version 16.1.1).

---

## Complete Deployment Steps

### Step 1: Go to Vercel
1. Visit: https://vercel.com/new
2. Sign in with GitHub (if not already signed in)

### Step 2: Select Your Repository
1. Click **"Import Git Repository"**
2. Find and select: `persis-indian-grill-expenses`
3. Click **"Import"**

### Step 3: Configure Project
**Project Name:**
- Leave as: `persis-indian-grill-expenses` (or customize)

**Framework Preset:**
- **Select: "Next.js"** ← This is the framework
- Vercel auto-detects Next.js from package.json

**Root Directory:**
- Leave as: `./` (default)

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `GITHUB_TOKEN` | `ghp_your_personal_access_token_here` |
| `GITHUB_REPO` | `vamshib4u/persis-indian-grill-expenses` |
| `GITHUB_BRANCH` | `data` |
| `NEXT_PUBLIC_GOOGLE_SHEET_ID` | `1NZlsd6of_V8rDOoQyGuTJOHxeIVp2b3dZ3gzotf0v7M` |

**How to add environment variables in Vercel:**
1. In the "Environment Variables" section
2. Enter Name: `GITHUB_TOKEN`
3. Enter Value: (your GitHub token)
4. Click **"Add"**
5. Repeat for each variable

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete (usually 2-5 minutes)
3. You'll see a success message with your URL

### Step 6: Access Your App
Your app is now live at:
- `https://persis-indian-grill-expenses.vercel.app` (or your custom domain)

---

## What Happens During Deployment

1. **Vercel detects Next.js** (from package.json)
2. **Installs dependencies** - `npm install`
3. **Builds your app** - `npm run build`
4. **Creates serverless functions** for API routes:
   - `/api/save-to-github` ← GitHub backup
   - `/api/sync-sheets` ← Google Sheets
5. **Deploys frontend** - your React app
6. **App goes live** on Vercel's CDN

---

## After Deployment

### Test GitHub Save Feature
1. Go to your live app: `https://persis-indian-grill-expenses.vercel.app`
2. Go to **Sales** page
3. Add some test data
4. Click **"Save to GitHub"** button
5. Check if data appears on GitHub (at `/tree/data/data`)

### Configure Custom Domain (Optional)
1. In Vercel dashboard for your project
2. Go to **Settings** → **Domains**
3. Add your custom domain
4. Follow DNS configuration steps

---

## Environment Variables Explained

| Variable | Purpose | Where to Get |
|----------|---------|-------------|
| `GITHUB_TOKEN` | Authenticate with GitHub API | https://github.com/settings/tokens |
| `GITHUB_REPO` | Your repo for data backup | `username/repo-name` |
| `GITHUB_BRANCH` | Branch to store data files | Create a branch called `data` |
| `NEXT_PUBLIC_GOOGLE_SHEET_ID` | Google Sheet ID (optional) | From your Google Sheet URL |

**Important:** Never commit `.env.local` to git. Vercel env vars are stored securely.

---

## Framework Details

### Why Next.js?
- **Server-side rendering** - Fast page loads
- **API routes** - Backend endpoints at `/api/`
- **Optimized for Vercel** - Deploys instantly
- **Full-stack** - Frontend + Backend in one app

### Build & Start Scripts
```json
"dev": "next dev"          // Development: http://localhost:3000
"build": "next build"      // Production build
"start": "next start"      // Run production build
```

---

## Troubleshooting Deployment

### Deployment Failed?
1. Check build logs in Vercel dashboard
2. Look for errors in the logs
3. Common issues:
   - Missing environment variables
   - Wrong GitHub token permissions
   - TypeScript errors in code

### "GitHub not configured" error on live app?
1. Check if env variables are added in Vercel
2. Redeploy: Go to Deployments → Redeploy
3. Make sure `GITHUB_TOKEN` is set

### App loads but Save to GitHub doesn't work?
1. Verify GitHub token has `repo` + `workflow` permissions
2. Check if `data` branch exists on GitHub
3. Open browser console (F12) for error messages

---

## Update After Deploy

If you make changes:
1. Push to GitHub: `git push origin main`
2. Vercel auto-deploys (if continuous deployment enabled)
3. Or manually redeploy in Vercel dashboard

---

## Summary

| Step | Action | Framework Select |
|------|--------|-----------------|
| 1 | Go to vercel.com/new | - |
| 2 | Select your repo | - |
| 3 | Configure project | **Select "Next.js"** ← HERE |
| 4 | Add env variables | - |
| 5 | Click Deploy | - |
| 6 | Wait & get URL | Done! |

---

**Your GitHub:** https://github.com/vamshib4u/persis-indian-grill-expenses
**Framework:** Next.js 16.1.1
**Deployment:** Ready for production!
