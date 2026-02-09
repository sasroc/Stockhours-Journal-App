import React, { useState, useEffect, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { theme } from '../theme';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import NoteModal from './NoteModal';

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
          backgroundColor: '#0A1628',
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
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={theme.colors.green}
            strokeWidth="10"
            strokeDasharray={`${(winPercentage / 100) * halfCircumference}, ${halfCircumference}`}
            strokeDashoffset="0"
            strokeLinecap="butt"
          />
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

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const profitPercentage = percentage;
  const lossPercentage = total > 0 ? ((total - value) / total) * 100 : 0;
  const profitDashLength = (profitPercentage / 100) * circumference;
  const lossDashLength = (lossPercentage / 100) * circumference;

  return (
    <div
      style={{
        position: 'relative',
        width: '60px',
        height: '60px',
      }}
    >
      <svg width="60" height="60" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={theme.colors.green}
          strokeWidth="10"
          strokeDasharray={`${profitDashLength}, ${circumference - profitDashLength}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="butt"
          style={{
            transform: `rotate(-90deg)`,
            transformOrigin: 'center',
            opacity: hoveredSection === 'profit' ? 0.8 : 1,
          }}
          onMouseEnter={() => setHoveredSection('profit')}
          onMouseLeave={() => setHoveredSection(null)}
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={theme.colors.red}
          strokeWidth="10"
          strokeDasharray={`${lossDashLength}, ${circumference - lossDashLength}`}
          strokeDashoffset={-profitDashLength + circumference / 4}
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
      {hoveredSection && (
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0A1628',
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

const StatsDashboard = ({ tradeData, isMobileDevice, isHalfScreen }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayPopupOpen, setIsDayPopupOpen] = useState(false);
  const [notes, setNotes] = useState({});
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [debriefs, setDebriefs] = useState({});
  const [debriefLoading, setDebriefLoading] = useState(null);
  const [debriefError, setDebriefError] = useState(null);
  const [debriefVisible, setDebriefVisible] = useState({});
  const navigate = useNavigate();
  const { currentUser, isPro } = useAuth();

  const trades = useMemo(() => {
    if (!tradeData.length) return [];

    const allTransactions = tradeData.flatMap(trade => trade.Transactions);
    const sortedTransactions = allTransactions.sort((a, b) => new Date(a.ExecTime) - new Date(b.ExecTime));

    const processedTrades = [];
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
          tradeDate: transaction.TradeDate,
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
          const lastSellRecord = sellRecordsForCycle[sellRecordsForCycle.length - 1];

          processedTrades.push({
            Symbol: transaction.Symbol,
            Strike: transaction.Strike,
            Expiration: transaction.Expiration,
            TradeDate: buyRecordsForCycle[0].tradeDate,
            FirstBuyExecTime: buyRecordsForCycle[0].execTime,
            LastSellExecTime: lastSellRecord.execTime,
            LastSellTradeDate: lastSellRecord.tradeDate,
            profitLoss,
            Type: transaction.Type,
            Quantity: totalBuyQuantity,
            Price: buyRecordsForCycle[0].price,
          });

          position.totalQuantity = 0;
          position.currentQuantity = 0;
        }
      }
    });

    return processedTrades;
  }, [tradeData]);

  const { dailyPnlData, cumulativePnlData } = useMemo(() => {
    const dailyPnlMap = {};
    const cumulativePnlData = [];
    const sortedTrades = trades.sort((a, b) => new Date(a.FirstBuyExecTime) - new Date(b.FirstBuyExecTime));

    if (sortedTrades.length > 0) {
      const firstDate = new Date(sortedTrades[0].FirstBuyExecTime);
      const initialDate = new Date(firstDate);
      initialDate.setDate(firstDate.getDate() - 1);
      cumulativePnlData.push({ date: initialDate.toISOString().split('T')[0], cumulativePnl: 0 });
    }

    sortedTrades.forEach(trade => {
      const dateKey = new Date(trade.FirstBuyExecTime).toISOString().split('T')[0];
      if (!dailyPnlMap[dateKey]) {
        dailyPnlMap[dateKey] = 0;
      }
      dailyPnlMap[dateKey] += trade.profitLoss;
    });

    const dailyPnlData = Object.entries(dailyPnlMap).map(([date, pnl]) => ({
      date,
      pnl,
    }));

    dailyPnlData.sort((a, b) => new Date(a.date) - new Date(b.date));

    let cumulativePnl = 0;
    dailyPnlData.forEach(({ date, pnl }) => {
      cumulativePnl += pnl;
      cumulativePnlData.push({ date, cumulativePnl });
    });

    return { dailyPnlData, cumulativePnlData };
  }, [trades]);

  const cumulativePnlChartData = useMemo(() => {
    return {
      labels: cumulativePnlData.map(data => data.date),
      datasets: [
        {
          label: 'Cumulative P&L',
          data: cumulativePnlData.map(data => data.cumulativePnl),
          borderColor: theme.colors.green,
          backgroundColor: theme.colors.green,
          fill: false,
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: ctx => {
            const value = ctx.dataset.data[ctx.dataIndex];
            return value < 0 ? theme.colors.red : theme.colors.green;
          },
          segment: {
            borderColor: ctx => {
              const prevValue = ctx.p0.parsed.y;
              const nextValue = ctx.p1.parsed.y;
              if (prevValue >= 0 && nextValue < 0) return theme.colors.red;
              if (prevValue < 0 && nextValue >= 0) return theme.colors.green;
              return prevValue >= 0 ? theme.colors.green : theme.colors.red;
            },
          },
        },
      ],
    };
  }, [cumulativePnlData]);

  useEffect(() => {
    if (tradeData.length > 0) {
      const dailyPnl = {};
      trades.forEach(trade => {
        const tradeDate = new Date(trade.FirstBuyExecTime);
        const dateKey = tradeDate.toISOString().split('T')[0];
        if (!dailyPnl[dateKey]) {
          dailyPnl[dateKey] = { pnl: 0, tradeCount: 0, trades: [] };
        }
        dailyPnl[dateKey].pnl += trade.profitLoss;
        dailyPnl[dateKey].tradeCount++;
        dailyPnl[dateKey].trades.push(trade);
      });
      setCalendarData(dailyPnl);
    }
  }, [tradeData, trades]);

  useEffect(() => {
    const fetchNotes = async () => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.notes) setNotes(data.notes);
        }
      } else {
        const storedNotes = localStorage.getItem('tradeNotes');
        if (storedNotes) setNotes(JSON.parse(storedNotes));
      }
    };
    fetchNotes();
  }, [currentUser]);

  // Fetch saved debriefs from Firestore on mount
  useEffect(() => {
    const fetchDebriefs = async () => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.dailyDebriefs) setDebriefs(data.dailyDebriefs);
        }
      }
    };
    fetchDebriefs();
  }, [currentUser]);

  // Convert YYYY-MM-DD to MM/DD/YYYY to match DailyStatsScreen debrief keys
  const toDebriefKey = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleDailyDebrief = async (date) => {
    if (debriefLoading) return;
    const debriefKey = toDebriefKey(date);
    setDebriefLoading(date);
    setDebriefError(null);

    try {
      const dayTrades = calendarData[date]?.trades || [];
      const tradePayload = dayTrades.map(trade => ({
        symbol: trade.Symbol,
        type: trade.Type || 'N/A',
        profitLoss: trade.profitLoss,
        netROI: trade.Quantity && trade.Price ? (trade.profitLoss / (trade.Quantity * trade.Price * 100)) * 100 : 0,
        quantity: trade.Quantity || 0,
        entryTime: trade.FirstBuyExecTime ? new Date(trade.FirstBuyExecTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        setups: [],
        mistakes: [],
        rating: 0,
      }));

      const totalPL = dayTrades.reduce((sum, t) => sum + t.profitLoss, 0);
      const winners = dayTrades.filter(t => t.profitLoss > 0).length;
      const losers = dayTrades.filter(t => t.profitLoss < 0).length;
      const dayTotalProfits = dayTrades.filter(t => t.profitLoss > 0).reduce((sum, t) => sum + t.profitLoss, 0);
      const dayTotalLosses = Math.abs(dayTrades.filter(t => t.profitLoss < 0).reduce((sum, t) => sum + t.profitLoss, 0));
      const dayProfitFactor = dayTotalLosses === 0 ? (dayTotalProfits > 0 ? 'Inf' : '0') : (dayTotalProfits / dayTotalLosses).toFixed(2);
      const volume = dayTrades.reduce((sum, t) => sum + (t.Quantity || 0), 0);

      const stats = {
        date: debriefKey,
        totalPL,
        totalTrades: dayTrades.length,
        winners,
        losers,
        profitFactor: dayProfitFactor,
        volume,
      };

      const dailyNote = stripHtml(notes[date] || '');

      // Build recent history from last 5 other trading days
      const sortedDates = Object.keys(calendarData).sort((a, b) => new Date(b) - new Date(a)).filter(d => d !== date);
      const recentHistory = sortedDates.slice(0, 5).map(d => {
        const dTrades = calendarData[d]?.trades || [];
        return {
          date: toDebriefKey(d),
          tradeCount: dTrades.length,
          totalPL: dTrades.reduce((sum, t) => sum + t.profitLoss, 0),
        };
      });

      const token = await currentUser.getIdToken();
      const API_URL = process.env.REACT_APP_STRIPE_API_URL || '';
      const response = await fetch(`${API_URL}/api/ai/daily-debrief`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trades: tradePayload, stats, dailyNote, recentHistory }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          setDebriefError({ date, message: 'AI Daily Debrief is available on the Pro plan.' });
        } else if (response.status === 429) {
          setDebriefError({ date, message: 'AI service is busy. Please try again in a moment.' });
        } else {
          setDebriefError({ date, message: errData.error || 'Failed to generate debrief.' });
        }
        return;
      }

      const data = await response.json();
      setDebriefs(prev => {
        const updated = { ...prev, [debriefKey]: data.debrief };
        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          updateDoc(userDocRef, { dailyDebriefs: updated });
        }
        return updated;
      });
      setDebriefVisible(prev => ({ ...prev, [debriefKey]: true }));
    } catch (err) {
      console.error('Daily debrief error:', err);
      setDebriefError({ date, message: 'Network error. Please check your connection and try again.' });
    } finally {
      setDebriefLoading(null);
    }
  };

  const totalTrades = trades.length;
  const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
  const tradeExpectancy = totalTrades > 0 ? totalProfitLoss / totalTrades : 0;
  const totalProfits = trades.filter(trade => trade.profitLoss > 0).reduce((sum, trade) => sum + trade.profitLoss, 0);
  const totalLosses = Math.abs(trades.filter(trade => trade.profitLoss < 0).reduce((sum, trade) => sum + trade.profitLoss, 0));
  const profitFactor = totalLosses === 0 ? (totalProfits > 0 ? Infinity : 0) : totalProfits / totalLosses;
  const winningTrades = trades.filter(trade => trade.profitLoss > 0).length;
  const losingTrades = trades.filter(trade => trade.profitLoss < 0).length;
  const neutralTrades = trades.filter(trade => trade.profitLoss === 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgWinTrade = winningTrades > 0
    ? trades.filter(trade => trade.profitLoss > 0).reduce((sum, trade) => sum + trade.profitLoss, 0) / winningTrades
    : 0;
  const avgLossTrade = losingTrades > 0
    ? Math.abs(trades.filter(trade => trade.profitLoss < 0).reduce((sum, trade) => sum + trade.profitLoss, 0)) / losingTrades
    : 0;
  const avgWinLossRatio = avgLossTrade > 0 ? avgWinTrade / avgLossTrade : avgWinTrade > 0 ? Infinity : 0;

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const DayTradesPopup = ({ dayData, onClose }) => {
    const [hoveredTrade, setHoveredTrade] = useState(null);

    if (!dayData) return null;

    const trades = dayData.trades || [];
    const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const winningTrades = trades.filter(trade => trade.profitLoss > 0).length;
    const losingTrades = trades.filter(trade => trade.profitLoss < 0).length;
    const totalProfits = trades.filter(trade => trade.profitLoss > 0).reduce((sum, trade) => sum + trade.profitLoss, 0);
    const totalLosses = Math.abs(trades.filter(trade => trade.profitLoss < 0).reduce((sum, trade) => sum + trade.profitLoss, 0));
    const profitFactor = totalLosses === 0 ? (totalProfits > 0 ? '--' : '--') : (totalProfits / totalLosses).toFixed(2);
    const volume = trades.reduce((sum, trade) => sum + (trade.Quantity || 0), 0);
    const winrate = trades.length > 0 ? ((winningTrades / trades.length) * 100).toFixed(0) : '--';

    const handleTradeClick = (trade) => {
      // Transform the trade object to match the expected structure
      const transformedTrade = {
        symbol: trade.Symbol,
        openDate: trade.TradeDate,
        closeDate: trade.LastSellTradeDate || trade.TradeDate,
        entryPrice: trade.Price,
        exitPrice: trade.Price + (trade.profitLoss / (trade.Quantity * 100)), // Calculate exit price from P&L
        netPL: trade.profitLoss,
        netROI: (trade.profitLoss / (trade.Quantity * trade.Price * 100)) * 100,
        open: {
          Quantity: trade.Quantity,
          ExecTime: trade.FirstBuyExecTime,
          TradeDate: trade.TradeDate,
          Type: trade.Type,
          Strike: trade.Strike,
          Expiration: trade.Expiration,
          Price: trade.Price,
          Side: 'BUY',
          PosEffect: 'OPEN'
        },
        close: {
          ExecTime: trade.LastSellExecTime,
          TradeDate: trade.LastSellTradeDate || trade.TradeDate,
          Quantity: trade.Quantity,
          Price: trade.Price + (trade.profitLoss / (trade.Quantity * 100)),
          Side: 'SELL',
          PosEffect: 'CLOSE'
        }
      };
      
      // Navigate to all trades screen with the transformed trade
      navigate('/alltrades', { state: { selectedTrade: transformedTrade } });
      onClose();
    };

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: '#121F35',
            padding: '32px 32px 24px 32px',
            borderRadius: '16px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '0 4px 32px 0 #000a',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 24, color: '#fff', fontWeight: 600 }}>
              {new Date(dayData.date.split('-').join('/')).toLocaleDateString('en-US', {
                weekday: 'short', month: 'long', day: '2-digit', year: 'numeric'
              })}
            </span>
            <span style={{ fontSize: 24, fontWeight: 600, marginLeft: 16, color: totalProfitLoss >= 0 ? theme.colors.green : theme.colors.red }}>
              • Net P&L ${totalProfitLoss.toFixed(2)}
            </span>
            <button
              onClick={() => {
                setSelectedDate(dayData.date);
                setNoteModalOpen(true);
              }}
              style={{
                backgroundColor: notes[dayData.date] ? '#3D5070' : theme.colors.green,
                color: theme.colors.white,
                border: 'none',
                borderRadius: '4px',
                padding: '5px 10px',
                cursor: 'pointer',
                marginLeft: 'auto',
                marginRight: '10px',
              }}
            >
              {notes[dayData.date] ? 'View Note' : 'Add Note'}
            </button>
            {isPro && (() => {
              const dk = toDebriefKey(dayData.date);
              return (
                <button
                  onClick={() => {
                    if (debriefs[dk]) {
                      setDebriefVisible(prev => ({ ...prev, [dk]: !prev[dk] }));
                    } else {
                      handleDailyDebrief(dayData.date);
                    }
                  }}
                  disabled={debriefLoading === dayData.date}
                  style={{
                    background: debriefLoading === dayData.date ? '#555' : 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: '#fff',
                    border: debriefs[dk] && !debriefVisible[dk] ? '1px solid #764ba2' : 'none',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    cursor: debriefLoading === dayData.date ? 'not-allowed' : 'pointer',
                    marginRight: '10px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {debriefLoading === dayData.date ? (
                    <>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'aiSpin 0.8s linear infinite' }} />
                      Analyzing...
                    </>
                  ) : debriefs[dk] ? (
                    debriefVisible[dk] ? <>{'✨ Hide Debrief'}</> : <>{'✨ View Debrief'}</>
                  ) : (
                    <>{'✨ AI Debrief'}</>
                  )}
                </button>
              );
            })()}
            <button
              onClick={onClose}
              style={{
                marginLeft: '10px',
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: 28,
                cursor: 'pointer',
                padding: 0,
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* AI Debrief Error */}
          {debriefError && debriefError.date === dayData.date && (
            <div style={{
              backgroundColor: 'rgba(255, 82, 82, 0.1)',
              border: '1px solid rgba(255, 82, 82, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: '#ff5252', fontSize: '14px' }}>{debriefError.message}</span>
              <button
                onClick={() => { setDebriefError(null); handleDailyDebrief(dayData.date); }}
                style={{
                  background: 'rgba(255, 82, 82, 0.2)',
                  color: '#ff5252',
                  border: '1px solid rgba(255, 82, 82, 0.4)',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Chart */}
          <div
            style={{
              height: '180px',
              margin: '24px 0 16px 0',
              backgroundColor: '#1A2A42',
              borderRadius: '12px',
              padding: '12px',
            }}
          >
            <Line
              data={{
                labels: ['Start', ...trades.map((_, index) => `Trade ${index + 1}`)],
                datasets: [
                  {
                    label: 'Cumulative P&L',
                    data: [0, ...trades.reduce((acc, trade) => {
                      const lastPnl = acc.length > 0 ? acc[acc.length - 1] : 0;
                      acc.push(lastPnl + trade.profitLoss);
                      return acc;
                    }, [])],
                    borderColor: theme.colors.green,
                    backgroundColor: theme.colors.green,
                    fill: true,
                    tension: 0.1,
                    segment: {
                      borderColor: ctx => {
                        const currentValue = ctx.p1.parsed.y;
                        return currentValue < 0 ? theme.colors.red : theme.colors.green;
                      },
                      backgroundColor: ctx => {
                        const currentValue = ctx.p1.parsed.y;
                        return currentValue < 0 ? theme.colors.red : theme.colors.green;
                      },
                    },
                    pointBackgroundColor: [0, ...trades.reduce((acc, trade) => {
                      const lastPnl = acc.length > 0 ? acc[acc.length - 1] : 0;
                      acc.push(lastPnl + trade.profitLoss);
                      return acc;
                    }, [])].map(value => (value < 0 ? theme.colors.red : theme.colors.green)),
                    pointBorderColor: [0, ...trades.reduce((acc, trade) => {
                      const lastPnl = acc.length > 0 ? acc[acc.length - 1] : 0;
                      acc.push(lastPnl + trade.profitLoss);
                      return acc;
                    }, [])].map(value => (value < 0 ? theme.colors.red : theme.colors.green)),
                  },
                ],
              }}
              options={{
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
                    grid: { color: '#233350' },
                    ticks: { color: '#888' },
                  },
                },
              }}
            />
          </div>

          {/* Stats Row */}
          <div style={{ display: 'flex', gap: 32, margin: '24px 0 16px 0', flexWrap: 'wrap' }}>
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Total trades<br /><span style={{ color: '#fff', fontWeight: 600, fontSize: 20 }}>{trades.length}</span></div>
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Winners<br /><span style={{ color: theme.colors.green, fontWeight: 600, fontSize: 20 }}>{winningTrades}</span></div>
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Losers<br /><span style={{ color: theme.colors.red, fontWeight: 600, fontSize: 20 }}>{losingTrades}</span></div>
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Winrate<br /><span style={{ color: '#fff', fontWeight: 600, fontSize: 20 }}>{winrate}%</span></div>
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Volume<br /><span style={{ color: '#fff', fontWeight: 600, fontSize: 20 }}>{volume}</span></div>
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Profit factor<br /><span style={{ color: '#fff', fontWeight: 600, fontSize: 20 }}>{profitFactor}</span></div>
          </div>

          {/* AI Daily Debrief Result */}
          {(() => {
            const dk = toDebriefKey(dayData.date);
            if (!debriefs[dk] || !debriefVisible[dk]) return null;
            return (
            <div style={{
              backgroundColor: '#1A2B44',
              border: '1px solid #2B3D55',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '15px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#b388ff', fontSize: '15px', fontWeight: 'bold' }}>{'✨ AI Daily Debrief'}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => { handleDailyDebrief(dayData.date); }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#b3b3c6',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => {
                      setDebriefs(prev => { const next = { ...prev }; delete next[dk]; return next; });
                      setDebriefVisible(prev => { const next = { ...prev }; delete next[dk]; return next; });
                      if (currentUser) {
                        const userDocRef = doc(db, 'users', currentUser.uid);
                        const updated = { ...debriefs }; delete updated[dk];
                        updateDoc(userDocRef, { dailyDebriefs: updated });
                      }
                    }}
                    style={{
                      background: 'rgba(255, 82, 82, 0.15)',
                      color: '#ff5252',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDebriefVisible(prev => ({ ...prev, [dk]: false }))}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#b3b3c6',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Hide
                  </button>
                </div>
              </div>
              <div style={{ color: '#d0d0e0', fontSize: '14px', lineHeight: '1.6' }}>
                {debriefs[dk].split('\n').map((line, i) => {
                  if (/^\*\*(.+)\*\*$/.test(line.trim())) {
                    return <div key={i} style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px', marginTop: i > 0 ? '14px' : '0', marginBottom: '4px' }}>{line.trim().replace(/^\*\*|\*\*$/g, '')}</div>;
                  }
                  if (/^[-•]\s/.test(line.trim())) {
                    return <div key={i} style={{ paddingLeft: '16px', position: 'relative', marginBottom: '2px' }}><span style={{ position: 'absolute', left: '4px' }}>&bull;</span>{line.trim().replace(/^[-•]\s/, '').replace(/\*\*(.+?)\*\*/g, (_, m) => m)}</div>;
                  }
                  if (!line.trim()) return <div key={i} style={{ height: '8px' }} />;
                  const parts = line.split(/\*\*(.+?)\*\*/g);
                  return (
                    <div key={i} style={{ marginBottom: '2px' }}>
                      {parts.map((part, j) =>
                        j % 2 === 1 ? <strong key={j} style={{ color: '#fff' }}>{part}</strong> : <span key={j}>{part}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })()}

          {/* Trade Table */}
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'none' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6', fontWeight: 500, fontSize: 15 }}>Open time</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6', fontWeight: 500, fontSize: 15 }}>Ticker</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6', fontWeight: 500, fontSize: 15 }}>Side</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6', fontWeight: 500, fontSize: 15 }}>Instrument</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#b3b3c6', fontWeight: 500, fontSize: 15 }}>Net P&L</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#b3b3c6', fontWeight: 500, fontSize: 15 }}>Net ROI</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, index) => {
                  const openTime = new Date(trade.FirstBuyExecTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const optionType = trade.Type || 'CALL';
                  const instrument = `${trade.Expiration} ${trade.Strike} ${optionType}`;
                  const netROI = (trade.profitLoss / (trade.Quantity * trade.Price * 100)) * 100;
                  const isHovered = hoveredTrade === index;
                  
                  return (
                    <tr 
                      key={index} 
                      style={{ 
                        borderBottom: '1px solid #222', 
                        background: isHovered ? '#253650' : 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={() => setHoveredTrade(index)}
                      onMouseLeave={() => setHoveredTrade(null)}
                      onClick={() => handleTradeClick(trade)}
                    >
                      <td style={{ padding: '12px 8px', color: '#fff', fontSize: 15 }}>{openTime}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          background: '#253555',
                          color: '#b3b3c6',
                          borderRadius: '16px',
                          padding: '4px 14px',
                          fontWeight: 600,
                          fontSize: 15,
                          display: 'inline-block',
                        }}>{trade.Symbol}</span>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#fff', fontSize: 15 }}>{optionType}</td>
                      <td style={{ padding: '12px 8px', color: '#fff', fontSize: 15 }}>{instrument}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: trade.profitLoss >= 0 ? theme.colors.green : theme.colors.red, fontWeight: 600, fontSize: 15 }}>${trade.profitLoss.toFixed(2)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: netROI >= 0 ? theme.colors.green : theme.colors.red, fontWeight: 600, fontSize: 15 }}>{netROI.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: theme.colors.green,
                color: theme.colors.white,
                border: 'none',
                borderRadius: '6px',
                padding: '10px 32px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600,
                marginTop: 8,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCalendar = (isMobileDevice) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const weeks = [];
    let dayCount = 1;

    // Adjust size based on screen width
    const daySize = isMobileDevice ? '10vw' : '6vw';
    const fontSize = isMobileDevice ? '8px' : '12px';
    const dayInfoFontSize = isMobileDevice ? '7px' : '10px';
    const weeklyPnlFontSize = isMobileDevice ? '8px' : '14px';

    for (let i = 0; i < 6; i++) {
      const week = [];
      let weeklyPnl = 0;

      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDay) || dayCount > daysInMonth) {
          week.push(
            <div
              key={j}
              style={{
                width: daySize,
                height: daySize,
                backgroundColor: '#344563',
                color: theme.colors.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '4px',
                borderRadius: '4px',
              }}
            />
          );
        } else {
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCount).padStart(2, '0')}`;
          const dailyData = calendarData[dateKey] || { pnl: 0, tradeCount: 0 };
          const hasTrades = dailyData.tradeCount > 0;
          if (hasTrades) {
            weeklyPnl += dailyData.pnl;
          }
          const backgroundColor = hasTrades
            ? dailyData.pnl >= 0
              ? theme.colors.green
              : theme.colors.red
            : '#3D5070';

          week.push(
            <div
              key={j}
              onClick={() => {
                if (hasTrades) {
                  setSelectedDay({ ...dailyData, date: dateKey });
                  setIsDayPopupOpen(true);
                }
              }}
              style={{
                width: daySize,
                height: daySize,
                backgroundColor,
                color: theme.colors.white,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '4px',
                borderRadius: '4px',
                fontSize,
                padding: '2px',
                boxSizing: 'border-box',
                cursor: hasTrades ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontSize: isMobileDevice ? '10px' : '16px' }}>{dayCount}</div>
              {hasTrades && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: '1px',
                  marginTop: '1px'
                }}>
                  <div style={{ fontSize: dayInfoFontSize }}>${dailyData.pnl.toFixed(1)}</div>
                  <div style={{ fontSize: dayInfoFontSize }}>
                    {dailyData.tradeCount} trade{dailyData.tradeCount !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          );
          dayCount++;
        }
      }

      // Add weekly P&L column
      week.push(
        <div
          key="weekly-pnl"
          style={{
            width: daySize,
            height: daySize,
            backgroundColor: '#1B2B43',
            color: theme.colors.white,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px',
            borderRadius: '4px',
            fontSize: weeklyPnlFontSize,
            border: '1px solid #333',
            padding: '4px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ 
            fontSize: isMobileDevice ? '8px' : '14px', 
            marginBottom: '2px',
            fontWeight: 'bold'
          }}>Weekly P&L:</div>
          <div style={{ 
            fontSize: isMobileDevice ? '10px' : '16px',
            color: weeklyPnl >= 0 ? theme.colors.green : theme.colors.red,
            fontWeight: 'bold'
          }}>
            ${weeklyPnl.toFixed(1)}
          </div>
        </div>
      );

      weeks.push(<div key={i} style={{ display: 'flex', justifyContent: 'center' }}>{week}</div>);
    }

    return weeks;
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const cumulativePnlChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          color: theme.colors.white,
        },
        ticks: {
          color: theme.colors.white,
          maxTicksLimit: 10,
        },
        grid: {
          color: '#344563',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Cumulative P&L ($)',
          color: theme.colors.white,
        },
        ticks: {
          color: theme.colors.white,
          callback: value => `$${value.toFixed(2)}`,
        },
        grid: {
          color: '#344563',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: context => {
            const date = context.label;
            const value = context.parsed.y;
            return `Date: ${date}, Cumulative P&L: $${value.toFixed(2)}`;
          },
        },
        backgroundColor: '#344563',
        titleColor: theme.colors.white,
        bodyColor: theme.colors.white,
      },
    },
  };

  const dailyPnlChartData = {
    labels: dailyPnlData.map(data => data.date),
    datasets: [
      {
        label: 'Daily P&L',
        data: dailyPnlData.map(data => data.pnl),
        backgroundColor: dailyPnlData.map(data => (data.pnl >= 0 ? theme.colors.green : theme.colors.red)),
        borderColor: dailyPnlData.map(data => (data.pnl >= 0 ? theme.colors.green : theme.colors.red)),
        borderWidth: 1,
      },
    ],
  };

  const dailyPnlChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          color: theme.colors.white,
        },
        ticks: {
          color: theme.colors.white,
          maxTicksLimit: 10,
        },
        grid: {
          color: '#344563',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Daily P&L ($)',
          color: theme.colors.white,
        },
        ticks: {
          color: theme.colors.white,
          callback: value => `$${value.toFixed(2)}`,
        },
        grid: {
          color: '#344563',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: theme.colors.white,
        },
      },
      tooltip: {
        callbacks: {
          label: context => {
            const date = context.label;
            const value = context.parsed.y;
            return `Date: ${date}, Daily P&L: $${value.toFixed(2)}`;
          },
        },
        backgroundColor: '#344563',
        titleColor: theme.colors.white,
        bodyColor: theme.colors.white,
      },
    },
  };

  const handleNoteSaved = (updatedNotes) => {
    setNotes(updatedNotes);
  };

  if (!tradeData.length) {
    return (
      <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
        <p style={{ color: theme.colors.white }}>No data uploaded yet.</p>
        <Calendar defaultView={true} isHalfScreen={isMobileDevice || isHalfScreen} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
      <style>{`@keyframes aiSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      {/* First row of stat boxes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobileDevice ? '1fr' : (isHalfScreen ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)'),
          gap: '20px',
          marginBottom: '20px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible',
        }}
      >
        {/* Net P&L Box */}
        <div
          style={{
            backgroundColor: '#1B2B43',
            padding: '15px',
            borderRadius: '8px',
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            minHeight: isMobileDevice ? 'auto' : '200px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#888' }}>Net P&L</span>
            <InfoCircle tooltip="The total realized net profit and loss for all closed trades." />
            <div
              style={{
                marginLeft: 'auto',
                backgroundColor: '#2B3C5A',
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
            backgroundColor: '#1B2B43',
            padding: '15px',
            borderRadius: '8px',
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            minHeight: isMobileDevice ? 'auto' : '200px',
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
            backgroundColor: '#1B2B43',
            padding: '15px',
            borderRadius: '8px',
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            minHeight: isMobileDevice ? 'auto' : '200px',
            overflow: 'visible',
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            maxWidth: '100%',
            overflow: 'visible'
          }}>
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
            backgroundColor: '#1B2B43',
            padding: '15px',
            borderRadius: '8px',
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            minHeight: isMobileDevice ? 'auto' : '200px',
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
            backgroundColor: '#1B2B43',
            padding: '15px',
            borderRadius: '8px',
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            minHeight: isMobileDevice ? 'auto' : '200px',
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
                backgroundColor: '#2B3C5A',
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

      {/* Charts Section */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '20px',
          flexDirection: isMobileDevice ? 'column' : (isHalfScreen ? 'column' : 'row'),
          marginBottom: '40px' 
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ color: theme.colors.white, marginBottom: '20px', textAlign: 'center' }}>Cumulative Daily P&L</h3>
            <div style={{ 
              height: '300px', 
              backgroundColor: '#1B2B43', 
              padding: '20px', 
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <Line data={cumulativePnlChartData} options={{
                ...cumulativePnlChartOptions,
                maintainAspectRatio: false,
                responsive: true
              }} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ color: theme.colors.white, marginBottom: '20px', textAlign: 'center' }}>Daily P&L</h3>
            <div style={{ 
              height: '300px', 
              backgroundColor: '#1B2B43', 
              padding: '20px', 
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <Bar data={dailyPnlChartData} options={{
                ...dailyPnlChartOptions,
                maintainAspectRatio: false,
                responsive: true
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Trade Calendar */}
      <h3 style={{ color: theme.colors.white, marginTop: '40px' }}>Trade Calendar</h3>
      <div style={{ marginTop: '20px', width: '100%' }}>
        <div style={{ color: theme.colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => changeMonth(-1)} style={{ marginRight: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>
            ←
          </button>
          <span>{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</span>
          <button onClick={() => changeMonth(1)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>
            →
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px', width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            color: theme.colors.white, 
            marginBottom: '10px', 
            fontSize: isMobileDevice ? '14px' : (isHalfScreen ? '14px' : '12px'),
            gap: isMobileDevice ? '0' : (isHalfScreen ? '0' : '8px')
          }}>
            <span style={{ width: isMobileDevice ? '10vw' : (isHalfScreen ? '10vw' : '6vw'), textAlign: 'center' }}>Sun</span>
            <span style={{ width: isMobileDevice ? '10vw' : (isHalfScreen ? '10vw' : '6vw'), textAlign: 'center' }}>Mon</span>
            <span style={{ width: isMobileDevice ? '10vw' : (isHalfScreen ? '10vw' : '6vw'), textAlign: 'center' }}>Tue</span>
            <span style={{ width: isMobileDevice ? '10vw' : (isHalfScreen ? '10vw' : '6vw'), textAlign: 'center' }}>Wed</span>
            <span style={{ width: isMobileDevice ? '10vw' : (isHalfScreen ? '10vw' : '6vw'), textAlign: 'center' }}>Thu</span>
            <span style={{ width: isMobileDevice ? '10vw' : (isHalfScreen ? '10vw' : '6vw'), textAlign: 'center' }}>Fri</span>
            <span style={{ width: isMobileDevice ? '10vw' : (isHalfScreen ? '10vw' : '6vw'), textAlign: 'center' }}>Sat</span>
          </div>
          {renderCalendar(isMobileDevice || isHalfScreen)}
        </div>
      </div>
      {isDayPopupOpen && (
        <DayTradesPopup
          dayData={selectedDay}
          onClose={() => {
            setIsDayPopupOpen(false);
            setSelectedDay(null);
          }}
        />
      )}

      {noteModalOpen && selectedDate && (
        <NoteModal
          isOpen={noteModalOpen}
          onClose={() => {
            setNoteModalOpen(false);
            setSelectedDate(null);
          }}
          date={selectedDate}
          existingNote={notes[selectedDate] || ''}
          onNoteSaved={handleNoteSaved}
        />
      )}
    </div>
  );
};

const Calendar = ({ defaultView, isHalfScreen }) => {
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

    const daySize = isHalfScreen ? '10vw' : '12vw';
    const fontSize = isHalfScreen ? '14px' : '16px';

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDay) || dayCount > daysInMonth) {
          week.push(
            <div
              key={j}
              style={{
                width: daySize,
                height: daySize,
                backgroundColor: '#344563',
                color: theme.colors.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '4px',
                borderRadius: '4px',
              }}
            />
          );
        } else {
          week.push(
            <div
              key={j}
              style={{
                width: daySize,
                height: daySize,
                backgroundColor: '#3D5070', // Light grey for days with no trades in default view
                color: theme.colors.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '4px',
                borderRadius: '4px',
                fontSize,
              }}
            >
              {dayCount}
            </div>
          );
          dayCount++;
        }
      }
      weeks.push(<div key={i} style={{ display: 'flex', justifyContent: 'center' }}>{week}</div>);
    }

    return weeks;
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  return (
    <div style={{ marginTop: '20px', width: '100%' }}>
      <div style={{ color: theme.colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={() => changeMonth(-1)} style={{ marginRight: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>
          ←
        </button>
        <span>{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</span>
        <button onClick={() => changeMonth(1)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: theme.colors.white, cursor: 'pointer' }}>
          →
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px', width: '100%' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          color: theme.colors.white, 
          marginBottom: '10px', 
          fontSize: isHalfScreen ? '14px' : '12px',
          gap: isHalfScreen ? '0' : '8px'
        }}>
          <span style={{ width: isHalfScreen ? '10vw' : '6vw', textAlign: 'center' }}>Sun</span>
          <span style={{ width: isHalfScreen ? '10vw' : '6vw', textAlign: 'center' }}>Mon</span>
          <span style={{ width: isHalfScreen ? '10vw' : '6vw', textAlign: 'center' }}>Tue</span>
          <span style={{ width: isHalfScreen ? '10vw' : '6vw', textAlign: 'center' }}>Wed</span>
          <span style={{ width: isHalfScreen ? '10vw' : '6vw', textAlign: 'center' }}>Thu</span>
          <span style={{ width: isHalfScreen ? '10vw' : '6vw', textAlign: 'center' }}>Fri</span>
          <span style={{ width: isHalfScreen ? '10vw' : '6vw', textAlign: 'center' }}>Sat</span>
        </div>
        {renderCalendar()}
      </div>
    </div>
  );
};

export default StatsDashboard;