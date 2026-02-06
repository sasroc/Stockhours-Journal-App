import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { theme } from '../theme';

const ImportsScreen = ({ uploadedFiles, onDeleteFile, currentUser, onSchwabSync }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schwabStatus, setSchwabStatus] = useState({ connected: false, lastSync: null });
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [statusLoading, setStatusLoading] = useState(true);

  const apiBase = process.env.REACT_APP_STRIPE_API_URL || '';
  const schwabClientId = process.env.REACT_APP_SCHWAB_CLIENT_ID || '';
  const schwabRedirectUri = process.env.REACT_APP_SCHWAB_REDIRECT_URI || '';

  // Check URL params for callback messages
  useEffect(() => {
    const schwabParam = searchParams.get('schwab');
    if (schwabParam === 'connected') {
      setMessage({ type: 'success', text: 'Schwab account connected successfully!' });
      searchParams.delete('schwab');
      setSearchParams(searchParams, { replace: true });
      // Refresh status
      fetchSchwabStatus();
    } else if (schwabParam === 'error') {
      const msg = searchParams.get('message') || 'Failed to connect Schwab account.';
      setMessage({ type: 'error', text: msg });
      searchParams.delete('schwab');
      searchParams.delete('message');
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch Schwab connection status on mount
  const fetchSchwabStatus = async () => {
    if (!currentUser || !apiBase) {
      setStatusLoading(false);
      return;
    }
    try {
      const token = await currentUser.getIdToken();
      const resp = await fetch(`${apiBase}/api/schwab/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setSchwabStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch Schwab status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchSchwabStatus();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = () => {
    const authUrl = `https://api.schwabapi.com/v1/oauth/authorize?client_id=${encodeURIComponent(schwabClientId)}&redirect_uri=${encodeURIComponent(schwabRedirectUri)}`;
    window.location.assign(authUrl);
  };

  const handleSync = async () => {
    if (!onSchwabSync) return;
    setSyncing(true);
    setMessage(null);
    try {
      const result = await onSchwabSync();
      if (result.reconnectRequired) {
        setSchwabStatus({ connected: false, lastSync: null });
        setMessage({ type: 'error', text: result.error || 'Session expired. Please reconnect.' });
      } else if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: `Sync complete! ${result.transactionsImported || 0} transactions imported.` });
        fetchSchwabStatus();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Sync failed unexpectedly.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentUser || !apiBase) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${apiBase}/api/schwab/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      setSchwabStatus({ connected: false, lastSync: null });
      setMessage({ type: 'success', text: 'Schwab account disconnected.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to disconnect.' });
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    const d = new Date(timestamp);
    return d.toLocaleString();
  };

  return (
    <div style={{ color: theme.colors.white }}>
      <h2 style={{ marginBottom: '20px' }}>Imports</h2>

      {/* Message banner */}
      {message && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: message.type === 'success'
              ? 'rgba(46, 204, 113, 0.1)'
              : 'rgba(255, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success'
              ? 'rgba(46, 204, 113, 0.3)'
              : 'rgba(255, 68, 68, 0.3)'}`,
            color: message.type === 'success' ? '#2ecc71' : '#ff6b6b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 4px',
            }}
          >
            x
          </button>
        </div>
      )}

      {/* Broker Connections Section */}
      <div
        style={{
          backgroundColor: '#1B2B43',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #344563',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>Broker Connections</h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            backgroundColor: '#0F1D2F',
            borderRadius: '8px',
            border: '1px solid #344563',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#1B6AC9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              CS
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Charles Schwab</div>
              {statusLoading ? (
                <div style={{ fontSize: '13px', color: '#8899AA' }}>Checking status...</div>
              ) : schwabStatus.connected ? (
                <div style={{ fontSize: '13px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#2ecc71',
                    display: 'inline-block',
                  }} />
                  Connected
                  <span style={{ color: '#8899AA', marginLeft: '8px' }}>
                    Last sync: {formatLastSync(schwabStatus.lastSync)}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#8899AA' }}>Not connected</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {statusLoading ? null : schwabStatus.connected ? (
              <>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  style={{
                    backgroundColor: theme.colors.green,
                    color: theme.colors.white,
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: syncing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: syncing ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {syncing && (
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                  )}
                  {syncing ? 'Syncing...' : 'Sync Trades'}
                </button>
                <button
                  onClick={handleDisconnect}
                  style={{
                    background: 'none',
                    border: '1px solid #555',
                    color: '#ff6b6b',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={!schwabClientId}
                style={{
                  backgroundColor: '#1B6AC9',
                  color: theme.colors.white,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: schwabClientId ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  opacity: schwabClientId ? 1 : 0.5,
                }}
              >
                Connect Schwab Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Files Section */}
      <div
        style={{
          backgroundColor: '#1B2B43',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #344563',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>Uploaded Files</h3>
        {uploadedFiles.length === 0 ? (
          <p style={{ color: '#8899AA' }}>No files uploaded yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {uploadedFiles.map((file, index) => (
              <li
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  backgroundColor: '#0F1D2F',
                  marginBottom: index < uploadedFiles.length - 1 ? '8px' : 0,
                  borderRadius: '6px',
                  border: '1px solid #344563',
                }}
              >
                <span>{file.name}</span>
                <button
                  onClick={() => onDeleteFile(file.name)}
                  style={{
                    backgroundColor: theme.colors.red,
                    color: theme.colors.white,
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ImportsScreen;
