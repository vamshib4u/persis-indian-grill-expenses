# Deploy Persis Grill App to GitHub with Data Backup

## Step 1: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `persis-grill-backup`
4. Set expiration: **No expiration** (or your preferred duration)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
6. Click **"Generate token"**
7. **Copy the token** (you won't see it again!)

## Step 2: Configure GitHub Token in .env.local

Update `.env.local` in your project root:

```env
NEXT_PUBLIC_GOOGLE_SHEET_ID=1NZlsd6of_V8rDOoQyGuTJOHxeIVp2b3dZ3gzotf0v7M

# GitHub Configuration for Data Backup
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=vamshib4u/persis-indian-grill-expenses
GITHUB_BRANCH=data
```

Replace:
- `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your token from Step 1
- `vamshib4u/persis-indian-grill-expenses` with your repository

## Step 3: Create Data Branch in GitHub

Create a separate branch to store your data files:

```bash
# Create and push the data branch
git checkout -b data
git push -u origin data
git checkout main
```

This keeps your data files organized separately from your code.

## Step 4: Deploy App to Vercel or GitHub Pages

### Option A: Deploy to Vercel (Recommended - Easiest)

1. Go to: https://vercel.com/import/git
2. Select your GitHub repository: `persis-indian-grill-expenses`
3. Add Environment Variables:
   - `GITHUB_TOKEN` = your token from Step 1
   - `GITHUB_REPO` = `vamshib4u/persis-indian-grill-expenses`
   - `GITHUB_BRANCH` = `data`
4. Click **"Deploy"**
5. Your app is live at: `https://persis-indian-grill-expenses.vercel.app`

### Option B: Deploy to GitHub Pages

1. Update `next.config.ts`:
   ```typescript
   const nextConfig = {
     output: 'export',
     basePath: '/persis-indian-grill-expenses',
   };
   ```

2. Add GitHub Actions workflow (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: 18
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./out
   ```

3. Push to GitHub:
   ```bash
   git add .github/
   git commit -m "Add GitHub Pages deployment workflow"
   git push origin main
   ```

4. Your app is live at: `https://vamshib4u.github.io/persis-indian-grill-expenses`

## Step 5: Use the App

1. Go to your deployed app (Vercel or GitHub Pages URL)
2. **Add sales and transactions** data
3. Click **"Save to GitHub"** button (on Sales page)
4. Data automatically saves to your GitHub repository in the `data` branch
5. View saved data at: `https://github.com/vamshib4u/persis-indian-grill-expenses/tree/data/data`

## Data Storage Structure

Your data files are saved as JSON in the `data/` folder:

```
data/
├── 2026-01-Jan.json
├── 2026-02-Feb.json
└── 2026-03-Mar.json
```

Each file contains:
```json
{
  "month": "January",
  "year": 2026,
  "exportedAt": "2026-01-12T15:30:00Z",
  "sales": [...],
  "transactions": [...]
}
```

## How to Load Saved Data

All data is saved locally in your browser. To restore:

1. **Export:** Click "Sales CSV" or "All Data JSON"
2. **Save locally:** Keep these files as backup
3. **Restore:** Manually re-enter data or ask for bulk import feature

## Troubleshooting

### Token Not Working?
- Verify token has `repo` and `workflow` permissions
- Check token hasn't expired at: https://github.com/settings/tokens
- Make sure `.env.local` is in root directory (not committed to git)

### Data Not Saving?
- Check browser console for errors (F12 → Console)
- Verify `GITHUB_TOKEN` and `GITHUB_REPO` are set correctly
- Ensure `data` branch exists in GitHub

### App Not Loading?
- If using GitHub Pages, check if `basePath` matches your repo name
- If using Vercel, check build logs at vercel.com

## Next Steps

- ✅ Create GitHub token
- ✅ Configure `.env.local`
- ✅ Deploy app to Vercel or GitHub Pages
- ✅ Test data saving with "Save to GitHub" button
- ✅ Keep data files as backup in GitHub repository

---

**For questions, check the repository:** https://github.com/vamshib4u/persis-indian-grill-expenses
