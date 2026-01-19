# Persis Indian Grill Expenses - Standards and Requirements

## Purpose
This document defines product requirements, engineering standards, and design guidelines for the Persis Indian Grill Expenses app. Use it as the single source of truth for future development and deployment.

## Scope
The app tracks daily sales, expenses, and payouts, provides monthly summaries, and supports export/backup to Google Sheets and GitHub.

## Functional Requirements
- Sales tracking with date, Square sales, cash collected, notes, and cash holder.
- Expense tracking with category, payment method, description, spent by, and notes.
- Payout tracking with payee, purpose, amount, and notes.
- Monthly dashboard with income, expenses, payouts, net cash, and trend chart.
- Export options (CSV/JSON) and optional cloud backups.
- Google Sheets sync with monthly replacement (by month) and summary data.

## Non-Functional Requirements
- Responsive UI (mobile and desktop).
- Fast local interactions using browser storage.
- No secrets exposed in client bundles (keep secrets server-side).
- Deployment on Vercel with environment-based configuration.

## Technology Stack
- Next.js (App Router), React, TypeScript.
- Tailwind CSS for styling.
- Local storage for persistence.
- Google Sheets API and OAuth for cloud sync.
- GitHub API for data backup.

## Pages and Routes
- `/` Home/Landing
- `/dashboard` Monthly summary + trends chart
- `/sales` Daily sales list and form
- `/expenses` Expense list and form
- `/payouts` Payout list and form
- `/transactions` Combined expenses/payouts + sales for export

## API Endpoints
- `POST /api/sales` basic sales endpoint (placeholder)
- `POST /api/expenses` basic expenses endpoint (placeholder)
- `POST /api/payouts` basic payouts endpoint (placeholder)
- `POST /api/save-to-github` save monthly data to GitHub
- `POST /api/sync-sheets` manual JSON prep for Sheets import
- `GET /api/google/oauth` start server-side OAuth flow
- `GET /api/google/callback` OAuth callback to store tokens
- `POST /api/google/sync` server-side Sheets sync
- `GET /api/google/status` OAuth token status

## Component Inventory
- `src/components/Navigation.tsx` top navigation
- `src/components/SalesForm.tsx` sales input
- `src/components/SalesList.tsx` sales table
- `src/components/ExpenseForm.tsx` expense input
- `src/components/ExpensesList.tsx` expense table
- `src/components/PayoutForm.tsx` payout input
- `src/components/PayoutsList.tsx` payout table
- `src/components/TransactionForm.tsx` combined transaction input
- `src/components/TransactionsList.tsx` combined transaction table
- `src/components/ExportButtons.tsx` CSV/JSON and cloud export UI
- `src/components/GoogleSheetsControls.tsx` Sheets OAuth + sync controls

## Data Models
- `DailySales`:
  - `date`, `squareSales`, `cashCollected`, `cashHolder`, `notes`
- `Transaction`:
  - `date`, `type` (expense|payout), `category`, `amount`, `paymentMethod`,
    `description`, `spentBy`, `payeeName`, `purpose`, `notes`
- `MonthlyReport`:
  - `month`, `year`, `totalIncome`, `totalExpenses`, `totalPayouts`,
    `netCash`, `squareSales`, `unreportedCash`

## Storage Standards
- Primary persistence: `localStorage`
  - Sales key: `persis_sales_data`
  - Transactions key: `persis_transactions_data`
- OAuth tokens: stored server-side in `.persist/google_tokens.json`
  - In production, uses Vercel KV when configured via `KV_URL` or `VERCEL_KV_REST_API_URL`.
  - Note: Vercel serverless filesystem is ephemeral. KV is required for persistent server-side tokens.

## Google Sheets Integration
- Sales/Expenses/Payouts are written to master tabs with a `Month` column.
- Month sync overwrites only rows for the selected month, preserving other months.
- Summary tab includes monthly totals and cash-holder aggregates.

Required environment variables:
- `NEXT_PUBLIC_GOOGLE_SHEET_ID`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`

Optional:
- `GOOGLE_OAUTH_REDIRECT`
- `NEXT_PUBLIC_GOOGLE_API_KEY` (legacy)

## Design Standards
- Tailwind utility-first styling.
- Neutral gray background, card-based content blocks, and clear spacing.
- Primary action buttons use solid color with hover states.
- Tables emphasize readability with aligned numeric columns.
- Charts are simple SVG-based lines with labeled axes and legend.

## Engineering Standards
- TypeScript with no `any` in new code.
- Keep state minimal; derive data with `useMemo` when possible.
- Date ordering is ascending in UI lists and Sheets exports.
- Reuse shared utilities from `src/lib`.
- No secrets or tokens committed to git.
- Keep API routes stateless and pure where possible.

## Deployment Checklist
- `npm run lint` passes.
- `npm run build` completes successfully.
- Verify environment variables in Vercel.
- Confirm Google OAuth authorized origins and redirect URIs.
- Validate Sheets sync and GitHub backup in production.

## Change Management
- Update this document for any new feature, API change, or UI redesign.
- Keep related docs in sync:
  - `VERCEL_DEPLOY.md`
  - `DEPLOYMENT_GUIDE.md`
  - `GITHUB_AND_SHEETS_SETUP.md`
