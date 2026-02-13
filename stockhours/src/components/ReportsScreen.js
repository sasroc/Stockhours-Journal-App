import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { theme } from '../theme';
import { startOfWeek, endOfWeek, eachWeekOfInterval, getMonth, getHours, differenceInDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ChartContainer component for robust responsive chart rendering
function ChartContainer({ data, options, layout, title }) {
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Defer rendering to next tick to ensure layout is stable
    const id = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new window.ResizeObserver(() => {
      if (chartRef.current && chartRef.current.resize) {
        chartRef.current.resize();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Set minHeight based on layout
  const minHeight = layout === 'column' ? 300 : 400;

  // Adjust style for small screens (column layout)
  const containerStyle = layout === 'column'
    ? {
        minWidth: 0,
        minHeight,
        height: '400px',
        width: '100%',
        position: 'relative',
        backgroundColor: '#1B2B43',
        padding: '10px 0', // Remove left/right padding
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 0,
        marginRight: 0,
      }
    : {
        minWidth: 0,
        minHeight,
        height: '400px',
        width: '100%',
        position: 'relative',
        backgroundColor: '#1B2B43',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
      };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
    >
      {title && <h3 style={{ color: '#fff', marginBottom: '20px', paddingLeft: layout === 'column' ? '10px' : 0 }}>{title}</h3>}
      <div style={{ flex: 1, width: '100%', minWidth: '200px', overflow: 'visible', position: 'relative' }}>
        {ready && <Bar ref={chartRef} data={data} options={options} />}
      </div>
    </div>
  );
}

// Add getTradeKey function (copied from AllTradesScreen)
const getTradeKey = (trade) => {
  // Match the format used in DailyStatsScreen
  return `${trade.Symbol}-${trade.Strike}-${trade.Expiration}-${trade.FirstBuyExecTime}`;
};

const ReportsScreen = ({ tradeData, setupsTags = [], mistakesTags = [], tradeRatings = {} }) => {
  const { currentUser, isPro } = useAuth();
  const [selectedReport, setSelectedReport] = useState('Overview');
  const [hoveredReport, setHoveredReport] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({
    'AI Insights': true,
    'Date & Time': true,
    'Price & Quantity': true,
    'Options': true,
    'Tags': true,
  });
  const [isHalfScreen, setIsHalfScreen] = useState(window.innerWidth <= 960);
  const [patternInsights, setPatternInsights] = useState(null);
  const [patternLoading, setPatternLoading] = useState(false);
  const [patternError, setPatternError] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsHalfScreen(window.innerWidth <= 960);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchInsights = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.patternInsights) setPatternInsights(data.patternInsights);
          }
        } catch (err) {
          console.error('Failed to load pattern insights:', err);
        }
      }
    };
    fetchInsights();
  }, [currentUser]);

  // Restore original position-tracking logic for processedTrades
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
        positions.set(key, {
          totalQuantity: 0,
          currentQuantity: 0,
          buyRecords: [],
          sellRecords: [],
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
          execTime: transaction.ExecTime,
        });
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
          const exitTime = sellRecordsForCycle[sellRecordsForCycle.length - 1].execTime;
          const totalVolume = totalBuyQuantity;
          const firstBuyPrice = buyRecordsForCycle[0].price;

          trades.push({
            Symbol: transaction.Symbol,
            Strike: transaction.Strike,
            Expiration: transaction.Expiration,
            TradeDate: buyRecordsForCycle[0].tradeDate,
            FirstBuyExecTime: buyRecordsForCycle[0].execTime,
            ExitTime: exitTime,
            profitLoss,
            totalVolume,
            firstBuyPrice,
            totalBuyCost,
          });

          position.totalQuantity = 0;
          position.currentQuantity = 0;
        }
      }
    });
    return trades;
  }, [tradeData]);

  // Create a new tagProcessedTrades array for tag charts only
  const tagProcessedTrades = useMemo(() => {
    if (!tradeData.length) return [];
    const trades = [];
    tradeData.forEach(trade => {
      const sorted = [...trade.Transactions].sort((a, b) => new Date(a.ExecTime) - new Date(b.ExecTime));
      let openTx = null;
      sorted.forEach(tx => {
        if (tx.PosEffect === 'OPEN' && tx.Side === 'BUY') {
          openTx = tx;
        } else if (tx.PosEffect === 'CLOSE' && tx.Side === 'SELL' && openTx) {
          const entryPrice = openTx.Price;
          const exitPrice = tx.Price;
          const quantity = openTx.Quantity;
          const contractMultiplier = 100;
          const netPL = (exitPrice - entryPrice) * quantity * contractMultiplier * (openTx.Side === 'BUY' ? 1 : -1);
          const tradeObj = {
            Symbol: openTx.Symbol,
            Strike: openTx.Strike,
            Expiration: openTx.Expiration,
            FirstBuyExecTime: openTx.ExecTime,
            ExitTime: tx.ExecTime,
            TradeDate: openTx.TradeDate,
            profitLoss: netPL,
            totalVolume: quantity,
            firstBuyPrice: entryPrice,
          };
          const key = getTradeKey(tradeObj);
          const meta = tradeRatings[key] || {};
          trades.push({
            ...tradeObj,
            setupTags: meta.setups || [],
            mistakeTags: meta.mistakes || [],
          });
          openTx = null;
        }
      });
    });
    return trades;
  }, [tradeData, tradeRatings]);

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
      x: { 
        title: { display: true, text: 'Profit/Loss ($)', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Symbol', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
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
      x: { 
        beginAtZero: true, 
        title: { display: true, text: 'Number of Trades', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Symbol', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      }
    }
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
      x: { 
        title: { display: true, text: 'Profit/Loss ($)', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Day of the Week', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
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
      x: { 
        beginAtZero: true, 
        title: { display: true, text: 'Number of Trades', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Day of the Week', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      }
    }
  };

  // Chart Data for "Weeks"
  const weeksStats = useMemo(() => {
    const allExecTimes = processedTrades.map(trade => new Date(trade.FirstBuyExecTime)).filter(time => !isNaN(time));
    if (!allExecTimes.length) return [];

    const earliestDate = new Date(Math.min(...allExecTimes));
    const latestDate = new Date(Math.max(...allExecTimes));

    const weekStarts = eachWeekOfInterval(
      { start: startOfWeek(earliestDate, { weekStartsOn: 1 }), end: endOfWeek(latestDate, { weekStartsOn: 1 }) },
      { weekStartsOn: 1 }
    );

    const weekMap = new Map();
    weekStarts.forEach((weekStart, index) => {
      const weekNumber = index + 1;
      weekMap.set(weekNumber, { totalPnl: 0, tradeCount: 0, weekStart });
    });

    processedTrades.forEach(trade => {
      const execTime = new Date(trade.FirstBuyExecTime);
      if (isNaN(execTime)) return;
      const weekStart = startOfWeek(execTime, { weekStartsOn: 1 });
      const weekIndex = weekStarts.findIndex(ws => ws.getTime() === weekStart.getTime());
      if (weekIndex !== -1) {
        const weekNumber = weekIndex + 1;
        const weekData = weekMap.get(weekNumber);
        weekData.totalPnl += trade.profitLoss;
        weekData.tradeCount += 1;
      }
    });

    return Array.from(weekMap.entries()).map(([weekNumber, stats]) => ({
      weekNumber,
      totalPnl: stats.totalPnl,
      tradeCount: stats.tradeCount,
    }));
  }, [processedTrades]);

  const weeksPnlChartData = {
    labels: weeksStats.map(week => `${week.weekNumber}`),
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
        ticks: { 
          color: theme.colors.white, 
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
          maxTicksLimit: window.innerWidth <= 480 ? 5 : undefined
        },
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
    labels: weeksStats.map(week => `${week.weekNumber}`),
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
        ticks: { 
          color: theme.colors.white, 
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
          maxTicksLimit: window.innerWidth <= 480 ? 5 : undefined
        },
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

  // Chart Data for "Months"
  const monthsStats = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthData = monthNames.map(() => ({ totalPnl: 0, tradeCount: 0 }));

    processedTrades.forEach(trade => {
      const execTime = new Date(trade.FirstBuyExecTime);
      if (isNaN(execTime)) return;
      const monthIndex = getMonth(execTime);
      monthData[monthIndex].totalPnl += trade.profitLoss;
      monthData[monthIndex].tradeCount += 1;
    });

    return monthData.map((stats, index) => ({
      month: monthNames[index],
      totalPnl: stats.totalPnl,
      tradeCount: stats.tradeCount,
    }));
  }, [processedTrades]);

  const monthsPnlChartData = {
    labels: monthsStats.map(stats => stats.month),
    datasets: [{
      label: 'Profit/Loss ($)',
      data: monthsStats.map(stats => stats.totalPnl),
      backgroundColor: monthsStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderColor: monthsStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderWidth: 1,
    }],
  };

  const monthsPnlChartOptions = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: $${context.raw.toFixed(2)}` } },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Month', color: theme.colors.white }, 
        ticks: { 
          color: theme.colors.white, 
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
          maxTicksLimit: window.innerWidth <= 480 ? 6 : undefined,
          font: { size: window.innerWidth <= 480 ? 10 : 12 }
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Profit/Loss ($)', color: theme.colors.white }, 
        ticks: { color: theme.colors.white },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  const monthsTradesChartData = {
    labels: monthsStats.map(stats => stats.month),
    datasets: [{
      label: 'Number of Trades',
      data: monthsStats.map(stats => stats.tradeCount),
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      borderWidth: 1,
    }],
  };

  const monthsTradesChartOptions = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}` } },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Month', color: theme.colors.white }, 
        ticks: { 
          color: theme.colors.white, 
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
          maxTicksLimit: window.innerWidth <= 480 ? 6 : undefined,
          font: { size: window.innerWidth <= 480 ? 10 : 12 }
        },
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

  // Chart Data for "Trade time"
  const tradeTimeStats = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourData = hours.map(() => ({ totalPnl: 0, tradeCount: 0 }));

    processedTrades.forEach(trade => {
      const exitTime = new Date(trade.ExitTime);
      if (isNaN(exitTime)) return;
      const hourIndex = getHours(exitTime);
      hourData[hourIndex].totalPnl += trade.profitLoss;
      hourData[hourIndex].tradeCount += 1;
    });

    return hourData.map((stats, index) => ({
      hour: hours[index],
      totalPnl: stats.totalPnl,
      tradeCount: stats.tradeCount,
    }));
  }, [processedTrades]);

  const tradeTimePnlChartData = {
    labels: tradeTimeStats.map(stats => stats.hour),
    datasets: [{
      label: 'Profit/Loss ($)',
      data: tradeTimeStats.map(stats => stats.totalPnl),
      backgroundColor: tradeTimeStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderColor: tradeTimeStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderWidth: 1,
    }],
  };

  const tradeTimePnlChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: $${context.raw.toFixed(2)}` } },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Profit/Loss ($)', color: theme.colors.white }, 
        ticks: { color: theme.colors.white },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Hour of Day', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0, font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  const tradeTimeTradesChartData = {
    labels: tradeTimeStats.map(stats => stats.hour),
    datasets: [{
      label: 'Number of Trades',
      data: tradeTimeStats.map(stats => stats.tradeCount),
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      borderWidth: 1,
    }],
  };

  const tradeTimeTradesChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}` } },
    },
    scales: {
      x: { 
        beginAtZero: true, 
        title: { display: true, text: 'Number of Trades', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Hour of Day', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0, font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  // Chart Data for "Trade duration"
  const tradeDurationStats = useMemo(() => {
    const durationBuckets = [
      { label: 'Under 1 min', min: 0, max: 60 },
      { label: '1:00 to 1:59', min: 60, max: 120 },
      { label: '2:00 to 4:59', min: 120, max: 300 },
      { label: '5:00 to 9:59', min: 300, max: 600 },
      { label: '10:00 to 29:59', min: 600, max: 1800 },
      { label: '30:00 to 59:59', min: 1800, max: 3600 },
      { label: '1:00:00 to 1:59:00', min: 3600, max: 7200 },
    ];
    const durationData = durationBuckets.map(() => ({ totalPnl: 0, tradeCount: 0 }));

    processedTrades.forEach(trade => {
      const entryTime = new Date(trade.FirstBuyExecTime);
      const exitTime = new Date(trade.ExitTime);
      if (isNaN(entryTime) || isNaN(exitTime)) return;
      const durationSeconds = (exitTime - entryTime) / 1000;
      if (durationSeconds < 0) return;

      const bucketIndex = durationBuckets.findIndex(bucket => durationSeconds >= bucket.min && durationSeconds < bucket.max);
      if (bucketIndex !== -1) {
        durationData[bucketIndex].totalPnl += trade.profitLoss;
        durationData[bucketIndex].tradeCount += 1;
      }
    });

    return durationData.map((stats, index) => ({
      duration: durationBuckets[index].label,
      totalPnl: stats.totalPnl,
      tradeCount: stats.tradeCount,
    }));
  }, [processedTrades]);

  const tradeDurationPnlChartData = {
    labels: tradeDurationStats.map(stats => stats.duration),
    datasets: [{
      label: 'Profit/Loss ($)',
      data: tradeDurationStats.map(stats => stats.totalPnl),
      backgroundColor: tradeDurationStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderColor: tradeDurationStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderWidth: 1,
    }],
  };

  const tradeDurationPnlChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: $${context.raw.toFixed(2)}` } },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Profit/Loss ($)', color: theme.colors.white }, 
        ticks: { color: theme.colors.white },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Trade Duration', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  const tradeDurationTradesChartData = {
    labels: tradeDurationStats.map(stats => stats.duration),
    datasets: [{
      label: 'Number of Trades',
      data: tradeDurationStats.map(stats => stats.tradeCount),
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      borderWidth: 1,
    }],
  };

  const tradeDurationTradesChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}` } },
    },
    scales: {
      x: { 
        beginAtZero: true, 
        title: { display: true, text: 'Number of Trades', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Trade Duration', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  // Chart Data for "Volume"
  const volumeStats = useMemo(() => {
    const volumeBuckets = [
      { label: '1 to 2', min: 1, max: 3 },
      { label: '3 to 4', min: 3, max: 5 },
      { label: '5 to 9', min: 5, max: 10 },
      { label: '10 to 19', min: 10, max: 20 },
      { label: '20 to 49', min: 20, max: 50 },
      { label: '50 to 99', min: 50, max: 100 },
      { label: '100 to 499', min: 100, max: 500 },
      { label: '500 to 999', min: 500, max: 1000 },
      { label: '1000 and over', min: 1000, max: Infinity },
    ];
    const volumeData = volumeBuckets.map(() => ({ totalPnl: 0, tradeCount: 0 }));

    processedTrades.forEach(trade => {
      const volume = trade.totalVolume;
      if (!volume || volume < 1) return;

      const bucketIndex = volumeBuckets.findIndex(bucket => volume >= bucket.min && volume < bucket.max);
      if (bucketIndex !== -1) {
        volumeData[bucketIndex].totalPnl += trade.profitLoss;
        volumeData[bucketIndex].tradeCount += 1;
      }
    });

    return volumeData.map((stats, index) => ({
      volume: volumeBuckets[index].label,
      totalPnl: stats.totalPnl,
      tradeCount: stats.tradeCount,
    }));
  }, [processedTrades]);

  const volumePnlChartData = {
    labels: volumeStats.map(stats => stats.volume),
    datasets: [{
      label: 'Profit/Loss ($)',
      data: volumeStats.map(stats => stats.totalPnl),
      backgroundColor: volumeStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderColor: volumeStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderWidth: 1,
    }],
  };

  const volumePnlChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: $${context.raw.toFixed(2)}` } },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Profit/Loss ($)', color: theme.colors.white }, 
        ticks: { color: theme.colors.white },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Volume', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  const volumeTradesChartData = {
    labels: volumeStats.map(stats => stats.volume),
    datasets: [{
      label: 'Number of Trades',
      data: volumeStats.map(stats => stats.tradeCount),
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      borderWidth: 1,
    }],
  };

  const volumeTradesChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}` } },
    },
    scales: {
      x: { 
        beginAtZero: true, 
        title: { display: true, text: 'Number of Trades', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Volume', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  // Chart Data for "Price"
  const priceStats = useMemo(() => {
    const priceBuckets = [
      { label: 'Under $0.99', min: 0, max: 0.99 },
      { label: '$1.00 to $1.99', min: 1.00, max: 2.00 },
      { label: '$2.00 to $4.99', min: 2.00, max: 5.00 },
      { label: '$5.00 to $9.99', min: 5.00, max: 10.00 },
      { label: 'Above $10.00', min: 10.00, max: Infinity },
    ];
    const priceData = priceBuckets.map(() => ({ totalPnl: 0, tradeCount: 0 }));

    processedTrades.forEach(trade => {
      const price = trade.firstBuyPrice;
      if (!price || price < 0) return;

      const bucketIndex = priceBuckets.findIndex(bucket => price >= bucket.min && price < bucket.max);
      if (bucketIndex !== -1) {
        priceData[bucketIndex].totalPnl += trade.profitLoss;
        priceData[bucketIndex].tradeCount += 1;
      }
    });

    return priceData.map((stats, index) => ({
      price: priceBuckets[index].label,
      totalPnl: stats.totalPnl,
      tradeCount: stats.tradeCount,
    }));
  }, [processedTrades]);

  const pricePnlChartData = {
    labels: priceStats.map(stats => stats.price),
    datasets: [{
      label: 'Profit/Loss ($)',
      data: priceStats.map(stats => stats.totalPnl),
      backgroundColor: priceStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderColor: priceStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderWidth: 1,
    }],
  };

  const pricePnlChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: $${context.raw.toFixed(2)}` } },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Profit/Loss ($)', color: theme.colors.white }, 
        ticks: { color: theme.colors.white },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Contract Price', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  const priceTradesChartData = {
    labels: priceStats.map(stats => stats.price),
    datasets: [{
      label: 'Number of Trades',
      data: priceStats.map(stats => stats.tradeCount),
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      borderWidth: 1,
    }],
  };

  const priceTradesChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}` } },
    },
    scales: {
      x: { 
        beginAtZero: true, 
        title: { display: true, text: 'Number of Trades', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Contract Price', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  // Chart Data for "Days till expiration"
  const daysTillExpirationStats = useMemo(() => {
    const dayBuckets = [
      { label: 'Same day', min: 0, max: 1 },
      { label: '1 day', min: 1, max: 2 },
      { label: '2 days', min: 2, max: 3 },
      { label: '3 days', min: 3, max: 4 },
      { label: '4 days', min: 4, max: 5 },
      { label: '5 days', min: 5, max: 6 },
      { label: '6 days', min: 6, max: 7 },
      { label: '7 days', min: 7, max: 8 },
      { label: '8 days', min: 8, max: 9 },
      { label: '9 days', min: 9, max: 10 },
      { label: '10+ days', min: 10, max: Infinity },
    ];
    const dayData = dayBuckets.map(() => ({ totalPnl: 0, tradeCount: 0 }));

    // Custom date parsing for TradeDate (MM/DD/YYYY) and Expiration (DD MM YYYY)
    const parseTradeDate = (dateStr) => {
      if (!dateStr) return null;
      const [month, day, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day); // month - 1 because JS months are 0-based
    };

    const parseExpirationDate = (dateStr) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split(' ').map(Number);
      return new Date(year, month - 1, day); // month - 1 because JS months are 0-based
    };

    processedTrades.forEach((trade, index) => {
      const tradeDate = parseTradeDate(trade.TradeDate);
      const expirationDate = parseExpirationDate(trade.Expiration);

      if (!tradeDate || !expirationDate || isNaN(tradeDate) || isNaN(expirationDate)) {
        console.warn(`Invalid dates for trade ${index}: TradeDate=${trade.TradeDate}, Expiration=${trade.Expiration}`);
        return;
      }

      const daysTillExpiration = differenceInDays(expirationDate, tradeDate);
      if (daysTillExpiration < 0) {
        console.warn(`Negative days till expiration for trade ${index}: ${daysTillExpiration}`);
        return;
      }

      const bucketIndex = dayBuckets.findIndex(bucket => daysTillExpiration >= bucket.min && daysTillExpiration < bucket.max);
      if (bucketIndex !== -1) {
        dayData[bucketIndex].totalPnl += trade.profitLoss;
        dayData[bucketIndex].tradeCount += 1;
      } else {
        console.warn(`Trade ${index} daysTillExpiration ${daysTillExpiration} didn't match any bucket`);
      }
    });

    return dayData.map((stats, index) => ({
      days: dayBuckets[index].label,
      totalPnl: stats.totalPnl,
      tradeCount: stats.tradeCount,
    }));
  }, [processedTrades]);

  const daysTillExpirationPnlChartData = {
    labels: daysTillExpirationStats.map(stats => stats.days),
    datasets: [{
      label: 'Profit/Loss ($)',
      data: daysTillExpirationStats.map(stats => stats.totalPnl),
      backgroundColor: daysTillExpirationStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderColor: daysTillExpirationStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderWidth: 1,
    }],
  };

  const daysTillExpirationPnlChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: $${context.raw.toFixed(2)}` } },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Profit/Loss ($)', color: theme.colors.white }, 
        ticks: { color: theme.colors.white },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Days till Expiration', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  const daysTillExpirationTradesChartData = {
    labels: daysTillExpirationStats.map(stats => stats.days),
    datasets: [{
      label: 'Number of Trades',
      data: daysTillExpirationStats.map(stats => stats.tradeCount),
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      borderWidth: 1,
    }],
  };

  const daysTillExpirationTradesChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: theme.colors.white } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}` } },
    },
    scales: {
      x: { 
        beginAtZero: true, 
        title: { display: true, text: 'Number of Trades', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        title: { display: true, text: 'Days till Expiration', color: theme.colors.white }, 
        ticks: { color: theme.colors.white, autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
    },
  };

  // Add new useMemo hooks for tag statistics
  const setupTagStats = useMemo(() => {
    const tagMap = new Map();
    setupsTags.forEach(tag => {
      tagMap.set(tag, { totalPnl: 0, tradeCount: 0 });
    });
    tagProcessedTrades.forEach(trade => {
      if (trade.setupTags && trade.setupTags.length > 0) {
        trade.setupTags.forEach(tag => {
          if (tagMap.has(tag)) {
            const stats = tagMap.get(tag);
            stats.totalPnl += trade.profitLoss;
            stats.tradeCount += 1;
          }
        });
      }
    });
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1].totalPnl - a[1].totalPnl)
      .map(([tag, stats]) => ({
        tag,
        totalPnl: stats.totalPnl,
        tradeCount: stats.tradeCount
      }));
  }, [tagProcessedTrades, setupsTags]);

  const mistakeTagStats = useMemo(() => {
    const tagMap = new Map();
    mistakesTags.forEach(tag => {
      tagMap.set(tag, { totalPnl: 0, tradeCount: 0 });
    });
    tagProcessedTrades.forEach(trade => {
      if (trade.mistakeTags && trade.mistakeTags.length > 0) {
        trade.mistakeTags.forEach(tag => {
          if (tagMap.has(tag)) {
            const stats = tagMap.get(tag);
            stats.totalPnl += trade.profitLoss;
            stats.tradeCount += 1;
          }
        });
      }
    });
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1].totalPnl - a[1].totalPnl)
      .map(([tag, stats]) => ({
        tag,
        totalPnl: stats.totalPnl,
        tradeCount: stats.tradeCount
      }));
  }, [tagProcessedTrades, mistakesTags]);

  // Add chart data for setup tags
  const setupTagPnlChartData = {
    labels: setupTagStats.map(stats => stats.tag),
    datasets: [{
      label: 'Profit/Loss ($)',
      data: setupTagStats.map(stats => stats.totalPnl),
      backgroundColor: setupTagStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderColor: setupTagStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderWidth: 1,
    }],
  };

  const setupTagTradesChartData = {
    labels: setupTagStats.map(stats => stats.tag),
    datasets: [{
      label: 'Number of Trades',
      data: setupTagStats.map(stats => stats.tradeCount),
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      borderWidth: 1,
    }],
  };

  // Add chart data for mistake tags
  const mistakeTagPnlChartData = {
    labels: mistakeTagStats.map(stats => stats.tag),
    datasets: [{
      label: 'Profit/Loss ($)',
      data: mistakeTagStats.map(stats => stats.totalPnl),
      backgroundColor: mistakeTagStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderColor: mistakeTagStats.map(stats => stats.totalPnl >= 0 ? theme.colors.green : theme.colors.red),
      borderWidth: 1,
    }],
  };

  const mistakeTagTradesChartData = {
    labels: mistakeTagStats.map(stats => stats.tag),
    datasets: [{
      label: 'Number of Trades',
      data: mistakeTagStats.map(stats => stats.tradeCount),
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      borderWidth: 1,
    }],
  };

  const computeTradeStats = () => {
    const trades = processedTrades;
    const tagTrades = tagProcessedTrades;

    // Overall
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profitLoss > 0);
    const losingTrades = trades.filter(t => t.profitLoss < 0);
    const winRate = totalTrades > 0 ? ((winningTrades.length / totalTrades) * 100).toFixed(1) : '0';
    const avgWin = winningTrades.length > 0 ? (winningTrades.reduce((s, t) => s + t.profitLoss, 0) / winningTrades.length).toFixed(2) : '0';
    const avgLoss = losingTrades.length > 0 ? (losingTrades.reduce((s, t) => s + t.profitLoss, 0) / losingTrades.length).toFixed(2) : '0';
    const grossProfit = winningTrades.reduce((s, t) => s + t.profitLoss, 0);
    const grossLoss = Math.abs(losingTrades.reduce((s, t) => s + t.profitLoss, 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : '0';
    const totalPL = trades.reduce((s, t) => s + t.profitLoss, 0).toFixed(2);
    const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.profitLoss)).toFixed(2) : '0';
    const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.profitLoss)).toFixed(2) : '0';

    // By Time of Day
    const timeLabels = ['Pre-market', '9-10', '10-11', '11-12', '12-1', '1-2', '2-3', '3-4'];
    const timeBuckets = {};
    timeLabels.forEach(l => { timeBuckets[l] = { trades: 0, wins: 0, totalPL: 0 }; });
    trades.forEach(t => {
      const h = new Date(t.FirstBuyExecTime).getHours();
      let bucket;
      if (h < 9) bucket = 'Pre-market';
      else if (h < 10) bucket = '9-10';
      else if (h < 11) bucket = '10-11';
      else if (h < 12) bucket = '11-12';
      else if (h < 13) bucket = '12-1';
      else if (h < 14) bucket = '1-2';
      else if (h < 15) bucket = '2-3';
      else bucket = '3-4';
      timeBuckets[bucket].trades++;
      if (t.profitLoss > 0) timeBuckets[bucket].wins++;
      timeBuckets[bucket].totalPL += t.profitLoss;
    });
    const byTimeOfDay = {};
    for (const [k, v] of Object.entries(timeBuckets)) {
      if (v.trades > 0) {
        byTimeOfDay[k] = { trades: v.trades, winRate: ((v.wins / v.trades) * 100).toFixed(1), avgPL: (v.totalPL / v.trades).toFixed(2) };
      }
    }

    // By Day of Week
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayBuckets = {};
    daysOfWeek.forEach(d => { dayBuckets[d] = { trades: 0, wins: 0, totalPL: 0 }; });
    trades.forEach(t => {
      const day = new Date(t.FirstBuyExecTime).getDay();
      if (day >= 1 && day <= 5) {
        const name = daysOfWeek[day - 1];
        dayBuckets[name].trades++;
        if (t.profitLoss > 0) dayBuckets[name].wins++;
        dayBuckets[name].totalPL += t.profitLoss;
      }
    });
    const byDayOfWeek = {};
    for (const [k, v] of Object.entries(dayBuckets)) {
      if (v.trades > 0) {
        byDayOfWeek[k] = { trades: v.trades, winRate: ((v.wins / v.trades) * 100).toFixed(1), avgPL: (v.totalPL / v.trades).toFixed(2) };
      }
    }

    // By Symbol (top 10)
    const symbolMap = {};
    trades.forEach(t => {
      if (!symbolMap[t.Symbol]) symbolMap[t.Symbol] = { trades: 0, wins: 0, totalPL: 0 };
      symbolMap[t.Symbol].trades++;
      if (t.profitLoss > 0) symbolMap[t.Symbol].wins++;
      symbolMap[t.Symbol].totalPL += t.profitLoss;
    });
    const bySymbol = Object.entries(symbolMap)
      .sort((a, b) => b[1].trades - a[1].trades)
      .slice(0, 10)
      .map(([symbol, v]) => ({
        symbol, trades: v.trades, winRate: ((v.wins / v.trades) * 100).toFixed(1),
        totalPL: v.totalPL.toFixed(2), avgPL: (v.totalPL / v.trades).toFixed(2),
      }));

    // By Setup Tag
    const setupMap = {};
    tagTrades.forEach(t => {
      (t.setupTags || []).forEach(tag => {
        if (!setupMap[tag]) setupMap[tag] = { trades: 0, wins: 0, totalPL: 0 };
        setupMap[tag].trades++;
        if (t.profitLoss > 0) setupMap[tag].wins++;
        setupMap[tag].totalPL += t.profitLoss;
      });
    });
    const bySetup = Object.entries(setupMap).map(([tag, v]) => ({
      tag, trades: v.trades, winRate: ((v.wins / v.trades) * 100).toFixed(1), avgPL: (v.totalPL / v.trades).toFixed(2),
    }));

    // By Mistake Tag
    const mistakeMap = {};
    tagTrades.forEach(t => {
      (t.mistakeTags || []).forEach(tag => {
        if (!mistakeMap[tag]) mistakeMap[tag] = { trades: 0, totalPL: 0 };
        mistakeMap[tag].trades++;
        mistakeMap[tag].totalPL += t.profitLoss;
      });
    });
    const byMistake = Object.entries(mistakeMap).map(([tag, v]) => ({
      tag, trades: v.trades, avgPL: (v.totalPL / v.trades).toFixed(2),
    }));

    // By Duration
    const durLabels = ['<15min', '15-60min', '1-4hr', '4hr+'];
    const durBuckets = {};
    durLabels.forEach(l => { durBuckets[l] = { trades: 0, wins: 0, totalPL: 0 }; });
    trades.forEach(t => {
      const entry = new Date(t.FirstBuyExecTime);
      const exit = new Date(t.ExitTime);
      if (isNaN(entry) || isNaN(exit)) return;
      const mins = (exit - entry) / (1000 * 60);
      let bucket;
      if (mins < 15) bucket = '<15min';
      else if (mins < 60) bucket = '15-60min';
      else if (mins < 240) bucket = '1-4hr';
      else bucket = '4hr+';
      durBuckets[bucket].trades++;
      if (t.profitLoss > 0) durBuckets[bucket].wins++;
      durBuckets[bucket].totalPL += t.profitLoss;
    });
    const byDuration = {};
    for (const [k, v] of Object.entries(durBuckets)) {
      if (v.trades > 0) {
        byDuration[k] = { trades: v.trades, winRate: ((v.wins / v.trades) * 100).toFixed(1), avgPL: (v.totalPL / v.trades).toFixed(2) };
      }
    }

    // By Position Size
    const sizeLabels = ['1', '2-5', '6-10', '10+'];
    const sizeBuckets = {};
    sizeLabels.forEach(l => { sizeBuckets[l] = { trades: 0, wins: 0, totalPL: 0 }; });
    trades.forEach(t => {
      const vol = t.totalVolume || 0;
      let bucket;
      if (vol <= 1) bucket = '1';
      else if (vol <= 5) bucket = '2-5';
      else if (vol <= 10) bucket = '6-10';
      else bucket = '10+';
      sizeBuckets[bucket].trades++;
      if (t.profitLoss > 0) sizeBuckets[bucket].wins++;
      sizeBuckets[bucket].totalPL += t.profitLoss;
    });
    const bySize = {};
    for (const [k, v] of Object.entries(sizeBuckets)) {
      if (v.trades > 0) {
        bySize[k] = { trades: v.trades, winRate: ((v.wins / v.trades) * 100).toFixed(1), avgPL: (v.totalPL / v.trades).toFixed(2) };
      }
    }

    return {
      overall: { totalTrades, winRate, avgWin, avgLoss, profitFactor, totalPL, bestTrade, worstTrade },
      byTimeOfDay, byDayOfWeek, bySymbol, bySetup, byMistake, byDuration, bySize,
    };
  };

  const handlePatternDetection = async () => {
    setPatternLoading(true);
    setPatternError(null);
    try {
      const stats = computeTradeStats();
      const token = await currentUser.getIdToken();
      const API_URL = process.env.REACT_APP_STRIPE_API_URL || '';
      const response = await fetch(`${API_URL}/api/ai/pattern-detection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stats }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          setPatternError('AI Pattern Detection is available on the Pro plan.');
        } else if (response.status === 429) {
          setPatternError('AI service is busy. Please try again in a moment.');
        } else {
          setPatternError(errData.error || 'Failed to generate pattern insights.');
        }
        return;
      }

      const data = await response.json();
      setPatternInsights(data.insights);
      // Persist to Firestore
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { patternInsights: data.insights });
      }
    } catch (err) {
      console.error('Pattern detection error:', err);
      setPatternError('Network error. Please check your connection and try again.');
    } finally {
      setPatternLoading(false);
    }
  };

  const handleDeletePatternInsights = async () => {
    setPatternInsights(null);
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { patternInsights: null });
      } catch (err) {
        console.error('Failed to delete pattern insights:', err);
      }
    }
  };

  const reportCategories = {
    'AI Insights': ['Pattern Detection'],
    'Date & Time': ['Days', 'Weeks', 'Months', 'Trade time', 'Trade duration'],
    'Price & Quantity': ['Volume', 'Price', 'Instrument'],
    'Options': ['Days till expiration'],
    'Tags': ['Setups', 'Mistakes'],
  };

  const handleReportSelect = (report) => setSelectedReport(report);
  const toggleCategory = (category) => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));

  const renderContent = () => {
    if (selectedReport === 'Overview') {
      // Calculate additional statistics from processedTrades
      const totalPnL = processedTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
      
      // Calculate average daily volume (contracts)
      const volumeByDay = processedTrades.reduce((acc, trade) => {
        const date = new Date(trade.FirstBuyExecTime).toDateString();
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += trade.totalVolume;
        return acc;
      }, {});
      const avgDailyVolume = Object.values(volumeByDay).reduce((sum, volume) => sum + volume, 0) / Object.keys(volumeByDay).length;
      
      const winningTrades = processedTrades.filter(trade => trade.profitLoss > 0);
      const losingTrades = processedTrades.filter(trade => trade.profitLoss < 0);
      const breakEvenTrades = processedTrades.filter(trade => trade.profitLoss === 0);
      
      const avgWinningTrade = winningTrades.length > 0 ? winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) / winningTrades.length : 0;
      const avgLosingTrade = losingTrades.length > 0 ? losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) / losingTrades.length : 0;

      // Calculate average winning/losing trade % gain/loss
      const avgWinningTradePercent = winningTrades.length > 0
        ? winningTrades.reduce((sum, trade) => {
            const roi = trade.totalBuyCost > 0 ? (trade.profitLoss / trade.totalBuyCost) * 100 : 0;
            return sum + roi;
          }, 0) / winningTrades.length
        : 0;
      const avgLosingTradePercent = losingTrades.length > 0
        ? losingTrades.reduce((sum, trade) => {
            const roi = trade.totalBuyCost > 0 ? (trade.profitLoss / trade.totalBuyCost) * 100 : 0;
            return sum + roi;
          }, 0) / losingTrades.length
        : 0;

      // Calculate average hold times
      const avgHoldTimeAll = processedTrades.reduce((sum, trade) => {
        const duration = (new Date(trade.ExitTime) - new Date(trade.FirstBuyExecTime)) / (1000 * 60); // in minutes
        return sum + duration;
      }, 0) / (processedTrades.length || 1);

      const avgHoldTimeWinning = winningTrades.reduce((sum, trade) => {
        const duration = (new Date(trade.ExitTime) - new Date(trade.FirstBuyExecTime)) / (1000 * 60);
        return sum + duration;
      }, 0) / (winningTrades.length || 1);

      const avgHoldTimeLoosing = losingTrades.reduce((sum, trade) => {
        const duration = (new Date(trade.ExitTime) - new Date(trade.FirstBuyExecTime)) / (1000 * 60);
        return sum + duration;
      }, 0) / (losingTrades.length || 1);

      // Calculate average trade P&L
      const avgTradePnL = totalPnL / (processedTrades.length || 1);

      // Calculate profit factor
      const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
      const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0));
      const profitFactor = grossLoss !== 0 ? grossProfit / grossLoss : 0;

      // Calculate consecutive trade streaks
      let currentTradeStreak = 0;
      let maxConsecutiveWins = 0;
      let maxConsecutiveLosses = 0;
      let prevTradeWasWin = null;

      processedTrades.forEach(trade => {
        const isWin = trade.profitLoss > 0;
        if (prevTradeWasWin === null) {
          currentTradeStreak = 1;
        } else if (prevTradeWasWin === isWin) {
          currentTradeStreak++;
        } else {
          currentTradeStreak = 1;
        }
        
        if (isWin) {
          maxConsecutiveWins = Math.max(maxConsecutiveWins, currentTradeStreak);
        } else {
          maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentTradeStreak);
        }
        
        prevTradeWasWin = isWin;
      });

      // Calculate largest individual trade profit/loss
      const profitableTrades = processedTrades.filter(trade => trade.profitLoss > 0);
      const largestIndividualProfit = profitableTrades.length > 0 
        ? Math.max(...profitableTrades.map(trade => trade.profitLoss))
        : 'N/A';
      const largestIndividualLoss = Math.min(...processedTrades.map(trade => trade.profitLoss));

      // Group trades by day for daily statistics
      const tradesByDay = processedTrades.reduce((acc, trade) => {
        const date = new Date(trade.FirstBuyExecTime).toDateString();
        if (!acc[date]) {
          acc[date] = {
            trades: [],
            pnl: 0
          };
        }
        acc[date].trades.push(trade);
        acc[date].pnl += trade.profitLoss;
        return acc;
      }, {});

      const tradingDays = Object.keys(tradesByDay).length;
      const winningDays = Object.values(tradesByDay).filter(day => day.pnl > 0).length;
      const losingDays = Object.values(tradesByDay).filter(day => day.pnl < 0).length;
      const breakEvenDays = Object.values(tradesByDay).filter(day => day.pnl === 0).length;
      
      // Calculate consecutive day streaks
      let currentDayStreak = 0;
      let maxWinningDays = 0;
      let maxLosingDays = 0;
      let prevDayWasWin = null;
      
      const sortedDays = Object.entries(tradesByDay)
        .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));
      
      sortedDays.forEach(([, dayData]) => {
        const isDayWin = dayData.pnl > 0;
        if (prevDayWasWin === null) {
          currentDayStreak = 1;
        } else if (prevDayWasWin === isDayWin) {
          currentDayStreak++;
        } else {
          currentDayStreak = 1;
        }
        
        if (isDayWin) {
          maxWinningDays = Math.max(maxWinningDays, currentDayStreak);
        } else {
          maxLosingDays = Math.max(maxLosingDays, currentDayStreak);
        }
        
        prevDayWasWin = isDayWin;
      });

      // Calculate daily P&L stats
      const avgDailyPnL = totalPnL / tradingDays;
      const avgWinningDayPnL = Object.values(tradesByDay)
        .filter(day => day.pnl > 0)
        .reduce((sum, day) => sum + day.pnl, 0) / winningDays;
      const avgLosingDayPnL = Object.values(tradesByDay)
        .filter(day => day.pnl < 0)
        .reduce((sum, day) => sum + day.pnl, 0) / losingDays;
      
      // Calculate largest daily P&L
      const profitableDays = Object.values(tradesByDay).filter(day => day.pnl > 0);
      const largestProfitableDay = profitableDays.length > 0 
        ? Math.max(...profitableDays.map(day => day.pnl))
        : 'N/A';
      const largestLosingDay = Math.min(...Object.values(tradesByDay).map(day => day.pnl));

      // Calculate trade expectancy
      const tradeExpectancy = (avgWinningTrade * (winningTrades.length / processedTrades.length)) +
                             (avgLosingTrade * (losingTrades.length / processedTrades.length));

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

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isHalfScreen ? '1fr' : '1fr 1fr', 
            gap: '10px',
            color: theme.colors.white,
            fontSize: '14px',
            width: '100%', // Ensure full width
            maxWidth: '100%', // Prevent overflow
            overflowX: 'hidden' // Hide horizontal scroll
          }}>
            <div style={{ 
              display: 'grid', 
              gap: '8px',
              minWidth: '0', // Prevents overflow
              overflow: 'hidden', // Ensures content stays within container
              width: '100%' // Ensure full width
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Total P&L</span>
                <span style={{ color: totalPnL >= 0 ? theme.colors.green : theme.colors.red }}>${totalPnL.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Average daily volume</span>
                <span>{Math.round(avgDailyVolume)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Average winning trade</span>
                <span style={{ color: theme.colors.green }}>${avgWinningTrade.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Average losing trade</span>
                <span style={{ color: theme.colors.red }}>${avgLosingTrade.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Avg winning trade % gain</span>
                <span style={{ color: theme.colors.green }}>+{avgWinningTradePercent.toFixed(2)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Avg losing trade % loss</span>
                <span style={{ color: theme.colors.red }}>{avgLosingTradePercent.toFixed(2)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Total number of trades</span>
                <span>{processedTrades.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Number of winning trades</span>
                <span>{winningTrades.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Number of losing trades</span>
                <span>{losingTrades.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Number of break even trades</span>
                <span>{breakEvenTrades.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Max consecutive wins</span>
                <span>{maxConsecutiveWins}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Max consecutive losses</span>
                <span>{maxConsecutiveLosses}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Largest profit</span>
                <span style={{ color: theme.colors.green }}>
                  {largestIndividualProfit === 'N/A' 
                    ? 'N/A' 
                    : `$${largestIndividualProfit.toFixed(2)}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Largest loss</span>
                <span style={{ color: theme.colors.red }}>${largestIndividualLoss.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Average hold time (All trades)</span>
                <span>{Math.round(avgHoldTimeAll)} minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Average hold time (Winning trades)</span>
                <span>{Math.round(avgHoldTimeWinning)} minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Average hold time (Losing trades)</span>
                <span>{Math.round(avgHoldTimeLoosing)} minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Average trade P&L</span>
                <span style={{ color: avgTradePnL >= 0 ? theme.colors.green : theme.colors.red }}>${avgTradePnL.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Profit factor</span>
                <span>{profitFactor.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gap: '8px',
              minWidth: '0', // Prevents overflow
              overflow: 'hidden', // Ensures content stays within container
              marginTop: isHalfScreen ? '20px' : '0', // Add margin when stacked
              width: '100%' // Ensure full width
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Open trades</span>
                <span>0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Total trading days</span>
                <span>{tradingDays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Winning days</span>
                <span>{winningDays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Losing days</span>
                <span>{losingDays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Breakeven days</span>
                <span>{breakEvenDays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Logged days</span>
                <span>{tradingDays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Max consecutive winning days</span>
                <span>{maxWinningDays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Max consecutive losing days</span>
                <span>{maxLosingDays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Average daily P&L</span>
                <span style={{ color: avgDailyPnL >= 0 ? theme.colors.green : theme.colors.red }}>${avgDailyPnL.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Average winning day P&L</span>
                <span style={{ color: theme.colors.green }}>${avgWinningDayPnL.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Average losing day P&L</span>
                <span style={{ color: theme.colors.red }}>${avgLosingDayPnL.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Largest profitable day (Profits)</span>
                <span style={{ color: theme.colors.green }}>
                  {largestProfitableDay === 'N/A' 
                    ? 'N/A' 
                    : `$${largestProfitableDay.toFixed(2)}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Largest losing day (Losses)</span>
                <span style={{ color: theme.colors.red }}>${largestLosingDay.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Trade expectancy</span>
                <span style={{ color: tradeExpectancy >= 0 ? theme.colors.green : theme.colors.red }}>${tradeExpectancy.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (selectedReport === 'Instrument') {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: isHalfScreen ? 'column' : 'row', 
          gap: '20px', 
          marginTop: '20px',
          width: '100%',
          minWidth: '300px',
          maxWidth: '100%',
          overflow: 'auto'
        }}>
          <ChartContainer
            data={chartData}
            options={chartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Performance by Symbol"
          />
          <ChartContainer
            data={tradesChartData}
            options={tradesChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Trades per Symbol"
          />
        </div>
      );
    } else if (selectedReport === 'Days') {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: isHalfScreen ? 'column' : 'row', 
          gap: '20px', 
          marginTop: '20px',
          width: '100%',
          minWidth: '300px', // Add minimum width
          maxWidth: '100%',
          overflow: 'auto' // Change to auto
        }}>
          <ChartContainer
            data={daysPnlChartData}
            options={daysPnlChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="P&L per Day of the Week"
          />
          <ChartContainer
            data={daysTradesChartData}
            options={daysTradesChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Trades per Day of the Week"
          />
        </div>
      );
    } else if (selectedReport === 'Weeks') {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: isHalfScreen ? 'column' : 'row', 
          gap: '20px', 
          marginTop: '20px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible'
        }}>
          <ChartContainer
            data={weeksPnlChartData}
            options={weeksPnlChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="P&L per Week"
          />
          <ChartContainer
            data={weeksTradesChartData}
            options={weeksTradesChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Trades per Week"
          />
        </div>
      );
    } else if (selectedReport === 'Months') {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: isHalfScreen ? 'column' : 'row', 
          gap: '20px', 
          marginTop: '20px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible'
        }}>
          <ChartContainer
            data={monthsPnlChartData}
            options={monthsPnlChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="P&L per Month"
          />
          <ChartContainer
            data={monthsTradesChartData}
            options={monthsTradesChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Trades per Month"
          />
        </div>
      );
    } else if (selectedReport === 'Trade time') {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: isHalfScreen ? 'column' : 'row', 
          gap: '20px', 
          marginTop: '20px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible'
        }}>
          <ChartContainer
            data={tradeTimePnlChartData}
            options={tradeTimePnlChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="P&L by Exit Hour"
          />
          <ChartContainer
            data={tradeTimeTradesChartData}
            options={tradeTimeTradesChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Trades by Exit Hour"
          />
        </div>
      );
    } else if (selectedReport === 'Trade duration') {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: isHalfScreen ? 'column' : 'row', 
          gap: '20px', 
          marginTop: '20px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible'
        }}>
          <ChartContainer
            data={tradeDurationPnlChartData}
            options={tradeDurationPnlChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="P&L by Trade Duration"
          />
          <ChartContainer
            data={tradeDurationTradesChartData}
            options={tradeDurationTradesChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Trades by Trade Duration"
          />
        </div>
      );
    } else if (selectedReport === 'Volume') {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: isHalfScreen ? 'column' : 'row', 
          gap: '20px', 
          marginTop: '20px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible'
        }}>
          <ChartContainer
            data={volumePnlChartData}
            options={volumePnlChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="P&L by Volume"
          />
          <ChartContainer
            data={volumeTradesChartData}
            options={volumeTradesChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Trades by Volume"
          />
        </div>
      );
    } else if (selectedReport === 'Price') {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: isHalfScreen ? 'column' : 'row', 
          gap: '20px', 
          marginTop: '20px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible'
        }}>
          <ChartContainer
            data={pricePnlChartData}
            options={pricePnlChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="P&L by Contract Price"
          />
          <ChartContainer
            data={priceTradesChartData}
            options={priceTradesChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Trades by Contract Price"
          />
        </div>
      );
    } else if (selectedReport === 'Days till expiration') {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: isHalfScreen ? 'column' : 'row', 
          gap: '20px', 
          marginTop: '20px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible'
        }}>
          <ChartContainer
            data={daysTillExpirationPnlChartData}
            options={daysTillExpirationPnlChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="P&L by Days till Expiration"
          />
          <ChartContainer
            data={daysTillExpirationTradesChartData}
            options={daysTillExpirationTradesChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Trades by Days till Expiration"
          />
        </div>
      );
    } else if (selectedReport === 'Setups') {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: isHalfScreen ? 'column' : 'row', 
          gap: '20px', 
          marginTop: '20px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible'
        }}>
          <ChartContainer
            data={setupTagPnlChartData}
            options={chartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="P&L by Setup Type"
          />
          <ChartContainer
            data={setupTagTradesChartData}
            options={tradesChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Trades by Setup Type"
          />
        </div>
      );
    } else if (selectedReport === 'Mistakes') {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: isHalfScreen ? 'column' : 'row', 
          gap: '20px', 
          marginTop: '20px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible'
        }}>
          <ChartContainer
            data={mistakeTagPnlChartData}
            options={chartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="P&L by Mistake Type"
          />
          <ChartContainer
            data={mistakeTagTradesChartData}
            options={tradesChartOptions}
            layout={isHalfScreen ? 'column' : 'row'}
            title="Trades by Mistake Type"
          />
        </div>
      );
    } else if (selectedReport === 'Pattern Detection') {
      // Not Pro — locked message
      if (!isPro) {
        return (
          <div style={{ marginTop: '20px', backgroundColor: '#1A2B44', borderRadius: '12px', padding: '30px', border: '1px solid #2B3D55', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Upgrade for AI Insights</div>
            <div style={{ color: '#b3b3c6', fontSize: '14px' }}>
              Unlock AI-powered pattern detection across your full trade history.
            </div>
          </div>
        );
      }

      // Loading state
      if (patternLoading) {
        return (
          <div style={{ marginTop: '20px', backgroundColor: '#1A2B44', borderRadius: '12px', padding: '30px', border: '1px solid #2B3D55', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #2B3D55', borderTop: '3px solid #b388ff', borderRadius: '50%', animation: 'aiSpin 1s linear infinite', marginBottom: '12px' }} />
            <div style={{ color: '#d0d0e0', fontSize: '16px' }}>Analyzing your trade history...</div>
            <div style={{ color: '#b3b3c6', fontSize: '13px', marginTop: '6px' }}>This may take a few seconds</div>
            <style>{`@keyframes aiSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        );
      }

      // Error state
      if (patternError) {
        return (
          <div style={{ marginTop: '20px', backgroundColor: '#2a1a1a', borderRadius: '12px', padding: '20px', border: '1px solid #5a2a2a' }}>
            <div style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '12px' }}>{patternError}</div>
            <button
              onClick={handlePatternDetection}
              style={{ padding: '8px 20px', backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
            >
              Retry
            </button>
          </div>
        );
      }

      // Insights loaded
      if (patternInsights) {
        return (
          <div style={{ marginTop: '20px' }}>
            <div style={{ backgroundColor: '#1A2B44', borderRadius: '12px', border: '1px solid #2B3D55', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2B3D55' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b388ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span style={{ color: '#b388ff', fontWeight: 'bold', fontSize: '16px' }}>AI Pattern Insights</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handlePatternDetection}
                    style={{ padding: '6px 14px', backgroundColor: 'transparent', color: '#b388ff', border: '1px solid #b388ff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={handleDeletePatternInsights}
                    style={{ padding: '6px 14px', backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ padding: '20px', color: '#d0d0e0', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {patternInsights.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.includes('**')) {
                    const match = line.match(/^\*\*(.+?)\*\*(.*)/);
                    if (match) {
                      return (
                        <div key={i} style={{ marginTop: i > 0 ? '16px' : '0' }}>
                          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>{match[1]}</span>
                          {match[2] && <span>{match[2]}</span>}
                        </div>
                      );
                    }
                  }
                  if (line.trim() === '') return <div key={i} style={{ height: '8px' }} />;
                  return <div key={i}>{line}</div>;
                })}
              </div>
            </div>
          </div>
        );
      }

      // No insights yet — show generate button
      return (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#1A2B44', borderRadius: '12px', padding: '40px 30px', border: '1px solid #2B3D55' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b388ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Discover Your Trading Patterns</div>
            <div style={{ color: '#b3b3c6', fontSize: '14px', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              AI analyzes your full trade history to surface behavioral insights, timing edges, and strategy effectiveness.
            </div>
            <button
              onClick={handlePatternDetection}
              disabled={processedTrades.length === 0}
              style={{
                padding: '12px 32px',
                background: processedTrades.length === 0 ? '#555' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: processedTrades.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Detect Patterns
            </button>
            {processedTrades.length === 0 && (
              <div style={{ color: '#b3b3c6', fontSize: '12px', marginTop: '12px' }}>Import some trades first to use this feature.</div>
            )}
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
    <div style={{
      padding: '20px',
      backgroundColor: theme.colors.black,
      width: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: isHalfScreen ? 'column' : 'row',
        alignItems: 'flex-start',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: isHalfScreen ? '100%' : '200px',
          backgroundColor: '#1B2B43',
          padding: '10px',
          borderRadius: '8px',
          marginRight: isHalfScreen ? '0' : '20px',
          marginBottom: isHalfScreen ? '20px' : '0',
          flexShrink: 0,
          boxSizing: 'border-box'
        }}>
          <ul style={{ listStyle: 'none', padding: '0' }}>
            <li
              onClick={() => handleReportSelect('Overview')}
              onMouseEnter={() => setHoveredReport('Overview')}
              onMouseLeave={() => setHoveredReport(null)}
              style={{
                padding: '10px',
                color: selectedReport === 'Overview' ? theme.colors.teal : theme.colors.white,
                cursor: 'pointer',
                backgroundColor: selectedReport === 'Overview' ? theme.colors.tealLight : (hoveredReport === 'Overview' ? theme.colors.tealSubtle : 'transparent'),
                borderLeft: selectedReport === 'Overview' ? `3px solid ${theme.colors.teal}` : '3px solid transparent',
                borderRadius: '4px',
                marginBottom: '5px',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'background-color 0.15s ease',
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
                    {category === 'AI Insights' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b388ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    )}
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
                    {category === 'Tags' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
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
                          color: selectedReport === report ? theme.colors.teal : '#B0B0B0',
                          cursor: 'pointer',
                          backgroundColor: selectedReport === report ? theme.colors.tealLight : (hoveredReport === report ? theme.colors.tealSubtle : 'transparent'),
                          borderLeft: selectedReport === report ? `3px solid ${theme.colors.teal}` : '3px solid transparent',
                          borderRadius: '4px',
                          marginBottom: '5px',
                          transition: 'background-color 0.15s ease',
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
        <div style={{
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
          boxSizing: 'border-box'
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportsScreen;