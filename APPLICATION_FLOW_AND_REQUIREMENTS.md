# Application Flow And Requirements

## Purpose
This document explains how the application works, what it requires, and how its main flows are structured.
It is intended for developers, maintainers, and reviewers who need to understand the system without relying on tribal knowledge.

## Product Summary
Persis Indian Grill Expenses is a Next.js application used to track:
- daily sales
- expenses
- payouts
- monthly summaries
- optional Google Sheets synchronization
- optional GitHub-based backup workflows

The app is designed to remain useful even when external services are unavailable. Core record management works from browser storage first.

## Primary Goals
- Keep daily financial entry simple for operators.
- Make monthly totals easy to review.
- Preserve data locally by default.
- Support external backup and spreadsheet reporting without making them mandatory for core use.

## Non-Goals
- This is not a full accounting platform.
- This is not a multi-tenant permissions system.
- This is not a database-first architecture today.

## Functional Requirements

### Sales
- Record sale date.
- Record Square sales amount.
- Record cash collected amount.
- Optionally record notes.
- Optionally record who currently holds the cash.

### Expenses
- Record expense date.
- Record category.
- Record amount.
- Record payment method.
- Optionally record description, spender, and notes.

### Payouts
- Record payout date.
- Record payee.
- Record amount.
- Record purpose.
- Record payment method and notes when needed.

### Dashboard
- Show monthly totals for income, expenses, and payouts.
- Show net cash position.
- Allow navigation by month and year.
- Summarize cash handling and monthly trends.

### Data Export And Sync
- Allow data export from the UI.
- Allow optional Google Sheets synchronization.
- Allow optional GitHub backup flow.

## Non-Functional Requirements
- The app must remain usable on local development without cloud dependencies.
- The UI must be responsive on desktop and mobile.
- The codebase must stay readable for a developer who did not build the feature originally.
- Secrets must remain server-side.
- Core flows must not depend on agent-specific context.

## Technology Requirements
- Node.js 18+ recommended.
- npm available locally.
- Next.js App Router.
- React and TypeScript.
- Tailwind CSS.

## Directory Responsibilities

### `src/app`
Contains routes and pages.
- Pages define feature screens.
- API routes expose server-side integration logic.

### `src/components`
Contains feature UI and reusable page-level building blocks.
- Forms collect input.
- Lists display records.
- Control components trigger export and sync actions.

### `src/lib`
Contains shared logic and integration code.
- storage helpers
- formatting and utility functions
- Google Sheets sync logic
- token storage helpers
- cash summary helpers

### `src/types`
Contains shared TypeScript types and contracts.

## Core Data Model

### DailySales
Represents one daily sales record.
Expected fields include:
- `id`
- `date`
- `squareSales`
- `cashCollected`
- `cashHolder`
- `notes`

### Transaction
Represents either an expense or a payout.
Expected fields include:
- `id`
- `date`
- `type`
- `amount`
- `paymentMethod`
- `notes`

Expense-specific fields:
- `category`
- `description`
- `spentBy`

Payout-specific fields:
- `payeeName`
- `purpose`

## Storage Model

### Browser Storage
The main records are stored in browser local storage for normal usage.
This keeps the application functional without a backend database.

Current local storage keys are defined in the storage utilities and should be treated as a compatibility contract.
Do not rename them without a migration plan.

### Server-Side Token Storage
Google OAuth tokens are stored server-side using one of these backends:
- local file storage in `.persist/google_tokens.json` for local development
- Vercel KV when configured
- Upstash Redis when configured

This storage is handled by `src/lib/serverStorage.ts`.

## Application Flows

### 1. Sales / Expense / Payout Entry Flow
1. A user opens a feature page such as `/sales`, `/expenses`, or `/payouts`.
2. The page loads current records from local storage through shared storage helpers.
3. The user submits a form.
4. The page validates and saves the new or updated record.
5. Lists and monthly summaries re-render from the updated local state.

Important rule:
- Local record creation and editing should remain independent from Google Sheets and GitHub availability.

### 2. Dashboard Flow
1. The dashboard reads current sales and transactions from local state or storage.
2. It filters data by selected month and year.
3. It computes totals and summary views.
4. It renders financial cards and supporting summaries.

Important rule:
- Dashboard values should be derived from shared data rather than duplicated state.

### 3. Google OAuth Flow
This is the backend authorization flow for Google Sheets access.

Entry points:
- UI controls trigger `/api/google/oauth`
- Google redirects back to `/api/google/callback`

