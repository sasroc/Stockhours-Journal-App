# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (React)
```bash
cd stockhours
npm start        # Dev server on port 3000 (HTTPS enabled)
npm run build    # Production build → stockhours/build/
npm test         # Run tests (Jest + React Testing Library) — no tests written yet
```

### Backend (Express)
```bash
cd backend
npm run dev      # Dev server with nodemon (port 4242)
npm start        # Production server
```

Both must run simultaneously for full functionality. Frontend requires `HTTPS=true` (set in `stockhours/.env`) because Schwab OAuth requires HTTPS redirect URIs.

> **Note:** The root-level `package.json` is a stub with only 2 transient deps — do not `npm install` from the project root. Install dependencies inside `stockhours/` or `backend/`.

### Required Environment Variables

**`stockhours/.env`** (frontend, all `REACT_APP_` prefixed):
- `HTTPS=true`
- `REACT_APP_STRIPE_API_URL` — backend base URL (e.g., `http://localhost:4242`)
- Firebase config: `REACT_APP_FIREBASE_API_KEY`, `REACT_APP_FIREBASE_AUTH_DOMAIN`, `REACT_APP_FIREBASE_PROJECT_ID`, `REACT_APP_FIREBASE_STORAGE_BUCKET`, `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`, `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_SCHWAB_CLIENT_ID`, `REACT_APP_SCHWAB_REDIRECT_URI`
- `REACT_APP_WEBULL_CLIENT_ID`, `REACT_APP_WEBULL_REDIRECT_URI`
- `REACT_APP_SENTRY_DSN` — optional; enables Sentry error tracking (tunneled through production backend to bypass ad blockers)

**`backend/.env`**:
- `PORT=4242`
- `FRONTEND_URL` — comma-separated origins for CORS (e.g., `http://localhost:3000,https://localhost:3000`)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC_ID`, `STRIPE_PRICE_BASIC_YEARLY_ID`, `STRIPE_PRICE_PRO_ID`, `STRIPE_PRICE_PRO_YEARLY_ID`
- `FIREBASE_SERVICE_ACCOUNT` — base64-encoded Firebase Admin service account JSON (production), or place the JSON file directly in `backend/` and reference its path
- `SCHWAB_CLIENT_ID`, `SCHWAB_CLIENT_SECRET`, `SCHWAB_REDIRECT_URI`
- `WEBULL_CLIENT_ID`, `WEBULL_CLIENT_SECRET`, `WEBULL_REDIRECT_URI`
- `OPENAI_API_KEY`
- `SENTRY_DSN` — optional; enables Sentry on the backend
- `REVENUECAT_WEBHOOK_SECRET` — required for iOS subscription webhooks

## Architecture

**Monorepo** with two independently-runnable apps:
- `stockhours/` — React 19 frontend (Create React App), deployed to **Netlify** (`public/_redirects` rewrites all paths to `index.html` for SPA routing)
- `backend/` — Express.js API server (`server.js` is the single file containing all endpoints), deployed to **Railway** (`backend/railway.json` configures `node server.js` as the start command)

Frontend source layout: `src/App.js` (entry, trade data/state), `src/components/` (all screens and UI components), `src/contexts/AuthContext.js`, `src/firebase.js` (Firebase client init), `src/theme.js`.

Key frontend libraries: **Chart.js** (`react-chartjs-2`) for all data visualizations, **xlsx** for client-side CSV/Excel parsing, **date-fns** for date math, **react-icons** for icons, **react-quill** for rich-text notes editing, **styled-components** + inline styles for UI.

### Navigation Model
React Router (`react-router-dom` v7) handles all routing. `setCurrentScreen` in `App.js` tracks only the header title string and does not drive rendering.

**Public routes** (no auth required):
- `/` or `/home` → `MarketingLanding`
- `/pricing` → `PricingScreen`
- `/faq` → `FAQScreen`
- `/privacy`, `/terms` → legal pages
- `/login` → login screen

**Protected authenticated routes** (wrapped in `<ProtectedRoute>`, all render via `<AppRoutes>`):
- `/dashboard`, `/reports`, `/alltrades`, `/dailystats`, `/imports`, `/settings`, `/weekly-reviews`, `/brokers`
- `AppRoutes` reads `location.pathname` to decide which screen component to render

**Other protected routes**:
- `/paywall` → `PaywallScreen` (auth required but no subscription check)
- `/callback/schwab`, `/callback/webull` → OAuth callback handlers (auth required, no subscription check)

Unmatched paths redirect to `/`.

### Frontend → Backend Communication
- API base URL: `process.env.REACT_APP_STRIPE_API_URL` (e.g., `http://localhost:4242`)
- Auth: Firebase ID token sent as `Authorization: Bearer {token}` on every protected request
- Backend middleware `verifyFirebaseToken` decodes the token and sets `req.user`

### State Management
No Redux. State lives in:
1. `AuthContext` (`src/contexts/AuthContext.js`) — auth user, subscription status/plan, trading profile. Exposes `isPro`, `isSubscribed`, `subscriptionPlan`, `tradingProfile`, `profileLoaded`, `refreshTradingProfile`.
2. `App.js` — global trade data, date range filter, tags, ratings (passed as props to all screens)

### Data Storage — Firestore
All user data in a single `users/{uid}` document:
- `tradeData` — array of trade groups from CSV imports
- `schwabTradeData` — array of trade groups synced from Schwab (stored separately since commit `678dbef` to prevent CSV data loss on re-sync)
- `subscription` — `{ status, plan, interval, updatedAt }` where `status` ∈ `active|trialing|inactive|canceled` and `plan` ∈ `none|basic|pro`
- `tradeRatings` — `{ [tradeId]: { rating, setups, mistakes } }`
- `notes` — `{ [dateString]: noteText }`
- `patternInsights` — persisted AI pattern detection results
- `setupsTags`, `mistakesTags` — user-defined tag arrays
- `tradingProfile` — `{ goals: string[], maxLossPercent, targetGainPercent, onboardingCompleted }` — set during onboarding, injected into all AI prompts

