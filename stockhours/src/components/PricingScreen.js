import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import secondaryLogo from '../assets/2.png';

const PricingScreen = () => {
  const navigate = useNavigate();
  const { currentUser, subscription, isSubscribed } = useAuth();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [portalLoading, setPortalLoading] = useState(false);

  const apiBase = process.env.REACT_APP_STRIPE_API_URL || '';
  const currentPlan = subscription?.plan || 'none';
  const currentInterval = subscription?.interval || 'monthly';

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      monthlyPrice: 20,
      yearlyPrice: 204,
      yearlyMonthly: 17,
      description: 'Everything you need to import and analyze trades.',
      features: [
        'Trade imports',
        'Daily stats + reports',
        'Tagging, notes, ratings',
        'Full access to trade data',
        '1 broker connection'
      ],
      highlight: false
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 45,
      yearlyPrice: 456,
      yearlyMonthly: 38,
      description: 'All Basic features plus AI-driven insights.',
      features: [
        'Everything in Basic',
        'AI trade review prompts',
        'Pattern detection insights',
        'Strategy summaries',
        'Unlimited broker connections'
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
    const yearlySavings = (plan.monthlyPrice * 12) - plan.yearlyPrice;
    return yearlySavings;
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${apiBase}/api/stripe/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Unable to open portal.');
      }

      const data = await response.json();
      window.location.assign(data.url);
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setPortalLoading(false);
    }
  };

  const isCurrentPlan = (planId) => {
    return isSubscribed && currentPlan === planId && currentInterval === billingCycle;
  };

  const getButtonText = (plan) => {
    if (isCurrentPlan(plan.id)) {
      return portalLoading ? 'Opening...' : 'Manage Subscription';
    }
    if (currentUser) {
      return `Get ${plan.name}`;
    }
    return `Get ${plan.name}`;
  };

  const handlePlanClick = (plan) => {
    if (isCurrentPlan(plan.id)) {
      handleManageSubscription();
    } else if (currentUser) {
      navigate('/paywall');
    } else {
      navigate('/login');
    }
  };

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
          {currentUser ? (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                backgroundColor: theme.colors.teal,
                border: 'none',
                color: theme.colors.white,
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Go to Dashboard
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </header>

      <main style={{ padding: '56px 32px 80px' }}>
        <section style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '40px', marginBottom: '12px' }}>Simple, transparent pricing</h1>
          <p style={{ color: '#b5b5b5', fontSize: '18px', margin: '0 0 28px 0' }}>
            Pick the plan that matches your trading workflow. Upgrade or cancel anytime.
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
        </section>

        <section
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
              key={plan.name}
              style={{
                backgroundColor: plan.highlight ? '#101010' : '#0d0d0d',
                borderRadius: '16px',
                padding: '28px',
                border: isCurrentPlan(plan.id)
                  ? `2px solid ${theme.colors.teal}`
                  : plan.highlight
                    ? '1px solid #2f3d58'
                    : '1px solid #222',
                boxShadow: plan.highlight ? '0 24px 60px rgba(0, 123, 255, 0.18)' : 'none',
                position: 'relative'
              }}
            >
              {isCurrentPlan(plan.id) && (
                <span
                  style={{
                    position: 'absolute',
                    top: '18px',
                    right: '18px',
                    padding: '4px 10px',
                    backgroundColor: 'rgba(45, 212, 191, 0.2)',
                    color: theme.colors.teal,
                    borderRadius: '999px',
                    fontSize: '11px',
                    border: `1px solid ${theme.colors.teal}`
                  }}
                >
                  Current plan
                </span>
              )}
              {!isCurrentPlan(plan.id) && plan.highlight && (
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
              <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '4px' }}>
                {getPrice(plan)}
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#8c8c8c' }}>/month</span>
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
              <p style={{ color: '#a8a8a8', marginBottom: '18px' }}>{plan.description}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px 0', color: '#d5d5d5' }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.teal} strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePlanClick(plan)}
                disabled={isCurrentPlan(plan.id) && portalLoading}
                style={{
                  width: '100%',
                  backgroundColor: isCurrentPlan(plan.id)
                    ? 'transparent'
                    : plan.highlight
                      ? '#1b66ff'
                      : theme.colors.teal,
                  border: isCurrentPlan(plan.id) ? `1px solid ${theme.colors.teal}` : 'none',
                  color: theme.colors.white,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                {getButtonText(plan)}
              </button>
            </div>
          ))}
        </section>

        <section style={{ textAlign: 'center', marginTop: '32px', color: '#7a7a7a', fontSize: '13px' }}>
          Questions? Email support and we'll help you choose.
        </section>
      </main>
    </div>
  );
};

export default PricingScreen;
