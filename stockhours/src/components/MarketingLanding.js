import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const featureItems = [
  {
    title: 'Import in minutes',
    detail: 'Upload broker exports or sync supported brokers and start analyzing fast.',
  },
  {
    title: 'See your real edge',
    detail: 'Spot where your win rate and profitability are strongest by time, setup, and ticker.',
  },
  {
    title: 'Fix recurring mistakes',
    detail: 'Tag mistakes, review losing trades, and build a tighter process each week.',
  },
  {
    title: 'Trade with structure',
    detail: 'Run every session with data-backed feedback instead of emotion-driven guesses.',
  },
];

const processItems = [
  {
    step: '1',
    title: 'Import your history',
    body: 'Bring in your trades from broker files or account sync.',
  },
  {
    step: '2',
    title: 'Review what matters',
    body: 'See daily and trade-level performance with clear context.',
  },
  {
    step: '3',
    title: 'Improve weekly',
    body: 'Use reports and reviews to sharpen decisions going forward.',
  },
];

const MarketingLanding = () => {
  const navigate = useNavigate();
  const [activeShotIndex, setActiveShotIndex] = useState(0);
  const activeShot = screenshotItems[activeShotIndex];

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

          .ml-btn {
            border: 1px solid rgba(143, 165, 190, 0.33);
            background: rgba(7, 11, 18, 0.55);
            color: #e7eef8;
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .ml-btn:hover {
            border-color: rgba(143, 165, 190, 0.65);
            transform: translateY(-1px);
          }

          .ml-btn-primary {
            border: none;
            background: linear-gradient(135deg, #1ecf97 0%, #2db9ff 100%);
            color: #03131a;
            font-weight: 700;
            box-shadow: 0 12px 26px rgba(46, 204, 113, 0.18), 0 10px 22px rgba(45, 185, 255, 0.24);
          }

          .ml-hero {
            padding: 52px 0 16px;
            display: grid;
            grid-template-columns: 1.15fr 1fr;
            gap: 34px;
            align-items: center;
          }

          .ml-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px 13px;
            border-radius: 999px;
            font-size: 12px;
            letter-spacing: 0.35px;
            color: #b8d6ff;
            background: rgba(15, 90, 179, 0.22);
            border: 1px solid rgba(91, 154, 226, 0.4);
          }

          .ml-title {
            margin: 16px 0 14px;
            font-size: clamp(32px, 5.2vw, 50px);
            line-height: 1.08;
            letter-spacing: -0.7px;
            max-width: 16ch;
          }

          .ml-sub {
            color: #a7b9d0;
            font-size: 17px;
            line-height: 1.7;
            max-width: 52ch;
          }

          .ml-cta-row {
            margin-top: 28px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
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

          .ml-hero-visual {
            border-radius: 20px;
            border: 1px solid rgba(102, 124, 153, 0.33);
            background: linear-gradient(170deg, rgba(17, 24, 39, 0.9) 0%, rgba(8, 13, 24, 0.92) 100%);
            padding: 20px;
            box-shadow: 0 28px 60px rgba(0, 0, 0, 0.48), 0 0 40px rgba(0, 123, 255, 0.15);
          }

          .ml-visual-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .ml-kpi {
            border-radius: 12px;
            background: rgba(11, 17, 30, 0.88);
            border: 1px solid rgba(106, 128, 157, 0.28);
            padding: 12px;
          }

          .ml-kpi-label {
            font-size: 11px;
            letter-spacing: 0.3px;
            color: #8ea2bd;
          }

          .ml-kpi-value {
            margin-top: 6px;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.4px;
          }

          .ml-kpi-sub {
            margin-top: 3px;
            font-size: 12px;
            color: #92a7c1;
          }

          .ml-stat-band {
            margin-top: 28px;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
          }

          .ml-stat {
            border-radius: 12px;
            background: rgba(9, 14, 25, 0.78);
            border: 1px solid rgba(109, 129, 156, 0.28);
            padding: 14px;
          }

          .ml-stat strong {
            display: block;
            font-size: 20px;
            margin-bottom: 4px;
          }

          .ml-stat span {
            color: #91a5be;
            font-size: 13px;
          }

          .ml-section {
            margin-top: 76px;
          }

          .ml-h2 {
            font-size: clamp(26px, 4.1vw, 39px);
            line-height: 1.1;
            margin: 0 0 12px;
            letter-spacing: -0.6px;
          }

          .ml-p {
            color: #9eb1ca;
            font-size: 17px;
            line-height: 1.7;
            margin: 0;
          }

          .ml-feature-grid {
            margin-top: 28px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .ml-feature-card {
            border-radius: 14px;
            padding: 18px;
            border: 1px solid rgba(117, 137, 164, 0.3);
            background: linear-gradient(180deg, rgba(14, 20, 34, 0.82) 0%, rgba(8, 12, 22, 0.9) 100%);
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.26);
          }

          .ml-feature-card h3 {
            margin: 0 0 8px;
            font-size: 19px;
            letter-spacing: -0.2px;
          }

          .ml-feature-card p {
            margin: 0;
            color: #95aac4;
            line-height: 1.6;
            font-size: 14px;
          }

          .ml-process-grid {
            margin-top: 22px;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
          }

          .ml-process-card {
            border-radius: 14px;
            border: 1px solid rgba(118, 137, 161, 0.28);
            padding: 18px;
            background: rgba(9, 14, 25, 0.8);
          }

          .ml-process-step {
            width: 30px;
            height: 30px;
            border-radius: 9px;
            display: grid;
            place-items: center;
            color: #062233;
            background: linear-gradient(145deg, #1cd59c 0%, #2da8ff 100%);
            font-weight: 700;
            margin-bottom: 12px;
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

          .ml-footer {
            padding: 30px 0 60px;
            color: #7488a4;
            font-size: 12px;
          }

          @media (max-width: 1080px) {
            .ml-hero {
              grid-template-columns: 1fr;
              gap: 22px;
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
          }

          @media (max-width: 760px) {
            .ml-shell {
              padding: 0 16px;
            }

            .ml-nav-row {
              height: auto;
              padding: 14px 0;
              align-items: flex-start;
              flex-direction: column;
            }

            .ml-feature-grid,
            .ml-process-grid,
            .ml-stat-band {
              grid-template-columns: 1fr;
            }

            .ml-thumbs {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .ml-title {
              letter-spacing: -0.6px;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              background: 'none',
              border: '1px solid #333',
              color: theme.colors.white,
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Pricing
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: '1px solid #333',
              color: theme.colors.white,
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Log in
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: theme.colors.teal,
              border: 'none',
              color: theme.colors.white,
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Get started
          </button>
        </div>
      </header>

      <main className="ml-shell">
        <section className="ml-hero">
          <div>
            <div className="ml-eyebrow">Built for serious options traders</div>
            <h1 className="ml-title">Your trades already have patterns. TradeBetter helps you see them.</h1>
            <p className="ml-sub">
              Stop journaling in scattered spreadsheets. Import your history, break down your edge,
              and get clear feedback on what to keep doing and what to stop.
            </p>

            <div className="ml-cta-row">
              <button className="ml-btn ml-btn-primary" onClick={() => navigate('/login')}>Try TradeBetter</button>
              <button className="ml-btn" onClick={() => navigate('/pricing')}>View plans</button>
            </div>
            <div className="ml-note">Cancel anytime. Keep your data. No bloated setup process.</div>

            <div className="ml-proof-row">
              <div className="ml-chip">Trade imports</div>
              <div className="ml-chip">Daily and weekly reviews</div>
              <div className="ml-chip">Tagging and notes</div>
              <div className="ml-chip">AI insights on Pro</div>
            </div>
          </div>

          <div className="ml-hero-visual">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <img src={primaryLogo} alt="TradeBetter" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
              <div style={{ fontSize: '13px', color: '#96aeca' }}>Live Journal Snapshot</div>
            </div>

            <div className="ml-visual-grid">
              <div className="ml-kpi">
                <div className="ml-kpi-label">Net P&L</div>
                <div className="ml-kpi-value" style={{ color: '#39d98a' }}>+$2,845</div>
                <div className="ml-kpi-sub">Last 30 days</div>
              </div>
              <div className="ml-kpi">
                <div className="ml-kpi-label">Win Rate</div>
                <div className="ml-kpi-value">64%</div>
                <div className="ml-kpi-sub">132 closed trades</div>
              </div>
              <div className="ml-kpi">
                <div className="ml-kpi-label">Best Setup</div>
                <div className="ml-kpi-value" style={{ fontSize: '18px' }}>Opening Range</div>
                <div className="ml-kpi-sub">+71% win rate</div>
              </div>
              <div className="ml-kpi">
                <div className="ml-kpi-label">Most Costly Mistake</div>
                <div className="ml-kpi-value" style={{ color: '#ff7b89', fontSize: '18px' }}>Late Entries</div>
                <div className="ml-kpi-sub">- $940 impact</div>
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
          <h2 className="ml-h2">Built for conversion from data to better execution</h2>
          <p className="ml-p">
            Every part of TradeBetter is designed to answer one question quickly: what should you do more of,
            and what should you cut out immediately?
          </p>
          <div className="ml-feature-grid">
            {featureItems.map((item) => (
              <article key={item.title} className="ml-feature-card">
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ml-section">
          <h2 className="ml-h2">How traders use it every week</h2>
          <p className="ml-p">Simple loop. Import, review, adjust, repeat.</p>
          <div className="ml-process-grid">
            {processItems.map((item) => (
              <article key={item.title} className="ml-process-card">
                <div className="ml-process-step">{item.step}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: '19px' }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#8ea4be', lineHeight: 1.6 }}>{item.body}</p>
              </article>
            ))}
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

        <section className="ml-final">
          <div>
            <h3>Ready to trade with clarity and consistency?</h3>
            <p>
              Start now, import your history, and make your next week in the market more structured than your last.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="ml-btn" onClick={() => navigate('/pricing')}>Compare plans</button>
            <button className="ml-btn ml-btn-primary" onClick={() => navigate('/login')}>Get started</button>
          </div>
        </section>

        <footer className="ml-footer">TradeBetter Journal Platform</footer>      
        </main>
    </div>
  );
};

export default MarketingLanding;
