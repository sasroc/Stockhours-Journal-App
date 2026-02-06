import React, { useState } from 'react';
import { theme } from '../theme';

const ProfileSettingsScreen = ({ currentUser, subscription }) => {
  const userEmail = currentUser?.email || 'Unknown';
  const userId = currentUser?.uid || 'Unknown';
  const planName = subscription?.plan || 'none';
  const statusName = subscription?.status || 'inactive';
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');

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
