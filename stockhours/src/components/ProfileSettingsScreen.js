import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import OnboardingModal from './OnboardingModal';

const ProfileSettingsScreen = ({ currentUser, subscription }) => {
  const navigate = useNavigate();
  const { logout, displayName, updateDisplayName, tradingProfile } = useAuth();
  const userEmail = currentUser?.email || 'Unknown';
  const planName = subscription?.plan || 'none';
  const statusName = subscription?.status || 'inactive';
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleEditName = () => {
    setNameInput(displayName);
    setNameError('');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { setNameError('Display name cannot be empty.'); return; }
    setNameSaving(true);
    setNameError('');
    try {
      await updateDisplayName(trimmed);
      setEditingName(false);
    } catch (e) {
      setNameError('Failed to save. Please try again.');
    } finally {
      setNameSaving(false);
    }
  };

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

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${apiBase}/api/user/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to delete account.');
      }
      await logout();
      navigate('/home');
    } catch (error) {
      setDeleteError(error.message || 'Failed to delete account. Please try again.');
      setDeleteLoading(false);
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
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Display Name</div>
          {editingName ? (
            <div>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                autoFocus
                maxLength={50}
                style={{
                  width: '100%',
                  backgroundColor: '#0A1628',
                  color: '#fff',
                  border: '1px solid #2DD4BF',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {nameError && <div style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px' }}>{nameError}</div>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving}
                  style={{
                    backgroundColor: theme.colors.teal,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    cursor: nameSaving ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    opacity: nameSaving ? 0.7 : 1,
                  }}
                >
                  {nameSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  disabled={nameSaving}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#888',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '15px' }}>{displayName || <span style={{ color: '#555' }}>Not set</span>}</div>
              <button
                onClick={handleEditName}
                style={{
                  backgroundColor: 'transparent',
                  color: theme.colors.teal,
                  border: '1px solid ' + theme.colors.teal,
                  borderRadius: '6px',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Edit
              </button>
            </div>
          )}
        </div>
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
              backgroundColor: theme.colors.teal,
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

      {isActive && (
        <div
          style={{
            marginTop: '24px',
            backgroundColor: '#121F35',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #233350',
          }}
        >
          <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#aaa' }}>
            You're on the <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{planName}</strong> plan.
            {planName === 'basic' && ' Upgrade to Pro for AI-powered insights.'}
          </p>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              backgroundColor: theme.colors.teal,
              color: theme.colors.white,
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Change Plan
          </button>
        </div>
      )}

      {/* Trading Strategy */}
      <div
        style={{
          marginTop: '24px',
          backgroundColor: '#121F35',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #233350',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Trading Strategy</h3>
          <button
            onClick={() => setShowEditProfile(true)}
            style={{
              backgroundColor: 'transparent',
              color: theme.colors.teal,
              border: '1px solid ' + theme.colors.teal,
              borderRadius: '6px',
              padding: '4px 14px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Edit
          </button>
        </div>
        <div style={{ fontSize: '13px', color: '#8899AA', marginBottom: '8px' }}>Goals</div>
        <div
          style={{
            fontSize: '14px',
            color: tradingProfile?.goals ? '#fff' : '#555',
            marginBottom: '16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {tradingProfile?.goals || 'Not set'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#8899AA', marginBottom: '4px' }}>Max loss per trade</div>
            <div style={{ fontSize: '14px', color: '#fff' }}>
              {[
                tradingProfile?.maxLossPercent != null && `${tradingProfile.maxLossPercent}%`,
                tradingProfile?.maxLossDollars != null && `$${tradingProfile.maxLossDollars}`,
              ].filter(Boolean).join(' / ') || <span style={{ color: '#555' }}>Not set</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#8899AA', marginBottom: '4px' }}>Target gain per trade</div>
            <div style={{ fontSize: '14px', color: '#fff' }}>
              {[
                tradingProfile?.targetGainPercent != null && `${tradingProfile.targetGainPercent}%`,
                tradingProfile?.targetGainDollars != null && `$${tradingProfile.targetGainDollars}`,
              ].filter(Boolean).join(' / ') || <span style={{ color: '#555' }}>Not set</span>}
            </div>
          </div>
        </div>
      </div>

      <OnboardingModal editMode open={showEditProfile} onClose={() => setShowEditProfile(false)} />

      {/* Danger Zone */}
      <div
        style={{
          marginTop: '32px',
          backgroundColor: '#121F35',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #4a1c1c',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '16px', color: '#FF4D4F' }}>
          Danger Zone
        </h3>
        <p style={{ color: '#888', margin: '0 0 16px', fontSize: '14px' }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              backgroundColor: 'transparent',
              color: '#FF4D4F',
              border: '1px solid #FF4D4F',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Delete Account
          </button>
        ) : (
          <div
            style={{
              backgroundColor: '#1a0f0f',
              borderRadius: '6px',
              padding: '16px',
              border: '1px solid #4a1c1c',
            }}
          >
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#ffb3b3' }}>
              Are you sure? This will permanently delete your account, all trade data, and cancel any active subscription. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                style={{
                  backgroundColor: '#FF4D4F',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, delete my account'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                disabled={deleteLoading}
                style={{
                  backgroundColor: 'transparent',
                  color: '#888',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
            </div>
            {deleteError && (
              <div style={{ marginTop: '10px', color: '#FF4D4F', fontSize: '12px' }}>
                {deleteError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettingsScreen;