Detailed flow:
1. The user starts Google connection from the app UI.
2. `GET /api/google/oauth` builds the Google consent URL.
3. Google redirects the user to the configured callback URL with an authorization code.
4. `GET /api/google/callback` receives the code.
5. `exchangeCodeForTokens` in `src/lib/googleSheets.ts` exchanges the code for access and refresh tokens.
6. Tokens are persisted using `src/lib/serverStorage.ts`.
7. Later requests use `getAccessToken` to load and refresh tokens when needed.

Important rule:
- Token exchange, refresh, and persistence belong in shared server-side code, not inside client components.

### 4. Google Sheets Load Flow
1. The app calls `GET /api/google/load`.
2. The route resolves the spreadsheet ID from request params or environment.
3. The route uses `readSheetRange` from `src/lib/googleSheets.ts`.
4. `readSheetRange` obtains a valid access token.
5. The server reads `Sales`, `Expenses`, and `Payouts` sheet tabs.
6. The route returns the rows to the frontend.

Expected spreadsheet tabs:
- `Sales`
- `Expenses`
- `Payouts`
- `Summary`

### 5. Google Sheets Sync Flow
1. The app collects current records for the selected month.
2. The client calls `POST /api/google/sync`.
3. The route forwards the request to shared sync logic.
4. `serverSyncAll` in `src/lib/googleSheets.ts` prepares rows and headers.
5. The server updates monthly data in Google Sheets while preserving unrelated months.

Important rule:
- Sheet headers and column order are part of the integration contract and must be updated carefully.

### 6. GitHub Backup Flow
1. The user triggers a GitHub backup action from the app.
2. The app calls the GitHub backup API route.
3. The route uses repository settings and token-based authentication.
4. The data is written to the configured repository and branch.

Important rule:
- GitHub backup is optional and should not block normal record management.

## Environment Requirements

### Core Local Development
Required:
- `npm install`
- `npm run dev`

No external service is required for basic local usage if the user only needs local data entry.

### Google Sheets Integration
Required environment variables:
- `NEXT_PUBLIC_GOOGLE_SHEET_ID`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`

Optional:
- `GOOGLE_OAUTH_REDIRECT`
- `NEXT_PUBLIC_GOOGLE_API_KEY`

Google configuration requirements:
- OAuth consent configured in Google Cloud
- authorized JavaScript origin for local app URL
- authorized redirect URI for `/api/google/callback`
- spreadsheet exists with expected tabs

### GitHub Backup
Required environment variables:
- `GITHUB_TOKEN`
- `GITHUB_REPO`
- `GITHUB_BRANCH`

GitHub token expectations:
- token must have the repository permissions required by the backup route
- target repository and branch must exist or match the route's behavior

## API Inventory

### Core API routes
- `POST /api/sales`
- `POST /api/expenses`
- `POST /api/payouts`

### External integration routes
- `POST /api/save-to-github`
- `POST /api/sync-sheets`
- `GET /api/google/oauth`
- `GET /api/google/callback`
- `GET /api/google/load`
- `POST /api/google/sync`
- `GET /api/google/status`

## Readability And Maintenance Standards

### Change Strategy
- Prefer surgical changes over broad rewrites.
- Do not refactor a large component only to satisfy style preference.
- Keep data shape changes explicit and documented.

### Code Style Expectations
- Use descriptive names.
- Keep helpers small and testable where practical.
- Keep route handlers thin.
- Keep side effects isolated.
- Prefer explicit transformation steps over packed inline logic.

### Documentation Expectations
Update documentation when changing:
- environment variables
- OAuth flow
- spreadsheet schema
- GitHub backup behavior
- storage keys
- user-facing feature flow

## Risk Areas
- date filtering by month and year
- money calculations and totals
- spreadsheet column order
- token refresh behavior
- storage compatibility across deployments

Any change in these areas should be reviewed carefully even if the code diff is small.

## Recommended Change Workflow
1. Understand which feature area owns the behavior.
2. Identify the shared utility or API route involved.
3. Make the smallest change that solves the issue.
4. Verify local behavior.
5. Verify integrations if the change touches Google Sheets or GitHub backup.
6. Update documentation before closing the task.

## Related Documents
- `README.md`
- `PROJECT_STANDARDS.md`
- `GITHUB_AND_SHEETS_SETUP.md`
- `DEPLOYMENT_GUIDE.md`
- `VERCEL_DEPLOY.md`