Broker OAuth tokens live in subcollections: `users/{uid}/schwabTokens/primary` and `users/{uid}/webullTokens/primary`.

### Subscription Gating
- **Pro check pattern** (backend): read `users/{uid}`, verify `subscription.plan === 'pro'` AND `subscription.status` is `'active'` or `'trialing'`
- **Basic check pattern** (backend): same but `subscription.plan === 'basic'` OR `'pro'`
- **Frontend**: `useAuth()` exposes `isPro`, `isSubscribed`, `subscriptionPlan`
- `ProtectedRoute` component gates screens requiring any subscription
- `PaywallScreen` is shown to unauthenticated/unsubscribed users

### Key Architectural Notes
- `FRONTEND_URL` env var is **comma-separated** (for CORS). Use `primaryFrontendUrl` (first entry, split on `,`) for Stripe redirect URLs — never the raw env var.
- AI endpoints (`/api/ai/*`) are rate-limited to 25 req/hour per user via `express-rate-limit`, and require Pro subscription.
- Trade data is processed entirely on the frontend from raw CSV/broker data. `App.js` handles all trade grouping, P&L computation, and filtering logic via `generateGroupKey` (groups executions into trade round-trips by symbol+expiry+strike+type+date).
- Supported CSV import formats: **thinkorswim** (auto-detected) and **IBKR Activity Statement** (detected when row[0]==='Trades' && row[1]==='Header').
- Schwab sync fetches ~1 year of history via sequential 60-day windows and uses `_schwabActivityId` for deduplication. CSV trades (`tradeData`) and Schwab trades (`schwabTradeData`) are stored in separate Firestore fields; `mergeWithSchwabData()` in `App.js` combines them into `filteredTradeData` for display. A one-time migration path in `App.js` handles legacy documents that mixed both in `tradeData`.
- RevenueCat webhook (`POST /api/revenuecat/webhook`) writes to the same `subscription` field as Stripe. `REVENUECAT_WEBHOOK_SECRET` must be set in `backend/.env`. Full implementation guide: `backend/REVENUECAT_MIGRATION_PLAN.md`.
- Several components are very large (`ReportsScreen.js` ~102KB, `StatsDashboard.js` ~67KB, `App.js` and `server.js` each ~56KB). Read selectively.

## Theme & Styling
- Dark theme; prefer inline styles for new components to match existing patterns (mix of `styled-components` and inline styles)
- Theme constants in `stockhours/src/theme.js`:

```js
colors: {
  red: '#FF4D4F',                         // Losses/errors
  green: '#52C41A',                        // Profits
  teal: '#2DD4BF',                         // Primary accent
  tealDark: '#26B8A6',                     // Hover state
  tealLight: 'rgba(45, 212, 191, 0.12)',   // Active background
  tealSubtle: 'rgba(45, 212, 191, 0.08)', // Hover background
  black: '#1E2D48',                        // Card/surface background
  white: '#FFFFFF',
  gray: '#8899AA',                         // Inactive icons/muted text
  // Page backgrounds: #0A1628 (deep), #1E2D48 (surface)
}
```

## External Services
| Service | Purpose |
|---|---|
| Firebase Auth | Email/password, Google, Apple sign-in |
| Firestore | All user/trade data storage |
| Stripe | Web subscriptions (Basic $10/mo or $102/yr; Pro $25/mo or $255/yr) |
| RevenueCat | iOS subscriptions via Apple IAP — same Firestore schema as Stripe (`users/{uid}/subscription`) |
| OpenAI GPT-4o | AI trade review, daily debrief, pattern detection, weekly review |
| Schwab API | OAuth broker connection, trade sync |
| Webull API | OAuth broker connection, trade sync |
| TradingView | Embedded chart widget in trade detail view |
| Sentry | Error monitoring (see Analytics & Monitoring section) |

## Reference Documents
- `IOS_APP_SPEC.md` — full feature parity spec for the iOS app (separate repo: `TradeLensiOS/`); defines required screens, Firestore schema alignment, and subscription gating behavior
- `backend/REVENUECAT_MIGRATION_PLAN.md` — step-by-step guide to adding the RevenueCat webhook (iOS IAP) alongside the existing Stripe integration

## AI Features (all Pro-only, GPT-4o)
1. **Trade Review** — `POST /api/ai/trade-review` — per-trade coaching
2. **Daily Debrief** — `POST /api/ai/daily-debrief` — day-level coaching
3. **Pattern Detection** — `POST /api/ai/pattern-detection` — cross-history insights, persisted to Firestore
4. **Weekly Review** — `POST /api/ai/weekly-review` — weekly summary with goals
5. **AI Chat Assistant** — conversational interface (planned, not yet implemented)

All AI endpoints receive `tradingProfile` in the request body; backend injects it into the GPT system prompt for personalized coaching.

## Analytics & Monitoring
- **Google Analytics**: GA4 (`G-NEZRJYNTW9`) via gtag script in `stockhours/public/index.html`
- **Sentry**: Frontend init in `stockhours/src/index.js` (`REACT_APP_SENTRY_DSN`), backend in `backend/server.js` (`SENTRY_DSN`) with global error handler middleware. Frontend tunnels events through `POST /api/sentry-tunnel` to bypass ad blockers.
