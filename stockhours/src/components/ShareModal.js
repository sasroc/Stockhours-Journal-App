import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import backgroundImage from '../assets/bg1.png';
import primaryLogo from '../assets/3.png';
import qrCode from '../assets/qrcode_tradebetter.net.png';
import secondaryLogo from '../assets/2.png';

const ShareModal = ({ isOpen, onClose, dayStats }) => {
  const { displayName } = useAuth();
  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const brandLogo = new Image();
    const accentLogo = new Image();
    const qrImg = new Image();

    let loadedImages = 0;
    const totalImages = 4;

    const drawWhenAllLoaded = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        // Set canvas dimensions to match the background image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw background
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw TradeBetter logo — replicate sidebar style (rounded container, zoomed image)
        const containerSize = canvas.height * 0.1; // matches 54px at preview scale
        const logoX = 40;
        const logoY = 40;
        const borderRadius = containerSize * (14 / 54);

        // Draw rounded rect background and clip
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, containerSize, containerSize, borderRadius);
        ctx.fillStyle = '#0C1829';
        ctx.fill();
        ctx.clip();

        // Draw logo zoomed inside the container (scale 1.1 * 66/54 ≈ 1.34x)
        const zoomFactor = 1.1 * (66 / 54);
        const drawSize = containerSize * zoomFactor;
        const centerOffset = (drawSize - containerSize) / 2;
        const translateX = containerSize * (-5 / 54); // shift left to center logo visually
        const translateY = containerSize * (-5 / 54);  // shift up to center logo visually
        ctx.drawImage(brandLogo, logoX - centerOffset + translateX, logoY - centerOffset + translateY, drawSize, drawSize);
        ctx.restore();

        ctx.font = `bold ${Math.floor(canvas.height * 0.05)}px Arial`;
        ctx.textAlign = 'left';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'black';
        ctx.strokeText('TradeBetter', logoX + containerSize + 20, logoY + containerSize / 2 + 10);
        ctx.fillStyle = 'white';
        ctx.fillText('TradeBetter', logoX + containerSize + 20, logoY + containerSize / 2 + 10);

        // Draw date — top right
        const [month, day, year] = dayStats.date.split('/');
        const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        ctx.font = `bold ${Math.floor(canvas.height * 0.04)}px Arial`;
        ctx.textAlign = 'right';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.strokeText(formattedDate, canvas.width - 40, logoY + containerSize / 2 + 10);
        ctx.fillStyle = 'white';
        ctx.fillText(formattedDate, canvas.width - 40, logoY + containerSize / 2 + 10);


        // Configure text style for trade data
        const leftMargin = canvas.width * 0.1; // 10% of canvas width
        const centerY = canvas.height / 2;

        // Draw ticker(s)
        ctx.font = `bold ${Math.floor(canvas.height * 0.1)}px Arial`;
        ctx.lineJoin = 'round';
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'black';
        const tickers = [...new Set(dayStats.trades.map(trade => trade.Symbol))];
        ctx.strokeText(tickers.join(', '), leftMargin, centerY - canvas.height * 0.15);
        ctx.fillStyle = 'white';
        ctx.fillText(tickers.join(', '), leftMargin, centerY - canvas.height * 0.15);

        // Draw P&L
        ctx.font = `bold ${Math.floor(canvas.height * 0.14)}px Arial`;
        ctx.lineWidth = 10;
        ctx.strokeStyle = 'black';
        ctx.strokeText(
          `$${dayStats.totalProfitLoss.toFixed(2)}`,
          leftMargin,
          centerY + canvas.height * 0.05
        );
        ctx.fillStyle = dayStats.totalProfitLoss >= 0 ? theme.colors.green : theme.colors.red;
        ctx.fillText(
          `$${dayStats.totalProfitLoss.toFixed(2)}`,
          leftMargin,
          centerY + canvas.height * 0.05
        );

        // Calculate total ROI (sum of all trade ROIs)
        const totalROI = dayStats.trades.reduce((sum, trade) => sum + trade.netROI, 0);
        ctx.strokeStyle = 'black';
        ctx.strokeText(
          `${totalROI.toFixed(2)}%`,
          leftMargin,
          centerY + canvas.height * 0.25
        );
        ctx.fillStyle = totalROI >= 0 ? theme.colors.green : theme.colors.red;
        ctx.fillText(
          `${totalROI.toFixed(2)}%`,
          leftMargin,
          centerY + canvas.height * 0.25
        );

        // Draw QR code — bottom right
        const qrSize = canvas.height * 0.2;
        const qrMargin = 30;

        // Draw display name — bottom left
        if (displayName) {
          ctx.font = `bold ${Math.floor(canvas.height * 0.04)}px Arial`;
          ctx.textAlign = 'left';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 5;
          ctx.strokeStyle = 'black';
          ctx.strokeText(displayName, qrMargin, canvas.height - qrMargin);
          ctx.fillStyle = 'white';
          ctx.fillText(displayName, qrMargin, canvas.height - qrMargin);
        }
        ctx.drawImage(qrImg, canvas.width - qrSize - qrMargin, canvas.height - qrSize - qrMargin, qrSize, qrSize);

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
    qrImg.onload = drawWhenAllLoaded;

    img.src = backgroundImage;
    brandLogo.src = secondaryLogo;
    accentLogo.src = primaryLogo;
    qrImg.src = qrCode;
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
                width: '66px',
                height: '66px',
                objectFit: 'cover',
                objectPosition: 'center',
                transform: 'scale(1.1) translateX(-5px) translateY(-5px)',
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