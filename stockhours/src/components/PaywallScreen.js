import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import primaryLogo from '../assets/3.png';

const BROKERS = ['thinkorswim', 'IBKR', 'Schwab', 'Webull'];

const OUTCOMES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'See your real edge',
    body: 'Win rates, profit factors, and P&L broken down by day, setup, and symbol — so you know exactly where your money comes from.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: 'Catch mistakes before they compound',
    body: 'Tag every setup and error. Over time, patterns emerge — and you stop paying the same tuition twice.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: 'Get coached after every session',
    body: "Pro's AI reads your trades, spots what went wrong, and gives you a specific action item for tomorrow — not generic advice.",
  },
];

const PaywallScreen = () => {
  const { currentUser, displayName, refreshSubscription, subscriptionLoading, isSubscribed, logout } = useAuth();
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();

  const apiBase = process.env.REACT_APP_STRIPE_API_URL || '';

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      monthlyPrice: 10,
      yearlyPrice: 102,
      yearlyMonthly: 8.5,
      description: 'Import your trades and see exactly where your edge is.',
      features: [
        'Import trades from any broker (CSV)',
        'Daily P&L stats, win rates, and reports',
        'Tag setups & mistakes to find patterns',
        'Rate every trade to build accountability',
        'Connect 1 broker for auto-sync',
      ],
      highlight: false,
      badge: null,
      cta: 'Get Started',
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 25,
      yearlyPrice: 255,
      yearlyMonthly: 21.25,
      description: 'Everything in Basic, plus an AI coach that tells you exactly what to fix.',
      features: [
        "AI reviews every trade — what worked, what didn't",
        'End-of-day debrief with personalized coaching',
        'Pattern detection across your full trade history',
        'Weekly AI review with goals for next week',
        'Connect unlimited brokers',
      ],
      highlight: true,
      badge: 'Most Popular',
      cta: 'Start Improving Now',
    },
  ];

  const getPrice = (plan) => {
    if (billingCycle === 'yearly') {
      const val = plan.yearlyMonthly % 1 === 0 ? plan.yearlyMonthly : plan.yearlyMonthly.toFixed(2);
      return `$${val}`;
    }
    return `$${plan.monthlyPrice}`;
  };

  const getSavings = (plan) => (plan.monthlyPrice * 12) - plan.yearlyPrice;

  const startCheckout = async (plan) => {
    setError('');
    setActionLoading(plan);
    try {
      if (!apiBase) {
        setError('Stripe API is not configured. Set REACT_APP_STRIPE_API_URL in the frontend env.');
        return;
      }
      const token = await currentUser.getIdToken();
      const response = await fetch(`${apiBase}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan, billing: billingCycle }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to start checkout.');
      }
      const data = await response.json();
      window.location.assign(data.url);
    } catch (err) {
      setError(err.message || 'Unable to start checkout.');
    } finally {
      setActionLoading('');
    }
  };

  useEffect(() => {
    if (isSubscribed) navigate('/dashboard', { replace: true });
  }, [isSubscribed, navigate]);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const userDisplayName = displayName || currentUser?.email || '';
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020810', color: theme.colors.white, overflowX: 'hidden' }}>

      {/* ── Header ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(2,8,16,0.9)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={primaryLogo} alt="TradeBetter" style={{ height: '34px' }} />
          <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em' }}>TradeBetter</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: theme.colors.teal, color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, flexShrink: 0,
          }}>
            {userInitial}
          </div>
          <span style={{ fontSize: '13px', color: '#666', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser?.email}
          </span>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: '1px solid #222', color: '#555',
              padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#555'; }}
          >
            Back to Home
          </button>
          <button
            onClick={handleSignOut}
            style={{
              background: 'none', border: '1px solid #222', color: '#555',
              padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#555'; }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Background glow — behind everything */}
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '800px', height: '500px',
          background: 'radial-gradient(ellipse at 50% 20%, rgba(45,212,191,0.11) 0%, rgba(45,212,191,0.03) 50%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', top: '10%', left: '65%',
          width: '400px', height: '300px',
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Hero + Plans (above the fold) ── */}
        <div style={{ position: 'relative', zIndex: 1, padding: '36px 32px 16px', textAlign: 'center' }}>

          {/* Broker pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'rgba(45,212,191,0.07)',
            border: '1px solid rgba(45,212,191,0.16)',
            borderRadius: '20px', padding: '5px 14px', marginBottom: '18px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.colors.teal }} />
            <span style={{ fontSize: '12px', color: '#888', letterSpacing: '0.01em' }}>
              Works with {BROKERS.join(' · ')}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800,
            margin: '0 auto 10px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            maxWidth: '520px',
          }}>
            Stop guessing why you're losing trades.
          </h1>
          <p style={{
            color: '#7a8a9a', fontSize: '15px',
            maxWidth: '400px', margin: '0 auto 22px', lineHeight: 1.6,
          }}>
            Track every trade, tag every mistake, and use AI to find exactly what to fix.
          </p>

          {/* Billing toggle */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            backgroundColor: '#0d1117', padding: '4px',
            borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)',
            marginBottom: '28px',
          }}>
            {['monthly', 'yearly'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                style={{
                  padding: '8px 18px', borderRadius: '7px', border: 'none',
                  backgroundColor: billingCycle === cycle ? 'rgba(45,212,191,0.15)' : 'transparent',
                  color: billingCycle === cycle ? theme.colors.teal : '#555',
                  cursor: 'pointer', fontSize: '13px',
                  fontWeight: billingCycle === cycle ? 600 : 400,
                  transition: 'all 0.18s ease',
                  display: 'flex', alignItems: 'center', gap: '7px',
                }}
              >
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                {cycle === 'yearly' && (
                  <span style={{
                    backgroundColor: billingCycle === 'yearly' ? 'rgba(45,212,191,0.25)' : 'rgba(45,212,191,0.1)',
                    color: theme.colors.teal, padding: '2px 6px',
                    borderRadius: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.03em',
                  }}>
                    SAVE 15%
                  </span>
                )}
              </button>
            ))}
          </div>

          {error && (
            <div style={{
              marginBottom: '16px',
              backgroundColor: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)',
              color: '#ff6b6b', padding: '10px 16px', borderRadius: '8px',
              maxWidth: '460px', margin: '0 auto 16px', fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          {/* Plan cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px',
            maxWidth: '680px',
            margin: '0 auto',
            textAlign: 'left',
          }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  backgroundColor: plan.highlight ? '#06111e' : '#080d14',
                  borderRadius: '16px',
                  padding: '28px 24px 24px',
                  border: plan.highlight
                    ? '1px solid rgba(45,212,191,0.4)'
                    : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: plan.highlight
                    ? '0 0 0 1px rgba(45,212,191,0.06), 0 16px 48px rgba(45,212,191,0.07)'
                    : 'none',
                  position: 'relative',
                }}
              >
                {/* Top teal line on Pro */}
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
                    background: `linear-gradient(to right, transparent, ${theme.colors.teal}, transparent)`,
                  }} />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: theme.colors.teal, color: '#000',
                    fontSize: '10px', fontWeight: 800, padding: '3px 12px',
                    borderRadius: '20px', whiteSpace: 'nowrap',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    {plan.badge}
                  </div>
                )}

                <h2 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700, color: plan.highlight ? theme.colors.teal : '#bbb' }}>
                  {plan.name}
                </h2>
                <div style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '2px' }}>
                  {getPrice(plan)}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#4a5a6a', marginLeft: '2px' }}>/mo</span>
                </div>

                <div style={{ fontSize: '12px', marginBottom: '14px', marginTop: '4px', minHeight: '16px' }}>
                  {billingCycle === 'yearly'
                    ? <span style={{ color: theme.colors.teal }}>${plan.yearlyPrice}/yr — save ${getSavings(plan)}</span>
                    : <span style={{ color: 'transparent' }}>—</span>
                  }
                </div>

                <div style={{ color: '#5a6a7a', marginBottom: '16px', fontSize: '13px', lineHeight: 1.5 }}>
                  {plan.description}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px 0' }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{
                      marginBottom: '9px', display: 'flex', alignItems: 'flex-start',
                      gap: '8px', fontSize: '13px', lineHeight: 1.4, color: '#b8c8d8',
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke={plan.highlight ? theme.colors.teal : '#2a5a50'}
                        strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => startCheckout(plan.id)}
                  disabled={!!actionLoading}
                  style={{
                    backgroundColor: plan.highlight ? theme.colors.teal : 'transparent',
                    border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: plan.highlight ? '#000' : '#888',
                    padding: '13px 16px', borderRadius: '9px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    width: '100%', fontSize: '14px', fontWeight: 700,
                    letterSpacing: '-0.01em', transition: 'all 0.15s',
                    opacity: actionLoading && actionLoading !== plan.id ? 0.45 : 1,
                  }}
                  onMouseEnter={e => {
                    if (actionLoading) return;
                    if (plan.highlight) {
                      e.currentTarget.style.backgroundColor = theme.colors.tealDark;
                    } else {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={e => {
                    if (plan.highlight) {
                      e.currentTarget.style.backgroundColor = theme.colors.teal;
                    } else {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.color = '#888';
                    }
                  }}
                >
                  {actionLoading === plan.id ? 'Redirecting...' : plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: '24px', marginTop: '20px', flexWrap: 'wrap',
          }}>
            {[
              { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>, text: 'Secure checkout via Stripe' },
              { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><polyline points="9 10 4 15 9 20" /><path d="M20 4v7a4 4 0 0 1-4 4H4" /></svg>, text: 'Cancel anytime' },
              { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>, text: 'No hidden fees' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#444', fontSize: '12px' }}>
                {icon}{text}
              </div>
            ))}
          </div>

          {/* Already subscribed */}
          <div style={{ marginTop: '14px' }}>
            <button
              onClick={refreshSubscription}
              disabled={subscriptionLoading}
              style={{
                background: 'none', border: 'none', color: '#333',
                cursor: 'pointer', fontSize: '12px',
                textDecoration: 'underline', textDecorationColor: '#2a3a4a',
              }}
            >
              {subscriptionLoading ? 'Checking...' : 'Already subscribed? Click here to refresh'}
            </button>
          </div>
        </div>

        {/* ── What you unlock (below the fold) ── */}
        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: '780px', margin: '48px auto 0', padding: '0 32px 64px',
        }}>
          <div style={{
            height: '1px', margin: '0 auto 40px',
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)',
          }} />
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#3a5a55', textTransform: 'uppercase', marginBottom: '8px' }}>
              What's inside
            </p>
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>
              Built for traders who want to get better
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {OUTCOMES.map((item) => (
              <div key={item.title} style={{
                flex: '1 1 200px', maxWidth: '240px',
                backgroundColor: '#080f18',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '14px', padding: '22px 18px',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  backgroundColor: 'rgba(45,212,191,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '7px', letterSpacing: '-0.01em' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: '#4a5a6a', lineHeight: 1.6 }}>
                  {item.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaywallScreen;
