# iOS App Specification (TradeBetter / Stockhours)

This document defines the full scope, behavior, and data requirements for the iOS app. The iOS app must be feature-parity with the current web app and must sync all user data via Firebase. It must enforce subscription gating on sign-in: subscribed users see the full app; non-subscribed users see pricing and are redirected to the website to subscribe.

## Goals

- Deliver full feature parity with the web app (Dashboard, Daily Stats, All Trades, Reports, Imports, Notes, Tags, Ratings, Sharing).
- Sync all user data across platforms via Firebase (Firestore + Auth).
- Enforce subscription gating at sign-in and on session refresh.
- Maintain consistent data processing logic (P&L, ROI, trade pairing) with the web app.

## Scope Summary (Parity Requirements)

The iOS app must include all screens and flows that exist in the web app:

- Authentication (Email/Password, Google, Apple).
- Dashboard (overview stats, charts, calendar heatmap).
- Daily Stats (day-by-day summaries, expandable trade list, intraday P&L chart, tags, notes, sharing).
- All Trades (full list, sorting, pagination/virtualization, detailed view).
- Reports (tag analysis, time-based analysis, breakdowns by symbol/strike/expiration/type).
- Imports (upload trade files, list files, delete files).
- Tag management (setups/mistakes), trade ratings, daily notes.
- Date range filtering (default Year-to-Date, presets, custom).
- Shareable images of daily performance.

## Subscription Gating

### Behavior

- On sign-in (and on session refresh), check subscription status.
- If subscribed, show full app and allow data access.
- If not subscribed, show a pricing screen with plan details and a clear CTA.
- CTA must open the subscription page on the website (external browser or in-app web view).
- After subscribing on the website, user returns to the app; app must refresh subscription state and unlock features.

### Subscription State Source

- Subscription state is stored per user in Firebase.
- Use the existing field (or add if missing): `users/{uid}.subscriptionStatus` with values `active` or `inactive`.
- Include `users/{uid}.subscriptionUpdatedAt` for cache busting and refresh.

### Deep Link / Return Flow

- Use a return URL (e.g., `tradebetter://subscription-complete`) or universal link.
- On return, re-check `subscriptionStatus` and unlock if `active`.

## Firebase Data Model (Must Match Web App)

Use the existing Firestore structure. Data must match exactly to keep sync parity:

- `users/{uid}` document contains:
  - `tradeRatings` (per trade key: setups, mistakes, rating)
  - `setupsTags` (array of strings)
  - `mistakesTags` (array of strings)
  - `notes` (per date)
  - `subscriptionStatus` (active/inactive)
  - `subscriptionUpdatedAt` (timestamp)
- Trades and import files use the same schema as the web app.

If any fields do not yet exist, the iOS app should tolerate missing values and default to empty values.

## Trade Processing Logic (Must Match Web)

Replicate the existing web logic for:

- Transaction grouping by symbol/strike/expiration.
- OPEN/CLOSE matching using FIFO.
- P&L calculation using contract multiplier (100).
- ROI calculation as `profitLoss / totalBuyCost * 100`.
- Date standardization and sorting.

The resulting data shape must remain consistent with the web app so stats match across platforms.

## Screens and Core Flows

### 1) Authentication

- Firebase Auth with Email/Password, Google, and Apple.
- Required for all core features.

### 2) Subscription Gate

- Display pricing plans and a single CTA button.
- CTA opens `https://<your-domain>/pricing` (or the active subscription page).
- Must block all trade data until subscription is `active`.

### 3) Dashboard

- Overview metrics: total trades, win rate, profit factor, gross P&L, etc.
- Calendar heatmap with daily P&L color scale.
- Cumulative P&L chart and win/loss distributions.
- Date range filtering (YTD default).

### 4) Daily Stats

- Daily summaries grouped by trade date.
- Intraday P&L chart per day.
- Expandable list of trades with:
  - Open time, ticker, instrument, net P&L, net ROI.
  - Tags (setups/mistakes), add/remove tags.
  - Trade rating.
- Daily notes (rich text editor).
- Share image generation and export.

### 5) All Trades

- Full list of processed trades.
- Sorting and pagination or list virtualization.
- Detailed trade view with:
  - Entry/exit prices, quantities
  - ROI
  - Duration
  - Option contract details
  - Embedded chart for the underlying symbol
- Tag management and trade rating.

### 6) Reports

- Overview KPIs.
- Tag-based analysis.
- Time-based analysis (hourly/daily/weekly).
- Performance by symbol, strike, expiration, option type.
- Filterable categories.

### 7) Imports

- Import trade history files (Excel/CSV).
- Show list of imported files.
- Allow deletion of a file and its trades.
- Track which trades came from which file.

## Date Range Filtering

- Default: current Year-to-Date.
- Presets: Today, This Week, This Month, Last 30 Days, Last Month, This Quarter, Year-to-Date.
- Custom range picker.
- All-time view allowed by clearing filters.
- All screens must update in real time on filter change.

## Notes & Rich Text

- Daily notes stored per date in Firestore (`notes`).
- Use rich text editor that supports basic formatting (bold, italics, lists).
- On save, update Firestore and local state.

## Tags & Ratings

- Tags are stored in `setupsTags` and `mistakesTags`.
- Ratings are stored in `tradeRatings` keyed by trade key.
- Trade key must match web logic exactly:
  - `${Symbol}-${Strike}-${Expiration}-${FirstBuyExecTime}`

## Sharing

- Generate shareable images for daily performance with branding.
- Export to the device share sheet.

## Performance & UX Requirements

- Large data sets should be virtualized in lists.
- Charts should be fast and responsive; defer heavy calculations to background threads where possible.
- Maintain the dark theme UI consistent with the web app.
- Animations and transitions should mirror the web experience.

## Offline & Sync Behavior

- No offline mode is required, but the app should:
  - Cache last loaded data for fast startup.
  - Re-sync on app foreground.
- All edits must be persisted to Firestore immediately.

## Analytics & Logging (Optional)

- Log key events: sign-in, subscription check, imports, exports, share actions.

## Testing Requirements

- Unit tests for trade processing logic (P&L and matching logic).
- Snapshot/UI tests for core screens.
- Integration tests for Auth + Firestore sync.
- Subscription gating tests (active/inactive).

## Deliverables

- Fully functional iOS app with parity to the web app.
- Firebase-backed sync for all user data.
- Subscription gate with website redirect and re-check.
- App Store-ready build with all required assets and metadata.

