# Stockhours iOS App Spec (Parity With Web)

## Goals
- Ship an iOS app that mirrors the current web app’s features and data.
- Remove CSV import from the mobile experience.
- Ensure a single source of truth so data is identical across web and iOS.

## Scope (Phase 1: Parity)
- Authentication and user profile.
- Trades, stats, daily stats, tagging, notes, sharing.
- All data reads/writes go through the same backend (Firestore).
- No CSV import on iOS. Data must already exist in Firestore.

## Non-Goals (Phase 1)
- Subscription model.
- AI features.
- Brokerage API integrations.

## Data Consistency Requirements
- Use the same Firebase project and Firestore collections as the web app.
- All changes in iOS should immediately reflect in web (and vice versa).
- Do not store user data locally except for short-term cache/offline support.
- Any local cache must sync to Firestore and be resilient to conflicts.

## Tech Stack Recommendation (iOS)
- SwiftUI for UI.
- Firebase Auth + Firestore SDK.
- Charts: Swift Charts (iOS 16+) or a lightweight chart library if needed.
- Analytics/Crash: Firebase Analytics + Crashlytics (optional but recommended).

## Data Model (Align With Web)
Ensure the iOS models match the fields used in the web app. Names must match exactly.

### Firestore Document Structure (Assumed)
`users/{uid}` document fields:
- `setupsTags`: [String]
- `mistakesTags`: [String]
- `tradeRatings`: Map<String, Object>
  - key: `${Symbol}-${Strike}-${Expiration}-${FirstBuyExecTime}`
  - value: { setups: [String], mistakes: [String], rating: Number }
- `notes`: Map<String, String>
  - key: ISO date string `YYYY-MM-DD`
  - value: note text

Trades data source:
- The web app expects a structured trade data input and performs aggregation.
- iOS must read the same trade data already stored (or stored by the backend).
- If trades are not yet stored in Firestore, this must be added to the backend
  before iOS ships. iOS should not parse CSV.

## Key UI Screens (Parity)
- Auth: Sign up, sign in, sign out, password reset.
- Dashboard/Home: Summary stats, net P&L, graph.
- Daily Stats: Day cards with graph, summary metrics, expand/collapse.
- Trades List: Trade rows and details.
- Trade Tags: Add/Remove setups/mistakes tags.
- Notes: Add/View notes per day.
- Share: Share daily stats image/text (iOS share sheet).

## Functional Requirements
- Daily stats sorting by date descending.
- Trade calculations and grouping logic must match the web app.
- P&L cumulative chart per day with red/green segment colors.
- Profit factor calculation as in web.
- Tagging changes update Firestore immediately.
- Notes stored by standardized date `YYYY-MM-DD`.

## Data Processing Requirements
The web app performs processing on the client. iOS should match logic:
- Flatten transactions, sort by `ExecTime`.
- Group positions by `${Symbol}-${Strike}-${Expiration}`.
- Build buy/sell cycles and compute `profitLoss` and `netROI`.
- Group trades by `TradeDate`.

If performance is an issue, move this to backend and store processed trades.

## Offline & Sync
- Use Firestore offline persistence.
- Handle conflict resolution by last-write-wins unless business rules require otherwise.
- All writes should be debounced to avoid excessive updates.

## Security & Privacy
- Enforce Firestore rules for per-user data access only.
- Use Firebase Auth to gate all reads and writes.
- No sensitive data in logs.

## Removal of CSV Import
- iOS app does not include CSV import UI or file handling.
- If the web app retains CSV import, ensure it writes to Firestore so iOS sees data.

## Subscription Model (Future Phase)
- Use StoreKit 2 for iOS.
- Backend entitlements in Firestore (or a dedicated subscription service).
- Feature gating: if no subscription, block premium features.

## AI Features (Future Phase)
- Define which data is sent to AI and ensure user consent.
- Prefer server-side AI calls; return summarized results to app.
- Add rate limits and cost tracking.

## Brokerage Integrations (Future Phase)
- Prefer server-side integration; store normalized trades in Firestore.
- OAuth token handling should never be on-device only.

## QA & Testing
- Unit tests for trade calculation logic.
- Snapshot/UI tests for key screens.
- End-to-end test: web adds tag -> iOS sees tag immediately.

## Deliverables
- iOS app (SwiftUI) with parity features.
- Build & release pipeline.
- Documentation of Firestore schema and sync behavior.

## Open Questions
- Where is trade data stored today? If not in Firestore, we need a backend sync.
- Do you want offline-first support or online-only?
- Minimum iOS version target?

