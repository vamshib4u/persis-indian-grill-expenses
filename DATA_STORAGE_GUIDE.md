# Data Storage & Troubleshooting Guide

## Where Your Data is Saved

### Browser localStorage

All data is stored in your **browser's localStorage** - NOT on a server. This means:
- Data persists even when you close the browser
- Data is stored locally on your computer
- No internet connection needed to access data

### How to View Your Data

#### Method 1: Browser Developer Tools (Recommended)

1. **Open your browser** (Chrome, Firefox, Safari, Edge)
2. **Open Developer Tools**:
   - Windows/Linux: Press `F12` or `Ctrl + Shift + I`
   - Mac: Press `Cmd + Option + I`

3. **Navigate to Application Tab**:
   - Click the **Application** tab (or "Storage" in Firefox)
   - In the left sidebar, expand **Local Storage**
   - Select **http://localhost:3000**

4. **View Your Data**:
   You'll see three keys:
   - `persis_sales_data` - Contains all daily sales records
   - `persis_expenses_data` - Contains all expense records
   - `persis_payouts_data` - Contains all payout records

5. **Click on each key** to see the data in JSON format

#### Method 2: Console Command (Advanced)

1. Open Developer Tools (`F12`)
2. Click the **Console** tab
3. Type these commands to view data:

```javascript
// View all sales
JSON.parse(localStorage.getItem('persis_sales_data'))

// View all expenses
JSON.parse(localStorage.getItem('persis_expenses_data'))

// View all payouts
JSON.parse(localStorage.getItem('persis_payouts_data'))

// Clear all data (WARNING: This will delete everything)
localStorage.clear()
```

---

## Date Issue - FIXED ✅

### The Problem
Dates were being saved with timezone offset issues. For example:
- You enter: **January 15, 2024**
- It was saving as: **January 14, 2024** (off by 1 day)

### The Solution
Updated all forms to properly parse dates:
- **Before**: `new Date(formData.date)` → UTC conversion caused offset
- **After**: Manually parse `YYYY-MM-DD` → `new Date(year, month-1, day)` → Correct local date

### Files Fixed
- ✅ `src/components/SalesForm.tsx`
- ✅ `src/components/ExpenseForm.tsx`
- ✅ `src/components/PayoutForm.tsx`

### Test the Fix

1. **Clear old data** (with wrong dates):
   - Open Developer Tools (F12)
   - Go to Application → Local Storage
   - Delete `persis_sales_data`, `persis_expenses_data`, `persis_payouts_data`
   - Refresh the page

2. **Add new data**:
   - Go to Sales page
   - Click "Record Sale"
   - Enter date: **January 15, 2024**
   - Enter amounts and save

3. **Verify the date**:
   - Open Developer Tools (F12)
   - Check Application → Local Storage → persis_sales_data
   - Should show: `"date":"2024-01-15T00:00:00.000Z"`
   - Display will show: **Jan 15** ✅

---

## Data Structure

### Sales Data
```json
{
  "id": "1705246799999-abc123",
  "date": "2024-01-15T00:00:00.000Z",
  "squareSales": 500,
  "cashCollected": 150,
  "notes": "Monday sales",
  "createdAt": "2024-01-12T10:30:00.000Z"
}
```

### Expenses Data
```json
{
  "id": "1705246799999-def456",
  "date": "2024-01-15T00:00:00.000Z",
  "category": "Supplies",
  "amount": 75.50,
  "description": "Office supplies",
  "paymentMethod": "cash",
  "notes": "From vendor",
  "createdAt": "2024-01-12T10:30:00.000Z"
}
```

### Payouts Data
```json
{
  "id": "1705246799999-ghi789",
  "date": "2024-01-15T00:00:00.000Z",
  "amount": 500,
  "payeeName": "John Employee",
  "purpose": "Weekly salary",
  "notes": "Regular payment",
  "createdAt": "2024-01-12T10:30:00.000Z"
}
```

---

## Backing Up Your Data

### Export Manually

1. **Open Developer Tools** (F12)
2. **Go to Application → Local Storage**
3. **Right-click on data key** → Copy value
4. **Paste into a text file** → Save as backup

### Export as JSON

Copy & paste in Console:
```javascript
// Save all data to file
const allData = {
  sales: JSON.parse(localStorage.getItem('persis_sales_data') || '[]'),
  expenses: JSON.parse(localStorage.getItem('persis_expenses_data') || '[]'),
  payouts: JSON.parse(localStorage.getItem('persis_payouts_data') || '[]'),
  exportDate: new Date().toISOString()
};
console.log(JSON.stringify(allData, null, 2));
```

### Enable Google Sheets Backup

1. Create `.env.local` file
2. Add your Google Sheets credentials:
   ```
   NEXT_PUBLIC_GOOGLE_SHEET_ID=your_sheet_id
   NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key
   ```
3. Use sync functions in `src/lib/googleSheets.ts`

---

## Common Issues

### Data disappeared after clearing cache
**Solution**: Always export data before clearing browser cache. This is permanent data loss if not backed up.

### Dates still showing wrong
**Solution**: 
1. Clear old data from localStorage
2. Reload page
3. Add new records
4. Test with new dates

### Can't find localStorage data
**Possible reasons**:
- Using **Private/Incognito mode** (data not persisted)
- **Browsing different domain** (data isolated per domain)
- **Different browser** (each browser has separate storage)

**Fix**:
- Use normal browsing mode
- Make sure you're on `localhost:3000` or same domain
- Use same browser

### Need to migrate data to server
When ready to add database:

1. **Export all data from localStorage** (using console commands above)
2. **Save as JSON file**
3. **API endpoint ready** at `/api/sales`, `/api/expenses`, `/api/payouts`
4. **Update `src/lib/storage.ts`** to call API instead of localStorage

---

## Storage Limits

### How Much Can You Store?
- **localStorage limit**: ~5-10MB per domain
- **Rough estimate**: ~1000 transactions per category = ~1MB
- **Your app**: Plenty of space for years of data

### When to Archive
- Store > 5000 transactions
- Export old data to Google Sheets or file
- Delete old records from localStorage

---

## Data Privacy

Your data:
- ✅ **Stays on your computer** (not sent to servers)
- ✅ **Only you can access** (isolated to your browser)
- ✅ **Survives browser restarts** (persistent storage)
- ✅ **Lost if cache cleared** (unless backed up)

**Recommendation**: 
- Regular exports to Google Sheets
- Backup files locally
- Use cloud storage for important backups

---

## Troubleshooting Steps

### If dates are still wrong:

1. **Stop the dev server**: `Ctrl + C`
2. **Clear browser cache**:
   - Open DevTools → Application
   - Storage → Clear site data
3. **Clean Next.js cache**:
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```
4. **Test with new data**: Add a sale and verify date

### If data is not saving:

1. **Check localStorage is enabled**:
   ```javascript
   // In console:
   localStorage.setItem('test', 'value');
   localStorage.getItem('test'); // Should return 'value'
   ```

2. **Check browser console for errors** (`F12` → Console tab)

3. **Verify Private Mode is OFF** (data won't persist in Private Mode)

---

## Support

For questions about your data, see:
- README.md - Data management section
- SETUP_COMPLETE.md - Detailed documentation
- Browser DevTools documentation for your browser

**Last Updated**: January 12, 2026
