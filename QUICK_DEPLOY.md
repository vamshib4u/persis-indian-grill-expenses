# Persis Grill Deployment Checklist

## Quick Start: 3 Steps to Deploy with Data Backup

### Step 1: Create GitHub Token (5 minutes)
- [ ] Go to https://github.com/settings/tokens
- [ ] Click "Generate new token (classic)"
- [ ] Name: `persis-grill-backup`
- [ ] Select scopes: `repo` + `workflow`
- [ ] Generate and copy token

### Step 2: Configure Locally
- [ ] Open `.env.local` in your project
- [ ] Add your token:
  ```
  GITHUB_TOKEN=ghp_your_token_here
  GITHUB_REPO=vamshib4u/persis-indian-grill-expenses
  GITHUB_BRANCH=data
  ```
- [ ] Test locally: `npm run dev`
- [ ] Try "Save to GitHub" button on /sales page

### Step 3: Deploy to Vercel (Easiest)
- [ ] Go to https://vercel.com/import/git
- [ ] Connect GitHub repo: `persis-indian-grill-expenses`
- [ ] Add same env variables to Vercel
- [ ] Click Deploy
- [ ] Your app is live! Share the URL

### Step 4: Create Data Branch (Optional but Recommended)
```bash
git checkout -b data
git push -u origin data
git checkout main
```

---

## What's Included

✅ **CSV Export** - Download sales, expenses, payouts as CSV
✅ **JSON Export** - Complete data backup as JSON
✅ **GitHub Save** - One-click backup to GitHub repository
✅ **Data Persistence** - Browser localStorage + GitHub backup
✅ **Deployment Ready** - Deploy to Vercel or GitHub Pages

---

## File Structure After Deployment

```
Your Repository/
├── main branch
│   ├── src/
│   ├── public/
│   └── package.json
│
└── data branch (auto-created)
    └── data/
        ├── 2026-01-Jan.json
        ├── 2026-02-Feb.json
        └── ...monthly files
```

---

## Using the App

1. **Add Data**: Fill in sales/expenses/payouts
2. **Download**: Export as CSV or JSON to your computer
3. **Backup**: Click "Save to GitHub" to backup to GitHub
4. **View**: Check https://github.com/your-repo/tree/data/data

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "GitHub not configured" error | Add GITHUB_TOKEN to .env.local |
| Token error when saving | Regenerate token at github.com/settings/tokens |
| Data not appearing on GitHub | Check if `data` branch exists |
| App not loading after deploy | Clear browser cache or try incognito |

---

## Next: Advanced Setup (Optional)

- [ ] Enable auto-backup on every data change
- [ ] Add email notifications
- [ ] Set up GitHub Actions for data validation
- [ ] Integrate with database for real-time sync

See `GITHUB_DEPLOYMENT.md` for full documentation.
