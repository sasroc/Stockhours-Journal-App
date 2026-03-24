import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import primaryLogo from '../assets/3.png';

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
        'Connect 1 broker for auto-sync'
      ],
      highlight: false,
      badge: null,
      cta: 'Get Started'
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 25,
      yearlyPrice: 255,
      yearlyMonthly: 21.25,
      description: 'Everything in Basic, plus an AI coach that tells you exactly what to fix.',
      features: [
        'AI reviews every trade — what worked, what didn\'t',
        'End-of-day debrief with personalized coaching',
        'Pattern detection across your full trade history',
        'Weekly AI review with goals for next week',
        'Connect unlimited brokers'
      ],
      highlight: true,
      badge: 'Most Popular',
      cta: 'Start Improving Now'
    }
  ];

  const getPrice = (plan) => {
    if (billingCycle === 'yearly') {
      const val = plan.yearlyMonthly % 1 === 0 ? plan.yearlyMonthly : plan.yearlyMonthly.toFixed(2);
      return `$${val}`;
    }
    return `$${plan.monthlyPrice}`;
  };

  const getSavings = (plan) => {
    return (plan.monthlyPrice * 12) - plan.yearlyPrice;
  };

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan, billing: billingCycle })
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
    if (isSubscribed) {
      navigate('/dashboard', { replace: true });
    }
  }, [isSubscribed, navigate]);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const userDisplayName = displayName || currentUser?.email || '';
  const userInitial = userDisplayName.charAt(0).toUpperCase();

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
        {/* Left: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={primaryLogo} alt="TradeBetter Logo" style={{ height: '42px' }} />
          <span style={{ fontSize: '20px', fontWeight: 600 }}>TradeBetter</span>
        </div>

        {/* Right: user info + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: theme.colors.teal,
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0
            }}>
              {userInitial}
            </div>
            <span style={{ fontSize: '13px', color: '#aaa', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.email}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: '1px solid #333',
              color: '#888',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#666'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888'; }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main style={{ padding: '52px 32px 64px' }}>
        {/* Hero copy */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.2 }}>
            Stop guessing why you're losing trades.
          </h1>
          <p style={{ color: '#aaa', fontSize: '16px', maxWidth: '480px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            TradeBetter tracks every trade, tags every mistake, and uses AI to show you exactly what to fix — so you can grow your account faster.
          </p>

          {/* Billing Toggle */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#1a1a1a',
              padding: '6px',
              borderRadius: '10px',
              border: '1px solid #333'
            }}
          >
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: billingCycle === 'monthly' ? theme.colors.teal : 'transparent',
                color: billingCycle === 'monthly' ? '#fff' : '#888',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: billingCycle === 'yearly' ? theme.colors.teal : 'transparent',
                color: billingCycle === 'yearly' ? '#fff' : '#888',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Yearly
              <span
                style={{
                  backgroundColor: billingCycle === 'yearly' ? 'rgba(255,255,255,0.2)' : 'rgba(45, 212, 191, 0.2)',
                  color: billingCycle === 'yearly' ? '#fff' : theme.colors.teal,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                Save 15%
              </span>
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: '16px',
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                color: '#ff6b6b',
                padding: '12px 16px',
                borderRadius: '8px',
                maxWidth: '500px',
                margin: '16px auto 0'
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Plan cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            maxWidth: '700px',
            margin: '0 auto'
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                backgroundColor: plan.highlight ? '#0e1620' : '#0d0d0d',
                borderRadius: '14px',
                padding: '28px 24px 24px',
                border: plan.highlight ? `1px solid ${theme.colors.teal}` : '1px solid #222',
                boxShadow: plan.highlight ? `0 0 32px rgba(45, 212, 191, 0.12)` : 'none',
                position: 'relative'
              }}
            >
              {/* Most Popular badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute',
                  top: '-13px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: theme.colors.teal,
                  color: '#000',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 14px',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  {plan.badge}
                </div>
              )}

              <h2 style={{ marginTop: 0, marginBottom: '4px', fontSize: '20px' }}>{plan.name}</h2>
              <div style={{ fontSize: '34px', fontWeight: 700, marginBottom: '4px' }}>
                {getPrice(plan)}
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#8c8c8c' }}>/month</span>
              </div>
              {billingCycle === 'yearly' && (
                <div style={{ fontSize: '13px', color: theme.colors.teal, marginBottom: '12px' }}>
                  ${plan.yearlyPrice} billed yearly — save ${getSavings(plan)}
                </div>
              )}
              {billingCycle === 'monthly' && (
                <div style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>
                  Billed monthly
                </div>
              )}
              <div style={{ color: '#888', marginBottom: '18px', fontSize: '13px', lineHeight: 1.5 }}>{plan.description}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', color: '#ddd' }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', lineHeight: 1.4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.teal} strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startCheckout(plan.id)}
                style={{
                  backgroundColor: plan.highlight ? theme.colors.teal : '#1e1e1e',
                  border: plan.highlight ? 'none' : '1px solid #333',
                  color: plan.highlight ? '#000' : theme.colors.white,
                  padding: '13px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '15px',
                  fontWeight: 700,
                  transition: 'opacity 0.15s'
                }}
                disabled={actionLoading === plan.id}
                onMouseEnter={e => { if (!actionLoading) e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {actionLoading === plan.id ? 'Redirecting...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust signals */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '28px',
          marginTop: '32px',
          flexWrap: 'wrap'
        }}>
          {[
            { icon: '🔒', text: 'Secure checkout via Stripe' },
            { icon: '↩️', text: 'Cancel anytime, no questions' },
            { icon: '💳', text: 'No hidden fees' }
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#666', fontSize: '13px' }}>
              <span style={{ fontSize: '14px' }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {/* Already subscribed link */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={refreshSubscription}
            style={{
              background: 'none',
              border: 'none',
              color: '#555',
              cursor: 'pointer',
              fontSize: '13px',
              textDecoration: 'underline',
              textDecorationColor: '#333'
            }}
            disabled={subscriptionLoading}
          >
            {subscriptionLoading ? 'Checking...' : 'Already subscribed? Click here to refresh'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default PaywallScreen;
