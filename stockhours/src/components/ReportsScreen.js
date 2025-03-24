// StockHours-Journal-App/stockhours/src/components/ReportsScreen.js

import React, { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { theme } from '../theme';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReportsScreen = ({ tradeData, isHalfScreen, isSidebarOpen }) => {
  const [expandedSections, setExpandedSections] = useState({
    dateTime: true,
    priceQuantity: true,
    options: true,
  });

  const trades = useMemo(() => {
    if (!tradeData.length) return [];

    // Flatten all transactions for processing
    const allTransactions = tradeData.flatMap(trade => trade.Transactions);

    // Sort transactions by ExecTime to process in chronological order
    const sortedTransactions = allTransactions.sort((a, b) => new Date(a.ExecTime) - new Date(b.ExecTime));

    const processedTrades = [];
    const positions = new Map(); // Map of Symbol-Strike-Expiration to { totalQuantity, currentQuantity, buyRecords, sellRecords }
    const CONTRACT_MULTIPLIER = 100;

    sortedTransactions.forEach(transaction => {
      const key = `${transaction.Symbol}-${transaction.Strike}-${transaction.Expiration}`;
      if (!positions.has(key)) {
        positions.set(key, {
          totalQuantity: 0,
          currentQuantity: 0,
          buyRecords: [], // { quantity, price, tradeDate, execTime }
          sellRecords: [], // { quantity, price }
        });
      }

      const position = positions.get(key);

      if (transaction.PosEffect === 'OPEN' && transaction.Side === 'BUY') {
        position.totalQuantity += transaction.Quantity;
        position.currentQuantity += transaction.Quantity;
        position.buyRecords.push({
          quantity: transaction.Quantity,
          price: transaction.Price,
          tradeDate: transaction.TradeDate,
          execTime: transaction.ExecTime,
        });
      } else if (transaction.PosEffect === 'CLOSE' && transaction.Side === 'SELL') {
        position.sellRecords.push({
          quantity: Math.abs(transaction.Quantity),
          price: transaction.Price,
        });

        position.currentQuantity -= Math.abs(transaction.Quantity);

        // If the position is fully closed or after a cycle, create a trade
        if (position.currentQuantity === 0) {
          let totalBuyQuantity = 0;
          let totalBuyCost = 0;
          const buyRecordsForCycle = [];

          while (position.buyRecords.length > 0 && totalBuyQuantity < position.totalQuantity) {
            const buyRecord = position.buyRecords.shift();
            buyRecordsForCycle.push(buyRecord);
            totalBuyQuantity += buyRecord.quantity;
            totalBuyCost += buyRecord.quantity * buyRecord.price * CONTRACT_MULTIPLIER;
          }

          let totalSellQuantity = 0;
          let totalSellProceeds = 0;
          const sellRecordsForCycle = [];

          while (position.sellRecords.length > 0 && totalSellQuantity < totalBuyQuantity) {
            const sellRecord = position.sellRecords.shift();
            sellRecordsForCycle.push(sellRecord);
            totalSellQuantity += sellRecord.quantity;
            totalSellProceeds += sellRecord.quantity * sellRecord.price * CONTRACT_MULTIPLIER;
          }

          const profitLoss = totalSellProceeds - totalBuyCost;

          processedTrades.push({
            Symbol: transaction.Symbol,
            Strike: transaction.Strike,
            Expiration: transaction.Expiration,
            TradeDate: buyRecordsForCycle[0].tradeDate,
            FirstBuyExecTime: buyRecordsForCycle[0].execTime,
            profitLoss,
          });

          position.totalQuantity = 0;
          position.currentQuantity = 0;
        }
      }
    });

    return processedTrades;
  }, [tradeData]);

  const totalTrades = trades.length;

  // Toggle expand/collapse for a section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!tradeData.length) {
    return (
      <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
        <p style={{ color: theme.colors.white }}>No data uploaded yet.</p>
      </div>
    );
  }

  const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);

  const tickerPnl = trades.reduce((acc, trade) => {
    acc[trade.Symbol] = (acc[trade.Symbol] || 0) + trade.profitLoss;
    return acc;
  }, {});

  const tickerChartData = {
    labels: Object.keys(tickerPnl),
    datasets: [
      {
        label: 'Total Profit/Loss per Ticker',
        data: Object.values(tickerPnl),
        backgroundColor: Object.values(tickerPnl).map(pnl =>
          pnl >= 0 ? theme.colors.green : theme.colors.red
        ),
      },
    ],
  };

  const tradeCountsByHour = new Array(24).fill(0);
  trades.forEach(trade => {
    const execTime = new Date(trade.FirstBuyExecTime);
    const hour = execTime.getHours();
    if (hour >= 0 && hour <= 23) {
      tradeCountsByHour[hour]++;
    }
  });

  const hourChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Trades per Hour',
        data: tradeCountsByHour,
        backgroundColor: 'blue',
      },
    ],
  };

  const tradeChartData = {
    labels: trades.map(trade => `${trade.Symbol}`),
    datasets: [
      {
        label: 'Profit/Loss per Trade',
        data: trades.map(trade => trade.profitLoss),
        backgroundColor: trades.map(trade =>
          trade.profitLoss >= 0 ? theme.colors.green : theme.colors.red
        ),
      },
    ],
  };

  // Common styles for menu items (main sections and sub-options)
  const menuItemStyle = {
    padding: '5px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s, border 0.2s',
    cursor: 'pointer',
  };

  const menuItemHoverStyle = {
    border: `1px solid ${theme.colors.white}`,
    backgroundColor: '#2a2a2a',
  };

  // Determine the left position and content margin based on isHalfScreen and isSidebarOpen
  const menuLeftPosition = isHalfScreen && !isSidebarOpen ? '0' : '50px';
  const contentMarginLeft = isHalfScreen && !isSidebarOpen ? '200px' : '250px';

  return (
    <div style={{ display: 'flex', backgroundColor: theme.colors.black }}>
      {/* Selection Menu */}
      <div
        style={{
          position: 'fixed',
          top: '71px',
          left: menuLeftPosition, // Dynamically set based on sidebar state
          width: '200px',
          height: 'calc(100% - 71px)',
          backgroundColor: '#1a1a1a',
          padding: '20px',
          boxSizing: 'border-box',
          zIndex: 800,
          overflowY: 'auto',
          transition: 'left 0.3s ease', // Smooth transition for shifting
        }}
      >
        {/* Overview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 0',
            color: theme.colors.white,
            ...menuItemStyle,
          }}
          onClick={() => {}}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = menuItemHoverStyle.border;
            e.currentTarget.style.backgroundColor = menuItemHoverStyle.backgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = 'none';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.white}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '10px' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>Overview</span>
        </div>

        {/* Date & Time Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 0',
            color: theme.colors.white,
            ...menuItemStyle,
          }}
          onClick={() => toggleSection('dateTime')}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = menuItemHoverStyle.border;
            e.currentTarget.style.backgroundColor = menuItemHoverStyle.backgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = 'none';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.white}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              marginRight: '10px',
              transform: expandedSections.dateTime ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.white}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '10px' }}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Date & Time</span>
        </div>
        {expandedSections.dateTime && (
          <div style={{ paddingLeft: '40px' }}>
            {['Days', 'Weeks', 'Months', 'Trade time', 'Trade duration'].map(option => (
              <div
                key={option}
                style={{
                  padding: '5px 0',
                  color: '#888',
                  ...menuItemStyle,
                }}
                onClick={() => {}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = menuItemHoverStyle.border;
                  e.currentTarget.style.backgroundColor = menuItemHoverStyle.backgroundColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {option}
              </div>
            ))}
          </div>
        )}

        {/* Price & Quantity Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 0',
            color: theme.colors.white,
            ...menuItemStyle,
          }}
          onClick={() => toggleSection('priceQuantity')}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = menuItemHoverStyle.border;
            e.currentTarget.style.backgroundColor = menuItemHoverStyle.backgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = 'none';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.white}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              marginRight: '10px',
              transform: expandedSections.priceQuantity ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.white}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '10px' }}
          >
            <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
            <path d="M12 2v4" />
            <path d="M8 6h8a4 4 0 0 1 0 8H8a4 4 0 0 1 0-8z" />
          </svg>
          <span>Price & Quantity</span>
        </div>
        {expandedSections.priceQuantity && (
          <div style={{ paddingLeft: '40px' }}>
            {['Price', 'Volume', 'Instrument'].map(option => (
              <div
                key={option}
                style={{
                  padding: '5px 0',
                  color: '#888',
                  ...menuItemStyle,
                }}
                onClick={() => {}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = menuItemHoverStyle.border;
                  e.currentTarget.style.backgroundColor = menuItemHoverStyle.backgroundColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {option}
              </div>
            ))}
          </div>
        )}

        {/* Options Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 0',
            color: theme.colors.white,
            ...menuItemStyle,
          }}
          onClick={() => toggleSection('options')}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = menuItemHoverStyle.border;
            e.currentTarget.style.backgroundColor = menuItemHoverStyle.backgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = 'none';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.white}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              marginRight: '10px',
              transform: expandedSections.options ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.white}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '10px' }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="9 8 12 5 15 8" />
            <polyline points="9 16 12 19 15 16" />
          </svg>
          <span>Options</span>
        </div>
        {expandedSections.options && (
          <div style={{ paddingLeft: '40px' }}>
            {['Days till expiration'].map(option => (
              <div
                key={option}
                style={{
                  padding: '5px 0',
                  color: '#888',
                  ...menuItemStyle,
                }}
                onClick={() => {}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = menuItemHoverStyle.border;
                  e.currentTarget.style.backgroundColor = menuItemHoverStyle.backgroundColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Reports Content */}
      <div
        style={{
          marginLeft: contentMarginLeft, // Adjust based on menu position
          padding: '20px',
          width: `calc(100% - ${contentMarginLeft})`, // Adjust width to account for menu position
          transition: 'margin-left 0.3s ease, width 0.3s ease', // Smooth transition for shifting
        }}
      >
        <h2 style={{ color: theme.colors.white }}>Trading Stats</h2>
        <p>Total Trades: {totalTrades}</p>
        <p>
          Total Profit/Loss:{' '}
          <span style={{ color: totalProfitLoss >= 0 ? theme.colors.green : theme.colors.red }}>
            ${totalProfitLoss.toFixed(2)}
          </span>
        </p>
        <h3 style={{ color: theme.colors.white }}>P&L by Trade</h3>
        {trades.map((trade, index) => (
          <p key={index}>
            {index + 1}. ({trade.TradeDate}) {trade.Symbol}:{' '}
            <span style={{ color: trade.profitLoss >= 0 ? theme.colors.green : theme.colors.red }}>
              ${trade.profitLoss.toFixed(2)}
            </span>
          </p>
        ))}

        <h3 style={{ color: theme.colors.white }}>P&L by Ticker</h3>
        <div style={{ height: '300px' }}>
          <Bar data={tickerChartData} />
        </div>

        <h3 style={{ color: theme.colors.white }}>Trades by Hour</h3>
        <div style={{ height: '300px' }}>
          <Bar data={hourChartData} />
        </div>

        <h3 style={{ color: theme.colors.white }}>P&L by Trade</h3>
        <div style={{ height: '300px' }}>
          <Bar data={tradeChartData} />
        </div>
      </div>
    </div>
  );
};

export default ReportsScreen;