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
  if (!tradeData.length) {
    return <p style={{ color: theme.colors.white }}>No data uploaded yet.</p>;
  }

  // Calculate basic stats
  const totalTrades = tradeData.length;
  const profitLoss = tradeData.reduce((sum, trade) => {
    const entry = parseFloat(trade['Entry Price']);
    const exit = parseFloat(trade['Exit Price']);
    const qty = parseInt(trade['Quantity']);
    const pl = trade['Side'] === 'Buy' ? (exit - entry) * qty : (entry - exit) * qty;
    return sum + pl;
  }, 0);
  const winRate = (tradeData.filter(trade => {
    const entry = parseFloat(trade['Entry Price']);
    const exit = parseFloat(trade['Exit Price']);
    return (trade['Side'] === 'Buy' && exit > entry) || (trade['Side'] === 'Sell' && entry > exit);
  }).length / totalTrades) * 100;

  // Chart data
  const chartData = {
    labels: ['Profit/Loss', 'Win Rate'],
    datasets: [
      {
        label: 'Stats',
        data: [profitLoss, winRate],
        backgroundColor: [profitLoss >= 0 ? theme.colors.green : theme.colors.red, theme.colors.white],
      },
    ],
  };

  return (
    <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
      <h2 style={{ color: theme.colors.white }}>Trading Stats</h2>
      <p>Total Trades: {totalTrades}</p>
      <p>Profit/Loss: <span style={{ color: profitLoss >= 0 ? theme.colors.green : theme.colors.red }}>
        ${profitLoss.toFixed(2)}
      </span></p>
      <p>Win Rate: {winRate.toFixed(2)}%</p>
      <Bar data={chartData} options={{ scales: { y: { beginAtZero: true } } }} />
    </div>
  );
};

export default StatsDashboard;