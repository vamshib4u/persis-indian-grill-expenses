# Quick Start: Deployment & Data Backup Setup

This guide will help you deploy your Persis Indian Grill Expenses app to GitHub and set up Google Sheets backup.

## Step 1: Push to GitHub (5 minutes)

```bash
# Navigate to your project
cd /Users/vamshidharkurapati/dev/persis-indian-grill-expenses

# Go to https://github.com/new and create a repository named:
# "persis-indian-grill-expenses" (Private recommended)

# Set up remote and push
git remote add origin https://github.com/YOUR_USERNAME/persis-indian-grill-expenses.git
git branch -M main
git push -u origin main
```

**Result:** Your code is now backed up on GitHub and version controlled.

---

## Step 2: Set Up Google Sheets for Data Backup (10 minutes)

### Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click **"+"** to create a new spreadsheet
3. Name it: `Persis Expenses Backup`
4. Create 4 tabs:
   - **Sales**
   - **Expenses**
   - **Payouts**
   - **Summary**

### Copy the Sheet ID

The URL looks like: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

Copy the `SHEET_ID_HERE` part.

### Enable Export Buttons

1. In your Next.js app, go to **Sales**, **Transactions**, or **Dashboard** pages
2. You'll see blue "Download Data" buttons (Sales, Expenses, Payouts, All Data)
3. Click any button to download JSON backup of your data

### Manual Google Sheets Entry

For now, you can:
1. Click **"Download All Data"** → Opens `persis-all-data-[Month].json`
2. Copy the formatted data from the JSON into your Google Sheet tabs
3. Or click **"Google Sheets"** button → Opens the sheet directly

---

## Step 3: Optional - Deploy to Vercel (5 minutes)

### Deploy the App Live

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Skip environment variables for now (local only)
5. Click **Deploy**

Your app will be live at a URL like: `https://persis-expenses-YOUR-NAME.vercel.app`

---

## Step 4: Configure Google Sheets API (Optional - Advanced)

For **automatic** sync to Google Sheets, see `DEPLOYMENT_GUIDE.md` for:
- Creating a Google Cloud project
- Setting up OAuth 2.0 credentials
- Configuring environment variables

---

## What You Can Do Now

✅ **Locally:**
- Record sales, expenses, and payouts
- View monthly analytics
- Download data as JSON
- Browse git history

✅ **With GitHub:**
- Backup code
- Track changes
- Collaborate with team
- Access code anywhere

✅ **With Google Sheets:**
- Manual data backup
- Share reports with team
- Create pivot tables and charts
- Archive historical data

---

## File Locations

- **Export buttons on pages:**
  - `/sales` - Download sales data
  - `/transactions` - Download expenses & payouts
  - `/dashboard` - View monthly analytics

- **Downloaded files go to:**
  - Your computer's Downloads folder
  - Named: `persis-sales-[Month].json`, etc.

- **GitHub repository:**
  - `https://github.com/YOUR_USERNAME/persis-indian-grill-expenses`
  - Code, docs, history all backed up

- **Google Sheet:**
  - `https://docs.google.com/spreadsheets/d/SHEET_ID`
  - Create tabs and manually paste data

---

## Troubleshooting

**Q: "Google Sheets button gives an error"**
- A: The Google Sheets API isn't configured yet. Download JSON and paste manually, or see DEPLOYMENT_GUIDE.md for OAuth setup.

**Q: "Can't see export buttons"**
- A: They're below the month selector on Sales, Transactions, and Dashboard pages.

**Q: "Downloaded file is empty"**
- A: Make sure you have data recorded for that month first.

**Q: "Can't push to GitHub"**
- A: Run `git remote -v` to verify remote is set. If not set, run the command from Step 1.

---

## Next Steps

1. **Today:** Set up GitHub repo
2. **This Week:** Start using export buttons to backup data
3. **Optional:** Deploy to Vercel for live app
4. **Future:** Enable automatic Google Sheets sync (see DEPLOYMENT_GUIDE.md)

---

## Need Help?

- **GitHub issues:** Create an issue in your repository
- **Documentation:** Check `DEPLOYMENT_GUIDE.md` and `DATA_STORAGE_GUIDE.md`
- **Code:** All components are in `src/` folder with comments

Happy tracking! 📊
