import React, { useState, useEffect } from 'react';
import TradeUploader from './components/TradeUploader';
import StatsDashboard from './components/StatsDashboard';
import { theme } from './theme';
import logo from './assets/clocklogo.PNG'; // Clock logo
import blackSHlogo from './assets/blackSHlogo.PNG'; // Stock Hours logo
import './App.css';

function App() {
  const [tradeData, setTradeData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHalfScreen, setIsHalfScreen] = useState(window.innerWidth <= 960); // Adjusted breakpoint to 960px

  // Handle window resize to toggle sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      const halfScreen = window.innerWidth <= 960; // Adjusted breakpoint
      setIsHalfScreen(halfScreen);
      if (!halfScreen) {
        setIsSidebarOpen(false); // Close sidebar when switching to full screen
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to handle file upload (replicating TradeUploader logic)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
        let tradeDataStartIndex = rows.findIndex(row => row[0] === 'Account Trade History');
        if (tradeDataStartIndex === -1) {
          console.error('Account Trade History section not found');
          return;
        }

        tradeDataStartIndex += 2; // Skip header row and section title
        let tradeDataEndIndex = rows.findIndex((row, index) => index > tradeDataStartIndex && row[0].startsWith('Profits and Losses'));
        if (tradeDataEndIndex === -1) tradeDataEndIndex = rows.length;

        const tradeRows = rows.slice(tradeDataStartIndex, tradeDataEndIndex).filter(row => row.length > 1 && row[0] !== '');
        const transformedData = tradeRows.map(row => {
          try {
            const execTimeStr = row[1]; // e.g., "2/28/25 09:31:48"
            const [datePart, timePart] = execTimeStr.split(' ');
            const [month, day, year] = datePart.split('/').map(Number);
            const [hours, minutes, seconds] = timePart.split(':').map(Number);
            const fullYear = 2000 + year; // Assuming 2-digit year (e.g., 25 -> 2025)
            const execTime = new Date(fullYear, month - 1, day, hours, minutes, seconds).toISOString();
            const tradeDate = `${month}/${day}/${fullYear}`;
            return {
              ExecTime: execTime,
              TradeDate: tradeDate,
              Side: row[2], // e.g., "SELL"
              Quantity: parseInt(row[3], 10) || 0, // e.g., -1
              PosEffect: row[4], // e.g., "TO CLOSE"
              Symbol: row[5], // e.g., "TSLA"
              Expiration: row[6], // e.g., "28 FEB 25"
              Strike: parseFloat(row[7]) || 0, // e.g., 275
              Type: row[8], // e.g., "PUT"
              Price: parseFloat(row[9]) || 0, // e.g., 5.65
              NetPrice: parseFloat(row[10]) || 0, // e.g., 5.65
              OrderType: row[11], // e.g., "LMT"
            };
          } catch (error) {
            console.error('Error parsing row:', row, error);
            return null;
          }
        }).filter(row => row !== null);

        // Group trades by Symbol, Strike, and Expiration
        const groupedTrades = transformedData.reduce((acc, curr) => {
          const key = `${curr.Symbol}-${curr.Strike}-${curr.Expiration}`;
          if (!acc[key]) {
            acc[key] = {
              Symbol: curr.Symbol,
              Strike: curr.Strike,
              Expiration: curr.Expiration,
              Transactions: [],
            };
          }
          acc[key].Transactions.push(curr);
          return acc;
        }, {});

        setTradeData(Object.values(groupedTrades));
        console.log('Processed tradeData:', Object.values(groupedTrades)); // Debug
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="App" style={{ backgroundColor: '#000', minHeight: '100vh', color: theme.colors.white }}>
      {/* Header with logo, hamburger menu (if half screen), and Dashboard text */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          padding: '10px 20px',
          borderBottom: '1px solid #333',
          position: 'relative',
          zIndex: 1000, // Ensure header is above sidebar
        }}
      >
        {/* Hamburger menu for half screen */}
        {isHalfScreen && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.white,
              cursor: 'pointer',
              marginRight: '10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '30px',
              height: '30px',
            }}
          >
            <div style={{ width: '20px', height: '3px', backgroundColor: theme.colors.white, margin: '2px 0' }} />
            <div style={{ width: '20px', height: '3px', backgroundColor: theme.colors.white, margin: '2px 0' }} />
            <div style={{ width: '20px', height: '3px', backgroundColor: theme.colors.white, margin: '2px 0' }} />
          </button>
        )}

        <img
          src={blackSHlogo}
          alt="Stock Hours Trading Logo"
          style={{ height: '50px', marginRight: '15px' }}
        />
        <h2 style={{ margin: 0, fontSize: '24px', color: theme.colors.white }}>
          Dashboard
        </h2>
      </header>

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: '71px', // Adjusted to be flush with header bottom (50px height + 10px padding + 1px border)
          left: 0,
          width: '50px', // Match blackSHlogo width
          height: 'calc(100% - 71px)', // Full height minus header
          backgroundColor: '#1a1a1a',
          display: (isHalfScreen && !isSidebarOpen) ? 'none' : 'block', // Hide on half screen unless open
          padding: '20px 0',
          boxSizing: 'border-box',
          zIndex: 900, // Below header zIndex
        }}
      >
        {/* "+" Button with Tooltip */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <label
            htmlFor="sidebar-file-upload"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: theme.colors.green,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '24px',
              color: theme.colors.white,
              marginBottom: '20px',
            }}
          >
            +
          </label>
          <input
            id="sidebar-file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          {/* Tooltip */}
          <span
            style={{
              visibility: 'hidden',
              position: 'absolute',
              left: '50px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: '#333',
              color: theme.colors.white,
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              zIndex: 1001,
            }}
            className="tooltip"
          >
            Add Trade(s)
          </span>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
          marginLeft: (isHalfScreen && !isSidebarOpen) ? '0' : '50px', // Adjust for sidebar width
          transition: 'margin-left 0.3s ease',
        }}
      >
        <img src={logo} alt="Clock Logo" style={{ width: '200px', marginBottom: '20px' }} />
        <h1 style={{ color: theme.colors.white, marginBottom: '20px' }}>Stockhours</h1>
        <TradeUploader setTradeData={setTradeData} />

        {/* Container for StatsDashboard */}
        <div
          style={{
            width: '90%',
            maxWidth: '1200px',
            backgroundColor: '#0d0d0d',
            borderRadius: '8px',
            padding: '20px',
            margin: '0 auto',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        >
          <StatsDashboard tradeData={tradeData} />
        </div>
      </div>
    </div>
  );
}

export default App;