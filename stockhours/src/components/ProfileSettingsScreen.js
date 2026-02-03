import React from 'react';
import { theme } from '../theme';

const ProfileSettingsScreen = ({ currentUser }) => {
  const userEmail = currentUser?.email || 'Unknown';
  const userId = currentUser?.uid || 'Unknown';

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
            backgroundColor: '#111',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #222',
          }}
        >
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Email</div>
          <div style={{ fontSize: '15px' }}>{userEmail}</div>
        </div>
        <div
          style={{
            backgroundColor: '#111',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #222',
          }}
        >
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>User ID</div>
          <div style={{ fontSize: '15px', wordBreak: 'break-all' }}>{userId}</div>
        </div>
        <div
          style={{
            backgroundColor: '#111',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #222',
          }}
        >
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Plan</div>
          <div style={{ fontSize: '15px' }}>Standard</div>
        </div>
      </div>

      <div
        style={{
          marginTop: '24px',
          backgroundColor: '#111',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #222',
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
