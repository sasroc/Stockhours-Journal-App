# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (React)
```bash
cd stockhours
npm start        # Dev server on port 3000 (HTTPS enabled)
npm run build    # Production build → stockhours/build/
npm test         # Run tests (Jest + React Testing Library)
```

### Backend (Express)
```bash
cd backend
npm run dev      # Dev server with nodemon (port 4242)
npm start        # Production server
```

Both must run simultaneously for full functionality. Frontend requires `HTTPS=true` (set in `.env`) because Schwab OAuth requires HTTPS redirect URIs.

## Architecture

**Monorepo** with two independently-runnable apps:
- `stockhours/` — React 19 frontend (Create React App)
- `backend/` — Express.js API server

### Frontend → Backend Communication
- API base URL: `process.env.REACT_APP_STRIPE_API_URL` (e.g., `http://localhost:4242`)
- Auth: Firebase ID token sent as `Authorization: Bearer {token}` on every protected request
- Backend middleware `verifyFirebaseToken` decodes the token and sets `req.user`

### State Management
No Redux. State lives in:
1. `AuthContext` (`src/contexts/AuthContext.js`) — auth user, subscription status/plan
2. `App.js` — global trade data, date range filter, tags, ratings (passed as props to all screens)

### Data Storage — Firestore
All user data in a single `users/{uid}` document:
- `tradeData` — array of trade groups (the primary trade storage)
- `subscription` — `{ status, plan, interval, updatedAt }` where `status` ∈ `active|trialing|inactive|canceled` and `plan` ∈ `none|basic|pro`
- `tradeRatings` — `{ [tradeId]: { rating, setups, mistakes } }`
- `notes` — `{ [dateString]: noteText }`
- `patternInsights` — persisted AI pattern detection results
- `setupsTags`, `mistakesTags` — user-defined tag arrays

Broker OAuth tokens live in subcollections: `users/{uid}/schwabTokens/primary` and `users/{uid}/webullTokens/primary`.

### Subscription Gating
- **Pro check pattern** (backend): read `users/{uid}`, verify `subscription.plan === 'pro'` AND `subscription.status` is `'active'` or `'trialing'`
- **Frontend**: `useAuth()` exposes `isPro`, `isSubscribed`, `subscriptionPlan`
- `ProtectedRoute` component gates screens requiring any subscription
- `PaywallScreen` is shown to unauthenticated/unsubscribed users

### Key Architectural Notes
- `FRONTEND_URL` env var is **comma-separated** (for CORS). Use `primaryFrontendUrl` (first entry, split on `,`) for Stripe redirect URLs — never the raw env var.
- AI endpoints (`/api/ai/*`) are rate-limited to 25 req/hour per user via `express-rate-limit`, and require Pro subscription.
- Trade data is processed entirely on the frontend from raw CSV/broker data. `App.js` handles all trade grouping, P&L computation, and filtering logic.
- Schwab sync fetches last 60 days and uses `_schwabActivityId` for deduplication when merging with existing trades.

## Theme & Styling
- Dark theme; primary accent teal `#2DD4BF`; profit green `#52C41A`; loss red `#FF4D4F`; backgrounds `#0A1628` / `#1E2D48`
- Theme constants in `stockhours/src/theme.js`
- Mix of `styled-components` and inline styles — prefer inline styles for new components to match existing patterns

## External Services
| Service | Purpose |
|---|---|
| Firebase Auth | Email/password, Google, Apple sign-in |
| Firestore | All user/trade data storage |
| Stripe | Subscriptions (Basic $20/mo, Pro $45/mo; yearly discounts) |
| OpenAI GPT-4o | AI trade review, daily debrief, pattern detection, weekly review |
| Schwab API | OAuth broker connection, trade sync |
| Webull API | OAuth broker connection, trade sync |
| TradingView | Embedded chart widget in trade detail view |

## AI Features (all Pro-only, GPT-4o)
1. **Trade Review** — `POST /api/ai/trade-review` — per-trade coaching
2. **Daily Debrief** — `POST /api/ai/daily-debrief` — day-level coaching
3. **Pattern Detection** — `POST /api/ai/pattern-detection` — cross-history insights, persisted to Firestore
4. **Weekly Review** — `POST /api/ai/weekly-review` — weekly summary with goals
