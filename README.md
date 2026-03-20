# TradeBetter

An AI-powered trading journal for options traders. Import trades from your broker or CSV files, get detailed analytics on your performance, and use GPT-4o coaching to identify patterns, fix mistakes, and trade with more discipline.

**Web app** built with React + Express. **iOS app** built with SwiftUI (separate repo). Both sync through Firebase in real time.

---

## Why TradeBetter?

Most traders lose money not because of bad strategies, but because they repeat the same mistakes without realizing it. TradeBetter gives you the data and AI feedback to break that cycle:

- **Import in minutes** — Connect your Schwab or Webull account for automatic trade syncing, or upload a CSV/Excel file.
- **See your real edge** — Win rate, profit factor, average win/loss, streaks, time-of-day patterns, and more — all calculated automatically.
- **Fix recurring mistakes** — Tag trades with setups and mistakes, then filter your reports to see exactly which patterns make or lose you money.
- **Get AI coaching** — GPT-4o reviews your trades, debriefs your day, detects patterns across your history, and writes weekly reviews with actionable goals.

---

## Features

### Trade Imports

| Method | Details |
|--------|---------|
| **Schwab** | OAuth connection, auto-syncs last 60 days of trades |
| **Webull** | OAuth connection, auto-syncs filled orders |
| **CSV / Excel** | Upload `.csv`, `.xlsx`, or `.xls` files exported from any broker |

Trades are automatically processed using FIFO matching — OPEN/CLOSE pairs are matched, P&L and ROI are calculated, and everything is organized by date, symbol, and contract.

### Dashboard

- Total trades, win rate, profit factor, gross P&L, best/worst trade
- Calendar heatmap showing daily P&L at a glance
- Cumulative P&L line chart tracking your equity curve
- Win/loss distribution and streak tracking

### Daily Stats

- Day-by-day trade summaries with intraday P&L charts
- Expandable trade details for each day
- Add rich-text daily notes (what you observed, felt, planned)
- Share daily performance as a branded PNG image for social media
- Request an AI Daily Debrief (Pro) for end-of-day coaching

### All Trades

- Paginated table of every completed trade (50 per page)
- Click any trade to see full details: entry/exit, timing, option specs, P&L, ROI
- Embedded TradingView chart for the underlying symbol
- Rate trades 1-5 stars (half-star support) for self-assessment
- Request an AI Trade Review (Pro) for per-trade coaching

### Reports

- **Overview**: Key performance indicators across your filtered date range
- **By Tag**: See how each setup or mistake tag performs (win rate, avg P&L, frequency)
- **By Time**: Hourly and day-of-week breakdowns to find your best trading windows
- **By Symbol / Strike / Expiration / Option Type**: Drill into what you trade most and what works
- **AI Insights** (Pro): Pattern detection across your entire history, powered by GPT-4o

### Weekly Reviews

- Weekly summaries with P&L, trade count, win rate, and profit factor
- Daily breakdown within each week
- AI Weekly Review (Pro) generates structured feedback with "What Worked", "Key Observation", and "Next Week's Goals"
- Edit and persist your own weekly goals alongside AI suggestions

### Tagging System

- **Setup tags**: Label trades by strategy (e.g., Breakout, Reversal, Support Bounce)
- **Mistake tags**: Label trades where you made errors (e.g., FOMO, Overtrading, Poor Entry)
- Create custom tags, manage them from any trade view, and filter reports by tag to see which setups and mistakes actually affect your bottom line

---

## AI Features (Pro Plan)

All AI features use GPT-4o and are rate-limited to 25 requests per hour per user.

| Feature | What it does |
|---------|-------------|
| **Trade Review** | Analyzes a single trade (entry/exit, P&L, your rating, your tags) and returns a 4-part coaching response: Recap, Wins, Improvements, Key Lesson |
| **Daily Debrief** | Reviews all trades from a single day plus your daily notes, then delivers: Day Review, Standout Trades, Patterns, Tomorrow's Focus |
| **Pattern Detection** | Synthesizes your full trade history — time-of-day stats, day-of-week stats, per-symbol stats, tag stats — into 5-8 specific, data-backed pattern insights |
| **Weekly Review** | Summarizes the week's trades and your daily notes into: The Week in Brief, What Worked, Key Observation, Next Week's Goals |

Basic plan users see these features locked with an upgrade prompt. No AI calls are made for Basic users.

---

## Subscription Plans

