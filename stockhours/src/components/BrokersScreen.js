import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import secondaryLogo from '../assets/2.png';
import schwabLogo from '../assets/schwab-logo.png';
import ibkrLogo from '../assets/ibkr-logo.png';
import moomooLogo from '../assets/moomoo-logo-png_seeklogo-463955.png';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const directBrokers = [
  {
    name: 'Charles Schwab',
    logo: schwabLogo,
    badge: 'Live',
    badgeColor: '#2DD4BF',
    badgeBg: 'rgba(45,212,191,0.1)',
    badgeBorder: 'rgba(45,212,191,0.28)',
    description: 'Connect your Schwab account with one click. TradeBetter syncs your last 60 days of options activity automatically — no file exports needed.',
    perks: [
      'OAuth — no credentials stored',
      'Auto-syncs last 60 days of trades',
      'Deduplication on every sync',
      'Re-sync anytime in Imports',
    ],
  },
];

const csvBrokers = [
  {
    name: 'thinkorswim (Schwab)',
    logo: schwabLogo,
    badge: 'Supported',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(96,165,250,0.08)',
    badgeBorder: 'rgba(96,165,250,0.25)',
    description: 'Export your trade history from the thinkorswim platform as a CSV. TradeBetter auto-detects the format and parses it instantly.',
    steps: [
      'Open thinkorswim → Monitor → Account Statement',
      'Set your date range and export as CSV',
      'Upload the file on the Imports screen',
    ],
  },
  {
    name: 'Interactive Brokers (IBKR)',
    logo: ibkrLogo,
    badge: 'Supported',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(96,165,250,0.08)',
    badgeBorder: 'rgba(96,165,250,0.25)',
    description: 'Download an Activity Statement from IBKR Client Portal. TradeBetter recognizes the format automatically — no configuration needed.',
    steps: [
      'Log in to IBKR Client Portal → Reports → Activity',
      'Choose CSV format and select your date range',
      'Upload the file on the Imports screen',
    ],
  },
  {
    name: 'MooMoo',
    logo: moomooLogo,
    badge: 'Supported',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(96,165,250,0.08)',
    badgeBorder: 'rgba(96,165,250,0.25)',
    description: 'Export your trade history from MooMoo as a CSV file. TradeBetter parses the format automatically — just upload and go.',
    steps: [
      'Open MooMoo → Account → Trade History',
      'Set your date range and export as CSV',
      'Upload the file on the Imports screen',
    ],
  },
];

const BrokerCard = ({ broker, variant }) => (
  <div style={{
    borderRadius: '16px',
    border: '1px solid rgba(118,140,168,0.22)',
    background: 'linear-gradient(180deg, rgba(13,19,33,0.9) 0%, rgba(9,13,23,0.94) 100%)',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  }}>
    {/* Header row */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '12px', overflow: 'hidden',
          background: '#fff', border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {broker.logo
            ? <img src={broker.logo} alt={broker.name} style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
            : <span style={{ fontSize: '13px', fontWeight: 800, color: broker.logoTextColor || '#1a1a1a', letterSpacing: '-0.3px', textAlign: 'center', lineHeight: 1.1 }}>{broker.logoText}</span>
          }
        </div>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#e8f1fb', letterSpacing: '-0.2px' }}>
            {broker.name}
          </div>
          <div style={{
            marginTop: '5px',
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 9px', borderRadius: '999px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
            color: broker.badgeColor,
            background: broker.badgeBg,
            border: `1px solid ${broker.badgeBorder}`,
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: broker.badgeColor, display: 'inline-block',
            }} />
            {broker.badge}
          </div>
        </div>
      </div>
    </div>

    <p style={{ margin: 0, color: '#8ca4be', fontSize: '14px', lineHeight: 1.7 }}>
      {broker.description}
    </p>

    {/* Perks (direct) or Steps (csv) */}
    {variant === 'direct' && broker.perks && (
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {broker.perks.map((perk) => (
          <li key={perk} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#afc4da' }}>
            <CheckIcon />
            {perk}
          </li>
        ))}
      </ul>
    )}

    {variant === 'csv' && broker.steps && (
      <div>
        <div style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#566880', marginBottom: '12px' }}>
          How to export
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {broker.steps.map((step, i) => (
            <li key={step} style={{ display: 'flex', gap: '10px', fontSize: '13.5px', color: '#9ab4cc' }}>
              <span style={{
                flexShrink: 0, width: '20px', height: '20px', borderRadius: '6px',
                background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#2DD4BF',
              }}>
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    )}
  </div>
);

const SectionLabel = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: '24px' }}>
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      padding: '6px 14px', borderRadius: '999px',
      fontSize: '12px', letterSpacing: '0.4px', fontWeight: 600,
      color: '#2DD4BF',
      background: 'rgba(45,212,191,0.08)',
      border: '1px solid rgba(45,212,191,0.22)',
      marginBottom: '14px',
    }}>
      {icon}
      {title}
    </div>
    <h2 style={{
      margin: '0 0 8px', fontSize: 'clamp(22px, 3.5vw, 30px)',
      fontWeight: 700, letterSpacing: '-0.4px', color: '#e8f2fc',
    }}>
      {subtitle}
    </h2>
  </div>
);

