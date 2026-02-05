import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import primaryLogo from '../assets/3.png';

const PaywallScreen = () => {
  const { currentUser, subscription, refreshSubscription, subscriptionLoading, isSubscribed } = useAuth();
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const navigate = useNavigate();

  const apiBase = process.env.REACT_APP_STRIPE_API_URL || '';

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
        body: JSON.stringify({ plan })
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
              backgroundColor: theme.colors.green,
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
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Choose your plan</h1>
          <p style={{ color: '#aaa' }}>
            Your account is not subscribed yet. Pick a plan to unlock TradeBetter.
          </p>
          {error && (
            <div
              style={{
                marginTop: '16px',
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                color: '#ff6b6b',
                padding: '12px 16px',
                borderRadius: '8px'
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0d0d0d',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #222'
            }}
          >
            <h2 style={{ marginTop: 0 }}>Basic</h2>
            <div style={{ color: '#aaa', marginBottom: '16px' }}>For trade import + analytics</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#ddd' }}>
              <li style={{ marginBottom: '8px' }}>Trade imports</li>
              <li style={{ marginBottom: '8px' }}>Daily stats + reports</li>
              <li style={{ marginBottom: '8px' }}>Tagging, notes, ratings</li>
              <li>Full access to trade data</li>
            </ul>
            <button
              onClick={() => startCheckout('basic')}
              style={{
                backgroundColor: theme.colors.green,
                border: 'none',
                color: theme.colors.white,
                padding: '10px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%'
              }}
              disabled={actionLoading === 'basic'}
            >
              {actionLoading === 'basic' ? 'Redirecting...' : 'Choose Basic'}
            </button>
          </div>

          <div
            style={{
              backgroundColor: '#101010',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #2c2c2c',
              boxShadow: '0 0 20px rgba(0, 123, 255, 0.12)'
            }}
          >
            <h2 style={{ marginTop: 0 }}>Pro</h2>
            <div style={{ color: '#aaa', marginBottom: '16px' }}>All Basic features + AI insights</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', color: '#ddd' }}>
              <li style={{ marginBottom: '8px' }}>Everything in Basic</li>
              <li style={{ marginBottom: '8px' }}>AI trade review prompts</li>
              <li style={{ marginBottom: '8px' }}>Pattern detection insights</li>
              <li>Strategy summaries</li>
            </ul>
            <button
              onClick={() => startCheckout('pro')}
              style={{
                backgroundColor: '#1b66ff',
                border: 'none',
                color: theme.colors.white,
                padding: '10px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%'
              }}
              disabled={actionLoading === 'pro'}
            >
              {actionLoading === 'pro' ? 'Redirecting...' : 'Choose Pro'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '24px', color: '#888' }}>
          Current plan: <strong style={{ color: theme.colors.white }}>{subscription.plan}</strong>
        </div>
      </main>
    </div>
  );
};

export default PaywallScreen;
