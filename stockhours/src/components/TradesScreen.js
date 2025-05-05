// StockHours-Journal-App/stockhours/src/components/TradesScreen.js

import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { theme } from '../theme';
import ShareModal from './ShareModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const TradesScreen = ({ tradeData }) => {
  const [expandedDays, setExpandedDays] = useState({}); // Track which days are expanded
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedDayStats, setSelectedDayStats] = useState(null);

  // Process trades and group by day
  const dailyTrades = useMemo(() => {
    if (!tradeData.length) return {};

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
          symbol: transaction.Symbol,
          expiration: transaction.Expiration,
          strike: transaction.Strike,
          type: transaction.Type,
        });
      } else if (transaction.PosEffect === 'CLOSE' && transaction.Side === 'SELL') {
        position.sellRecords.push({
          quantity: Math.abs(transaction.Quantity),
          price: transaction.Price,
        });

        position.currentQuantity -= Math.abs(transaction.Quantity);

        // If the position is fully closed, create a trade
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
          const netROI = totalBuyCost > 0 ? (profitLoss / totalBuyCost) * 100 : 0;

          processedTrades.push({
            Symbol: buyRecordsForCycle[0].symbol,
            Strike: buyRecordsForCycle[0].strike,
            Expiration: buyRecordsForCycle[0].expiration,
            TradeDate: buyRecordsForCycle[0].tradeDate,
            FirstBuyExecTime: buyRecordsForCycle[0].execTime,
            Type: buyRecordsForCycle[0].type,
            profitLoss,
            netROI,
            buyRecords: buyRecordsForCycle,
            sellRecords: sellRecordsForCycle,
          });

          position.totalQuantity = 0;
          position.currentQuantity = 0;
        }
      }
    });

    // Group trades by TradeDate
    const groupedByDate = processedTrades.reduce((acc, trade) => {
      const dateKey = trade.TradeDate;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(trade);
      return acc;
    }, {});

    return groupedByDate;
  }, [tradeData]);

  if (!tradeData.length || Object.keys(dailyTrades).length === 0) {
    return (
      <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
        <p style={{ color: theme.colors.white }}>No trades uploaded yet.</p>
      </div>
    );
  }

  // Toggle expand/collapse for a specific day
  const toggleDay = (date) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const [month, day, year] = dateStr.split('/');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate metrics and render each day's box
  return (
    <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
      {Object.keys(dailyTrades)
        .sort((a, b) => new Date(b) - new Date(a)) // Sort by date descending
        .map(date => {
          const trades = dailyTrades[date];
          const totalTrades = trades.length;
          const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
          const winningTrades = trades.filter(trade => trade.profitLoss > 0).length;
          const losingTrades = trades.filter(trade => trade.profitLoss < 0).length;
          const totalProfits = trades
            .filter(trade => trade.profitLoss > 0)
            .reduce((sum, trade) => sum + trade.profitLoss, 0);
          const totalLosses = Math.abs(
            trades
              .filter(trade => trade.profitLoss < 0)
              .reduce((sum, trade) => sum + trade.profitLoss, 0)
          );
          const profitFactor = totalLosses === 0 ? (totalProfits > 0 ? '—' : '—') : (totalProfits / totalLosses).toFixed(2);
          const volume = trades.reduce((sum, trade) => {
            const qty = trade.buyRecords.reduce((s, r) => s + r.quantity, 0);
            return sum + qty;
          }, 0);

          // Prepare data for the P&L line graph, starting at 0
          const pnlData = [0, ...trades.reduce((acc, trade) => {
            const lastPnl = acc.length > 0 ? acc[acc.length - 1] : 0;
            acc.push(lastPnl + trade.profitLoss);
            return acc;
          }, [])];

          const lineData = {
            labels: ['Start', ...trades.map((_, index) => `Trade ${index + 1}`)],
            datasets: [
              {
                label: 'Cumulative P&L',
                data: pnlData,
                borderColor: theme.colors.green, // Default color, will be overridden by segment
                backgroundColor: theme.colors.green, // Default color, will be overridden by segment
                fill: true,
                tension: 0.1,
                segment: {
                  borderColor: ctx => {
                    const currentValue = ctx.p1.parsed.y; // P&L at the end of the segment
                    return currentValue < 0 ? theme.colors.red : theme.colors.green;
                  },
                  backgroundColor: ctx => {
                    const currentValue = ctx.p1.parsed.y; // P&L at the end of the segment
                    return currentValue < 0 ? theme.colors.red : theme.colors.green;
                  },
                },
                pointBackgroundColor: pnlData.map(value => (value < 0 ? theme.colors.red : theme.colors.green)),
                pointBorderColor: pnlData.map(value => (value < 0 ? theme.colors.red : theme.colors.green)),
              },
            ],
          };

          const lineOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: true },
            },
            scales: {
              x: { display: false },
              y: {
                beginAtZero: true,
                grid: { color: '#333' },
                ticks: { color: '#888' },
              },
            },
          };

          return (
            <div
              key={date}
              style={{
                backgroundColor: '#0d0d0d',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Header with Date and Net P&L */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '15px',
                }}
              >
                <button
                  onClick={() => toggleDay(date)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.colors.white,
                    cursor: 'pointer',
                    marginRight: '10px',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: expandedDays[date] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span style={{ fontSize: '16px', color: theme.colors.white, flex: 1 }}>
                  {formatDate(date)} • Net P&L{' '}
                  <span
                    style={{
                      color: totalProfitLoss >= 0 ? theme.colors.green : theme.colors.red,
                    }}
                  >
                    ${totalProfitLoss.toFixed(2)}
                  </span>
                </span>
                <button
                  onClick={() => {
                    setSelectedDayStats({
                      trades,
                      totalProfitLoss,
                      date,
                    });
                    setShareModalOpen(true);
                  }}
                  style={{
                    backgroundColor: theme.colors.green,
                    color: theme.colors.white,
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    marginRight: '10px',
                  }}
                >
                  Share
                </button>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              {/* P&L Line Graph */}
              <div
                style={{
                  height: '100px',
                  marginBottom: '15px',
                }}
              >
                <Line data={lineData} options={lineOptions} />
              </div>

              {/* Summary Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '10px',
                  marginBottom: expandedDays[date] ? '15px' : '0',
                }}
              >
                <div>
                  <span style={{ fontSize: '14px', color: '#888' }}>Total trades</span>
                  <div style={{ fontSize: '16px', color: theme.colors.white }}>{totalTrades}</div>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#888' }}>Winners</span>
                  <div style={{ fontSize: '16px', color: theme.colors.green }}>{winningTrades}</div>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#888' }}>Losers</span>
                  <div style={{ fontSize: '16px', color: theme.colors.red }}>{losingTrades}</div>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#888' }}>Gross P&L</span>
                  <div
                    style={{
                      fontSize: '16px',
                      color: totalProfitLoss >= 0 ? theme.colors.green : theme.colors.red,
                    }}
                  >
                    ${totalProfitLoss.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#888' }}>Commissions</span>
                  <div style={{ fontSize: '16px', color: theme.colors.white }}>N/A</div>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#888' }}>Volume</span>
                  <div style={{ fontSize: '16px', color: theme.colors.white }}>{volume}</div>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#888' }}>Profit factor</span>
                  <div style={{ fontSize: '16px', color: theme.colors.white }}>{profitFactor}</div>
                </div>
              </div>

              {/* Expanded Trade Details */}
              {expandedDays[date] && (
                <div style={{ marginTop: '15px' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      color: theme.colors.white,
                      fontSize: '14px',
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Open time</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Ticker</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Side</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Instrument</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Net P&L</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Net ROI</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Realized R-Multip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade, index) => {
                        const openTime = new Date(trade.FirstBuyExecTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        });
                        const optionType = trade.Type || 'CALL'; // Use the actual option type, default to CALL if not specified
                        const instrument = `${trade.Expiration} ${trade.Strike} ${optionType}`;
                        return (
                          <tr key={index} style={{ borderBottom: '1px solid #333' }}>
                            <td style={{ padding: '8px' }}>{openTime}</td>
                            <td style={{ padding: '8px' }}>{trade.Symbol}</td>
                            <td style={{ padding: '8px' }}>{optionType}</td>
                            <td style={{ padding: '8px' }}>{instrument}</td>
                            <td
                              style={{
                                padding: '8px',
                                color: trade.profitLoss >= 0 ? theme.colors.green : theme.colors.red,
                              }}
                            >
                              ${trade.profitLoss.toFixed(2)}
                            </td>
                            <td style={{ padding: '8px' }}>{trade.netROI.toFixed(2)}%</td>
                            <td style={{ padding: '8px' }}>—</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

      {shareModalOpen && selectedDayStats && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          dayStats={selectedDayStats}
        />
      )}
    </div>
  );
};

export default TradesScreen;