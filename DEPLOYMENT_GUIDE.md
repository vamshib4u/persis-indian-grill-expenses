# Deployment Guide

This guide covers deploying to GitHub and setting up Google Sheets integration for data backup.

## Part 1: GitHub Deployment

### Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named `persis-indian-grill-expenses`
3. Choose **Private** if this is sensitive business data
4. Do NOT initialize with README (we already have one)
5. Click "Create repository"

### Step 2: Push Your Code to GitHub

```bash
cd /Users/vamshidharkurapati/dev/persis-indian-grill-expenses

# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/persis-indian-grill-expenses.git

# Rename branch to main if needed (check current branch with: git branch)
git branch -M main

# Stage and commit all changes
git add .
git commit -m "Initial commit: Add unified transaction system and deployment setup"

# Push to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: GitHub Configuration

- **Branch Protection** (Optional): Go to Settings → Branches → Add protection rule
  - Require pull request reviews before merging
  - Require status checks to pass
  
- **Secrets Management**: Go to Settings → Secrets and variables → Actions
  - Add any sensitive environment variables here for CI/CD pipelines

---

## Part 2: Google Sheets Integration

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "NEW PROJECT"
3. Name: `Persis Indian Grill Expenses`
4. Click "Create"

### Step 2: Enable Google Sheets API

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "ENABLE"

### Step 3: Create Service Account (Recommended for Backend/Automated Syncs)

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in:
   - Service account name: `persis-app`
   - Service account ID: (auto-filled)
   - Click "Create and Continue"
4. Grant roles (optional): `Editor` or `Viewer` (can skip for now)
5. Click "Continue" → "Done"
6. Click on the service account you just created
7. Go to "Keys" tab
8. Click "Add Key" → "Create new key"
9. Choose JSON format
10. Click "Create" - this downloads your `credentials.json` file
11. **IMPORTANT**: Never commit this file to GitHub. It's in `.gitignore` already.

### Step 4: Create a Google Sheet for Data Backup

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "+" to create a new spreadsheet
3. Name it: `Persis Expenses Backup` (or similar)
4. Create tabs/sheets:
   - `Sales` - for daily sales data
   - `Expenses` - for expense transactions
   - `Payouts` - for payout transactions
   - `Summary` - for monthly summaries

Add headers to each sheet:
- **Sales**: Date | Square Sales | Cash Collected | Total | Notes | Cash Holders (JSON)
- **Expenses**: Date | Category | Description | Amount | Payment Method | Spent By | Notes
- **Payouts**: Date | Payee Name | Purpose | Amount | Payment Method | Notes
- **Summary**: Month | Total Sales | Total Expenses | Total Payouts | Net Profit

5. Click "Share" and add the service account email (from the credentials.json)
   - Give it "Editor" access

### Step 5: Set Up Environment Variables

Create a `.env.local` file in your project root (this file should NOT be committed):

```env
# Google Sheets Configuration
NEXT_PUBLIC_GOOGLE_SHEET_ID=your_spreadsheet_id_here
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here

# For service account (if using server-side sync)
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

To get your Spreadsheet ID:
- Open your Google Sheet
- The ID is in the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
- Copy the `SPREADSHEET_ID` part

### Step 6: Export Your Data

The app already has export functions. To manually sync data to Google Sheets:

1. Go to the app's Dashboard
2. Look for "Export" buttons (UI integration pending)
3. Or use the built-in functions from `src/lib/utils.ts`:
   - `exportSalesToJSON(sales)`
   - `exportTransactionsToJSON(transactions, type)`
   - `generateMonthlyReport(sales, transactions, month, year)`

---

## Part 3: Deployment Hosting Options

### Option A: Vercel (Recommended for Next.js)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select your `persis-indian-grill-expenses` repository
5. Configure environment variables:
   - Add `NEXT_PUBLIC_GOOGLE_SHEET_ID`
   - Add `NEXT_PUBLIC_GOOGLE_API_KEY`
   - Add `GOOGLE_APPLICATION_CREDENTIALS` if using service account
6. Click "Deploy"

Your app will be live at `https://persis-expenses.vercel.app` (or similar)

### Option B: GitHub Pages (Static Export - Limited)

1. Update `next.config.ts` to enable static export
2. Configure GitHub Actions for CI/CD
3. GitHub Pages limited functionality for this app (it's a dynamic app)

### Option C: Self-Hosted (AWS, DigitalOcean, Railway, etc.)

Build and deploy:
```bash
npm run build
npm start
```

---

## Part 4: Automated Data Backups (Optional)

To automatically sync data to Google Sheets daily:

1. Use GitHub Actions (free with public repo, limited with private)
2. Or use a cron job service like [EasyCron](https://www.easycron.com/)
3. Or integrate a scheduled function in your deployment platform

### GitHub Actions Example

Create `.github/workflows/backup.yml`:

```yaml
name: Daily Data Backup

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run backup
        env:
          GOOGLE_SHEET_ID: ${{ secrets.GOOGLE_SHEET_ID }}
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
```

---

## Security Checklist

- [ ] Never commit `.env` files or `credentials.json`
- [ ] Use GitHub Secrets for sensitive environment variables
- [ ] Set repository to Private if containing sensitive business data
- [ ] Regularly rotate Google API keys
- [ ] Use service accounts instead of personal Google accounts
- [ ] Review `.gitignore` before each commit
- [ ] Enable two-factor authentication on GitHub
- [ ] Don't expose API keys in client-side code (use backend only)

---

## Troubleshooting

### "Google Sheets API not enabled"
- Go to Cloud Console → APIs & Services → Library
- Search "Google Sheets API" and click Enable

### "Invalid credentials"
- Check your `credentials.json` file exists
- Verify service account has access to the spreadsheet
- Ensure you've shared the sheet with the service account email

### "Spreadsheet not found"
- Double-check the Spreadsheet ID
- Ensure your account has access to the sheet
- Try using the full share URL instead

---

## Next Steps

1. Create GitHub repository
2. Push code to GitHub
3. Set up Google Cloud project and credentials
4. Configure Google Sheet for backups
5. Deploy to Vercel or your hosting platform
6. Monitor data sync and backups
