// StockHours-Journal-App/stockhours/src/components/ReportsScreen.js

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { theme } from '../theme';

const ReportsScreen = ({ tradeData }) => {
  const [selectedReport, setSelectedReport] = useState('Overview');
  const [hoveredReport, setHoveredReport] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({
    'Date & Time': true,
    'Price & Quantity': true,
    'Options': true,
  });
  const [isHalfScreen, setIsHalfScreen] = useState(window.innerWidth <= 960);
  const chartContainerRef = useRef(null);

  // Handle resize to update half-screen state
  useEffect(() => {
    const handleResize = () => {
      setIsHalfScreen(window.innerWidth <= 960);
    };

    // Initial resize
    handleResize();

    // Add resize event listener
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Process trades to calculate P&L (adapted from StatsDashboard.js)
  const processedTrades = useMemo(() => {
    if (!tradeData.length) return [];

    // Flatten all transactions for processing
    const allTransactions = tradeData.flatMap(trade => trade.Transactions);

    // Sort transactions by ExecTime to process in chronological order
    const sortedTransactions = allTransactions.sort((a, b) => new Date(a.ExecTime) - new Date(b.ExecTime));

    const trades = [];
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

        // If the position is fully closed, calculate P&L
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

          trades.push({
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

    return trades;
  }, [tradeData]);

  // Calculate monthly P&L based on processed trades
  const monthlyStats = processedTrades.reduce((acc, trade) => {
    const execTime = new Date(trade.FirstBuyExecTime);
    if (isNaN(execTime)) return acc; // Skip invalid dates

    const monthKey = `${execTime.getFullYear()}-${execTime.getMonth() + 1}`; // e.g., "2023-1" for January 2023
    if (!acc[monthKey]) {
      acc[monthKey] = {
        totalPnl: 0,
        monthName: execTime.toLocaleString('default', { month: 'long', year: 'numeric' }),
      };
    }
    acc[monthKey].totalPnl += trade.profitLoss;
    return acc;
  }, {});

  // Calculate Best month, Lowest month, and Average
  const monthlyPnlValues = Object.entries(monthlyStats);
  let bestMonth = { month: 'N/A', value: 0 };
  let lowestMonth = { month: 'N/A', value: 0 };
  let averagePnl = 0;

  if (monthlyPnlValues.length > 0) {
    // Find best and lowest months
    const sortedMonths = monthlyPnlValues.sort((a, b) => b[1].totalPnl - a[1].totalPnl);
    bestMonth = {
      month: sortedMonths[0][1].monthName,
      value: sortedMonths[0][1].totalPnl,
    };
    lowestMonth = {
      month: sortedMonths[sortedMonths.length - 1][1].monthName,
      value: sortedMonths[sortedMonths.length - 1][1].totalPnl,
    };

    // Calculate average P&L per month
    const totalPnl = monthlyPnlValues.reduce((sum, [, stats]) => sum + stats.totalPnl, 0);
    averagePnl = totalPnl / monthlyPnlValues.length;
  }

  // Chart Data for "Performance by Symbol" (used in Instrument)
  const tradesBySymbol = processedTrades.reduce((acc, trade) => {
    const symbol = trade.Symbol;
    if (!acc[symbol]) {
      acc[symbol] = { profitLoss: 0 };
    }
    acc[symbol].profitLoss += trade.profitLoss;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(tradesBySymbol),
    datasets: [
      {
        label: 'Profit/Loss ($)',
        data: Object.values(tradesBySymbol).map((item) => item.profitLoss),
        backgroundColor: Object.values(tradesBySymbol).map((item) =>
          item.profitLoss >= 0 ? theme.colors.green : theme.colors.red
        ),
        borderColor: Object.values(tradesBySymbol).map((item) =>
          item.profitLoss >= 0 ? theme.colors.green : theme.colors.red
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Profit/Loss ($)',
          color: theme.colors.white,
        },
        ticks: {
          color: theme.colors.white,
        },
        grid: {
          color: '#333',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Symbol',
          color: theme.colors.white,
        },
        ticks: {
          color: theme.colors.white,
        },
        grid: {
          color: '#333',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: theme.colors.white,
        },
      },
    },
  };

  // Menu items updated to match the image
  const reportCategories = {
    'Date & Time': ['Days', 'Weeks', 'Months', 'Trade time', 'Trade duration'],
    'Price & Quantity': ['Volume', 'Price', 'Instrument'],
    'Options': ['Days till expiration'],
  };

  const handleReportSelect = (report) => {
    setSelectedReport(report);
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Render content based on selected report
  const renderContent = () => {
    if (selectedReport === 'Overview') {
      return (
        <div>
          {/* Your Stats Section */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: theme.colors.white, marginBottom: '20px' }}>
              Your Stats
            </h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              {/* Best Month */}
              <div style={{ textAlign: 'center', flex: '1 1 100px' }}>
                <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>
                  Best month
                </div>
                <div
                  style={{
                    color: bestMonth.value >= 0 ? theme.colors.green : theme.colors.red,
                    fontSize: '20px',
                    fontWeight: 'bold',
                  }}
                >
                  ${bestMonth.value.toFixed(2)}
                </div>
                <div style={{ color: '#B0B0B0', fontSize: '12px', marginTop: '4px' }}>
                  {bestMonth.month}
                </div>
              </div>

              {/* Lowest Month */}
              <div style={{ textAlign: 'center', flex: '1 1 100px' }}>
                <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>
                  Lowest month
                </div>
                <div
                  style={{
                    color: lowestMonth.value >= 0 ? theme.colors.green : theme.colors.red,
                    fontSize: '20px',
                    fontWeight: 'bold',
                  }}
                >
                  ${lowestMonth.value.toFixed(2)}
                </div>
                <div style={{ color: '#B0B0B0', fontSize: '12px', marginTop: '4px' }}>
                  {lowestMonth.month}
                </div>
              </div>

              {/* Average */}
              <div style={{ textAlign: 'center', flex: '1 1 100px' }}>
                <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>
                  Average
                </div>
                <div
                  style={{
                    color: averagePnl >= 0 ? theme.colors.green : theme.colors.red,
                    fontSize: '20px',
                    fontWeight: 'bold',
                  }}
                >
                  ${averagePnl.toFixed(2)}
                </div>
                <div style={{ color: '#B0B0B0', fontSize: '12px', marginTop: '4px' }}>
                  Per month
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (selectedReport === 'Instrument') {
      return (
        <div
          ref={chartContainerRef}
          style={{
            height: '400px',
            width: '100%',
            marginTop: '20px',
            position: 'relative',
          }}
        >
          <h3 style={{ color: theme.colors.white, marginBottom: '20px' }}>
            Performance by Symbol
          </h3>
          <div style={{ height: '100%', width: '100%' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      );
    } else {
      return (
        <div style={{ color: theme.colors.white, marginTop: '20px' }}>
          <p>Content for "{selectedReport}" will be implemented here.</p>
        </div>
      );
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        {/* Sidebar Menu */}
        <div
          style={{
            width: isHalfScreen ? '150px' : '200px',
            backgroundColor: '#1a1a1a',
            padding: '10px',
            borderRadius: '8px',
            marginRight: '20px',
            flexShrink: 0,
          }}
        >
          <ul style={{ listStyle: 'none', padding: '0' }}>
            {/* Overview Option */}
            <li
              onClick={() => handleReportSelect('Overview')}
              onMouseEnter={() => setHoveredReport('Overview')}
              onMouseLeave={() => setHoveredReport(null)}
              style={{
                padding: '10px',
                color:
                  selectedReport === 'Overview'
                    ? theme.colors.green
                    : theme.colors.white,
                cursor: 'pointer',
                border:
                  hoveredReport === 'Overview'
                    ? '1px solid white'
                    : '1px solid transparent',
                borderRadius: '4px',
                marginBottom: '5px',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              <span style={{ marginRight: '8px' }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.colors.white}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                  <path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
                </svg>
              </span>
              Overview
            </li>
            {Object.entries(reportCategories).map(([category, reports]) => (
              <li key={category}>
                <div
                  onClick={() => toggleCategory(category)}
                  style={{
                    padding: '10px',
                    color: theme.colors.white,
                    display: 'block',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  <span style={{ marginRight: '8px' }}>
                    {category === 'Date & Time' && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={theme.colors.white}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    )}
                    {category === 'Price & Quantity' && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={theme.colors.white}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="4" y="14" width="4" height="6" />
                        <rect x="10" y="8" width="4" height="12" />
                        <rect x="16" y="11" width="4" height="9" />
                      </svg>
                    )}
                    {category === 'Options' && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={theme.colors.white}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="8" />
                        <circle cx="12" cy="12" r="2" />
                        <line x1="12" y1="4" x2="12" y2="2" />
                        <line x1="12" y1="22" x2="12" y2="20" />
                        <line x1="4" y1="12" x2="2" y2="12" />
                        <line x1="22" y1="12" x2="20" y2="12" />
                      </svg>
                    )}
                  </span>
                  {category}
                  <span
                    style={{
                      float: 'right',
                      transform: expandedCategories[category]
                        ? 'rotate(90deg)'
                        : 'rotate(0deg)',
                      fontSize: '12px',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    ›
                  </span>
                </div>
                {expandedCategories[category] && (
                  <ul style={{ listStyle: 'none', paddingLeft: '20px' }}>
                    {reports.map((report) => (
                      <li
                        key={report}
                        onClick={() => handleReportSelect(report)}
                        onMouseEnter={() => setHoveredReport(report)}
                        onMouseLeave={() => setHoveredReport(null)}
                        style={{
                          padding: '8px 10px',
                          color:
                            selectedReport === report
                              ? theme.colors.green
                              : '#B0B0B0',
                          cursor: 'pointer',
                          border:
                            hoveredReport === report
                              ? '1px solid white'
                              : '1px solid transparent',
                          borderRadius: '4px',
                          marginBottom: '5px',
                        }}
                      >
                        {report}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>{renderContent()}</div>
      </div>
    </div>
  );
};

export default ReportsScreen;