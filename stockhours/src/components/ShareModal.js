import React from 'react';
import { theme } from '../theme';
import backgroundImage from '../assets/backgroundtrade.jpg';
import primaryLogo from '../assets/3.png';
import secondaryLogo from '../assets/2.png';

const ShareModal = ({ isOpen, onClose, dayStats }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const brandLogo = new Image();
    const accentLogo = new Image();

    let loadedImages = 0;
    const totalImages = 3;

    const drawWhenAllLoaded = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        // Set canvas dimensions to match the background image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw background
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw TradeBetter logo and text
        const logoSize = canvas.height * 0.1; // 10% of canvas height
        ctx.drawImage(brandLogo, 40, 40, logoSize, logoSize);
        ctx.font = `bold ${Math.floor(canvas.height * 0.05)}px Arial`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('TradeBetter', logoSize + 60, 40 + (logoSize / 2) + 10);

        // Draw secondary logo on right side
        const clockSize = canvas.height * 0.4; // 40% of canvas height
        ctx.drawImage(
          accentLogo,
          canvas.width - clockSize - canvas.width * 0.1,
          (canvas.height - clockSize) / 2,
          clockSize,
          clockSize
        );

        // Configure text style for trade data
        const leftMargin = canvas.width * 0.1; // 10% of canvas width
        const centerY = canvas.height / 2;

        // Draw ticker(s)
        ctx.font = `bold ${Math.floor(canvas.height * 0.1)}px Arial`;
        ctx.fillStyle = 'white';
        const tickers = [...new Set(dayStats.trades.map(trade => trade.Symbol))];
        ctx.fillText(tickers.join(', '), leftMargin, centerY - canvas.height * 0.15);

        // Draw P&L
        ctx.font = `bold ${Math.floor(canvas.height * 0.14)}px Arial`;
        ctx.fillStyle = dayStats.totalProfitLoss >= 0 ? theme.colors.green : theme.colors.red;
        ctx.fillText(
          `$${dayStats.totalProfitLoss.toFixed(2)}`,
          leftMargin,
          centerY + canvas.height * 0.05
        );

        // Calculate total ROI (sum of all trade ROIs)
        const totalROI = dayStats.trades.reduce((sum, trade) => sum + trade.netROI, 0);
        ctx.fillStyle = totalROI >= 0 ? theme.colors.green : theme.colors.red;
        ctx.fillText(
          `${totalROI.toFixed(2)}%`,
          leftMargin,
          centerY + canvas.height * 0.25
        );

        // Convert to blob and download
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
      }
    };

    img.onload = drawWhenAllLoaded;
    brandLogo.onload = drawWhenAllLoaded;
    accentLogo.onload = drawWhenAllLoaded;

    img.src = backgroundImage;
    brandLogo.src = secondaryLogo;
    accentLogo.src = primaryLogo;
  };

  // Calculate total ROI for preview
  const totalROI = dayStats.trades.reduce((sum, trade) => sum + trade.netROI, 0);

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
          {/* TradeBetter Logo and Text */}
          <div style={{ 
            position: 'absolute',
            top: 20,
            left: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <img src={secondaryLogo} alt="TradeBetter Logo" style={{ height: '45px' }} />
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>TradeBetter</span>
          </div>

          {/* Left side - Trade Data */}
          <div style={{ flex: 1, paddingLeft: '30px', marginTop: '40px' }}>
            {/* Tickers */}
            <div style={{ color: 'white', fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>
              {[...new Set(dayStats.trades.map(trade => trade.Symbol))].join(', ')}
            </div>

            {/* P&L */}
            <div
              style={{
                color: dayStats.totalProfitLoss >= 0 ? theme.colors.green : theme.colors.red,
                fontSize: '64px',
                fontWeight: 'bold',
                marginBottom: '20px',
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
              }}
            >
              {totalROI.toFixed(2)}%
            </div>
          </div>

          {/* Right side - Secondary Logo */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={primaryLogo} alt="TradeBetter Logo" style={{ height: '180px' }} />
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