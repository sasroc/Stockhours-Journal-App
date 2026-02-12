import React from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';
import secondaryLogo from '../assets/2.png';

const PricingScreen = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Basic',
      price: '$20',
      cadence: '/month',
      description: 'Everything you need to import and analyze trades.',
      features: [
        'Trade imports',
        'Daily stats + reports',
        'Tagging, notes, ratings',
        'Full access to trade data'
      ],
      cta: 'Get Basic',
      highlight: false
    },
    {
      name: 'Pro',
      price: '$45',
      cadence: '/month',
      description: 'All Basic features plus AI-driven insights.',
      features: [
        'Everything in Basic',
        'AI trade review prompts',
        'Pattern detection insights',
        'Strategy summaries'
      ],
      cta: 'Get Pro',
      highlight: true
    }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000',
        color: theme.colors.white,
        backgroundImage: 'radial-gradient(circle at top, rgba(0, 123, 255, 0.12), transparent 55%)'
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 32px',
          borderBottom: '1px solid #222',
          backgroundColor: 'rgba(13, 13, 13, 0.9)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(8px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={secondaryLogo} alt="TradeBetter Logo" style={{ height: '42px' }} />
          <span style={{ fontSize: '20px', fontWeight: 600 }}>TradeBetter</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: '1px solid #333',
              color: theme.colors.white,
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Back to home
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
            Log in
          </button>
        </div>
      </header>

      <main style={{ padding: '56px 32px 80px' }}>
        <section style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '40px', marginBottom: '12px' }}>Simple, transparent pricing</h1>
          <p style={{ color: '#b5b5b5', fontSize: '18px', margin: 0 }}>
            Pick the plan that matches your trading workflow. Upgrade or cancel anytime.
          </p>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            maxWidth: '980px',
            margin: '0 auto'
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                backgroundColor: plan.highlight ? '#101010' : '#0d0d0d',
                borderRadius: '16px',
                padding: '28px',
                border: plan.highlight ? '1px solid #2f3d58' : '1px solid #222',
                boxShadow: plan.highlight ? '0 24px 60px rgba(0, 123, 255, 0.18)' : 'none',
                position: 'relative'
              }}
            >
              {plan.highlight && (
                <span
                  style={{
                    position: 'absolute',
                    top: '18px',
                    right: '18px',
                    padding: '4px 10px',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    color: '#cfe2ff',
                    borderRadius: '999px',
                    fontSize: '11px',
                    border: '1px solid rgba(0, 123, 255, 0.4)'
                  }}
                >
                  Most popular
                </span>
              )}
              <h2 style={{ marginTop: 0, marginBottom: '8px' }}>{plan.name}</h2>
              <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '6px' }}>
                {plan.price}
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#8c8c8c' }}>{plan.cadence}</span>
              </div>
              <p style={{ color: '#a8a8a8', marginBottom: '18px' }}>{plan.description}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px 0', color: '#d5d5d5' }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ marginBottom: '8px' }}>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  backgroundColor: plan.highlight ? '#1b66ff' : theme.colors.teal,
                  border: 'none',
                  color: theme.colors.white,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </section>

        <section style={{ textAlign: 'center', marginTop: '32px', color: '#7a7a7a', fontSize: '13px' }}>
          Questions? Email support and we’ll help you choose.
        </section>
      </main>
    </div>
  );
};

export default PricingScreen;
