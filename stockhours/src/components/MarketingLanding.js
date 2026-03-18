import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import primaryLogo from '../assets/3.png';
import secondaryLogo from '../assets/2.png';
import dashboardOverviewImg from '../assets/dashboard-overview.png';
import dailyStatsImg from '../assets/daily-stats.png';
import allTradesImg from '../assets/all-trades.png';
import reportsInsightsImg from '../assets/reports-insights.png';
import importsImg from '../assets/imports.png';
import weeklyReviewImg from '../assets/weekly-review.png';

const screenshotItems = [
  {
    title: 'Dashboard Overview',
    description: 'Daily P&L, win rate, streaks, and performance trend at a glance.',
    src: dashboardOverviewImg,
  },
  {
    title: 'Daily Stats',
    description: 'Break down each session to see what made or broke the day.',
    src: dailyStatsImg,
  },
  {
    title: 'All Trades',
    description: 'Review each trade with notes, ratings, and setup/mistake tags.',
    src: allTradesImg,
  },
  {
    title: 'Reports & Insights',
    description: 'Find patterns by setup, symbol, day, and execution behavior.',
    src: reportsInsightsImg,
  },
  {
    title: 'Weekly Review',
    description: 'Turn weekly performance into focused, actionable goals.',
    src: weeklyReviewImg,
  },
  {
    title: 'Imports',
    description: 'Connect brokers or import files to keep your journal current.',
    src: importsImg,
  },
];


const faqItems = [
  {
    q: 'What brokers can I connect to TradeBetter?',
    a: 'TradeBetter currently supports direct OAuth connections with Charles Schwab and Webull, which automatically sync your recent trades. You can also manually import CSV exports from thinkorswim (TD Ameritrade) and Interactive Brokers (IBKR Activity Statements). Additional broker support is on our roadmap.',
  },
  {
    q: 'What file formats are supported for importing trades?',
    a: 'We support CSV exports from thinkorswim and IBKR Activity Statements out of the box — just drop the file in and TradeBetter auto-detects the format. For brokers with OAuth support (Schwab, Webull), you can skip the file entirely and sync directly from your account.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes — no contracts, no cancellation fees. For web subscriptions, cancel from Settings → Subscription and your access continues through the end of the current billing period. For iOS subscriptions, manage billing through your Apple ID in the App Store. Your data stays intact either way.',
  },
  {
    q: "What's the difference between Basic and Pro?",
    a: 'Basic gives you full access to trade imports, the dashboard, daily stats, all-trades view, and reports — everything you need to analyze your trading history. Pro adds all four AI features (Trade Review, Daily Debrief, Pattern Detection, and Weekly Review), unlimited broker connections, and priority support.',
  },
  {
    q: 'How does the AI work and what can it actually tell me?',
    a: 'TradeBetter uses GPT-4o to analyze your actual trade data — not generic advice. The AI Trade Review coaches you on individual trades, Daily Debrief summarizes your session against your stated goals, Pattern Detection surfaces behavioral trends across your full history, and Weekly Review turns your numbers into a focused plan for the week ahead. All AI features are Pro-only.',
  },
  {
    q: 'Is my trading data private and secure?',
    a: 'Yes. Your trade data is stored in your own private Firestore document and is never shared with other users or sold to third parties. Broker OAuth tokens are encrypted at rest. TradeBetter never has direct access to execute trades — connections are read-only for transaction history.',
  },
  {
    q: 'Can I use TradeBetter on my iPhone or iPad?',
    a: 'Yes — TradeBetter is available as a native iOS app on the App Store, built for iPhone and iPad. The iOS app is in sync with the web app and uses the same account, so your journal is available across all your devices.',
  },
  {
    q: 'Does TradeBetter support stocks and futures, or just options?',
    a: 'TradeBetter is purpose-built for options traders. The trade grouping, P&L computation, and analytics are all designed around options round-trips (entry to exit by symbol, strike, expiry, and type). Stock and futures imports may parse but the analysis is optimized for options.',
  },
  {
    q: 'Can I export my journal data?',
    a: 'Your trade data can be exported directly from the Imports screen. We provide CSV export so you always have a portable copy of your journal — no lock-in.',
  },
  {
    q: 'How often should I sync my broker account?',
    a: "Schwab and Webull syncs pull the last 60 days of transactions each time, so syncing after each trading session or once a day keeps your journal current. The sync uses a unique activity ID to deduplicate, so running it multiple times won't create duplicate trades.",
  },
  {
    q: 'What happens to my data if I cancel my subscription?',
    a: 'Your account and all trade data remain intact. You lose access to Pro features (AI and multiple broker connections), but everything you imported stays in your journal. You can resubscribe at any time and pick up right where you left off.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Go to Settings → Subscription and click "Manage Subscription." For web (Stripe) billing, cancellation takes effect at the end of your current billing period. For iOS subscribers, manage billing directly through your Apple ID in the App Store settings.',
  },
];

