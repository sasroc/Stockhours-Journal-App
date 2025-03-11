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

  // Calculate P&L for each trade
  const tradeStats = tradeData.map(trade => {
    const { Symbol, Strike, Expiration, Transactions } = trade;

    // Separate buy (opening) and sell (closing) transactions
    const buys = Transactions.filter(t => t.PosEffect === 'OPEN' && t.Side === 'BUY');
    const sells = Transactions.filter(t => t.PosEffect === 'CLOSE' && t.Side === 'SELL');

    // Calculate total buy cost (Price * |Quantity| * 100 for options)
    const buyCost = buys.reduce((sum, t) => {
      const contractValue = t.Price * 100; // Price per contract
      return sum + contractValue * Math.abs(t.Quantity);
    }, 0);

    // Calculate total sell proceeds (Price * |Quantity| * 100 for options)
    const sellProceeds = sells.reduce((sum, t) => {
      const contractValue = t.Price * 100; // Price per contract
      return sum + contractValue * Math.abs(t.Quantity);
    }, 0);

    // P&L = Sell Proceeds - Buy Cost
    const profitLoss = sellProceeds - buyCost;

    return { Symbol, Strike, Expiration, profitLoss };
  });

  // Total trades (number of unique Symbol-Strike-Expiration combinations)
  const totalTrades = tradeStats.length;

  // Total P&L across all trades
  const totalProfitLoss = tradeStats.reduce((sum, trade) => sum + trade.profitLoss, 0);

  // Chart data (P&L per trade)
  const chartData = {
    labels: tradeStats.map(trade => `${trade.Symbol}`),
    datasets: [
      {
        label: 'Profit/Loss per Trade',
        data: tradeStats.map(trade => trade.profitLoss),
        backgroundColor: tradeStats.map(trade =>
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
      {tradeStats.map((trade, index) => (
        <p key={index}>
          {trade.Symbol}: <span style={{ color: trade.profitLoss >= 0 ? theme.colors.green : theme.colors.red }}>
            ${trade.profitLoss.toFixed(2)}
          </span>
        </p>
      ))}
      <Bar data={chartData} options={{ scales: { y: { beginAtZero: true } } }} />
    </div>
  );
};

export default StatsDashboard;