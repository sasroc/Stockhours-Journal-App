import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { theme } from '../theme';
import { startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns'; // Removed unused getISOWeek and addDays

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

  useEffect(() => {
    const handleResize = () => setIsHalfScreen(window.innerWidth <= 960);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const processedTrades = useMemo(() => {
    if (!tradeData.length) return [];
    const allTransactions = tradeData.flatMap(trade => trade.Transactions);
    const sortedTransactions = allTransactions.sort((a, b) => new Date(a.ExecTime) - new Date(b.ExecTime));
    const trades = [];
    const positions = new Map();
    const CONTRACT_MULTIPLIER = 100;

    sortedTransactions.forEach(transaction => {
      const key = `${transaction.Symbol}-${transaction.Strike}-${transaction.Expiration}`;
      if (!positions.has(key)) {
        positions.set(key, { totalQuantity: 0, currentQuantity: 0, buyRecords: [], sellRecords: [] });
      }
      const position = positions.get(key);

      if (transaction.PosEffect === 'OPEN' && transaction.Side === 'BUY') {
        position.totalQuantity += transaction.Quantity;
        position.currentQuantity += transaction.Quantity;
        position.buyRecords.push({ quantity: transaction.Quantity, price: transaction.Price, tradeDate: transaction.TradeDate, execTime: transaction.ExecTime });
      } else if (transaction.PosEffect === 'CLOSE' && transaction.Side === 'SELL') {
        position.sellRecords.push({ quantity: Math.abs(transaction.Quantity), price: transaction.Price });
        position.currentQuantity -= Math.abs(transaction.Quantity);

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

  const monthlyStats = processedTrades.reduce((acc, trade) => {
    const execTime = new Date(trade.FirstBuyExecTime);
    if (isNaN(execTime)) return acc;
    const monthKey = `${execTime.getFullYear()}-${execTime.getMonth() + 1}`;
    if (!acc[monthKey]) acc[monthKey] = { totalPnl: 0, monthName: execTime.toLocaleString('default', { month: 'long', year: 'numeric' }) };
    acc[monthKey].totalPnl += trade.profitLoss;
    return acc;
  }, {});

  const monthlyPnlValues = Object.entries(monthlyStats);
  let bestMonth = { month: 'N/A', value: 0 };
  let lowestMonth = { month: 'N/A', value: 0 };
  let averagePnl = 0;

  if (monthlyPnlValues.length > 0) {
    const sortedMonths = monthlyPnlValues.sort((a, b) => b[1].totalPnl - a[1].totalPnl);
    bestMonth = { month: sortedMonths[0][1].monthName, value: sortedMonths[0][1].totalPnl };
    lowestMonth = { month: sortedMonths[sortedMonths.length - 1][1].monthName, value: sortedMonths[sortedMonths.length - 1][1].totalPnl };
    averagePnl = monthlyPnlValues.reduce((sum, [, stats]) => sum + stats.totalPnl, 0) / monthlyPnlValues.length;
  }

  // Chart Data for "Performance by Symbol"
  const tradesBySymbol = processedTrades.reduce((acc, trade) => {
    const symbol = trade.Symbol;
    if (!acc[symbol]) acc[symbol] = { profitLoss: 0 };
    acc[symbol].profitLoss += trade.profitLoss;
    return acc;
  }, {});

  const sortedSymbols = Object.entries(tradesBySymbol).sort((a, b) => b[1].profitLoss - a[1].profitLoss).map(([symbol]) => symbol);

  const chartData = {
    labels: sortedSymbols,
    datasets: [{
      label: 'Profit/Loss ($)',
      data: sortedSymbols.map(symbol => tradesBySymbol[symbol].profitLoss),
      backgroundColor: sortedSymbols.map(symbol => tradesBySymbol[symbol].profitLoss >= 0 ? theme.colors.green : theme.colors.red),
      borderColor: sortedSymbols.map(symbol => tradesBySymbol[symbol].profitLoss >= 0 ? theme.colors.green : theme.colors.red),
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: $${context.raw.toFixed(2)}` } },
    },
    scales: {
      x: { title: { display: true, text: 'Profit/Loss ($)', color: theme.colors.white }, ticks: { color: theme.colors.white }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
      y: { title: { display: true, text: 'Symbol', color: theme.colors.white }, ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
    },
  };

  // Chart Data for "Trades per Symbol"
  const tradesCountBySymbol = processedTrades.reduce((acc, trade) => {
    const symbol = trade.Symbol;
    if (!acc[symbol]) acc[symbol] = { tradeCount: 0 };
    acc[symbol].tradeCount += 1;
    return acc;
  }, {});

  const sortedSymbolsByTrades = Object.entries(tradesCountBySymbol).sort((a, b) => b[1].tradeCount - a[1].tradeCount).map(([symbol]) => symbol);

  const tradesChartData = {
    labels: sortedSymbolsByTrades,
    datasets: [{
      label: 'Number of Trades',
      data: sortedSymbolsByTrades.map(symbol => tradesCountBySymbol[symbol].tradeCount),
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      borderWidth: 1,
    }],
  };

  const tradesChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}` } },
    },
    scales: {
      x: { beginAtZero: true, title: { display: true, text: 'Number of Trades', color: theme.colors.white }, ticks: { color: theme.colors.white, stepSize: 1 }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
      y: { title: { display: true, text: 'Symbol', color: theme.colors.white }, ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
    },
  };

  // Chart Data for "Days"
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const pnlByDayOfWeek = daysOfWeek.reduce((acc, day) => {
    acc[day] = { totalPnl: 0, tradeCount: 0 };
    return acc;
  }, {});

  processedTrades.forEach(trade => {
    const execTime = new Date(trade.FirstBuyExecTime);
    if (isNaN(execTime)) return;
    const dayOfWeek = execTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return;
    const dayName = daysOfWeek[dayOfWeek - 1];
    pnlByDayOfWeek[dayName].totalPnl += trade.profitLoss;
    pnlByDayOfWeek[dayName].tradeCount += 1;
  });

  const daysPnlChartData = {
    labels: daysOfWeek,
    datasets: [{
      label: 'Profit/Loss ($)',
      data: daysOfWeek.map(day => pnlByDayOfWeek[day].totalPnl),
      backgroundColor: daysOfWeek.map(day => pnlByDayOfWeek[day].totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderColor: daysOfWeek.map(day => pnlByDayOfWeek[day].totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderWidth: 1,
    }],
  };

  const daysPnlChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: $${context.raw.toFixed(2)}` } },
    },
    scales: {
      x: { title: { display: true, text: 'Profit/Loss ($)', color: theme.colors.white }, ticks: { color: theme.colors.white }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
      y: { title: { display: true, text: 'Day of the Week', color: theme.colors.white }, ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
    },
  };

  const daysTradesChartData = {
    labels: daysOfWeek,
    datasets: [{
      label: 'Number of Trades',
      data: daysOfWeek.map(day => pnlByDayOfWeek[day].tradeCount),
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      borderWidth: 1,
    }],
  };

  const daysTradesChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}` } },
    },
    scales: {
      x: { beginAtZero: true, title: { display: true, text: 'Number of Trades', color: theme.colors.white }, ticks: { color: theme.colors.white, stepSize: 1 }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
      y: { title: { display: true, text: 'Day of the Week', color: theme.colors.white }, ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
    },
  };

  // Chart Data for "Weeks"
  const weeksStats = useMemo(() => {
    const allExecTimes = processedTrades.map(trade => new Date(trade.FirstBuyExecTime)).filter(time => !isNaN(time));
    if (!allExecTimes.length) return [];

    const earliestDate = new Date(Math.min(...allExecTimes));
    const latestDate = new Date(Math.max(...allExecTimes));

    // Generate all weeks in the range, even those with no trades
    const weekStarts = eachWeekOfInterval(
      { start: startOfWeek(earliestDate, { weekStartsOn: 1 }), end: endOfWeek(latestDate, { weekStartsOn: 1 }) },
      { weekStartsOn: 1 } // ISO weeks start on Monday
    );

    const weekMap = new Map();
    weekStarts.forEach((weekStart, index) => {
      const weekNumber = index + 1; // Sequential week number starting from 1
      weekMap.set(weekNumber, { totalPnl: 0, tradeCount: 0, weekStart });
    });

    // Populate trades into their respective weeks
    processedTrades.forEach(trade => {
      const execTime = new Date(trade.FirstBuyExecTime);
      if (isNaN(execTime)) return;

      // Find the week this trade belongs to
      const weekStart = startOfWeek(execTime, { weekStartsOn: 1 });
      const weekIndex = weekStarts.findIndex(ws => ws.getTime() === weekStart.getTime());
      if (weekIndex !== -1) {
        const weekNumber = weekIndex + 1;
        const weekData = weekMap.get(weekNumber);
        weekData.totalPnl += trade.profitLoss;
        weekData.tradeCount += 1;
      }
    });

    // Convert to array for charting
    return Array.from(weekMap.entries()).map(([weekNumber, stats]) => ({
      weekNumber,
      totalPnl: stats.totalPnl,
      tradeCount: stats.tradeCount,
    }));
  }, [processedTrades]);

  const weeksPnlChartData = {
    labels: weeksStats.map(week => `${week.weekNumber}`), // Just the number
    datasets: [{
      label: 'Profit/Loss ($)',
      data: weeksStats.map(week => week.totalPnl),
      backgroundColor: weeksStats.map(week => week.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderColor: weeksStats.map(week => week.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderWidth: 1,
    }],
  };

  const weeksPnlChartOptions = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: $${context.raw.toFixed(2)}` } },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Week Number', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Profit/Loss ($)', color: theme.colors.white }, 
        ticks: { color: theme.colors.white }, 
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  const weeksTradesChartData = {
    labels: weeksStats.map(week => `${week.weekNumber}`), // Just the number
    datasets: [{
      label: 'Number of Trades',
      data: weeksStats.map(week => week.tradeCount),
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      borderWidth: 1,
    }],
  };

  const weeksTradesChartOptions = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}` } },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Week Number', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        beginAtZero: true, 
        title: { display: true, text: 'Number of Trades', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, stepSize: 1 }, 
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  const reportCategories = {
    'Date & Time': ['Days', 'Weeks', 'Months', 'Trade time', 'Trade duration'],
    'Price & Quantity': ['Volume', 'Price', 'Instrument'],
    'Options': ['Days till expiration'],
  };

  const handleReportSelect = (report) => setSelectedReport(report);
  const toggleCategory = (category) => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));

  const renderContent = () => {
    if (selectedReport === 'Overview') {
      return (
        <div>
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: theme.colors.white, marginBottom: '20px' }}>Your Stats</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ textAlign: 'center', flex: '1 1 100px' }}>
                <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Best month</div>
                <div style={{ color: bestMonth.value >= 0 ? theme.colors.green : theme.colors.red, fontSize: '20px', fontWeight: 'bold' }}>
                  ${bestMonth.value.toFixed(2)}
                </div>
                <div style={{ color: '#B0B0B0', fontSize: '12px', marginTop: '4px' }}>{bestMonth.month}</div>
              </div>
              <div style={{ textAlign: 'center', flex: '1 1 100px' }}>
                <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Lowest month</div>
                <div style={{ color: lowestMonth.value >= 0 ? theme.colors.green : theme.colors.red, fontSize: '20px', fontWeight: 'bold' }}>
                  ${lowestMonth.value.toFixed(2)}
                </div>
                <div style={{ color: '#B0B0B0', fontSize: '12px', marginTop: '4px' }}>{lowestMonth.month}</div>
              </div>
              <div style={{ textAlign: 'center', flex: '1 1 100px' }}>
                <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Average</div>
                <div style={{ color: averagePnl >= 0 ? theme.colors.green : theme.colors.red, fontSize: '20px', fontWeight: 'bold' }}>
                  ${averagePnl.toFixed(2)}
                </div>
                <div style={{ color: '#B0B0B0', fontSize: '12px', marginTop: '4px' }}>Per month</div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (selectedReport === 'Instrument') {
      return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          <div ref={chartContainerRef} style={{ flex: 1, minWidth: isHalfScreen ? '200px' : '300px', height: '400px', position: 'relative' }}>
            <h3 style={{ color: theme.colors.white, marginBottom: '20px' }}>Performance by Symbol</h3>
            <div style={{ height: '100%', width: '100%' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: isHalfScreen ? '200px' : '300px', height: '400px', position: 'relative' }}>
            <h3 style={{ color: theme.colors.white, marginBottom: '20px' }}>Trades per Symbol</h3>
            <div style={{ height: '100%', width: '100%' }}>
              <Bar data={tradesChartData} options={tradesChartOptions} />
            </div>
          </div>
        </div>
      );
    } else if (selectedReport === 'Days') {
      return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: isHalfScreen ? '200px' : '300px', height: '400px', position: 'relative' }}>
            <h3 style={{ color: theme.colors.white, marginBottom: '20px' }}>P&L per Day of the Week</h3>
            <div style={{ height: '100%', width: '100%' }}>
              <Bar data={daysPnlChartData} options={daysPnlChartOptions} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: isHalfScreen ? '200px' : '300px', height: '400px', position: 'relative' }}>
            <h3 style={{ color: theme.colors.white, marginBottom: '20px' }}>Trades per Day of the Week</h3>
            <div style={{ height: '100%', width: '100%' }}>
              <Bar data={daysTradesChartData} options={daysTradesChartOptions} />
            </div>
          </div>
        </div>
      );
    } else if (selectedReport === 'Weeks') {
      return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: isHalfScreen ? '200px' : '300px', height: '400px', position: 'relative' }}>
            <h3 style={{ color: theme.colors.white, marginBottom: '20px' }}>P&L per Week</h3>
            <div style={{ height: '100%', width: '100%' }}>
              <Bar data={weeksPnlChartData} options={weeksPnlChartOptions} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: isHalfScreen ? '200px' : '300px', height: '400px', position: 'relative' }}>
            <h3 style={{ color: theme.colors.white, marginBottom: '20px' }}>Trades per Week</h3>
            <div style={{ height: '100%', width: '100%' }}>
              <Bar data={weeksTradesChartData} options={weeksTradesChartOptions} />
            </div>
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
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
        <div style={{ width: isHalfScreen ? '150px' : '200px', backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '8px', marginRight: '20px', flexShrink: 0 }}>
          <ul style={{ listStyle: 'none', padding: '0' }}>
            <li
              onClick={() => handleReportSelect('Overview')}
              onMouseEnter={() => setHoveredReport('Overview')}
              onMouseLeave={() => setHoveredReport(null)}
              style={{
                padding: '10px',
                color: selectedReport === 'Overview' ? theme.colors.green : theme.colors.white,
                cursor: 'pointer',
                border: hoveredReport === 'Overview' ? '1px solid white' : '1px solid transparent',
                borderRadius: '4px',
                marginBottom: '5px',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              <span style={{ marginRight: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  style={{ padding: '10px', color: theme.colors.white, display: 'block', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <span style={{ marginRight: '8px' }}>
                    {category === 'Date & Time' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    )}
                    {category === 'Price & Quantity' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="14" width="4" height="6" />
                        <rect x="10" y="8" width="4" height="12" />
                        <rect x="16" y="11" width="4" height="9" />
                      </svg>
                    )}
                    {category === 'Options' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <span style={{ float: 'right', transform: expandedCategories[category] ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: '12px', transition: 'transform 0.2s ease' }}>
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
                          color: selectedReport === report ? theme.colors.green : '#B0B0B0',
                          cursor: 'pointer',
                          border: hoveredReport === report ? '1px solid white' : '1px solid transparent',
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
        <div style={{ flex: 1, minWidth: 0 }}>{renderContent()}</div>
      </div>
    </div>
  );
};

export default ReportsScreen;