|  | Basic | Pro |
|--|-------|-----|
| **Monthly** | $10/mo | $25/mo |
| **Yearly** | $8.50/mo ($102/yr) | $21.25/mo ($255/yr) |
| Trade imports (file + broker) | Yes | Yes |
| Dashboard, Daily Stats, Reports | Yes | Yes |
| Tagging, notes, ratings | Yes | Yes |
| Broker connections | 1 | Unlimited |
| AI Trade Review | - | Yes |
| AI Daily Debrief | - | Yes |
| AI Pattern Detection | - | Yes |
| AI Weekly Review | - | Yes |

Billing is handled through Stripe with support for promo codes, mid-cycle plan changes with prorated billing, and a self-service customer portal.

---

## Architecture

```
stockhours/          React frontend (Create React App)
backend/             Express API server
```

### Frontend

- **React 19** with React Router for SPA navigation
- **Firebase SDK** for authentication (email/password, Google, Apple) and Firestore reads
- **Chart.js** for all data visualizations (line, bar, calendar heatmap)
- **xlsx** for client-side Excel/CSV parsing
- Dark theme with inline styles, fully responsive

### Backend

- **Express** server with Firebase Admin SDK for auth verification and Firestore writes
- **Stripe** for subscription billing and webhook handling
- **OpenAI** (GPT-4o) for all AI endpoints
- **Schwab & Webull APIs** for OAuth token exchange, trade syncing, and token refresh
- **express-rate-limit** for per-user AI rate limiting (25 req/hr)

### Data Flow

1. User imports trades (broker sync or file upload)
2. Frontend parses and processes transactions — groups by symbol/strike/expiration, matches OPEN/CLOSE pairs via FIFO, calculates P&L and ROI
3. Processed trades are stored in Firestore under `users/{uid}`
4. All screens read from the same trade data, applying date range filters
5. AI endpoints receive trade data from the frontend, call GPT-4o, and return structured coaching responses
6. Broker tokens are stored in Firestore subcollections and automatically refreshed on sync

### Security

- All API endpoints require a valid Firebase ID token (`verifyFirebaseToken` middleware)
- User data is fully isolated by UID
- AI endpoints are rate-limited (25 requests/hour per user) to prevent cost abuse
- Broker tokens are stored server-side in Firestore, never exposed to the client
- Stripe webhooks are verified via signature before processing
- Basic plan users are server-side gated from connecting more than 1 broker

---

## Getting Started

### Prerequisites

- Node.js v14+
- A Firebase project with Authentication and Firestore enabled
- A Stripe account (for subscription billing)
- An OpenAI API key (for AI features)
- Schwab and/or Webull developer credentials (for broker integrations, optional)

### Frontend Setup

```bash
cd stockhours
npm install
```

Create `stockhours/.env`:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_STRIPE_API_URL=http://localhost:4242
REACT_APP_SCHWAB_CLIENT_ID=your_schwab_client_id
REACT_APP_SCHWAB_REDIRECT_URI=http://localhost:3000/imports
REACT_APP_WEBULL_CLIENT_ID=your_webull_client_id
REACT_APP_WEBULL_REDIRECT_URI=http://localhost:3000/imports
```

```bash
npm start
```

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC_ID=price_...
STRIPE_PRICE_BASIC_YEARLY_ID=price_...
STRIPE_PRICE_PRO_ID=price_...
STRIPE_PRICE_PRO_YEARLY_ID=price_...
FIREBASE_SERVICE_ACCOUNT=base64_encoded_service_account_json
OPENAI_API_KEY=sk-...
SCHWAB_CLIENT_ID=your_schwab_client_id
SCHWAB_CLIENT_SECRET=your_schwab_client_secret
SCHWAB_REDIRECT_URI=http://localhost:4242/api/schwab/callback
WEBULL_CLIENT_ID=your_webull_client_id
WEBULL_CLIENT_SECRET=your_webull_client_secret
WEBULL_REDIRECT_URI=http://localhost:4242/api/webull/callback
```

```bash
npm run dev
```

### Building for Production

```bash
cd stockhours
npm run build
```

---

## File Format Support

For manual CSV/Excel imports, the app expects columns matching standard broker export formats:

| Column | Description |
|--------|-------------|
| Exec Time | Execution timestamp |
| Trade Date | Date of the trade |
| Side | BUY or SELL |
| Quantity | Number of contracts |
| Symbol | Underlying ticker |
| Expiration | Option expiration date |
| Strike | Strike price |
| Price | Fill price |
| Order Type | Order type (MARKET, LIMIT, etc.) |
| Pos Effect | OPEN or CLOSE |
| Type | CALL or PUT |

---

## License

See LICENSE file for details.
