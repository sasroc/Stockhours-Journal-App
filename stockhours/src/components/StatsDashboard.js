import React, { useState, useEffect, useMemo } from 'react';
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

const InfoCircle = ({ tooltip }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        marginLeft: '8px',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: '1px solid #888',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#888',
        }}
      >
        i
      </div>
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#000',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          opacity: isHovered ? 1 : 0,
          visibility: isHovered ? 'visible' : 'hidden',
          transition: 'opacity 0.2s, visibility 0.2s',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        {tooltip}
      </div>
    </div>
  );
};

const CircleProgress = ({ value, total, color, isHalfCircle = false, profitValue, lossValue }) => {
  const [hoveredSection, setHoveredSection] = useState(null);
  const percentage = total > 0 ? (value / total) * 100 : 0;

  if (isHalfCircle) {
    // For half-circle (Trade Win %)
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const winPercentage = percentage;
    const lossPercentage = total > 0 ? ((total - value) / total) * 100 : 0;
    const halfCircumference = circumference / 2;


    return (
      <div
        style={{
          position: 'relative',
          width: '100px',
          height: '50px',
          overflow: 'hidden',
        }}
      >
        <svg
          width="100"
          height="50"
          viewBox="0 0 100 50"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {/* Green section (winning trades) */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={theme.colors.green}
            strokeWidth="10"
            strokeDasharray={`${(winPercentage / 100) * halfCircumference}, ${halfCircumference}`}
            strokeDashoffset="0"
            strokeLinecap="butt"
          />
          {/* Red section (losing trades) */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={theme.colors.red}
            strokeWidth="10"
            strokeDasharray={`${(lossPercentage / 100) * halfCircumference}, ${halfCircumference}`}
            strokeDashoffset={-(winPercentage / 100) * halfCircumference}
            strokeLinecap="butt"
          />
        </svg>
      </div>
    );
  }

  // For full circle (Profit Factor)
  const radius = 50; // Increased radius for a larger circle
  const circumference = 2 * Math.PI * radius;
  const profitPercentage = percentage;
  const lossPercentage = total > 0 ? ((total - value) / total) * 100 : 0;
  const profitDashLength = (profitPercentage / 100) * circumference;
  const lossDashLength = (lossPercentage / 100) * circumference;

  return (
    <div
      style={{
        position: 'relative',
        width: '60px', // Increased size
        height: '60px',
      }}
    >
      <svg width="60" height="60" viewBox="0 0 120 120">
        {/* Green section (profits, left side) */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={theme.colors.green}
          strokeWidth="10"
          strokeDasharray={`${profitDashLength}, ${circumference - profitDashLength}`}
          strokeDashoffset={circumference / 4} // Start at 90 degrees (top, adjusted to left)
          strokeLinecap="butt"
          style={{
            transform: `rotate(-90deg)`,
            transformOrigin: 'center',
            opacity: hoveredSection === 'profit' ? 0.8 : 1,
          }}
          onMouseEnter={() => setHoveredSection('profit')}
          onMouseLeave={() => setHoveredSection(null)}
        />
        {/* Red section (losses, right side) */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={theme.colors.red}
          strokeWidth="10"
          strokeDasharray={`${lossDashLength}, ${circumference - lossDashLength}`}
          strokeDashoffset={-profitDashLength + circumference / 4} // Start where green ends
          strokeLinecap="butt"
          style={{
            transform: `rotate(-90deg)`,
            transformOrigin: 'center',
            opacity: hoveredSection === 'loss' ? 0.8 : 1,
          }}
          onMouseEnter={() => setHoveredSection('loss')}
          onMouseLeave={() => setHoveredSection(null)}
        />
      </svg>
      {/* Hover tooltips */}
      {hoveredSection && (
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#000',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
          }}
        >
          ${hoveredSection === 'profit' ? profitValue?.toFixed(2) : lossValue?.toFixed(2)}
        </div>
      )}
    </div>
  );
};

const StatsDashboard = ({ tradeData }) => {
  console.log('Trade Data in StatsDashboard:', tradeData);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});

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

  useEffect(() => {
    if (tradeData.length > 0) {
      const dailyPnl = {};
      trades.forEach(trade => {
        const tradeDate = new Date(trade.FirstBuyExecTime);
        const dateKey = tradeDate.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!dailyPnl[dateKey]) {
          dailyPnl[dateKey] = { pnl: 0, tradeCount: 0 };
        }
        dailyPnl[dateKey].pnl += trade.profitLoss;
        dailyPnl[dateKey].tradeCount++;
      });
      setCalendarData(dailyPnl);
    }
  }, [tradeData, trades]);

  const totalTrades = trades.length;

  if (!tradeData.length) {
    return (
      <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
        <p style={{ color: theme.colors.white }}>No data uploaded yet.</p>
        <Calendar defaultView={true} />
      </div>
    );
  }

  // Calculate metrics
  const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
  const tradeExpectancy = totalTrades > 0 ? totalProfitLoss / totalTrades : 0;

  // Calculate Profit Factor
  const totalProfits = trades.filter(trade => trade.profitLoss > 0).reduce((sum, trade) => sum + trade.profitLoss, 0);
  const totalLosses = Math.abs(trades.filter(trade => trade.profitLoss < 0).reduce((sum, trade) => sum + trade.profitLoss, 0));
  const profitFactor = totalLosses === 0 ? (totalProfits > 0 ? Infinity : 0) : totalProfits / totalLosses;

  // Calculate Win Rate
  const winningTrades = trades.filter(trade => trade.profitLoss > 0).length;
  const losingTrades = trades.filter(trade => trade.profitLoss < 0).length;
  const neutralTrades = trades.filter(trade => trade.profitLoss === 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  // Calculate Average Win/Loss
  const avgWinTrade = winningTrades > 0
    ? trades.filter(trade => trade.profitLoss > 0).reduce((sum, trade) => sum + trade.profitLoss, 0) / winningTrades
    : 0;
  const avgLossTrade = losingTrades > 0
    ? Math.abs(trades.filter(trade => trade.profitLoss < 0).reduce((sum, trade) => sum + trade.profitLoss, 0)) / losingTrades
    : 0;
  const avgWinLossRatio = avgLossTrade > 0 ? avgWinTrade / avgLossTrade : avgWinTrade > 0 ? Infinity : 0;



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
    console.log('Trade:', trade.Symbol, 'FirstBuyExecTime:', trade.FirstBuyExecTime, 'Hour:', hour);
    if (hour >= 0 && hour <= 23) {
      tradeCountsByHour[hour]++;
    }
  });

  console.log('Trade Counts by Hour:', tradeCountsByHour);
  console.log('Sum of Trades Per Hour:', tradeCountsByHour.reduce((sum, count) => sum + count, 0));

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

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const weeks = [];
    let dayCount = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDay) || dayCount > daysInMonth) {
          week.push(
            <div
              key={j}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: theme.colors.grey,
                color: theme.colors.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '2px',
                borderRadius: '4px',
              }}
            />
          );
        } else {
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCount).padStart(2, '0')}`;
          const dailyData = calendarData[dateKey] || { pnl: 0, tradeCount: 0 };
          const color = dailyData.pnl !== 0 ? (dailyData.pnl >= 0 ? theme.colors.green : theme.colors.red) : theme.colors.grey;
          week.push(
            <div
              key={j}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: color,
                color: theme.colors.white,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '2px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <div>{dayCount}</div>
              {dailyData.pnl !== 0 && (
                <div>
                  <div style={{ fontSize: '10px' }}>${dailyData.pnl.toFixed(1)}</div>
                  <div style={{ fontSize: '8px' }}>
                    {dailyData.tradeCount} trade{dailyData.tradeCount !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          );
          dayCount++;
        }
      }
      weeks.push(<div key={i} style={{ display: 'flex' }}>{week}</div>);
    }

    return weeks;
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  return (
    <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {/* Net P&L Box */}
        <div
          style={{
            backgroundColor: '#1a1a1a',
            padding: '15px',
            borderRadius: '8px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#888' }}>Net P&L</span>
            <InfoCircle tooltip="The total realized net profit and loss for all closed trades." />
            <div
              style={{
                marginLeft: 'auto',
                backgroundColor: '#2a2a2a',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#fff',
              }}
            >
              {totalTrades}
            </div>
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: totalProfitLoss >= 0 ? theme.colors.green : theme.colors.red,
              marginTop: '8px',
            }}
          >
            ${totalProfitLoss.toFixed(2)}
          </div>
        </div>

        {/* Trade Expectancy Box */}
        <div
          style={{
            backgroundColor: '#1a1a1a',
            padding: '15px',
            borderRadius: '8px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#888' }}>Trade expectancy</span>
            <InfoCircle tooltip="The average amount you can expect to win, or lose, per trade based on your closed trades." />
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: tradeExpectancy >= 0 ? theme.colors.green : theme.colors.red,
              marginTop: '8px',
            }}
          >
            ${tradeExpectancy.toFixed(2)}
          </div>
        </div>

        {/* Profit Factor Box */}
        <div
          style={{
            backgroundColor: '#1a1a1a',
            padding: '15px',
            borderRadius: '8px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#888' }}>Profit factor</span>
            <InfoCircle tooltip="Total profits divided by total losses. A profit factor above 1.0 indicates a profitable trading system." />
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              marginTop: '8px',
              marginBottom: '12px',
            }}
          >
            {profitFactor.toFixed(2)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <CircleProgress
              value={totalProfits}
              total={totalProfits + totalLosses}
              color={theme.colors.green}
              profitValue={totalProfits}
              lossValue={totalLosses}
            />
          </div>
        </div>

        {/* Trade Win % Box */}
        <div
          style={{
            backgroundColor: '#1a1a1a',
            padding: '15px',
            borderRadius: '8px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#888' }}>Trade win %</span>
            <InfoCircle tooltip="Reflects the percentage of your winning trades out of total trades taken." />
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              marginTop: '8px',
              marginBottom: '12px',
            }}
          >
            {winRate.toFixed(2)}%
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <CircleProgress
              value={winningTrades}
              total={totalTrades}
              color={theme.colors.green}
              isHalfCircle={true}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#888',
              position: 'relative',
              top: '-10px',
            }}
          >
            <span style={{ color: theme.colors.green }}>{winningTrades}</span>
            <span style={{ color: '#888', fontSize: '10px' }}>{neutralTrades}</span>
            <span style={{ color: theme.colors.red }}>{losingTrades}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#888',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: theme.colors.green, borderRadius: '50%' }} />
              <span>Winning Trades</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Losing Trades</span>
              <div style={{ width: '8px', height: '8px', backgroundColor: theme.colors.red, borderRadius: '50%' }} />
            </div>
          </div>
        </div>

        {/* Avg Win/Loss Trade Box */}
        <div
          style={{
            backgroundColor: '#1a1a1a',
            padding: '15px',
            borderRadius: '8px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#888' }}>Avg win/loss trade</span>
            <InfoCircle tooltip="The average profit on all winning and losing trades." />
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fff',
              marginTop: '8px',
            }}
          >
            {avgWinLossRatio.toFixed(2)}
          </div>
          <div style={{ marginTop: '8px' }}>
            <div
              style={{
                height: '4px',
                backgroundColor: '#2a2a2a',
                borderRadius: '2px',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${(avgWinTrade / (avgWinTrade + avgLossTrade)) * 100}%`,
                  backgroundColor: theme.colors.green,
                  borderRadius: '2px 0 0 2px',
                }}
              />
              <div
                style={{
                  width: `${(avgLossTrade / (avgWinTrade + avgLossTrade)) * 100}%`,
                  backgroundColor: theme.colors.red,
                  borderRadius: '0 2px 2px 0',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
                fontSize: '12px',
              }}
            >
              <span style={{ color: theme.colors.green }}>${avgWinTrade.toFixed(1)}</span>
              <span style={{ color: theme.colors.red }}>-${avgLossTrade.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <Bar data={tradeChartData} options={{ scales: { y: { beginAtZero: true } } }} />
      </div>
      <h3 style={{ color: theme.colors.white }}>Total P&L by Ticker</h3>
      <div style={{ marginTop: '20px' }}>
        <Bar data={tickerChartData} options={{ scales: { y: { beginAtZero: true } } }} />
      </div>
      <h3 style={{ color: theme.colors.white }}>Trades per Hour</h3>
      <div style={{ marginTop: '20px' }}>
        <Bar data={hourChartData} options={{ scales: { y: { beginAtZero: true, min: 0 } } }} />
      </div>
      <h3 style={{ color: theme.colors.white }}>Trade Calendar</h3>
      <div style={{ marginTop: '20px' }}>
        <div style={{ color: theme.colors.white, display: 'flex', alignItems: 'center' }}>
          <button onClick={() => changeMonth(-1)} style={{ marginRight: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>
            ←
          </button>
          <span>{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</span>
          <button onClick={() => changeMonth(1)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>
            →
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.colors.white, marginBottom: '5px' }}>
            <span style={{ width: '40px', textAlign: 'center' }}>Sun</span>
            <span style={{ width: '40px', textAlign: 'center' }}>Mon</span>
            <span style={{ width: '40px', textAlign: 'center' }}>Tue</span>
            <span style={{ width: '40px', textAlign: 'center' }}>Wed</span>
            <span style={{ width: '40px', textAlign: 'center' }}>Thu</span>
            <span style={{ width: '40px', textAlign: 'center' }}>Fri</span>
            <span style={{ width: '40px', textAlign: 'center' }}>Sat</span>
          </div>
          {renderCalendar()}
        </div>
      </div>
    </div>
  );
};

// Separate Calendar component for default view
const Calendar = ({ defaultView }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const weeks = [];
    let dayCount = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDay) || dayCount > daysInMonth) {
          week.push(
            <div
              key={j}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: theme.colors.grey,
                color: theme.colors.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '2px',
                borderRadius: '4px',
              }}
            />
          );
        } else {
          week.push(
            <div
              key={j}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: theme.colors.grey,
                color: theme.colors.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '2px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              {dayCount}
            </div>
          );
          dayCount++;
        }
      }
      weeks.push(<div key={i} style={{ display: 'flex' }}>{week}</div>);
    }

    return weeks;
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ color: theme.colors.white, display: 'flex', alignItems: 'center' }}>
        <button onClick={() => changeMonth(-1)} style={{ marginRight: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>
          ←
        </button>
        <span>{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</span>
        <button onClick={() => changeMonth(1)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>
          →
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.colors.white, marginBottom: '5px' }}>
          <span style={{ width: '40px', textAlign: 'center' }}>Sun</span>
          <span style={{ width: '40px', textAlign: 'center' }}>Mon</span>
          <span style={{ width: '40px', textAlign: 'center' }}>Tue</span>
          <span style={{ width: '40px', textAlign: 'center' }}>Wed</span>
          <span style={{ width: '40px', textAlign: 'center' }}>Thu</span>
          <span style={{ width: '40px', textAlign: 'center' }}>Fri</span>
          <span style={{ width: '40px', textAlign: 'center' }}>Sat</span>
        </div>
        {renderCalendar()}
      </div>
    </div>
  );
};

export default StatsDashboard;