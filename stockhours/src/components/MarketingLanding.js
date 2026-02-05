import React from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';
import primaryLogo from '../assets/3.png';
import secondaryLogo from '../assets/2.png';

const MarketingLanding = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000',
        color: theme.colors.white,
        backgroundImage: [
          'radial-gradient(circle at top, rgba(0, 123, 255, 0.18), transparent 55%)',
          'radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.12), transparent 35%)',
          'radial-gradient(circle at 80% 10%, rgba(14, 165, 233, 0.12), transparent 30%)'
        ].join(', ')
      }}
    >
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
              backgroundColor: theme.colors.green,
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

      <main style={{ padding: '64px 32px 96px' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '40px',
            alignItems: 'center',
            marginBottom: '64px'
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: 'rgba(0, 123, 255, 0.12)',
                border: '1px solid rgba(0, 123, 255, 0.35)',
                borderRadius: '999px',
                fontSize: '12px',
                color: '#cfe2ff'
              }}
            >
              Built for active traders
            </span>
            <h1 style={{ fontSize: '48px', marginBottom: '16px', marginTop: '18px' }}>
              Track performance, refine strategy, trade with clarity.
            </h1>
            <p style={{ color: '#b5b5b5', fontSize: '18px', lineHeight: 1.7 }}>
              TradeBetter turns raw broker exports into clean analytics, daily breakdowns,
              and actionable insights so you can focus on better trading decisions.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: theme.colors.green,
                  border: 'none',
                  color: theme.colors.white,
                  padding: '12px 22px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  boxShadow: '0 12px 24px rgba(16, 185, 129, 0.25)'
                }}
              >
                Start free
              </button>
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  background: 'none',
                  border: '1px solid #333',
                  color: theme.colors.white,
                  padding: '12px 22px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                View pricing
              </button>
            </div>
            <div style={{ marginTop: '18px', color: '#7a7a7a', fontSize: '13px' }}>
              No contracts. Upgrade anytime. Cancel in one click.
            </div>
          </div>
          <div
            style={{
              backgroundColor: '#0d0d0d',
              borderRadius: '16px',
              padding: '30px',
              border: '1px solid #222',
              textAlign: 'center',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45), 0 0 30px rgba(0, 123, 255, 0.12)'
            }}
          >
            <img
              src={primaryLogo}
              alt="TradeBetter Preview"
              style={{ width: '190px', marginBottom: '18px', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.8))' }}
            />
            <div style={{ color: '#c5c5c5', fontSize: '14px', lineHeight: 1.6 }}>
              Visual dashboards, daily stats, trade-level analysis, and rapid import workflows.
            </div>
            <div
              style={{
                marginTop: '18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '10px'
              }}
            >
              {['Daily P&L', 'Win rate', 'Tagging', 'Reports'].map((item) => (
                <div
                  key={item}
                  style={{
                    backgroundColor: '#111',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    color: '#a8a8a8',
                    border: '1px solid #1f1f1f'
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '64px' }}>
          <h2 style={{ fontSize: '26px', marginBottom: '16px' }}>What you get</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px'
            }}
          >
            {[
              { title: 'Fast imports', detail: 'Upload broker exports and auto-group trades.' },
              { title: 'Daily clarity', detail: 'See daily P&L, win rate, and volume.' },
              { title: 'Actionable reports', detail: 'Filter by date, setup, and tags.' },
              { title: 'Trade journaling', detail: 'Add notes, ratings, and mistakes.' }
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  backgroundColor: '#111',
                  borderRadius: '12px',
                  padding: '18px',
                  border: '1px solid #222',
                  boxShadow: '0 16px 32px rgba(0, 0, 0, 0.25)'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>{item.title}</div>
                <div style={{ color: '#9a9a9a', fontSize: '14px', lineHeight: 1.6 }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#0d0d0d',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid #222',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h2 style={{ fontSize: '26px', marginBottom: '10px' }}>Ready to level up your journal?</h2>
            <p style={{ color: '#9a9a9a', margin: 0 }}>
              Choose a plan and get your trading data organized in minutes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                background: 'none',
                border: '1px solid #333',
                color: theme.colors.white,
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              View pricing
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: theme.colors.green,
                border: 'none',
                color: theme.colors.white,
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Get started
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MarketingLanding;
