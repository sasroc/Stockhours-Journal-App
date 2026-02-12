import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

const WebullCallback = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Connecting your Webull account...');

  const apiBase = process.env.REACT_APP_STRIPE_API_URL || '';

  useEffect(() => {
    const exchangeCode = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        navigate(`/imports?webull=error&message=${encodeURIComponent(error)}`);
        return;
      }

      if (!code) {
        navigate('/imports?webull=error&message=No+authorization+code+received');
        return;
      }

      if (!currentUser) {
        navigate('/imports?webull=error&message=Not+authenticated');
        return;
      }

      try {
        setStatus('Exchanging authorization code...');
        const token = await currentUser.getIdToken();
        const response = await fetch(`${apiBase}/api/webull/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to connect Webull account.');
        }

        navigate('/imports?webull=connected');
      } catch (err) {
        navigate(`/imports?webull=error&message=${encodeURIComponent(err.message)}`);
      }
    };

    exchangeCode();
  }, [searchParams, currentUser, navigate, apiBase]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0A1628',
        color: theme.colors.white,
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          border: '3px solid #344563',
          borderTopColor: theme.colors.green,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px',
        }}
      />
      <p>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default WebullCallback;
