# Persis Grill Expense Tracker - Complete Setup Guide

## Current Status: ✅ Ready to Deploy

Your app is fully functional with data backup to GitHub. Here's what's working:

### Features Implemented

#### 1. **Data Entry**
- ✅ Record daily sales (Square sales + Cash collected)
- ✅ Track expenses and payouts
- ✅ Add notes and categorize transactions
- ✅ Monthly view with navigation

#### 2. **Data Export**
- ✅ **CSV Export** - Download as spreadsheet (Sales, Expenses, Payouts, All Data)
- ✅ **JSON Export** - Complete backup format
- ✅ **Files download to your computer's Downloads folder**

#### 3. **Cloud Backup (GitHub)**
- ✅ **"Save to GitHub" button** - One-click backup
- ✅ Data saves as JSON to GitHub repository
- ✅ Files organized by date: `data/2026-01-Jan.json`
- ✅ Files stored in separate `data` branch (keeps code clean)

#### 4. **Deployment Ready**
- ✅ Code on GitHub: https://github.com/vamshib4u/persis-indian-grill-expenses
- ✅ Ready to deploy to Vercel or GitHub Pages
- ✅ Environment configuration ready

---

## 🚀 Deploy in 3 Steps

### Step 1: Create GitHub Token
Go to: https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Name: `persis-grill-backup`
- Scopes: `repo` + `workflow`
- Copy token

### Step 2: Update .env.local
Add to `.env.local`:
```
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO=vamshib4u/persis-indian-grill-expenses
GITHUB_BRANCH=data
```

### Step 3: Deploy (Choose One)

**Option A: Vercel (Easiest - Recommended)**
1. Go to https://vercel.com/import/git
2. Select your repo
3. Add env variables from Step 2
4. Click Deploy
5. Live at: `https://persis-grill.vercel.app`

**Option B: GitHub Pages**
1. Run: `git checkout -b data && git push -u origin data && git checkout main`
2. Update `next.config.ts` with `output: 'export'`
3. Add `.github/workflows/deploy.yml` (see GITHUB_DEPLOYMENT.md)
4. Push to GitHub
5. Live at: `https://vamshib4u.github.io/persis-indian-grill-expenses`

---

## 📋 How to Use

### Local Development
```bash
npm run dev
# Open: http://localhost:3000
```

### Record Data
1. Go to **Sales** page
2. Click **"Record Sale"** button
3. Enter: Square sales, Cash collected, Notes
4. Data saves to browser (localStorage)

### Export Data
- **CSV**: Click "Sales CSV" → Downloads spreadsheet
- **JSON**: Click "All Data JSON" → Downloads backup
- **GitHub**: Click "Save to GitHub" → Backs up to repo

### View Backed Up Data
- Visit: https://github.com/vamshib4u/persis-indian-grill-expenses/tree/data/data
- See all your monthly data files
- Each file is a complete snapshot

---

## 📁 Project Structure

```
persis-indian-grill-expenses/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── save-to-github/       ← GitHub backup endpoint
│   │   │   ├── sync-sheets/          ← Google Sheets endpoint
│   │   │   └── sales/                ← API endpoints
│   │   ├── sales/page.tsx            ← Sales page
│   │   ├── expenses/page.tsx         ← Expenses page
│   │   ├── payouts/page.tsx          ← Payouts page
│   │   └── dashboard/page.tsx        ← Dashboard
│   ├── components/
│   │   ├── ExportButtons.tsx         ← CSV/JSON/GitHub export
│   │   ├── SalesForm.tsx
│   │   ├── ExpenseForm.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── utils.ts                  ← Export functions
│   │   ├── storage.ts                ← localStorage
│   │   └── googleSheets.ts
│   └── types/
│       └── index.ts                  ← TypeScript types
├── .env.local                        ← Your secrets (not committed)
├── .env.example                      ← Template
├── QUICK_DEPLOY.md                   ← Deploy in 3 steps
├── GITHUB_DEPLOYMENT.md              ← Full guide
├── IMPORT_JSON_TO_SHEETS.md          ← Google Sheets import
└── package.json
```

---

## 🔐 Security & Privacy

- **Data stored locally**: Uses browser localStorage (only on your device)
- **GitHub backup**: Uses Personal Access Token (never shared)
- **.env.local is NOT committed** to git (listed in .gitignore)
- **No sensitive data** in git repository

---

## 🛠 Troubleshooting

### "GitHub not configured" error
→ Add GITHUB_TOKEN and GITHUB_REPO to .env.local

### Token invalid when saving
→ Check https://github.com/settings/tokens - token may have expired

### Data not appearing on GitHub
→ Check if `data` branch exists: `git push -u origin data`

### App not loading after deploy
→ Clear browser cache: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## 📞 Next Steps

1. ✅ **Create GitHub Token** - Takes 2 minutes
2. ✅ **Update .env.local** - Copy 3 lines
3. ✅ **Test locally** - Run `npm run dev` and click "Save to GitHub"
4. ✅ **Deploy to Vercel** - Paste repo URL and env vars
5. ✅ **Share URL** - Your app is live!

---

## 📖 Documentation Files

- **QUICK_DEPLOY.md** - 3-step deployment
- **GITHUB_DEPLOYMENT.md** - Complete setup guide
- **IMPORT_JSON_TO_SHEETS.md** - Google Sheets integration
- **QUICK_START_DEPLOYMENT.md** - Initial setup
- **README.md** - Project overview

---

## 🎯 Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| Data Entry | ✅ Working | Sales, expenses, payouts |
| Local Storage | ✅ Working | Persists in browser |
| CSV Export | ✅ Working | Download to computer |
| JSON Export | ✅ Working | Backup format |
| GitHub Save | ✅ Working | Click button to backup |
| GitHub Deploy | ✅ Ready | Add token and deploy |
| Vercel Deploy | ✅ Ready | Use Vercel dashboard |
| Google Sheets | ⏳ Optional | Can import manually |
| Real-time sync | 🔄 Future | Database + WebSocket |
| Multi-user | 🔄 Future | Authentication required |

---

## Contact & Support

Your repository: https://github.com/vamshib4u/persis-indian-grill-expenses

Questions? Check the documentation files or create a GitHub issue.

---

**Last Updated:** January 12, 2026
**Version:** 1.0.0 - Production Ready