const BrokersScreen = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div style={{
      minHeight: '100vh',
      color: theme.colors.white,
      overflowX: 'hidden',
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
          padding: isMobile ? '0 16px' : '0 24px',
          height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              flexShrink: 0,
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', overflow: 'hidden',
              background: '#0b0b0b', border: '1px solid #1f1f1f',
              boxShadow: '0 6px 16px rgba(0,0,0,0.5), 0 0 14px rgba(0,123,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <img src={secondaryLogo} alt="TradeBetter" style={{
                width: '46px', height: '46px', objectFit: 'cover', objectPosition: 'center',
                transform: 'scale(1.1) translateX(6px)',
              }} />
            </div>
            {!isMobile && (
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#f2f7ff', letterSpacing: '0.2px' }}>
                TradeBetter
              </span>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => navigate('/home')}
              style={{
                background: 'none', border: '1px solid rgba(130,155,185,0.28)',
                color: '#afc4db', padding: isMobile ? '7px 12px' : '8px 16px',
                borderRadius: '8px', cursor: 'pointer',
                fontSize: isMobile ? '12px' : '13.5px', transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(130,155,185,0.55)'; e.currentTarget.style.color = '#dce9f5'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(130,155,185,0.28)'; e.currentTarget.style.color = '#afc4db'; }}
            >
              ← Back
            </button>
            <button
              onClick={() => navigate(currentUser ? '/paywall' : '/login')}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, #1ecf97 0%, #2db9ff 100%)',
                color: '#03131a', fontWeight: 700,
                padding: isMobile ? '7px 14px' : '9px 18px',
                borderRadius: '8px', cursor: 'pointer',
                fontSize: isMobile ? '12px' : '13.5px',
                boxShadow: '0 8px 20px rgba(46,204,113,0.18), 0 6px 16px rgba(45,185,255,0.2)',
                whiteSpace: 'nowrap',
              }}
            >
              {currentUser ? 'Subscribe' : 'Get started'}
            </button>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: '960px', margin: '0 auto',
        padding: isMobile ? '0 16px 80px' : '0 24px 100px',
      }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: isMobile ? '40px 0 36px' : '64px 0 56px' }}>
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
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Broker Support
          </div>
          <h1 style={{
            margin: '0 0 16px',
            fontSize: 'clamp(26px, 5vw, 46px)',
            lineHeight: 1.08, letterSpacing: '-0.7px', fontWeight: 800,
          }}>
            Connect your broker.<br />
            <span style={{ color: '#2DD4BF' }}>Start journaling today.</span>
          </h1>
          <p style={{
            margin: '0 auto', maxWidth: '52ch',
            color: '#8fa8c4', fontSize: isMobile ? '15px' : '17px', lineHeight: 1.7,
          }}>
            TradeBetter supports direct OAuth connections for instant syncing, plus CSV imports for all other brokers. Getting your trade history in takes less than two minutes.
          </p>
        </div>

        {/* Direct Link section */}
        <section style={{ marginBottom: '48px' }}>
          <SectionLabel
            icon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            }
            title="Direct Connection"
            subtitle="One-click OAuth sync — no files needed"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {directBrokers.map((broker) => (
              <BrokerCard key={broker.name} broker={broker} variant="direct" />
            ))}
          </div>
          <p style={{
            marginTop: '14px', fontSize: '13px', color: '#4f6478',
            paddingLeft: '4px',
          }}>
            More direct connections are on the roadmap. Vote or request yours via the support email.
          </p>
        </section>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: '12px', color: '#3e526a', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>or import a file</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* CSV section */}
        <section style={{ marginBottom: '48px' }}>
          <SectionLabel
            icon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            }
            title="CSV Import"
            subtitle="Export from your broker, upload in seconds"
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '16px',
          }}>
            {csvBrokers.map((broker) => (
              <BrokerCard key={broker.name} broker={broker} variant="csv" />
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div style={{
          borderRadius: '20px',
          padding: isMobile ? '28px 20px' : '36px 32px',
          border: '1px solid rgba(117,140,170,0.28)',
          background: `
            radial-gradient(45% 80% at 0% 100%, rgba(46,185,255,0.12), transparent 75%),
            radial-gradient(45% 80% at 100% 0%, rgba(40,210,140,0.11), transparent 75%),
            rgba(8,13,24,0.92)
          `,
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: isMobile ? '20px' : '24px', fontWeight: 700, letterSpacing: '-0.35px' }}>
              Ready to import your first trades?
            </h3>
            <p style={{ margin: 0, color: '#7a96b2', fontSize: '14.5px', lineHeight: 1.65 }}>
              Create your account, pick a plan, and get your journal set up in minutes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                border: '1px solid rgba(130,155,185,0.35)', background: 'rgba(10,16,28,0.7)',
                color: '#c8d8ec', padding: '11px 22px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
                flex: isMobile ? 1 : undefined,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(45,212,191,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(130,155,185,0.35)'; }}
            >
              View plans
            </button>
            <button
              onClick={() => navigate(currentUser ? '/paywall' : '/login')}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, #1ecf97 0%, #2db9ff 100%)',
                color: '#03131a', fontWeight: 700,
                padding: '11px 22px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '14px',
                boxShadow: '0 10px 24px rgba(46,204,113,0.2), 0 8px 20px rgba(45,185,255,0.22)',
                flex: isMobile ? 1 : undefined,
              }}
            >
              {currentUser ? 'Subscribe' : 'Get started'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default BrokersScreen;
