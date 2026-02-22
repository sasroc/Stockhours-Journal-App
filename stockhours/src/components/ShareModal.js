import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import backgroundImage from '../assets/bg2.png';
import qrCode from '../assets/qrcode_tradebetter.net.png';
import secondaryLogo from '../assets/logo2.png';

const ShareModal = ({ isOpen, onClose, dayStats }) => {
  const { displayName } = useAuth();
  const previewRef = useRef(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trade-stats-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // Calculate total ROI for preview
  const totalROI = dayStats.trades.reduce((sum, trade) => sum + trade.netROI, 0);

  // Format date for display (MM/DD/YYYY → "February 21, 2026")
  const formatDate = (dateStr) => {
    const [month, day, year] = dateStr.split('/');
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#1B2B43',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '90%',
          maxHeight: '90%',
          overflow: 'auto',
        }}
      >
        <div
          ref={previewRef}
          style={{
            position: 'relative',
            width: '800px',
            height: '450px',
            marginBottom: '20px',
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '20px',
          }}
        >
          {/* Display name - bottom left */}
          {displayName && (
            <div style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
            }}>
              {displayName}
            </div>
          )}

          {/* QR code - bottom right */}
          <img src={qrCode} alt="QR Code" style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: '90px',
            height: '90px',
          }} />

          {/* Date - top right */}
          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
            textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
          }}>
            {formatDate(dayStats.date)}
          </div>

          {/* TradeBetter Logo and Text */}
          <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              overflow: 'hidden',
              backgroundColor: '#0C1829',
              border: '1px solid #1E2D48',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6), 0 0 18px rgba(0, 123, 255, 0.25)',
              flexShrink: 0,
            }}>
              <img src={secondaryLogo} alt="TradeBetter Logo" style={{
                width: '54px',
                height: '54px',
                display: 'block',
              }} />
            </div>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000' }}>TradeBetter</span>
          </div>

          {/* Left side - Trade Data */}
          <div style={{ flex: 1, paddingLeft: '30px', marginTop: '40px' }}>
            {/* Tickers */}
            <div style={{ color: 'white', fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', textShadow: '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000' }}>
              {[...new Set(dayStats.trades.map(trade => trade.Symbol))].join(', ')}
            </div>

            {/* P&L */}
            <div
              style={{
                color: dayStats.totalProfitLoss >= 0 ? theme.colors.green : theme.colors.red,
                fontSize: '64px',
                fontWeight: 'bold',
                marginBottom: '20px',
                textShadow: '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000',
              }}
            >
              ${dayStats.totalProfitLoss.toFixed(2)}
            </div>

            {/* Total ROI */}
            <div
              style={{
                color: totalROI >= 0 ? theme.colors.green : theme.colors.red,
                fontSize: '64px',
                fontWeight: 'bold',
                textShadow: '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000',
              }}
            >
              {totalROI.toFixed(2)}%
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: theme.colors.red,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            style={{
              backgroundColor: theme.colors.teal,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