const MarketingLanding = () => {
  const navigate = useNavigate();
  const { currentUser, displayName, logout } = useAuth();
  const [activeShotIndex, setActiveShotIndex] = useState(0);
  const activeShot = screenshotItems[activeShotIndex];
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const visibleFaqs = faqItems.slice(0, 6);

  return (
    <div className="ml-root">
      <style>
        {`
          @keyframes brandShift {
            0% {
              color: #31d17c;
              text-shadow: 0 0 18px rgba(49, 209, 124, 0.55);
            }
            50% {
              color: #37a7ff;
              text-shadow: 0 0 18px rgba(55, 167, 255, 0.6);
            }
            100% {
              color: #31d17c;
              text-shadow: 0 0 18px rgba(49, 209, 124, 0.55);
            }
          }

          @keyframes pulseGlow {
            0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.6); }
            50% { opacity: 0.85; box-shadow: 0 0 0 5px rgba(52, 211, 153, 0); }
          }

          @keyframes heroGlow {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 0.8; }
          }

          .brandText {
            animation: brandShift 4.5s ease-in-out infinite;
          }

          .ml-root {
            min-height: 100vh;
            color: ${theme.colors.white};
            background:
              radial-gradient(70% 55% at 50% 0%, rgba(46, 204, 113, 0.12), transparent 65%),
              radial-gradient(45% 35% at 8% 8%, rgba(0, 123, 255, 0.18), transparent 75%),
              radial-gradient(45% 35% at 92% 12%, rgba(45, 212, 191, 0.12), transparent 75%),
              linear-gradient(180deg, #05070c 0%, #070d17 46%, #04060b 100%);
          }

          .ml-shell {
            max-width: 1320px;
            margin: 0 auto;
            padding: 0 24px;
          }

          .ml-nav {
            position: sticky;
            top: 0;
            z-index: 20;
            backdrop-filter: blur(10px);
            background: rgba(8, 12, 20, 0.82);
            border-bottom: 1px solid rgba(140, 169, 201, 0.16);
          }

          .ml-nav-row {
            height: 78px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }

          .ml-brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .ml-brand-icon {
            width: 46px;
            height: 46px;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(123, 160, 203, 0.25);
            background: rgba(15, 20, 32, 0.7);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5), 0 0 24px rgba(0, 123, 255, 0.24);
          }

          .ml-brand-name {
            font-weight: 700;
            letter-spacing: 0.3px;
            font-size: 21px;
            color: #f2f7ff;
          }

          /* ── Hero CTA buttons ── */
          .ml-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(143, 165, 190, 0.28);
            background: rgba(255,255,255,0.04);
            color: #c8d8ec;
            padding: 13px 22px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.22s ease;
            font-family: inherit;
            letter-spacing: 0.1px;
          }

          .ml-btn:hover {
            border-color: rgba(143, 165, 190, 0.52);
            background: rgba(255,255,255,0.07);
            color: #e8f0fb;
            transform: translateY(-1px);
          }

          .ml-btn-primary {
            border: none;
            background: linear-gradient(135deg, #1ecf97 0%, #2db9ff 100%);
            color: #021a12;
            font-weight: 700;
            font-size: 15px;
            padding: 13px 26px;
            letter-spacing: 0.2px;
            box-shadow:
              0 0 0 1px rgba(30, 207, 151, 0.35),
              0 8px 24px rgba(30, 207, 151, 0.28),
              0 16px 40px rgba(45, 185, 255, 0.2);
          }

          .ml-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow:
              0 0 0 1px rgba(30, 207, 151, 0.45),
              0 12px 32px rgba(30, 207, 151, 0.36),
              0 20px 52px rgba(45, 185, 255, 0.28);
            filter: brightness(1.06);
          }

          /* ── Navbar buttons ── */
          .ml-nav-link {
            background: none;
            border: none;
            color: #8899aa;
            padding: 7px 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: color 0.18s ease, background 0.18s ease;
            font-family: inherit;
            letter-spacing: 0.1px;
          }

          .ml-nav-link:hover {
            color: #dde8f5;
            background: rgba(255,255,255,0.05);
          }

          .ml-nav-login {
            display: inline-flex;
            align-items: center;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(130, 155, 185, 0.25);
            color: #c4d4e8;
            padding: 8px 18px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
          }

          .ml-nav-login:hover {
            background: rgba(255,255,255,0.08);
            border-color: rgba(130, 155, 185, 0.45);
            color: #e8f0fb;
            transform: translateY(-1px);
          }

          .ml-nav-cta {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: none;
            background: linear-gradient(135deg, #1ecf97 0%, #2db9ff 100%);
            color: #021a12;
            padding: 9px 20px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.22s ease;
            font-family: inherit;
            letter-spacing: 0.15px;
            box-shadow: 0 4px 14px rgba(30,207,151,0.28), 0 8px 24px rgba(45,185,255,0.18);
          }

          .ml-nav-cta:hover {
            transform: translateY(-1px);
            filter: brightness(1.07);
            box-shadow: 0 6px 20px rgba(30,207,151,0.36), 0 12px 32px rgba(45,185,255,0.24);
          }

          .ml-nav-signout {
            background: none;
            border: none;
            color: #6b7f96;
            padding: 7px 12px;
            border-radius: 8px;
            font-size: 13px;
            cursor: pointer;
            transition: color 0.18s ease;
            font-family: inherit;
          }

          .ml-nav-signout:hover {
            color: #a0b3c8;
          }

          .ml-hero {
            padding: 72px 0 24px;
            display: grid;
            grid-template-columns: 1.1fr 1fr;
            gap: 56px;
            align-items: center;
          }

          .ml-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            padding: 7px 14px 7px 10px;
            border-radius: 999px;
            font-size: 12.5px;
            font-weight: 600;
            letter-spacing: 0.3px;
            color: #34d399;
            background: rgba(52, 211, 153, 0.08);
            border: 1px solid rgba(52, 211, 153, 0.28);
          }

          .ml-eyebrow-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #34d399;
            animation: pulseGlow 2.4s ease-in-out infinite;
            flex-shrink: 0;
          }

          .ml-title {
            margin: 20px 0 18px;
            font-size: clamp(34px, 5.4vw, 54px);
            line-height: 1.06;
            letter-spacing: -1px;
            max-width: 18ch;
          }

          .ml-title-accent {
            background: linear-gradient(135deg, #34d399 0%, #60a5fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .ml-sub {
            color: #8fa8c4;
            font-size: 17px;
            line-height: 1.75;
            max-width: 48ch;
          }

          .ml-cta-row {
            margin-top: 32px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .ml-trust-row {
            margin-top: 20px;
            display: flex;
            align-items: center;
            gap: 18px;
            flex-wrap: wrap;
          }

          .ml-trust-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12.5px;
            color: #627b96;
            font-weight: 500;
          }

          .ml-trust-check {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: rgba(52, 211, 153, 0.12);
            border: 1px solid rgba(52, 211, 153, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .ml-note {
            margin-top: 14px;
            color: #7d90aa;
            font-size: 13px;
          }

          .ml-proof-row {
            margin-top: 24px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .ml-chip {
            border-radius: 999px;
            font-size: 12px;
            color: #bdd1ea;
            border: 1px solid rgba(122, 149, 181, 0.35);
            background: rgba(12, 18, 30, 0.72);
            padding: 6px 11px;
          }

          .ml-hero-visual-wrap {
            position: relative;
          }

          .ml-hero-glow {
            position: absolute;
            inset: -30px;
            border-radius: 40px;
            background: radial-gradient(60% 60% at 50% 50%, rgba(30, 207, 151, 0.14) 0%, rgba(45, 185, 255, 0.1) 50%, transparent 100%);
            animation: heroGlow 4s ease-in-out infinite;
            pointer-events: none;
            z-index: 0;
          }

          .ml-hero-visual {
            position: relative;
            z-index: 1;
            border-radius: 22px;
            border: 1px solid rgba(52, 211, 153, 0.18);
            background: linear-gradient(160deg, rgba(14, 22, 38, 0.92) 0%, rgba(7, 11, 21, 0.96) 100%);
            padding: 22px;
            box-shadow:
              0 0 0 1px rgba(255,255,255,0.04) inset,
              0 32px 64px rgba(0, 0, 0, 0.55),
              0 0 48px rgba(30, 207, 151, 0.08);
          }

          .ml-visual-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 18px;
            padding-bottom: 14px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }

          .ml-visual-status {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
            color: #34d399;
            font-weight: 600;
            letter-spacing: 0.2px;
          }

          .ml-visual-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #34d399;
            animation: pulseGlow 2s ease-in-out infinite;
          }

          .ml-visual-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .ml-kpi {
            border-radius: 14px;
            background: rgba(8, 13, 24, 0.72);
            border: 1px solid rgba(255,255,255,0.06);
            padding: 14px 16px;
            transition: border-color 0.2s ease;
          }

          .ml-kpi:hover {
            border-color: rgba(255,255,255,0.1);
          }

          .ml-kpi-label {
            font-size: 10.5px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #5a7290;
            font-weight: 600;
          }

          .ml-kpi-value {
            margin-top: 8px;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            line-height: 1;
          }

          .ml-kpi-sub {
            margin-top: 5px;
            font-size: 11.5px;
            color: #4e6880;
          }

          /* ── Stat band ── */
          .ml-stat-band {
            margin-top: 36px;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
          }

          .ml-stat {
            border-radius: 14px;
            background: rgba(9, 14, 25, 0.72);
            border: 1px solid rgba(109, 129, 156, 0.2);
            padding: 18px 20px;
            border-left: 2px solid rgba(45, 212, 191, 0.35);
            transition: border-color 0.2s ease, background 0.2s ease;
          }

          .ml-stat:hover {
            background: rgba(9, 14, 25, 0.9);
            border-left-color: rgba(45, 212, 191, 0.65);
          }

          .ml-stat strong {
            display: block;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 6px;
            color: #ddeaf8;
            letter-spacing: -0.2px;
          }

          .ml-stat span {
            color: #5a7290;
            font-size: 13px;
            line-height: 1.55;
          }

          /* ── Section layout ── */
          .ml-section {
            margin-top: 96px;
          }

          .ml-section-header {
            text-align: center;
            max-width: 640px;
            margin: 0 auto 48px;
          }

          .ml-section-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.4px;
            color: #2DD4BF;
            background: rgba(45, 212, 191, 0.08);
            border: 1px solid rgba(45, 212, 191, 0.22);
            margin-bottom: 16px;
          }

          .ml-h2 {
            font-size: clamp(26px, 4.1vw, 40px);
            line-height: 1.08;
            margin: 0 0 14px;
            letter-spacing: -0.7px;
            color: #eaf2ff;
          }

          .ml-p {
            color: #6b87a4;
            font-size: 17px;
            line-height: 1.72;
            margin: 0;
          }

          /* ── Feature cards ── */
          .ml-feature-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }

          .ml-feature-card {
            position: relative;
            border-radius: 18px;
            padding: 28px 26px;
            border: 1px solid rgba(255,255,255,0.06);
            background: linear-gradient(160deg, rgba(13, 19, 34, 0.88) 0%, rgba(8, 12, 22, 0.94) 100%);
            box-shadow: 0 20px 40px rgba(0,0,0,0.28);
            overflow: hidden;
            transition: border-color 0.25s ease, transform 0.2s ease;
          }

          .ml-feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            border-radius: 18px 18px 0 0;
            background: var(--card-accent, linear-gradient(90deg, #2dd4bf, #60a5fa));
            opacity: 0.7;
          }

          .ml-feature-card:hover {
            border-color: rgba(255,255,255,0.1);
            transform: translateY(-2px);
          }

          .ml-feature-icon {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 18px;
            flex-shrink: 0;
          }

          .ml-feature-card h3 {
            margin: 0 0 10px;
            font-size: 19px;
            font-weight: 700;
            letter-spacing: -0.3px;
            color: #e2eefb;
          }

          .ml-feature-card p {
            margin: 0;
            color: #5a7a98;
            line-height: 1.68;
            font-size: 14.5px;
          }

          /* ── Process section ── */
          .ml-process-outer {
            position: relative;
          }

          .ml-process-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0;
            position: relative;
          }

          .ml-process-card {
            position: relative;
            border-radius: 0;
            padding: 32px 28px;
            background: transparent;
            display: flex;
            flex-direction: column;
          }

          .ml-process-card:not(:last-child)::after {
            content: '';
            position: absolute;
            top: 48px;
            right: -1px;
            width: 2px;
            height: 32px;
            background: linear-gradient(180deg, rgba(45,212,191,0.4), transparent);
          }

          .ml-process-card-inner {
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.06);
            background: linear-gradient(160deg, rgba(11,17,31,0.9), rgba(7,11,21,0.95));
            padding: 28px 24px;
            height: 100%;
            transition: border-color 0.25s ease, transform 0.2s ease;
            position: relative;
            overflow: hidden;
          }

          .ml-process-card-inner:hover {
            border-color: rgba(45,212,191,0.22);
            transform: translateY(-2px);
          }

          .ml-process-connector {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 8px;
            margin-top: -16px;
          }

          .ml-process-step-num {
            font-size: 52px;
            font-weight: 800;
            line-height: 1;
            letter-spacing: -3px;
            margin-bottom: 20px;
            background: linear-gradient(135deg, rgba(45,212,191,0.22) 0%, rgba(96,165,250,0.14) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            display: block;
          }

          .ml-process-icon {
            width: 38px;
            height: 38px;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(45, 212, 191, 0.1);
            border: 1px solid rgba(45, 212, 191, 0.2);
            margin-bottom: 16px;
          }

          .ml-process-card-inner h3 {
            margin: 0 0 10px;
            font-size: 19px;
            font-weight: 700;
            letter-spacing: -0.3px;
            color: #ddeaf8;
          }

          .ml-process-card-inner p {
            margin: 0;
            color: #4e6880;
            line-height: 1.65;
            font-size: 14.5px;
          }

          .ml-process-grid-wrap {
            display: grid;
            grid-template-columns: 1fr 40px 1fr 40px 1fr;
            align-items: stretch;
            gap: 0;
          }

          .ml-process-arrow {
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: 52px;
            color: rgba(45, 212, 191, 0.3);
          }

          .ml-showcase-wrap {
            margin-top: 24px;
            display: grid;
            grid-template-columns: 0.78fr 1.42fr;
            gap: 16px;
            align-items: stretch;
          }

          .ml-showcase-panel {
            border-radius: 18px;
            border: 1px solid rgba(118, 141, 170, 0.28);
            background: linear-gradient(180deg, rgba(11, 16, 29, 0.92), rgba(8, 12, 21, 0.94));
            box-shadow: 0 24px 42px rgba(0, 0, 0, 0.36);
            padding: 14px;
          }

          .ml-showcase-item {
            width: 100%;
            border: 1px solid transparent;
            background: transparent;
            color: #b2c4dd;
            text-align: left;
            border-radius: 12px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
            margin-bottom: 8px;
          }

          .ml-showcase-item:hover {
            background: rgba(114, 144, 178, 0.14);
            color: #e5eefb;
          }

          .ml-showcase-item.active {
            background: linear-gradient(135deg, rgba(46, 212, 191, 0.18), rgba(59, 130, 246, 0.2));
            border-color: rgba(101, 176, 232, 0.55);
            color: #f3f8ff;
          }

          .ml-showcase-item h4 {
            margin: 0 0 6px;
            font-size: 16px;
            letter-spacing: -0.2px;
          }

          .ml-showcase-item p {
            margin: 0;
            color: inherit;
            opacity: 0.86;
            line-height: 1.55;
            font-size: 13px;
          }

          .ml-showcase-num {
            display: inline-grid;
            place-items: center;
            width: 24px;
            height: 24px;
            border-radius: 7px;
            margin-right: 8px;
            font-size: 12px;
            font-weight: 700;
            color: #0a2230;
            background: linear-gradient(135deg, #2dd4bf 0%, #60a5fa 100%);
          }

          .ml-showcase-screen {
            border-radius: 18px;
            border: 1px solid rgba(115, 138, 168, 0.32);
            background: linear-gradient(180deg, rgba(9, 14, 24, 0.95), rgba(6, 10, 18, 0.98));
            box-shadow: 0 30px 52px rgba(0, 0, 0, 0.43);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .ml-screen-head {
            height: 40px;
            border-bottom: 1px solid rgba(104, 126, 156, 0.24);
            background: rgba(15, 21, 35, 0.72);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 12px;
          }

          .ml-screen-dots {
            display: flex;
            gap: 6px;
          }

          .ml-screen-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #384c6a;
          }

          .ml-screen-title {
            font-size: 12px;
            color: #9ab1cd;
            letter-spacing: 0.3px;
          }

          .ml-screen-image-wrap {
            padding: 6px;
            background: linear-gradient(160deg, rgba(9, 15, 26, 0.94), rgba(7, 12, 21, 0.95));
          }

          .ml-screen-image {
            width: 100%;
            height: auto;
            display: block;
            object-fit: contain;
            border-radius: 8px;
            border: 1px solid rgba(111, 133, 160, 0.36);
            background: #0a1220;
            box-shadow: 0 14px 24px rgba(0, 0, 0, 0.35);
          }

          .ml-thumbs {
            border-top: 1px solid rgba(106, 126, 152, 0.24);
            padding: 10px;
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 8px;
            background: rgba(9, 14, 24, 0.9);
          }

          .ml-thumb {
            border: 1px solid rgba(102, 126, 154, 0.32);
            background: #0c1525;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            padding: 0;
            transition: transform 0.2s ease, border-color 0.2s ease;
          }

          .ml-thumb:hover {
            transform: translateY(-1px);
            border-color: rgba(134, 184, 224, 0.6);
          }

          .ml-thumb.active {
            border-color: rgba(116, 201, 255, 0.88);
            box-shadow: 0 0 0 1px rgba(116, 201, 255, 0.48);
          }

          .ml-thumb img {
            width: 100%;
            display: block;
            object-fit: cover;
            aspect-ratio: 16 / 10;
          }

          .ml-final {
            margin-top: 76px;
            border-radius: 20px;
            padding: 28px;
            border: 1px solid rgba(117, 140, 170, 0.32);
            background:
              radial-gradient(45% 80% at 0% 100%, rgba(46, 185, 255, 0.15), transparent 75%),
              radial-gradient(45% 80% at 100% 0%, rgba(40, 210, 140, 0.14), transparent 75%),
              rgba(8, 13, 24, 0.92);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            flex-wrap: wrap;
          }

          .ml-final h3 {
            margin: 0 0 8px;
            font-size: 28px;
            letter-spacing: -0.45px;
          }

          .ml-final p {
            margin: 0;
            color: #9bb0c9;
            font-size: 15px;
            line-height: 1.65;
          }


          .ml-faq-section {
            margin-top: 80px;
            margin-bottom: 76px;
          }

          .ml-faq-header {
            text-align: center;
            margin-bottom: 40px;
          }

          .ml-faq-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 12px;
            letter-spacing: 0.4px;
            font-weight: 600;
            color: #2DD4BF;
            background: rgba(45, 212, 191, 0.08);
            border: 1px solid rgba(45, 212, 191, 0.22);
            margin-bottom: 18px;
          }

          .ml-faq-list {
            max-width: 780px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .ml-faq-item {
            border-radius: 14px;
            border: 1px solid rgba(118, 140, 168, 0.22);
            background: linear-gradient(180deg, rgba(13, 19, 33, 0.88) 0%, rgba(9, 13, 23, 0.92) 100%);
            overflow: hidden;
            transition: border-color 0.25s ease;
          }

          .ml-faq-item.open {
            border-color: rgba(45, 212, 191, 0.35);
            background: linear-gradient(180deg, rgba(45, 212, 191, 0.05) 0%, rgba(9, 13, 23, 0.92) 100%);
          }

          .ml-faq-trigger {
            width: 100%;
            background: none;
            border: none;
            padding: 20px 22px;
            text-align: left;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            font-family: inherit;
          }

          .ml-faq-trigger:hover .ml-faq-q {
            color: #e8f1fb;
          }

          .ml-faq-q {
            font-size: 15.5px;
            font-weight: 600;
            color: #ccdaea;
            line-height: 1.4;
            letter-spacing: -0.1px;
            transition: color 0.2s;
          }

          .ml-faq-icon {
            flex-shrink: 0;
            width: 26px;
            height: 26px;
            border-radius: 8px;
            border: 1px solid rgba(100, 140, 185, 0.3);
            background: rgba(20, 30, 50, 0.7);
            display: grid;
            place-items: center;
            transition: all 0.25s ease;
          }

          .ml-faq-item.open .ml-faq-icon {
            background: rgba(45, 212, 191, 0.14);
            border-color: rgba(45, 212, 191, 0.4);
          }

          .ml-faq-icon svg {
            transition: transform 0.3s ease;
          }

          .ml-faq-item.open .ml-faq-icon svg {
            transform: rotate(45deg);
          }

          .ml-faq-body {
            overflow: hidden;
            max-height: 0;
            transition: max-height 0.35s ease, opacity 0.25s ease;
            opacity: 0;
          }

          .ml-faq-item.open .ml-faq-body {
            max-height: 300px;
            opacity: 1;
          }

          .ml-faq-answer {
            padding: 0 22px 20px;
            color: #8ba4be;
            font-size: 14.5px;
            line-height: 1.72;
            border-top: 1px solid rgba(100, 130, 165, 0.14);
            padding-top: 16px;
          }

          .ml-faq-view-all {
            margin-top: 28px;
            display: flex;
            justify-content: center;
          }

          .ml-faq-view-all-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 13px 28px;
            border-radius: 12px;
            font-size: 14.5px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.22s ease;
            border: 1px solid rgba(130, 160, 195, 0.35);
            background: rgba(10, 16, 28, 0.7);
            color: #c8d8ec;
            letter-spacing: 0.1px;
          }

          .ml-faq-view-all-btn:hover {
            border-color: rgba(45, 212, 191, 0.5);
            background: rgba(45, 212, 191, 0.07);
            color: #e5f2fb;
            transform: translateY(-1px);
          }

          @media (max-width: 1080px) {
            .ml-hero {
              grid-template-columns: 1fr;
              gap: 40px;
            }

            .ml-stat-band {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .ml-showcase-wrap {
              grid-template-columns: 1fr;
            }

            .ml-screen-image-wrap {
              padding: 8px;
            }

            .ml-process-grid-wrap {
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .ml-process-arrow {
              display: none;
            }
          }

          @media (max-width: 760px) {
            .ml-shell {
              padding: 0 16px;
            }

            .ml-footer-grid {
              grid-template-columns: 1fr 1fr !important;
            }

            .ml-nav-row {
              height: auto;
              padding: 14px 0;
              align-items: flex-start;
              flex-direction: column;
            }

            .ml-feature-grid,
            .ml-stat-band {
              grid-template-columns: 1fr;
            }

            .ml-process-grid-wrap {
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .ml-process-arrow {
              display: none;
            }

            .ml-thumbs {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .ml-title {
              letter-spacing: -0.7px;
            }

            .ml-hero {
              padding: 48px 0 16px;
            }

            .ml-trust-row {
              gap: 12px;
            }
          }
        `}
      </style>

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          borderBottom: '1px solid #1a1a1a',
          backgroundColor: 'rgba(8, 8, 8, 0.92)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              overflow: 'hidden',
              backgroundColor: '#0b0b0b',
              border: '1px solid #1f1f1f',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6), 0 0 18px rgba(0, 123, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={secondaryLogo}
              alt="TradeBetter Logo"
              style={{
                width: '66px',
                height: '66px',
                objectFit: 'cover',
                objectPosition: 'center',
                transform: 'scale(1.1) translateX(7px)',
                display: 'block'
              }}
            />
          </div>
          <span
            className="brandText"
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '0.6px',
              color: '#ffffff',
              textShadow: '0 0 16px rgba(0, 123, 255, 0.5)'
            }}
          >
            TradeBetter
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="ml-nav-link" onClick={() => navigate('/pricing')}>Pricing</button>
          <button className="ml-nav-link" onClick={() => navigate('/faq')}>FAQ</button>
          <button className="ml-nav-link" onClick={() => navigate('/brokers')}>Brokers</button>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

          {currentUser ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1ecf97 0%, #2db9ff 100%)',
                  color: '#021a12',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {(displayName || currentUser.email || '').charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', color: '#5a7290', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.email}
                </span>
              </div>
              <button className="ml-nav-cta" onClick={() => navigate('/paywall')}>Subscribe</button>
              <button className="ml-nav-signout" onClick={async () => { await logout(); navigate('/login'); }}>Sign out</button>
            </>
          ) : (
            <>
              <button className="ml-nav-login" onClick={() => navigate('/login')}>Log in</button>
              <button className="ml-nav-cta" onClick={() => navigate('/login')}>
                Get started
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </header>

      <main className="ml-shell">
        <section className="ml-hero">
          <div>
            <div className="ml-eyebrow">
              <span className="ml-eyebrow-dot" />
              Built for serious options traders
            </div>
            <h1 className="ml-title">
              Your trades already tell a story.{' '}
              <span className="ml-title-accent">Are you reading it?</span>
            </h1>
            <p className="ml-sub">
              Stop guessing what works. Import your history, uncover your real edge by setup and symbol,
              and get clear AI feedback on what to keep doing and what to cut.
            </p>

            <div className="ml-cta-row">
              <button className="ml-btn ml-btn-primary" onClick={() => navigate(currentUser ? '/paywall' : '/login')}>
                Get started
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px' }}>
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className="ml-btn" onClick={() => navigate('/pricing')}>View plans</button>
            </div>

            <div className="ml-trust-row">
              <div className="ml-trust-item">
                <div className="ml-trust-check">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                Plans from $10 / month
              </div>
              <div className="ml-trust-item">
                <div className="ml-trust-check">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                Cancel anytime
              </div>
              <div className="ml-trust-item">
                <div className="ml-trust-check">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                Your data stays yours
              </div>
            </div>
          </div>

          <div className="ml-hero-visual-wrap">
            <div className="ml-hero-glow" />
            <div className="ml-hero-visual">
              <div className="ml-visual-header">
                <img src={primaryLogo} alt="TradeBetter" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '7px' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#7a96b4', letterSpacing: '0.1px' }}>Journal Snapshot</div>
                <div className="ml-visual-status">
                  <span className="ml-visual-status-dot" />
                  Live
                </div>
              </div>

              <div className="ml-visual-grid">
                <div className="ml-kpi">
                  <div className="ml-kpi-label">Net P&L</div>
                  <div className="ml-kpi-value" style={{ color: '#34d399' }}>+$2,845</div>
                  <div className="ml-kpi-sub">↑ 18% vs last month</div>
                </div>
                <div className="ml-kpi">
                  <div className="ml-kpi-label">Win Rate</div>
                  <div className="ml-kpi-value" style={{ color: '#60a5fa' }}>64%</div>
                  <div className="ml-kpi-sub">132 closed trades</div>
                </div>
                <div className="ml-kpi">
                  <div className="ml-kpi-label">Best Setup</div>
                  <div className="ml-kpi-value" style={{ fontSize: '17px', color: '#e2ecfa' }}>Opening Range</div>
                  <div className="ml-kpi-sub">71% win rate · +$1,620</div>
                </div>
                <div className="ml-kpi">
                  <div className="ml-kpi-label">Top Mistake</div>
                  <div className="ml-kpi-value" style={{ color: '#f87171', fontSize: '17px' }}>Late Entries</div>
                  <div className="ml-kpi-sub">−$940 total impact</div>
                </div>
              </div>

              <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.14)' }}>
                <div style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2f6b52', fontWeight: 600, marginBottom: '6px' }}>AI Insight · Pro</div>
                <div style={{ fontSize: '13px', color: '#6fa898', lineHeight: 1.55 }}>
                  Your <span style={{ color: '#34d399', fontWeight: 600 }}>Opening Range</span> setups are outperforming your average by 2.3×. Consider sizing up on high-conviction entries.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ml-section">
          <h2 className="ml-h2">See the app in action</h2>
          <p className="ml-p">Explore the actual product flow, from overview to detailed review, in one interactive preview.</p>
          <div className="ml-showcase-wrap">
            <aside className="ml-showcase-panel">
              {screenshotItems.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className={`ml-showcase-item ${index === activeShotIndex ? 'active' : ''}`}
                  onClick={() => setActiveShotIndex(index)}
                >
                  <h4><span className="ml-showcase-num">{index + 1}</span>{item.title}</h4>
                  <p>{item.description}</p>
                </button>
              ))}
            </aside>

            <div className="ml-showcase-screen">
              <div className="ml-screen-head">
                <div className="ml-screen-dots">
                  <span className="ml-screen-dot" />
                  <span className="ml-screen-dot" />
                  <span className="ml-screen-dot" />
                </div>
                <div className="ml-screen-title">{activeShot.title}</div>
              </div>
              <div className="ml-screen-image-wrap">
                <img
                  src={activeShot.src}
                  alt={activeShot.title}
                  className="ml-screen-image"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.objectFit = 'contain';
                    event.currentTarget.style.padding = '28px';
                    event.currentTarget.src = primaryLogo;
                  }}
                />
              </div>

              <div className="ml-thumbs">
                {screenshotItems.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    className={`ml-thumb ${index === activeShotIndex ? 'active' : ''}`}
                    onClick={() => setActiveShotIndex(index)}
                    aria-label={`Show ${item.title}`}
                  >
                    <img src={item.src} alt={item.title} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ml-stat-band">
          <div className="ml-stat">
            <strong>One place</strong>
            <span>Imports, dashboards, reviews, and notes in one workflow.</span>
          </div>
          <div className="ml-stat">
            <strong>Clear signals</strong>
            <span>Focus on actionable trends, not vanity metrics.</span>
          </div>
          <div className="ml-stat">
            <strong>Repeatable process</strong>
            <span>Turn random sessions into a consistent routine.</span>
          </div>
          <div className="ml-stat">
            <strong>Built to improve</strong>
            <span>Measure progress every day and every week.</span>
          </div>
        </section>

        <section className="ml-section">
          <div className="ml-section-header">
            <div className="ml-section-eyebrow">Why it works</div>
            <h2 className="ml-h2">One question answered four ways</h2>
            <p className="ml-p">
              Every part of TradeBetter is designed to surface the same signal fast: what should you do more of,
              and what should you cut out immediately?
            </p>
          </div>
          <div className="ml-feature-grid">
            {/* Import in minutes */}
            <article
              className="ml-feature-card"
              style={{ '--card-accent': 'linear-gradient(90deg, #60a5fa, #818cf8)' }}
            >
              <div className="ml-feature-icon" style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.22)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h3>Import in minutes</h3>
              <p>Upload broker exports or sync supported brokers and start analyzing fast.</p>
            </article>

            {/* See your real edge */}
            <article
              className="ml-feature-card"
              style={{ '--card-accent': 'linear-gradient(90deg, #34d399, #2dd4bf)' }}
            >
              <div className="ml-feature-icon" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.22)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <h3>See your real edge</h3>
              <p>Spot where your win rate and profitability are strongest by time, setup, and ticker.</p>
            </article>

            {/* Fix recurring mistakes */}
            <article
              className="ml-feature-card"
              style={{ '--card-accent': 'linear-gradient(90deg, #fb923c, #f87171)' }}
            >
              <div className="ml-feature-icon" style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.22)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              </div>
              <h3>Fix recurring mistakes</h3>
              <p>Tag mistakes, review losing trades, and build a tighter process each week.</p>
            </article>

            {/* Trade with structure */}
            <article
              className="ml-feature-card"
              style={{ '--card-accent': 'linear-gradient(90deg, #a78bfa, #60a5fa)' }}
            >
              <div className="ml-feature-icon" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.22)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <h3>Trade with structure</h3>
              <p>Run every session with data-backed feedback instead of emotion-driven guesses.</p>
            </article>
          </div>
        </section>

        <section className="ml-section">
          <div className="ml-section-header">
            <div className="ml-section-eyebrow">How it works</div>
            <h2 className="ml-h2">How traders use it every week</h2>
            <p className="ml-p">Simple loop. Import, review, adjust, repeat.</p>
          </div>
          <div className="ml-process-grid-wrap">

            {/* Step 1 */}
            <div className="ml-process-card-inner">
              <span className="ml-process-step-num">01</span>
              <div className="ml-process-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <h3>Import your history</h3>
              <p>Bring in your trades from broker files or account sync — no manual entry needed.</p>
            </div>

            {/* Arrow */}
            <div className="ml-process-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>

            {/* Step 2 */}
            <div className="ml-process-card-inner">
              <span className="ml-process-step-num">02</span>
              <div className="ml-process-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h3>Review what matters</h3>
              <p>See daily and trade-level performance with clear context on what's actually driving results.</p>
            </div>

            {/* Arrow */}
            <div className="ml-process-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>

            {/* Step 3 */}
            <div className="ml-process-card-inner">
              <span className="ml-process-step-num">03</span>
              <div className="ml-process-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <h3>Improve weekly</h3>
              <p>Use reports and AI reviews to sharpen decisions and set focused goals going forward.</p>
            </div>
          </div>
        </section>

        <section className="ml-final">
          <div>
            <h3>Ready to trade with clarity and consistency?</h3>
            <p>
              Start now, import your history, and make your next week in the market more structured than your last.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="ml-btn" onClick={() => navigate('/pricing')}>Compare plans</button>
            <button className="ml-btn ml-btn-primary" onClick={() => navigate(currentUser ? '/paywall' : '/login')}>Get started</button>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="ml-faq-section">
          <div className="ml-faq-header">
            <div className="ml-faq-eyebrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              FAQ
            </div>
            <h2 className="ml-h2">Questions we hear most</h2>
            <p className="ml-p" style={{ maxWidth: '520px', margin: '0 auto' }}>
              Everything you need to know before getting started — from imports and brokers to billing and data security.
            </p>
          </div>

          <div className="ml-faq-list">
            {visibleFaqs.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className={`ml-faq-item${isOpen ? ' open' : ''}`}>
                  <button
                    className="ml-faq-trigger"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="ml-faq-q">{item.q}</span>
                    <span className="ml-faq-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isOpen ? '#2DD4BF' : '#7a98b8'} strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </span>
                  </button>
                  <div className="ml-faq-body" aria-hidden={!isOpen}>
                    <p className="ml-faq-answer">{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ml-faq-view-all">
            <button
              className="ml-faq-view-all-btn"
              onClick={() => navigate('/faq')}
            >
              View all FAQs
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(5,7,12,0.95)',
        backdropFilter: 'blur(10px)',
        marginTop: '20px',
      }}>
        {/* Main footer grid */}
        <div className="ml-footer-grid" style={{
          maxWidth: '1320px',
          margin: '0 auto',
          padding: '56px 24px 40px',
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
          gap: '40px',
        }}>
          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                overflow: 'hidden',
                backgroundColor: '#0b0b0b',
                border: '1px solid #1f1f1f',
                boxShadow: '0 8px 20px rgba(0,0,0,0.6), 0 0 18px rgba(0,123,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img
                  src={secondaryLogo}
                  alt="TradeBetter Logo"
                  style={{
                    width: '66px',
                    height: '66px',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    transform: 'scale(1.1)',
                    display: 'block'
                  }}
                />
              </div>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#f2f7ff', letterSpacing: '0.2px' }}>TradeBetter</span>
            </div>
            <p style={{ color: '#5d7490', fontSize: '13.5px', lineHeight: 1.7, margin: '0 0 20px', maxWidth: '240px' }}>
              The trading journal built for serious options traders. Import, analyze, and improve.
            </p>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.18)', borderRadius: '999px', padding: '6px 12px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#2DD4BF"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span style={{ color: '#2DD4BF', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.3px' }}>Pro AI-powered journaling</span>
            </div>
          </div>

          {/* Product column */}
          <div>
            <div style={{ color: '#fff', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '18px', opacity: 0.5 }}>Product</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Features', action: () => {} },
                { label: 'Pricing', action: () => navigate('/pricing') },
                { label: 'FAQ', action: () => navigate('/faq') },
                { label: 'Sign in', action: () => navigate('/login') },
                { label: 'Get started', action: () => navigate(currentUser ? '/paywall' : '/login') },
              ].map(({ label, action }) => (
                <button key={label} onClick={action} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#5d7490', fontSize: '13.5px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#c8d6e5'}
                  onMouseLeave={e => e.currentTarget.style.color = '#5d7490'}
                >{label}</button>
              ))}
            </nav>
          </div>

          {/* Legal column */}
          <div>
            <div style={{ color: '#fff', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '18px', opacity: 0.5 }}>Legal</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Privacy Policy', action: () => navigate('/privacy') },
                { label: 'Terms of Service', action: () => navigate('/terms') },
              ].map(({ label, action }) => (
                <button key={label} onClick={action} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#5d7490', fontSize: '13.5px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#c8d6e5'}
                  onMouseLeave={e => e.currentTarget.style.color = '#5d7490'}
                >{label}</button>
              ))}
            </nav>
          </div>

          {/* Support column */}
          <div>
            <div style={{ color: '#fff', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '18px', opacity: 0.5 }}>Support</div>
            <p style={{ color: '#5d7490', fontSize: '13px', lineHeight: 1.65, margin: '0 0 14px' }}>
              Have a question or need help? We're here.
            </p>
            <a
              href="mailto:rsassanimarketing@gmail.com"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(45,212,191,0.06)',
                border: '1px solid rgba(45,212,191,0.18)',
                borderRadius: '8px',
                padding: '9px 14px',
                color: '#2DD4BF',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.12)'; e.currentTarget.style.borderColor = 'rgba(45,212,191,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.06)'; e.currentTarget.style.borderColor = 'rgba(45,212,191,0.18)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              Email Support
            </a>
            <div style={{ color: '#3a4e62', fontSize: '11.5px', marginTop: '10px' }}>
              rsassanimarketing@gmail.com
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          maxWidth: '1320px',
          margin: '0 auto',
          padding: '18px 24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <span style={{ color: '#3a4e62', fontSize: '12px' }}>© 2026 TradeBetter. All rights reserved.</span>
          <span style={{ color: '#3a4e62', fontSize: '12px' }}>Built for traders, by traders.</span>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLanding;
