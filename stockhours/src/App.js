import React, { useState } from 'react';
import TradeUploader from './components/TradeUploader';
import StatsDashboard from './components/StatsDashboard';
import { theme } from './theme';
import logo from './assets/clocklogo.PNG'; // Import the logo
import './App.css';

function App() {
  const [tradeData, setTradeData] = useState([]);

  return (
    <div className="App">
      <img src={logo} alt="Stockhours Logo" style={{ width: '200px', marginBottom: '20px' }} /> {/* Add the logo */}
      {/* Optionally, remove the <h1> if the logo includes the app name */}
      <h1 style={{ color: theme.colors.white }}>Stockhours</h1>
      <TradeUploader setTradeData={setTradeData} />
      <StatsDashboard tradeData={tradeData} />
    </div>
  );
}

export default App;