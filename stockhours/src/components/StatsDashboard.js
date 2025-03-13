import React from 'react';
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
  console.log('Trade Data in StatsDashboard:', tradeData); // Debug log

  if (!tradeData.length) {
    return <p style={{ color: theme.colors.white }}>No data uploaded yet.</p>;
  }

  // Flatten all transactions for processing
  const allTransactions = tradeData.flatMap(trade => trade.Transactions);

  // Sort transactions by ExecTime to process in chronological order
  const sortedTransactions = allTransactions.sort((a, b) => new Date(a.ExecTime) - new Date(b.ExecTime));

  // Track trades and positions
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

      // If the position is fully closed or after a cycle, create a trade
      if (position.currentQuantity === 0) {
        // Calculate P&L for the cycle
        let totalBuyQuantity = 0;
        let totalBuyCost = 0;
        const buyRecordsForCycle = [];

        // Take buy records until we match the total quantity sold in this cycle
        while (position.buyRecords.length > 0 && totalBuyQuantity < position.totalQuantity) {
          const buyRecord = position.buyRecords.shift();
          buyRecordsForCycle.push(buyRecord);
          totalBuyQuantity += buyRecord.quantity;
          totalBuyCost += buyRecord.quantity * buyRecord.price * CONTRACT_MULTIPLIER;
        }

        let totalSellQuantity = 0;
        let totalSellProceeds = 0;
        const sellRecordsForCycle = [];

        // Take sell records until we match the total quantity bought in this cycle
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
          FirstBuyExecTime: buyRecordsForCycle[0].execTime, // Store for Trades Per Hour
          profitLoss,
        });

        // Reset position for the next cycle
        position.totalQuantity = 0;
        position.currentQuantity = 0;
      }
    }
  });

  console.log('Trade Stats:', trades); // Debug: Log all trade stats

  // Total trades
  const totalTrades = trades.length;
  console.log('Total Trades:', totalTrades); // Debug: Log total trades

  // Total P&L across all trades
  const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);

  // Calculate total P&L per ticker
  const tickerPnl = trades.reduce((acc, trade) => {
    acc[trade.Symbol] = (acc[trade.Symbol] || 0) + trade.profitLoss;
    return acc;
  }, {});

  // Prepare data for the Total P&L per Ticker chart
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

  // Prepare data for Trades per Hour chart
  const tradeCountsByHour = new Array(24).fill(0); // Initialize array for 0:00 to 23:00
  trades.forEach(trade => {
    const execTime = new Date(trade.FirstBuyExecTime);
    const hour = execTime.getHours(); // Get hour in 24-hour format (0-23)
    console.log('Trade:', trade.Symbol, 'FirstBuyExecTime:', trade.FirstBuyExecTime, 'Hour:', hour); // Debug: Log hour extraction
    if (hour >= 0 && hour <= 23) {
      tradeCountsByHour[hour]++;
    }
  });

  console.log('Trade Counts by Hour:', tradeCountsByHour); // Debug: Log the counts
  console.log('Sum of Trades Per Hour:', tradeCountsByHour.reduce((sum, count) => sum + count, 0)); // Debug: Verify total

  const hourChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Trades per Hour',
        data: tradeCountsByHour,
        backgroundColor: 'blue', // Blue bars for trades per hour
      },
    ],
  };

  // Prepare data for the existing chart (P&L per Trade)
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
    </div>
  );
};

export default StatsDashboard;