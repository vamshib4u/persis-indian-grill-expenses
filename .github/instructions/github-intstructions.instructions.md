# Persis Indian Grill Expenses - Contributor Instructions

## Purpose
This document defines the standards for making safe, readable changes in this repository.
It is written for any developer who opens the codebase without prior context, including developers who are not using AI tools.

## Core Principles
- Preserve existing user behavior unless the task explicitly requires a product change.
- Avoid large refactors when a small, local change solves the problem.
- Prefer readable code over clever code.
- Keep business logic easy to trace from page -> component -> utility -> API route.
- Update documentation when changing flows, environment variables, storage contracts, or external integrations.

## Safe Change Boundaries
- Do not rename or reorganize major top-level feature areas without a strong reason:
  - `src/app`
  - `src/components`
  - `src/lib`
  - `src/types`
- Do not change local storage keys unless a migration plan is included.
- Do not change Google Sheets column order or tab names without updating every dependent writer/reader.
- Do not move secrets to client-side code.
- Do not introduce breaking API contract changes without documenting them in the relevant doc.

## Readability Standards
- Use descriptive names. Prefer `loadGoogleStatus` over `loadStatus`, `salesRows` over `rows`.
- Keep functions focused on one responsibility.
- Split dense logic into small helpers in `src/lib` when it improves clarity.
- Prefer explicit branches over compressed one-liners when the logic affects money, dates, or external sync.
- Add brief comments only where intent is not obvious from the code itself.
- Avoid unexplained magic values. Extract constants when values have business meaning.
- Keep JSX readable:
  - move formatting, mapping, and calculation helpers out of large render blocks
  - keep prop names explicit
  - avoid deeply nested conditional rendering when a helper or early return is clearer

## Component Standards
- Keep components focused on presentation and user interaction.
- Move reusable data transformation and sync logic into `src/lib`.
- Prefer passing typed props over reading from unrelated globals.
- Preserve existing page structure unless the task requires UI redesign.
- Avoid rewriting a major component just to satisfy style preference.

## State Management Standards
- Keep state local when it is local to a page or component.
- Derive computed values instead of storing duplicated state.
- Avoid introducing new global state unless there is a clear multi-page need.
- Treat local storage as the source of truth for business records unless the feature explicitly shifts ownership.

## API Route Standards
- Validate inputs early and return clear error responses.
- Keep routes thin: parse request, call shared library code, return response.
- Put external service logic in `src/lib`, not inline in routes.
- Avoid duplicating Google Sheets or GitHub API logic across routes.

## Data and Money Handling
- Favor correctness over brevity in calculations.
- Keep date handling explicit and review month/year boundaries carefully.
- Preserve numeric fields as numeric values in the application layer.
- When exporting or syncing, be explicit about formatting and column order.

## Google Sheets Standards
- Server-side OAuth flow lives under `src/app/api/google/*`.
- Token persistence is handled in `src/lib/serverStorage.ts`.
- Sheets read/write helpers live in `src/lib/googleSheets.ts`.
- If spreadsheet structure changes, update:
  - write helpers
  - read helpers
  - setup documentation
  - any UI text that explains the tabs or columns

## GitHub Backup Standards
- Keep GitHub backup behavior isolated to its API route and supporting utilities.
- Do not commit tokens, generated credentials, or backup data by accident.
- Any change to GitHub backup flow must document required token scopes and branch expectations.

## Documentation Requirements
When changing the app, update the relevant docs if any of the following changed:
- environment variables
- API routes
- local storage keys
- Google OAuth flow
- Google Sheets schema
- GitHub backup behavior
- core business workflow for sales, expenses, payouts, or dashboard totals

## Minimum Review Checklist
Before considering a change complete, verify:
- The change is readable without external explanation.
- Major components were not rewritten unnecessarily.
- Shared logic is not duplicated.
- Types remain accurate.
- Existing storage and sync flows still work.
- Related documentation is updated.
