import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import secondaryLogo from '../assets/2.png';
import { usePageMeta } from '../hooks/usePageMeta';

const categories = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
    faqs: [
      {
        q: 'What exactly is TradeBetter?',
        a: 'TradeBetter is a trading journal built specifically for options traders. You import your trade history from your broker, and TradeBetter automatically groups executions into round-trips, calculates P&L, and gives you a structured dashboard to review your performance — daily, weekly, and across your full history. Pro subscribers also get AI-powered coaching on individual trades, daily sessions, detected patterns, and weekly plans.',
      },
      {
        q: 'How do I get started?',
        a: 'Create an account, choose a plan (Basic or Pro), then head to the Imports screen. If you use Schwab or Webull, connect directly via OAuth for automatic syncing. If you use thinkorswim or IBKR, export a CSV from your broker and upload it. TradeBetter auto-detects the format and has your journal populated in seconds.',
      },
      {
        q: 'What brokers and import formats are supported?',
        a: 'Direct OAuth connections are available for Charles Schwab and Webull — these sync automatically without any file export. For manual imports, TradeBetter supports thinkorswim CSV exports (TD Ameritrade format) and IBKR Activity Statements. Additional broker support is on the roadmap.',
      },
      {
        q: 'Does TradeBetter work for stocks and futures, or only options?',
        a: 'TradeBetter is purpose-built for options traders. The trade grouping logic, P&L calculations, and analytics are all designed around options round-trips — grouping executions by symbol, strike, expiry, and contract type. Stock and futures imports may parse, but the full analysis engine is optimized for options.',
      },
      {
        q: 'Is there an iOS app?',
        a: 'Yes. TradeBetter is available as a native app on the App Store for iPhone and iPad. The iOS app uses the same account as the web app, so your full journal is available across all your devices in sync.',
      },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    faqs: [
      {
        q: 'What does the Dashboard show?',
        a: "The Dashboard gives you a high-level view of your trading performance: net P&L, win rate, average win/loss, streaks, and a trend chart — all scoped to a date range you control. It's designed to answer \"how am I doing right now?\" in one glance.",
      },
      {
        q: 'What is the Daily Stats screen?',
        a: 'Daily Stats breaks down your performance session by session. You can see each trading day\'s P&L, win rate, number of trades, and compare days side by side. It also shows your AI Daily Debrief (Pro) for each session — coaching notes tied to how that specific day went against your stated goals.',
      },
      {
        q: 'How does trade tagging work?',
        a: 'On any individual trade you can apply setup tags (e.g. "Opening Range", "Earnings Play") and mistake tags (e.g. "Chased Entry", "Held Too Long"), give it a star rating, and add freeform notes. These tags feed directly into the Reports screen, where you can see your win rate and P&L broken down by setup and mistake type — so you know exactly which behaviors are helping or hurting you.',
      },
      {
        q: 'What does the Reports screen analyze?',
        a: 'Reports surfaces patterns across your full trade history: performance by symbol, by day of week, by time of day, by setup tag, by mistake tag, and more. The goal is to find where your real edge is and where your losses are clustering. Pro subscribers also get an AI Insights tab that synthesizes these stats into plain-language behavioral patterns.',
      },
      {
        q: 'What is the Weekly Review?',
        a: 'The Weekly Review screen lets you write a structured end-of-week summary. Pro users can generate an AI-written review that reads your actual weekly stats and trade data, then produces a focused plan: what worked, what to cut, and what to focus on next week. Reviews are saved to your journal and build up over time as a performance log.',
      },
      {
        q: 'How does the AI work and what can it actually tell me?',
        a: "TradeBetter uses GPT-4o to analyze your real trade data — not generic advice. There are four AI features: Trade Review (coaching on a specific trade's entry, sizing, and exit), Daily Debrief (session-level feedback against your goals), Pattern Detection (cross-history insights surfacing behavioral trends from your full trade log), and Weekly Review (a data-backed weekly plan). All AI features read your trading profile — your stated goals, max loss targets, and gain targets — to make feedback relevant to your specific situation.",
      },
      {
        q: 'Can I connect multiple broker accounts?',
        a: 'Pro subscribers can connect unlimited broker accounts. Basic subscribers are limited to one broker connection. Broker connections are read-only — TradeBetter pulls transaction history only and cannot execute trades.',
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing & Plans',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    faqs: [
      {
        q: "What's the difference between Basic and Pro?",
        a: 'Basic ($10/mo or $8.50/mo billed yearly) includes trade imports, the full dashboard, daily stats, all-trades view, reports, weekly reviews, tagging, notes, ratings, and one broker connection. Pro ($25/mo or $21.25/mo billed yearly) adds all four AI features (Trade Review, Daily Debrief, Pattern Detection, Weekly Review) and unlimited broker connections.',
      },
      {
        q: 'How does yearly billing work?',
        a: 'Yearly plans are billed as a single upfront charge — $102/yr for Basic (equivalent to $8.50/mo) and $255/yr for Pro (equivalent to $21.25/mo). That saves you $18 on Basic and $45 on Pro compared to paying monthly. You can switch between monthly and yearly billing from the subscription management portal.',
      },
      {
        q: 'Can I upgrade from Basic to Pro?',
        a: 'Yes — navigate to Settings → Subscription and select Pro. Stripe will prorate the difference, so you only pay for the upgrade from your current billing date. Downgrading works the same way and takes effect at the next billing cycle.',
      },
      {
        q: 'Can I cancel my subscription at any time?',
        a: "Yes — no contracts, no cancellation fees. For web (Stripe) billing, go to Settings → Subscription → Manage Subscription and cancel there. Your access continues through the end of the current billing period. For iOS subscribers, manage billing through your Apple ID in the App Store. Either way, your data stays intact after cancellation.",
      },
      {
        q: 'What happens to my data if I cancel?',
        a: "Your account and all trade data remain in your journal after cancellation. You'll lose access to Pro features (AI tools and multiple broker connections on Pro, or all features on Basic), but nothing is deleted. Resubscribe at any time and everything picks up exactly where you left off.",
      },
      {
        q: 'Do you offer refunds?',
        a: 'We evaluate refund requests case by case. If you run into a technical issue that prevented you from using the product, reach out to support at rsassanimarketing@gmail.com and we\'ll work with you. For general "I changed my mind" cancellations, we don\'t typically issue refunds on completed billing periods.',
      },
    ],
  },
  {
    id: 'data',
    label: 'Data & Privacy',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    faqs: [
      {
        q: 'Is my trading data private and secure?',
        a: "Yes. Your trade data is stored in a private Firestore document accessible only to your account. It is never shared with other users, sold to third parties, or used to train AI models. Broker OAuth tokens are encrypted at rest. TradeBetter's AI features send your trade data to OpenAI to generate responses, but this is governed by OpenAI's API data usage policies (not used for model training by default).",
      },
      {
        q: 'Will TradeBetter ever execute trades on my behalf?',
        a: 'No. Broker connections (Schwab, Webull) are strictly read-only — TradeBetter only requests permission to read your transaction history. There is no write access to your brokerage account, no order placement, and no position management of any kind.',
      },
      {
        q: 'Where is my data stored?',
        a: "All user data is stored in Google Firebase (Firestore), a SOC 2 and ISO 27001-certified cloud platform. Your trade history, notes, tags, ratings, and trading profile are stored in your private user document. Broker OAuth tokens are stored in encrypted subcollections accessible only to your account.",
      },
      {
        q: 'Can I export my trade data?',
        a: 'Yes. You can export your full trade journal as a CSV from the Imports screen. Your data is always yours — no lock-in. We recommend keeping a periodic backup if you want an offline copy of your history.',
      },
    ],
  },
  {
    id: 'technical',
    label: 'Technical',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    faqs: [
      {
        q: 'How does TradeBetter group my trades?',
        a: 'TradeBetter automatically groups individual executions into round-trip trades using a combination of symbol, expiry date, strike price, contract type (call/put), and trade date. For example, if you bought 5 contracts of AAPL Jan 150C and closed them in two separate fills, TradeBetter combines those into one trade group and computes the blended P&L. This means your journal always reflects the full picture of each position.',
      },
      {
        q: 'How often should I sync my broker account?',
        a: "Schwab and Webull syncs fetch the last 60 days of transactions each time (the maximum the APIs allow). Syncing after each session or once a day keeps your journal current. Syncing is safe to run repeatedly — TradeBetter uses a unique activity ID per transaction for deduplication, so running the sync multiple times won't create duplicates.",
      },
      {
        q: 'My broker connection says it expired. What do I do?',
        a: 'Broker OAuth tokens expire periodically as a security measure. When yours expires, go to the Imports screen, disconnect your broker, then click Connect again to go through the short authorization flow. The whole process takes about 30 seconds and your existing trade data is unaffected.',
      },
    ],
  },
];

