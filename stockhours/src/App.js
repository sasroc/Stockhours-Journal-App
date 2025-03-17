import React, { useState } from 'react';
import TradeUploader from './components/TradeUploader';
import StatsDashboard from './components/StatsDashboard';
import { theme } from './theme';
import logo from './assets/clocklogo.PNG'; // Clock logo
import blackSHlogo from './assets/blackSHlogo.PNG'; // Stock Hours logo
import './App.css';

function App() {
  const [tradeData, setTradeData] = useState([]);

  return (
    <div className="App" style={{ backgroundColor: '#000', minHeight: '100vh', color: theme.colors.white }}>
      {/* Header with logo and Dashboard text */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          padding: '10px 20px',
          borderBottom: '1px solid #333',
        }}
      >
        <img
          src={blackSHlogo}
          alt="Stock Hours Trading Logo"
          style={{ height: '50px', marginRight: '15px' }}
        />
        <h2 style={{ margin: 0, fontSize: '24px', color: theme.colors.white }}>
          Dashboard
        </h2>
      </header>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        <img src={logo} alt="Clock Logo" style={{ width: '200px', marginBottom: '20px' }} />
        <h1 style={{ color: theme.colors.white, marginBottom: '20px' }}>Stockhours</h1>
        <TradeUploader setTradeData={setTradeData} />

        {/* Container for StatsDashboard to expand width */}
        <div
          style={{
            width: '90%', // Consistent width
            maxWidth: '1200px', // Maximum width for larger screens
            backgroundColor: '#0d0d0d', // Slightly different background for separation
            borderRadius: '8px',
            padding: '20px',
            margin: '0 auto', // Center the container
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)', // Optional shadow for depth
          }}
        >
          <StatsDashboard tradeData={tradeData} />
        </div>
      </div>
    </div>
  );
}

export default App;