import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import primaryLogo from '../assets/3.png';

const PaywallScreen = () => {
  const { currentUser, subscription, refreshSubscription, subscriptionLoading, isSubscribed } = useAuth();
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();

  const apiBase = process.env.REACT_APP_STRIPE_API_URL || '';

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      monthlyPrice: 20,
      yearlyPrice: 204,
      yearlyMonthly: 17,
      description: 'For trade import + analytics',
      features: [
        'Trade imports',
        'Daily stats + reports',
        'Tagging, notes, ratings',
        'Full access to trade data'
      ],
      highlight: false
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 45,
      yearlyPrice: 456,
      yearlyMonthly: 38,
      description: 'All Basic features + AI insights',
      features: [
        'Everything in Basic',
        'AI trade review prompts',
        'Pattern detection insights',
        'Strategy summaries'
      ],
      highlight: true
    }
  ];

  const getPrice = (plan) => {
    if (billingCycle === 'yearly') {
      return `$${plan.yearlyMonthly}`;
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

  const handleManageSubscription = async () => {
    setError('');
    setActionLoading('portal');
    try {
      if (!apiBase) {
        setError('Stripe API is not configured. Set REACT_APP_STRIPE_API_URL in the frontend env.');
        return;
      }
      const token = await currentUser.getIdToken();
      const response = await fetch(`${apiBase}/api/stripe/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to open portal.');
      }

      const data = await response.json();
      window.location.assign(data.url);
    } catch (err) {
      setError(err.message || 'Unable to open portal.');
    } finally {
      setActionLoading('');
    }
  };

  useEffect(() => {
    if (isSubscribed) {
      navigate('/dashboard', { replace: true });
    }
  }, [isSubscribed, navigate]);

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
          <img src={primaryLogo} alt="TradeBetter Logo" style={{ height: '42px' }} />
          <span style={{ fontSize: '20px', fontWeight: 600 }}>TradeBetter</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={refreshSubscription}
            style={{
              background: 'none',
              border: '1px solid #333',
              color: theme.colors.white,
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            disabled={subscriptionLoading}
          >
            {subscriptionLoading ? 'Refreshing...' : 'Refresh status'}
          </button>
          <button
            onClick={handleManageSubscription}
            style={{
              backgroundColor: theme.colors.teal,
              border: 'none',
              color: theme.colors.white,
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            disabled={actionLoading === 'portal'}
          >
            {actionLoading === 'portal' ? 'Opening...' : 'Manage subscription'}
          </button>
        </div>
      </header>

      <main style={{ padding: '48px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Choose your plan</h1>
          <p style={{ color: '#aaa', marginBottom: '24px' }}>
            Your account is not subscribed yet. Pick a plan to unlock TradeBetter.
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
                backgroundColor: plan.highlight ? '#101010' : '#0d0d0d',
                borderRadius: '12px',
                padding: '24px',
                border: plan.highlight ? '1px solid #2c2c2c' : '1px solid #222',
                boxShadow: plan.highlight ? '0 0 20px rgba(0, 123, 255, 0.12)' : 'none'
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '4px' }}>{plan.name}</h2>
              <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>
                {getPrice(plan)}
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#8c8c8c' }}>/month</span>
              </div>
              {billingCycle === 'yearly' && (
                <div style={{ fontSize: '13px', color: theme.colors.teal, marginBottom: '12px' }}>
                  ${plan.yearlyPrice} billed yearly — save ${getSavings(plan)}
                </div>
              )}
              {billingCycle === 'monthly' && (
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  Billed monthly
                </div>
              )}
              <div style={{ color: '#aaa', marginBottom: '16px', fontSize: '14px' }}>{plan.description}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#ddd' }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.teal} strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startCheckout(plan.id)}
                style={{
                  backgroundColor: plan.highlight ? '#1b66ff' : theme.colors.teal,
                  border: 'none',
                  color: theme.colors.white,
                  padding: '12px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '14px',
                  fontWeight: 600
                }}
                disabled={actionLoading === plan.id}
              >
                {actionLoading === plan.id ? 'Redirecting...' : `Choose ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px', color: '#888', textAlign: 'center' }}>
          Current plan: <strong style={{ color: theme.colors.white }}>{subscription.plan}</strong>
        </div>
      </main>
    </div>
  );
};

export default PaywallScreen;