const FAQScreen = () => {
  usePageMeta({
    title: 'FAQ — TradeBetter | Options Trading Journal Questions Answered',
    description: 'Answers to common questions about TradeBetter — brokers supported, AI features, pricing plans, data security, the iOS app, and how to get started journaling your options trades.',
    canonical: 'https://tradebetter.net/faq',
  });
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [openKey, setOpenKey] = useState(null);
  const [activeCategory, setActiveCategory] = useState('getting-started');

  const toggle = (key) => setOpenKey(openKey === key ? null : key);

  const activeData = categories.find((c) => c.id === activeCategory);

  return (
    <div style={{
      minHeight: '100vh',
      color: theme.colors.white,
      background: `
        radial-gradient(70% 45% at 50% 0%, rgba(46,204,113,0.09), transparent 65%),
        radial-gradient(45% 30% at 8% 8%, rgba(0,123,255,0.14), transparent 75%),
        radial-gradient(45% 30% at 92% 10%, rgba(45,212,191,0.09), transparent 75%),
        linear-gradient(180deg, #05070c 0%, #070d17 50%, #04060b 100%)
      `,
    }}>

      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        backdropFilter: 'blur(10px)',
        background: 'rgba(8,12,20,0.82)',
        borderBottom: '1px solid rgba(140,169,201,0.14)',
      }}>
        <div style={{
          maxWidth: '1240px', margin: '0 auto',
          padding: '0 24px', height: '72px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden',
              background: '#0b0b0b', border: '1px solid #1f1f1f',
              boxShadow: '0 6px 16px rgba(0,0,0,0.5), 0 0 14px rgba(0,123,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <img src={secondaryLogo} alt="TradeBetter" style={{
                width: '50px', height: '50px', objectFit: 'cover', objectPosition: 'center',
                transform: 'scale(1.1) translateX(6px)',
              }} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#f2f7ff', letterSpacing: '0.2px' }}>
              TradeBetter
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/home')}
              style={{
                background: 'none', border: '1px solid rgba(130,155,185,0.28)',
                color: '#afc4db', padding: '8px 16px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '13.5px', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(130,155,185,0.55)'; e.currentTarget.style.color = '#dce9f5'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(130,155,185,0.28)'; e.currentTarget.style.color = '#afc4db'; }}
            >
              ← Back to home
            </button>
            <button
              onClick={() => navigate(currentUser ? '/paywall' : '/login')}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, #1ecf97 0%, #2db9ff 100%)',
                color: '#03131a', fontWeight: 700,
                padding: '9px 18px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '13.5px',
                boxShadow: '0 8px 20px rgba(46,204,113,0.18), 0 6px 16px rgba(45,185,255,0.2)',
              }}
            >
              {currentUser ? 'Subscribe' : 'Get started'}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 100px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '64px 0 52px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '6px 14px', borderRadius: '999px',
            fontSize: '12px', letterSpacing: '0.4px', fontWeight: 600,
            color: '#2DD4BF',
            background: 'rgba(45,212,191,0.08)',
            border: '1px solid rgba(45,212,191,0.22)',
            marginBottom: '20px',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Frequently Asked Questions
          </div>
          <h1 style={{
            fontSize: 'clamp(30px, 5vw, 46px)', lineHeight: 1.1,
            letterSpacing: '-0.7px', margin: '0 0 16px',
          }}>
            Everything you need to know
          </h1>
          <p style={{
            color: '#8fa8c2', fontSize: '17px', lineHeight: 1.7,
            maxWidth: '520px', margin: '0 auto',
          }}>
            Can't find what you're looking for? Email us at{' '}
            <a href="mailto:rsassanimarketing@gmail.com" style={{ color: '#2DD4BF', textDecoration: 'none' }}>
              rsassanimarketing@gmail.com
            </a>
          </p>
        </div>

        {/* Category tabs */}
        <div style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap',
          justifyContent: 'center', marginBottom: '48px',
        }}>
          {categories.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setOpenKey(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 18px', borderRadius: '10px',
                  fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                  border: isActive
                    ? '1px solid rgba(45,212,191,0.45)'
                    : '1px solid rgba(110,135,165,0.28)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(45,212,191,0.14), rgba(59,130,246,0.16))'
                    : 'rgba(10,16,28,0.6)',
                  color: isActive ? '#e2f5f0' : '#8da6bf',
                  boxShadow: isActive ? '0 0 0 1px rgba(45,212,191,0.2)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(110,135,165,0.5)'; e.currentTarget.style.color = '#c8daea'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(110,135,165,0.28)'; e.currentTarget.style.color = '#8da6bf'; } }}
              >
                <span style={{ opacity: isActive ? 1 : 0.65, color: isActive ? '#2DD4BF' : 'inherit' }}>
                  {cat.icon}
                </span>
                {cat.label}
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  padding: '2px 7px', borderRadius: '999px',
                  background: isActive ? 'rgba(45,212,191,0.18)' : 'rgba(100,130,165,0.18)',
                  color: isActive ? '#2DD4BF' : '#6a8aaa',
                }}>
                  {cat.faqs.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* FAQ list */}
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '20px', paddingBottom: '16px',
            borderBottom: '1px solid rgba(100,130,165,0.15)',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(45,212,191,0.2), rgba(59,130,246,0.22))',
              border: '1px solid rgba(45,212,191,0.3)',
              display: 'grid', placeItems: 'center',
              color: '#2DD4BF', flexShrink: 0,
            }}>
              {activeData.icon}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#ddeaf7', letterSpacing: '-0.2px' }}>
                {activeData.label}
              </div>
              <div style={{ fontSize: '13px', color: '#5d7a96', marginTop: '2px' }}>
                {activeData.faqs.length} questions
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeData.faqs.map((item, i) => {
              const key = `${activeCategory}-${i}`;
              const isOpen = openKey === key;
              return (
                <div
                  key={key}
                  style={{
                    borderRadius: '16px',
                    border: isOpen
                      ? '1px solid rgba(45,212,191,0.32)'
                      : '1px solid rgba(100,125,158,0.2)',
                    background: isOpen
                      ? 'linear-gradient(180deg, rgba(45,212,191,0.04) 0%, rgba(9,13,23,0.92) 100%)'
                      : 'linear-gradient(180deg, rgba(13,19,33,0.85) 0%, rgba(9,13,23,0.9) 100%)',
                    overflow: 'hidden',
                    transition: 'border-color 0.25s, background 0.25s',
                    boxShadow: isOpen ? '0 0 0 1px rgba(45,212,191,0.08), 0 8px 24px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  <button
                    onClick={() => toggle(key)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      padding: '20px 22px', textAlign: 'left',
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: '16px',
                    }}
                  >
                    <span style={{
                      fontSize: '15.5px', fontWeight: 600, lineHeight: 1.4,
                      letterSpacing: '-0.1px',
                      color: isOpen ? '#e6f2fc' : '#c4d8ec',
                      transition: 'color 0.2s',
                    }}>
                      {item.q}
                    </span>
                    <span style={{
                      flexShrink: 0, width: '28px', height: '28px',
                      borderRadius: '8px', display: 'grid', placeItems: 'center',
                      border: isOpen ? '1px solid rgba(45,212,191,0.4)' : '1px solid rgba(90,120,158,0.3)',
                      background: isOpen ? 'rgba(45,212,191,0.12)' : 'rgba(18,28,46,0.7)',
                      transition: 'all 0.25s',
                    }}>
                      <svg
                        width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke={isOpen ? '#2DD4BF' : '#6a8aaa'} strokeWidth="2.5" strokeLinecap="round"
                        style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                      >
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </span>
                  </button>

                  <div style={{
                    overflow: 'hidden',
                    maxHeight: isOpen ? '600px' : '0',
                    opacity: isOpen ? 1 : 0,
                    transition: 'max-height 0.38s ease, opacity 0.25s ease',
                  }}>
                    <p style={{
                      margin: 0, padding: '0 22px 22px',
                      color: '#7e9ab4', fontSize: '14.5px', lineHeight: 1.75,
                      borderTop: '1px solid rgba(85,115,150,0.13)',
                      paddingTop: '16px',
                    }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Still have questions CTA */}
        <div style={{
          maxWidth: '820px', margin: '60px auto 0',
          borderRadius: '20px', padding: '36px 40px',
          border: '1px solid rgba(100,130,165,0.22)',
          background: `
            radial-gradient(50% 80% at 0% 100%, rgba(46,185,255,0.1), transparent 70%),
            radial-gradient(50% 80% at 100% 0%, rgba(40,210,140,0.1), transparent 70%),
            rgba(8,13,24,0.9)
          `,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap',
        }}>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', letterSpacing: '-0.3px', color: '#ddeaf7' }}>
              Still have questions?
            </h3>
            <p style={{ margin: 0, color: '#6e8ea8', fontSize: '14.5px', lineHeight: 1.65 }}>
              We're happy to help. Send us an email and we'll get back to you.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href="mailto:rsassanimarketing@gmail.com"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 22px', borderRadius: '10px',
                background: 'rgba(45,212,191,0.08)',
                border: '1px solid rgba(45,212,191,0.25)',
                color: '#2DD4BF', fontSize: '14px', fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.14)'; e.currentTarget.style.borderColor = 'rgba(45,212,191,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.08)'; e.currentTarget.style.borderColor = 'rgba(45,212,191,0.25)'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              Email support
            </a>
            <button
              onClick={() => navigate(currentUser ? '/paywall' : '/login')}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, #1ecf97 0%, #2db9ff 100%)',
                color: '#03131a', fontWeight: 700,
                padding: '12px 22px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '14px',
                boxShadow: '0 8px 20px rgba(46,204,113,0.16), 0 6px 14px rgba(45,185,255,0.18)',
              }}
            >
              Get started
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default FAQScreen;
