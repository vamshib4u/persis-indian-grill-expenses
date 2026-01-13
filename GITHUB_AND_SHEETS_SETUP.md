# GitHub & Google Sheets - Commands & URLs

## Step 1: Create GitHub Repository (5 min)

### Go to GitHub
```
https://github.com/new
```

### Fill in Form
- **Repository name:** `persis-indian-grill-expenses`
- **Description:** Revenue tracking app for Persis Indian Grill
- **Visibility:** Private (recommended for business data)
- **Skip:** "Initialize with README" (we have one)
- **Click:** Create repository

### Get Your Remote URL
After creating, GitHub shows you commands. Copy the HTTPS URL:
```
https://github.com/YOUR_USERNAME/persis-indian-grill-expenses.git
```

---

## Step 2: Push Code to GitHub (1 min)

Run these commands in terminal:

```bash
cd /Users/vamshidharkurapati/dev/persis-indian-grill-expenses

# Add the remote (replace with your URL from Step 1)
git remote add origin https://github.com/YOUR_USERNAME/persis-indian-grill-expenses.git

# Ensure we're on main branch
git branch -M main

# Push all commits
git push -u origin main
```

**Result:** All your code is now on GitHub! ✅

---

## Step 3: Create Google Sheet (2 min)

### Create Sheet
```
https://docs.google.com/spreadsheets/
```

1. Click **"+" (Create)**
2. Name it: **Persis Expenses Backup**
3. In the sheet, create 4 tabs at the bottom:
   - Right-click tab "Sheet1" → Rename to **Sales**
   - **"+"** to add sheet → Name: **Expenses**
   - **"+"** to add sheet → Name: **Payouts**
   - **"+"** to add sheet → Name: **Summary**

### Copy Your Sheet ID
Your URL looks like:
```
https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/edit
```

Copy the long ID part (all the X's) and save it.

---

## Step 4: Optional - Deploy to Vercel (5 min)

### Go to Vercel
```
https://vercel.com
```

1. Click **"Sign up"** (or login if you have account)
2. Sign in with GitHub
3. Click **"New Project"**
4. Find and select: `persis-indian-grill-expenses`
5. Click **Import**
6. Skip environment variables (we'll use local storage)
7. Click **Deploy**

**Result:** App live at URL like: `https://persis-expenses-yourname.vercel.app` ✅

Every time you push to GitHub, Vercel auto-deploys!

---

## Using the Export Features

### Download Data Locally

#### From Sales Page
```
https://localhost:3000/sales
```
- Select month
- Click blue **"Download Sales"** button
- JSON file saves to Downloads folder

#### From Transactions Page
```
https://localhost:3000/transactions
```
- Select month
- Click:
  - **"Download Expenses"** for expense data
  - **"Download Payouts"** for payout data
  - **"Download All Data"** for both

#### Files Downloaded
- `persis-sales-Jan 2026.json`
- `persis-expenses-Jan 2026.json`
- `persis-payouts-Jan 2026.json`
- `persis-all-data-Jan 2026.json`

### View in Google Sheets

1. Open your JSON file with text editor (or online JSON viewer)
2. Copy the data
3. Open your Google Sheet
4. Paste into appropriate tab (Sales, Expenses, or Payouts)

Or click **"Google Sheets"** button in app:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID
```

---

## Your Next Steps (Checklist)

### This Hour
- [ ] Create GitHub repo (https://github.com/new)
- [ ] Get HTTPS URL from GitHub
- [ ] Run git push command above
- [ ] Verify: Go to `https://github.com/YOUR_USERNAME/persis-indian-grill-expenses`

### Today
- [ ] Create Google Sheet (https://sheets.google.com)
- [ ] Create 4 tabs (Sales, Expenses, Payouts, Summary)
- [ ] Save Sheet ID somewhere safe

### Optional This Week
- [ ] Deploy to Vercel (https://vercel.com)
- [ ] Share Vercel URL with team
- [ ] Download some test data and paste into Google Sheet

---

## Important URLs for Future Reference

| What | URL |
|------|-----|
| Your GitHub Repo | `https://github.com/YOUR_USERNAME/persis-indian-grill-expenses` |
| Your Google Sheet | `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID` |
| Local App (Dev) | `http://localhost:3000` |
| Local Sales | `http://localhost:3000/sales` |
| Local Transactions | `http://localhost:3000/transactions` |
| Local Dashboard | `http://localhost:3000/dashboard` |
| Vercel App (After Deploy) | `https://persis-expenses-yourname.vercel.app` |
| GitHub Settings | `https://github.com/YOUR_USERNAME/persis-indian-grill-expenses/settings` |

---

## Common Commands

### See Your Commits
```bash
git log --oneline
```

### See What Changed
```bash
git status
```

### Pull Latest Changes (if editing on other computer)
```bash
git pull origin main
```

### Make a New Commit After Changes
```bash
git add .
git commit -m "Your message here"
git push
```

### Build for Production
```bash
npm run build
npm start
```

---

## Troubleshooting

### Can't push to GitHub
```bash
# Check remote is correct
git remote -v

# Should show:
# origin  https://github.com/YOUR_USERNAME/persis-indian-grill-expenses.git

# If not, fix it:
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/persis-indian-grill-expenses.git
git push -u origin main
```

### Forgot GitHub username
```bash
# Go to https://github.com/settings/profile
# Your username is at top of page
```

### Sheet ID not found
```bash
# Open your sheet in browser
# Copy everything after /d/ and before /edit
# https://docs.google.com/spreadsheets/d/[COPY_THIS]/edit
```

### Vercel deployment failed
- Check: Did you push to GitHub first?
- Check: Is your build succeeding locally? (`npm run build`)
- Check: Is main branch selected in Vercel settings?

---

## Sharing with Team

### Share GitHub Repo
1. Go to `https://github.com/YOUR_USERNAME/persis-indian-grill-expenses`
2. Click **Settings** → **Collaborators** → **Add people**
3. Share URL: `https://github.com/YOUR_USERNAME/persis-indian-grill-expenses`

### Share Google Sheet
1. Open your sheet
2. Click **Share** (top right)
3. Add email addresses
4. Click **Share**

### Share Live App (if Vercel)
1. Send URL: `https://persis-expenses-yourname.vercel.app`
2. Anyone can view/edit if Vercel allows

---

## Security Reminders

✅ **Already Protected:**
- ✅ `.gitignore` prevents uploading secrets
- ✅ No API keys in code
- ✅ No credentials in localStorage

⚠️ **Keep Safe:**
- 🔐 Never share `credentials.json` file
- 🔐 Keep `.env.local` on your computer only
- 🔐 Don't paste API keys in code
- 🔐 Use GitHub Secrets for production keys

---

## Next Update: Automatic Sync

When ready for automatic Google Sheets sync:
1. See `DEPLOYMENT_GUIDE.md` for OAuth setup
2. Get Google Cloud credentials
3. Set environment variables
4. Click "Google Sheets" button to auto-sync
5. No more manual copy-paste needed!

---

**Created:** January 12, 2026
**For:** Persis Indian Grill Expenses App v1.0
