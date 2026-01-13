# How to Use Downloads & Import to Google Sheets

## Part 1: Download Your Data as JSON

1. Go to **Sales** page or **Transactions** page
2. Click any download button:
   - **Sales** - Download daily sales data
   - **Expenses** - Download expense records
   - **Payouts** - Download payout records
   - **All Data** - Download everything
3. File saves to your **Downloads** folder as `persis-[type]-[Month Year].json`

Example: `persis-sales-Jan 2026.json`

---

## Part 2: Import JSON to Google Sheets (Manual Method)

### Option A: Using Google Sheets Native Import
1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1NZlsd6of_V8rDOoQyGuTJOHxeIVp2b3dZ3gzotf0v7M/edit
2. Click **File** → **Import**
3. Choose **Upload** tab
4. Select your downloaded JSON file
5. Choose import location (new sheet or replace existing)
6. Click **Import**

### Option B: Convert JSON to CSV (Better Compatibility)

If you need CSV format instead:

1. **Download the JSON** from the app
2. **Visit an online converter**: https://www.convertjson.com/json-to-csv.htm
3. Paste the JSON content
4. Click "Convert to CSV"
5. Copy the CSV data
6. In Google Sheets:
   - Go to your sheet
   - Click a cell where you want data
   - **Paste Special** → **Paste values only**

### Option C: Manual Copy-Paste (Simplest)

1. **Download JSON** from app
2. **Open the JSON file** in a text editor
3. **Copy the data** (or view the formatted data)
4. In Google Sheets:
   - Select columns for: Date, Amount, Category, etc.
   - **Paste** the data

---

## Part 3: Automatic Google Sheets Sync (Future Feature)

Currently, the **"Google Sheets"** button shows:

### Quick Client-side OAuth (new)

You can now connect directly from the app using your **Google OAuth Client ID**. This performs a user-authorized connection (access token) and lets you save or load the current month data directly to/from the configured Google Sheet.

Steps:

1. In the Google Cloud Console, create an **OAuth 2.0 Client ID** (Application type: Web application).
2. Add your app origin to *Authorized JavaScript origins* (e.g., `http://localhost:3000` for local development and your deployment URL for production).
3. Add the following environment variables to your deployment or `.env.local`:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = *your client id*
   - `NEXT_PUBLIC_GOOGLE_SHEET_ID` = *your spreadsheet id (optional if already set)*
4. Restart the dev server and open the app. In **Export → Google Sheets (Direct)** click **Connect Google**, then **Save to Sheets** or **Load from Sheets**.

Notes:

- This client-side flow uses an **access token** (short-lived). If you want persistent server-side access with refresh tokens, see the advanced server-side OAuth section in `DEPLOYMENT_GUIDE.md`.
- The app writes to these tabs: `Sales`, `Expenses`, `Payouts`, and `Summary`. Ensure those sheets exist (the app will overwrite the ranges `A1` onward).

- ✅ Button is functional
- ✅ API endpoint is ready
- ⏳ Waiting for OAuth configuration

**To enable automatic sync in the future**, you'll need to:
1. Set up Google OAuth 2.0 credentials
2. Add credentials to `.env.local`
3. Configure the sync endpoint

For now, use the download + manual import method above.

---

## Quick Checklist

- ✅ Downloaded JSON from Sales/Transactions page
- ✅ Your Google Sheet is ready: https://docs.google.com/spreadsheets/d/1NZlsd6of_V8rDOoQyGuTJOHxeIVp2b3dZ3gzotf0v7M/edit
- ✅ Import JSON using File → Import or convert to CSV
- ✅ Data backed up in Google Sheets

---

## Troubleshooting

**Can't see download buttons?**
- Hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)

**JSON file won't import?**
- Try CSV conversion method above
- Or paste data manually

**Google Sheets button not working?**
- It's not yet configured for automatic sync
- Use manual import for now

