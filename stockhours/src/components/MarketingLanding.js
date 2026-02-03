import React from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';
import primaryLogo from '../assets/1.png';
import secondaryLogo from '../assets/2.png';

const MarketingLanding = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: theme.colors.white }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 32px',
          borderBottom: '1px solid #222',
          backgroundColor: '#0d0d0d'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={secondaryLogo} alt="TradeLens Logo" style={{ height: '42px' }} />
          <span style={{ fontSize: '20px', fontWeight: 600 }}>TradeLens</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

      <main style={{ padding: '48px 32px' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            alignItems: 'center',
            marginBottom: '48px'
          }}
        >
          <div>
            <h1 style={{ fontSize: '40px', marginBottom: '16px' }}>
              Track performance, refine strategy, trade with clarity.
            </h1>
            <p style={{ color: '#aaa', fontSize: '18px', lineHeight: 1.6 }}>
              TradeLens turns raw broker exports into clean analytics, daily breakdowns,
              and actionable insights so you can focus on better trading decisions.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: theme.colors.green,
                  border: 'none',
                  color: theme.colors.white,
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                Start now
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: '1px solid #333',
                  color: theme.colors.white,
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                See pricing
              </button>
            </div>
          </div>
          <div
            style={{
              backgroundColor: '#0d0d0d',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #222',
              textAlign: 'center'
            }}
          >
            <img
              src={primaryLogo}
              alt="TradeLens Preview"
              style={{ width: '160px', marginBottom: '16px', filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' }}
            />
            <div style={{ color: '#bbb', fontSize: '14px' }}>
              Visual dashboards, daily stats, and trade-level analysis.
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>What you get</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}
          >
            {[
              'Fast trade imports with clean grouping',
              'Daily stats + cumulative P&L tracking',
              'Performance reports by date and setup',
              'Tagging, notes, and custom ratings'
            ].map((item) => (
              <div
                key={item}
                style={{
                  backgroundColor: '#111',
                  borderRadius: '10px',
                  padding: '16px',
                  border: '1px solid #222',
                  color: '#ddd'
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#0d0d0d',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #222'
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Simple plans</h2>
          <p style={{ color: '#aaa', marginBottom: '20px' }}>
            Choose the plan that fits your workflow. Basic gives you everything you need to
            import and analyze trades. Pro adds AI-driven insights on top.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: theme.colors.green,
              border: 'none',
              color: theme.colors.white,
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            Sign up to continue
          </button>
        </section>
      </main>
    </div>
  );
};

export default MarketingLanding;
