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

