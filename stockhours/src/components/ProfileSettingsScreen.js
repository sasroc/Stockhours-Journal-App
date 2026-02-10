import React, { useState } from 'react';
import { theme } from '../theme';

const ProfileSettingsScreen = ({ currentUser, subscription }) => {
  const userEmail = currentUser?.email || 'Unknown';
  const userId = currentUser?.uid || 'Unknown';
  const planName = subscription?.plan || 'none';
  const statusName = subscription?.status || 'inactive';
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  const apiBase = process.env.REACT_APP_STRIPE_API_URL || '';

  const handleManageSubscription = async () => {
    setPortalError('');
    setPortalLoading(true);
    try {
      if (!apiBase) {
        setPortalError('Stripe API is not configured. Set REACT_APP_STRIPE_API_URL in the frontend env.');
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
    } catch (error) {
      setPortalError(error.message || 'Unable to open portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleChangePlan = async (newPlan) => {
    setUpgradeError('');
    setUpgradeLoading(true);
    try {
      if (!apiBase) {
        setUpgradeError('Stripe API is not configured.');
        return;
      }
      const token = await currentUser.getIdToken();
      const response = await fetch(`${apiBase}/api/stripe/change-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan: newPlan })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to change plan.');
      }

      window.location.reload();
    } catch (error) {
      setUpgradeError(error.message || 'Failed to change plan.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const isActive = statusName === 'active' || statusName === 'trialing';

  return (
    <div style={{ color: theme.colors.white }}>
      <h2 style={{ marginTop: 0, fontSize: '24px' }}>Profile Settings</h2>
      <p style={{ color: '#888', marginTop: '4px' }}>
        Manage your account information and preferences.
      </p>

      <div
        style={{
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: '#121F35',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #233350',
          }}
        >
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Email</div>
          <div style={{ fontSize: '15px' }}>{userEmail}</div>
        </div>
        <div
          style={{
            backgroundColor: '#121F35',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #233350',
          }}
        >
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>User ID</div>
          <div style={{ fontSize: '15px', wordBreak: 'break-all' }}>{userId}</div>
        </div>
        <div
          style={{
            backgroundColor: '#121F35',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #233350',
          }}
        >
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Plan</div>
          <div style={{ fontSize: '15px', textTransform: 'capitalize' }}>{planName}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '6px', textTransform: 'capitalize' }}>
            Status: {statusName}
          </div>
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            style={{
              marginTop: '12px',
              backgroundColor: theme.colors.green,
              color: theme.colors.white,
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {portalLoading ? 'Opening...' : 'Manage subscription'}
          </button>
          {portalError && (
            <div style={{ marginTop: '10px', color: '#ff6b6b', fontSize: '12px' }}>
              {portalError}
            </div>
          )}
        </div>
      </div>

      {isActive && planName === 'basic' && (
        <div
          style={{
            marginTop: '24px',
            background: 'linear-gradient(135deg, #4a1a8a 0%, #6c3ce0 100%)',
            borderRadius: '10px',
            padding: '20px',
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: '18px', color: '#fff' }}>Upgrade to Pro</h3>
          <p style={{ color: '#ddd', margin: '8px 0 12px', fontSize: '14px', lineHeight: '1.5' }}>
            Unlock the full power of TradeBetter:
          </p>
          <ul style={{ color: '#ddd', margin: '0 0 16px', paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
            <li>AI Trade Reviews &mdash; personalized coaching on every trade</li>
            <li>AI Pattern Detection &mdash; spot trends across your history</li>
            <li>AI Weekly Reviews &mdash; weekly performance summaries</li>
            <li>AI Daily Debrief &mdash; end-of-day journal coaching</li>
          </ul>
          <button
            onClick={() => handleChangePlan('pro')}
            disabled={upgradeLoading}
            style={{
              backgroundColor: '#fff',
              color: '#4a1a8a',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {upgradeLoading ? 'Upgrading...' : 'Upgrade to Pro \u2014 $45/mo'}
          </button>
          {upgradeError && (
            <div style={{ marginTop: '10px', color: '#ff6b6b', fontSize: '12px' }}>
              {upgradeError}
            </div>
          )}
        </div>
      )}

      {isActive && planName === 'pro' && (
        <div
          style={{
            marginTop: '24px',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #233350',
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>
            You're on the <strong style={{ color: '#fff' }}>Pro</strong> plan.
          </p>
          <button
            onClick={() => handleChangePlan('basic')}
            disabled={upgradeLoading}
            style={{
              marginTop: '10px',
              backgroundColor: 'transparent',
              color: '#888',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: '13px',
              textDecoration: 'underline',
            }}
          >
            {upgradeLoading ? 'Switching...' : 'Switch to Basic \u2014 $20/mo'}
          </button>
          {upgradeError && (
            <div style={{ marginTop: '10px', color: '#ff6b6b', fontSize: '12px' }}>
              {upgradeError}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: '24px',
          backgroundColor: '#121F35',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #233350',
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: '18px' }}>Preferences</h3>
        <p style={{ color: '#888', margin: 0 }}>
          Profile preferences will appear here as they are added.
        </p>
      </div>
    </div>
  );
};

export default ProfileSettingsScreen;
