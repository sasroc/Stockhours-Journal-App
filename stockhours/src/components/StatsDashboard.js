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

  console.log('Trade Stats:', trades);

  const totalTrades = trades.length;
  console.log('Total Trades:', totalTrades);

  if (!tradeData.length) {
    return (
      <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
        <p style={{ color: theme.colors.white }}>No data uploaded yet.</p>
        <Calendar defaultView={true} />
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
      <h2 style={{ color: theme.colors.white }}>Trading Stats</h2>
      <p>Total Trades: {totalTrades}</p>
      <p>Total Profit/Loss: <span style={{ color: totalProfitLoss >= 0 ? theme.colors.green : theme.colors.red }}>
        ${totalProfitLoss.toFixed(2)}
      </span></p>
      <h3 style={{ color: theme.colors.white }}>P&L by Trade</h3>
      {trades.map((trade, index) => (
        <p key={index}>
          {index + 1}. ({trade.TradeDate}) {trade.Symbol}: <span style={{ color: trade.profitLoss >= 0 ? theme.colors.green : theme.colors.red }}>
            ${trade.profitLoss.toFixed(2)}
          </span>
        </p>
      ))}
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
          <button onClick={() => changeMonth(-1)} style={{ marginRight: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>←</button>
          <span>{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</span>
          <button onClick={() => changeMonth(1)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>→</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
          <div style={{ display: 'flex', marginBottom: '5px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <span
                key={index}
                style={{
                  width: '40px',
                  textAlign: 'center',
                  color: theme.colors.white,
                  fontSize: '12px',
                }}
              >
                {day}
              </span>
            ))}
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
        <button onClick={() => changeMonth(-1)} style={{ marginRight: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>←</button>
        <span>{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</span>
        <button onClick={() => changeMonth(1)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>→</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
        <div style={{ display: 'flex', marginBottom: '5px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <span
              key={index}
              style={{
                width: '40px',
                textAlign: 'center',
                color: theme.colors.white,
                fontSize: '12px',
              }}
            >
              {day}
            </span>
          ))}
        </div>
        {renderCalendar()}
      </div>
    </div>
  );
};

export default StatsDashboard;