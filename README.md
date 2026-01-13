# Persis Indian Grill - Revenue Management App

A comprehensive web application for managing monthly revenue, expenses, and cash payouts with local storage and optional Google Sheets integration. Built with modern technologies including Next.js 14, TypeScript, and Tailwind CSS.

**Live Demo**: http://localhost:3000

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [API Endpoints](#api-endpoints)
- [Google Sheets Integration](#google-sheets-integration)
- [Data Management](#data-management)
- [Development](#development)
- [Building & Deployment](#building--deployment)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)

---

## ✨ Features

### Core Functionality

- **Daily Sales Tracking** 
  - Record Square sales transactions
  - Track unreported cash collections
  - Add notes and descriptions
  - Date-based organization

- **Comprehensive Expense Management**
  - 9 predefined expense categories (Supplies, Utilities, Rent, Labor, Equipment, Maintenance, Marketing, Insurance, Other)
  - Multiple payment methods (Cash, Card, Bank Transfer)
  - Detailed descriptions and notes
  - Full transaction history

- **Cash Payout Management**
  - Track payee names and payment purposes
  - Record individual payout amounts
  - Organize by date
  - Add transaction notes

- **Monthly Financial Dashboard**
  - Real-time income and expense calculations
  - Navigate between months
  - Income breakdown (Square vs. Cash)
  - Expense and payout summaries
  - Net cash flow analysis

- **Data Persistence**
  - Browser localStorage for permanent data storage
  - No server required for basic operation
  - Automatic data backup to localStorage

- **Responsive User Interface**
  - Mobile-friendly design
  - Desktop optimized layout
  - Intuitive navigation
  - Real-time form validation
  - User feedback notifications

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|---------------|
| **Frontend Framework** | Next.js 14, React 18 |
| **Language** | TypeScript 5+ |
| **Styling** | Tailwind CSS 3, PostCSS |
| **State Management** | React Hooks, localStorage |
| **UI Components** | Custom React components, Lucide Icons |
| **Notifications** | react-hot-toast |
| **API Calls** | Axios |
| **Date Handling** | date-fns |
| **Code Quality** | ESLint, TypeScript strict mode |
| **Build Tool** | Turbopack (Next.js 16) |
| **Deployment** | Vercel optimized |

---

## 📁 Project Structure

```
persis-indian-grill-expenses/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── sales/route.ts           # Sales API endpoints
│   │   │   ├── expenses/route.ts        # Expenses API endpoints
│   │   │   └── payouts/route.ts         # Payouts API endpoints
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Monthly financial dashboard
│   │   ├── sales/
│   │   │   └── page.tsx                 # Daily sales management page
│   │   ├── expenses/
│   │   │   └── page.tsx                 # Expense tracking page
│   │   ├── payouts/
│   │   │   └── page.tsx                 # Payout management page
│   │   ├── layout.tsx                   # Root layout with navigation
│   │   ├── page.tsx                     # Landing/home page
│   │   └── globals.css                  # Global styles
│   ├── components/
│   │   ├── Navigation.tsx               # Top navigation bar
│   │   ├── SalesForm.tsx                # Sales data input form
│   │   ├── SalesList.tsx                # Sales records display table
│   │   ├── ExpenseForm.tsx              # Expense input form
│   │   ├── ExpensesList.tsx             # Expenses display table
│   │   ├── PayoutForm.tsx               # Payout input form
│   │   └── PayoutsList.tsx              # Payouts display table
│   ├── lib/
│   │   ├── storage.ts                   # localStorage CRUD operations
│   │   ├── utils.ts                     # Utility functions (format, export)
│   │   └── googleSheets.ts              # Google Sheets API integration
│   └── types/
│       └── index.ts                     # TypeScript interfaces & types
├── public/
│   └── data/                            # Static data files
├── .env.example                         # Environment variables template
├── .eslintrc.json                       # ESLint configuration
├── tsconfig.json                        # TypeScript configuration
├── next.config.ts                       # Next.js configuration
├── tailwind.config.ts                   # Tailwind CSS configuration
├── postcss.config.mjs                   # PostCSS configuration
├── package.json                         # Project dependencies
├── package-lock.json                    # Locked dependency versions
├── SETUP_COMPLETE.md                    # Setup documentation
└── README.md                            # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (comes with Node.js)
- **Browser**: Modern browser with localStorage support

### Installation

1. **Navigate to the project directory**:
```bash
cd persis-indian-grill-expenses
```

2. **Install dependencies** (if not already done):
```bash
npm install
```

3. **Set up environment variables** (optional, for Google Sheets integration):
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Google Sheets credentials if you plan to use the sync feature.

### Development Server

Start the development server:

```bash
npm run dev
```

Output:
```
▲ Next.js 16.1.1
- Local:         http://localhost:3000
- Network:       http://192.168.1.138:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application hot-reloads when you make changes.

---

## 📖 Usage Guide

### Navigation

The app has 5 main sections accessible from the top navigation bar:

#### 1. **Home** (/)
- Overview of all features
- Quick access cards to each section
- Feature highlights
- Call-to-action buttons

#### 2. **Dashboard** (/dashboard)
**Purpose**: View monthly financial summary

**Features**:
- Monthly statistics cards (Total Income, Expenses, Payouts, Net Cash)
- Income breakdown (Square vs. Cash)
- Expense and payout breakdown
- Month navigation (Previous/Next buttons)
- Real-time calculations

**How to use**:
1. Click "Dashboard" in navigation
2. View current month statistics
3. Use Previous/Next buttons to view other months
4. See detailed breakdowns in the cards below

#### 3. **Sales** (/sales)
**Purpose**: Track daily sales and cash collections

**Features**:
- Record Square sales amounts
- Track unreported cash collections
- Add optional notes
- View sales history in table format
- Edit/Delete individual sales
- Date-based organization

**How to record a sale**:
1. Click "Sales" in navigation
2. Click "Record Sale" button
3. Fill in the form:
   - Select date
   - Enter Square sales amount
   - Enter cash collected amount
   - Optionally add notes
4. Click "Save Sale"
5. Record appears in the table below

**How to edit a sale**:
1. Click the edit icon (pencil) in the sales table
2. Modify the values in the form
3. Click "Update Sale"

**How to delete a sale**:
1. Click the delete icon (trash) in the sales table
2. Confirm the deletion

#### 4. **Expenses** (/expenses)
**Purpose**: Track and categorize business expenses

**Features**:
- 9 predefined categories
- 3 payment method options
- Track descriptions and notes
- View expense history
- Full edit/delete capabilities

**Available Categories**:
- Supplies
- Utilities
- Rent
- Labor
- Equipment
- Maintenance
- Marketing
- Insurance
- Other

**Payment Methods**:
- Cash
- Card
- Bank Transfer

**How to record an expense**:
1. Click "Expenses" in navigation
2. Click "Add Expense" button
3. Fill in the form:
   - Select date
   - Choose category
   - Enter amount
   - Select payment method
   - Enter description
   - Optionally add notes
4. Click "Save Expense"

#### 5. **Payouts** (/payouts)
**Purpose**: Manage cash disbursements and payouts

**Features**:
- Track payee names
- Record payout purposes
- Organize by date
- Add transaction notes
- Edit/Delete payouts

**How to record a payout**:
1. Click "Payouts" in navigation
2. Click "Record Payout" button
3. Fill in the form:
   - Select date
   - Enter payout amount
   - Enter payee name
   - Enter payout purpose
   - Optionally add notes
4. Click "Save Payout"

---

## 🔌 API Endpoints

The app includes REST API endpoints ready for database integration:

### Sales Endpoints

```http
GET    /api/sales              Retrieve all sales
POST   /api/sales              Create new sale
PUT    /api/sales              Update existing sale
DELETE /api/sales?id=UUID      Delete sale by ID
```

**Request Body (POST/PUT)**:
```json
{
  "date": "2024-01-15",
  "squareSales": 500.00,
  "cashCollected": 150.00,
  "notes": "Monday sales"
}
```

### Expenses Endpoints

```http
GET    /api/expenses              Retrieve all expenses
POST   /api/expenses              Create new expense
PUT    /api/expenses              Update existing expense
DELETE /api/expenses?id=UUID      Delete expense by ID
```

**Request Body (POST/PUT)**:
```json
{
  "date": "2024-01-15",
  "category": "Supplies",
  "amount": 75.50,
  "paymentMethod": "cash",
  "description": "Office supplies",
  "notes": "From local vendor"
}
```

### Payouts Endpoints

```http
GET    /api/payouts              Retrieve all payouts
POST   /api/payouts              Create new payout
PUT    /api/payouts              Update existing payout
DELETE /api/payouts?id=UUID      Delete payout by ID
```

**Request Body (POST/PUT)**:
```json
{
  "date": "2024-01-15",
  "amount": 500.00,
  "payeeName": "John Employee",
  "purpose": "Weekly salary",
  "notes": "Regular payment"
}
```

---

## 🔗 Google Sheets Integration

### Setup Instructions

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google Sheets API
4. Create OAuth 2.0 credentials (API key)

#### Step 2: Configure Environment Variables
1. Copy `.env.example` to `.env.local`
2. Add your credentials:
   ```env
   NEXT_PUBLIC_GOOGLE_SHEET_ID=your_sheet_id_here
   NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here
   ```

#### Step 3: Use the Integration
Functions are ready in `src/lib/googleSheets.ts`:

```typescript
import { syncSalesToSheets } from '@/lib/googleSheets';

// Sync sales to Google Sheets
await syncSalesToSheets(
  salesData,
  spreadsheetId,
  apiKey
);
```

### Available Functions

- `syncSalesToSheets()` - Backup sales data
- `syncExpensesToSheets()` - Backup expenses
- `syncPayoutsToSheets()` - Backup payouts

---

## 💾 Data Management

### How Data is Stored

All data is stored in browser's localStorage under these keys:
- `persis_sales_data` - Daily sales records
- `persis_expenses_data` - Expense records
- `persis_payouts_data` - Payout records

### Storage Operations

**src/lib/storage.ts** provides CRUD operations:

```typescript
// Sales
storage.getSales()           // Get all sales
storage.addSale(sale)        // Add new sale
storage.updateSale(id, updates)  // Update sale
storage.deleteSale(id)       // Delete sale

// Expenses
storage.getExpenses()        // Get all expenses
storage.addExpense(expense)  // Add new expense
storage.updateExpense(id, updates) // Update expense
storage.deleteExpense(id)    // Delete expense

// Payouts
storage.getPayouts()         // Get all payouts
storage.addPayout(payout)    // Add new payout
storage.updatePayout(id, updates)  // Update payout
storage.deletePayout(id)     // Delete payout

// Utility
storage.clearAll()           // Clear all data
```

### Data Export

Utility functions in `src/lib/utils.ts`:

```typescript
// Export as CSV
exportToCSV(salesData, 'sales-2024-01.csv');

// Export as JSON
exportToJSON(
  { sales, expenses, payouts },
  'financial-report-2024-01.json'
);

// Generate monthly report
const report = generateMonthlyReport(
  sales,
  expenses,
  payouts,
  month,
  year
);
```

### Backup Best Practices

1. **Regular Exports**: Export data monthly as backup
2. **Google Sheets**: Enable syncing for cloud backup
3. **Browser Data**: Enable cloud sync in browser settings
4. **Archival**: Keep exported files for historical records

---

## 💻 Development

### Available Commands

```bash
# Development server (hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run TypeScript checks
npm run tsc

# Run ESLint
npm run lint

# Clean build artifacts
rm -rf .next node_modules
npm install
```

### Development Workflow

1. **Make changes** to files in `src/`
2. **Hot reload** automatically updates browser
3. **Check console** for errors/warnings
4. **Use DevTools** to inspect state and localStorage
5. **Test all features** before committing

### TypeScript

The project uses strict TypeScript mode:
- Type-safe code
- Compile-time error checking
- IntelliSense in editor

### Code Style

Uses ESLint for code quality:
- Consistent formatting
- Best practices enforcement
- Automatic fixes available

Run ESLint:
```bash
npm run lint
```

---

## 🏗️ Building & Deployment

### Production Build

```bash
npm run build
```

Output:
```
Route (app)
├ ○ /
├ ○ /dashboard
├ ○ /sales
├ ○ /expenses
├ ○ /payouts
└ ƒ /api/...
```

### Start Production Server

```bash
npm start
```

### Deploy to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "Add New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Set Environment Variables**:
   - Go to project settings
   - Add environment variables:
     - `NEXT_PUBLIC_GOOGLE_SHEET_ID`
     - `NEXT_PUBLIC_GOOGLE_API_KEY`

4. **Deploy**:
   - Click "Deploy"
   - Automatic deployment on future pushes

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t persis-grill .
docker run -p 3000:3000 persis-grill
```

---

## 🔧 Troubleshooting

### Common Issues

#### Data not persisting
**Symptom**: Data disappears after refresh

**Solution**:
1. Check if localStorage is enabled (not in private mode)
2. Try incognito/private window
3. Check browser settings → Privacy
4. Clear cache if corrupted:
   - Open DevTools (F12)
   - Application → Local Storage
   - Clear persis_* entries
   - Refresh page

#### Port 3000 in use
**Error**: `Error: Port 3000 is already in use`

**Solution**:
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### Build errors
**Error**: `Failed to compile`

**Solution**:
```bash
# Clean installation
rm -rf .next node_modules
npm install
npm run build
```

#### Google Sheets sync not working
**Issue**: Cannot sync to Google Sheets

**Solution**:
1. Verify API credentials in `.env.local`
2. Check API is enabled in Google Cloud Console
3. Verify spreadsheet ID is correct
4. Check browser console for specific errors

---

## 🚀 Future Enhancements

### Phase 2: Database Integration
- [ ] PostgreSQL/MongoDB integration
- [ ] Move from localStorage to cloud database
- [ ] Real-time data sync

### Phase 3: Authentication
- [ ] User accounts and login
- [ ] Multi-user support
- [ ] Role-based access control

### Phase 4: Advanced Features
- [ ] Bank statement import/parsing
- [ ] Receipt image upload storage
- [ ] Recurring expense templates
- [ ] Budget alerts and warnings
- [ ] Tax report generation

### Phase 5: Analytics
- [ ] Advanced reporting
- [ ] Trend analysis charts
- [ ] Forecasting
- [ ] Custom report builder

### Phase 6: Mobile & Integrations
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Automated email reports
- [ ] Slack notifications
- [ ] Inventory tracking

### Phase 7: Accounting Integration
- [ ] QuickBooks sync
- [ ] Xero integration
- [ ] Accounting software connections
- [ ] Tax software export

---

## 📊 Data Types

### DailySales
```typescript
interface DailySales {
  id: string;              // Unique identifier
  date: Date;              // Transaction date
  squareSales: number;     // Amount from Square
  cashCollected: number;   // Unreported cash
  notes?: string;          // Optional notes
  createdAt: Date;         // Creation timestamp
}
```

### Expense
```typescript
interface Expense {
  id: string;
  date: Date;
  category: string;        // Category of expense
  amount: number;
  description: string;     // Expense description
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  notes?: string;
  createdAt: Date;
}
```

### CashPayout
```typescript
interface CashPayout {
  id: string;
  date: Date;
  amount: number;
  payeeName: string;       // Who received the payout
  purpose: string;         // Purpose of payout
  notes?: string;
  createdAt: Date;
}
```

### MonthlyReport
```typescript
interface MonthlyReport {
  month: string;           // Month name
  year: number;
  totalIncome: number;     // Square + Cash
  totalExpenses: number;
  totalPayouts: number;
  netCash: number;         // Income - Expenses - Payouts
  squareSales: number;
  unreportedCash: number;
}
```

---

## 📝 License

This project is private and for internal use only.

---

## 👨‍💼 Support

For issues, questions, or feature requests, contact the development team.

---

## 📅 Version History

### v1.0.0 (January 12, 2026)
- ✅ Daily sales tracking
- ✅ Expense management
- ✅ Cash payout tracking
- ✅ Monthly dashboard
- ✅ Local storage persistence
- ✅ Google Sheets integration (foundation)
- ✅ Responsive UI
- ✅ Production-ready build

---

**Last Updated**: January 12, 2026 | **Status**: Production Ready ✅
