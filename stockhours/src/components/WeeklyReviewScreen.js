import React, { useState, useEffect, useMemo } from 'react';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Week helpers
const getWeekMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  // Sunday maps to previous Monday (Mon-Sat trading week)
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toWeekKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekLabel = (mondayDate) => {
  const mon = new Date(mondayDate);
  const sat = new Date(mon);
  sat.setDate(mon.getDate() + 5);
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(mon).replace(`, ${mon.getFullYear()}`, '')} – ${fmt(sat)}`;
};

const isCurrentWeek = (weekKey) => {
  const currentMonday = getWeekMonday(new Date());
  return weekKey === toWeekKey(currentMonday);
};

const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    // Bold headers: **text**
    if (/^\*\*(.+)\*\*$/.test(line.trim())) {
      return <div key={i} style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px', marginTop: i > 0 ? '14px' : '0', marginBottom: '4px' }}>{line.trim().replace(/^\*\*|\*\*$/g, '')}</div>;
    }
    // Numbered items: 1. text
    if (/^\d+\.\s/.test(line.trim())) {
      return <div key={i} style={{ paddingLeft: '8px', marginBottom: '4px' }}>{renderInlineBold(line.trim())}</div>;
    }
    // Bullet points
    if (/^[-•]\s/.test(line.trim())) {
      return <div key={i} style={{ paddingLeft: '16px', position: 'relative', marginBottom: '2px' }}><span style={{ position: 'absolute', left: '4px' }}>&bull;</span>{renderInlineBold(line.trim().replace(/^[-•]\s/, ''))}</div>;
    }
    // Empty lines
    if (!line.trim()) return <div key={i} style={{ height: '8px' }} />;
    // Inline bold
    return <div key={i} style={{ marginBottom: '2px' }}>{renderInlineBold(line)}</div>;
  });
};

const renderInlineBold = (text) => {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, j) =>
    j % 2 === 1 ? <strong key={j} style={{ color: '#fff' }}>{part}</strong> : <span key={j}>{part}</span>
  );
};

const WeeklyReviewScreen = ({ tradeData }) => {
  const { currentUser, isPro } = useAuth();
  const [weeklyReviews, setWeeklyReviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingGoals, setEditingGoals] = useState(null);
  const [goalsText, setGoalsText] = useState('');
  const [savingGoals, setSavingGoals] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [notes, setNotes] = useState({});
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  // Process raw tradeData into individual trades (same pattern as StatsDashboard)
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

  // Load weekly reviews and notes from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.weeklyReviews) setWeeklyReviews(data.weeklyReviews);
          if (data.notes) setNotes(data.notes);
        }
      }
    };
    fetchData();
  }, [currentUser]);

  // Auto-expand current week
  useEffect(() => {
    const currentWeekKey = toWeekKey(getWeekMonday(new Date()));
    setExpandedWeeks(prev => ({ ...prev, [currentWeekKey]: true }));
  }, []);

  // Get all week keys that have trades or reviews, sorted descending
  const weekKeys = useMemo(() => {
    const keys = new Set();

    // Add weeks with trades
    trades.forEach(trade => {
      const monday = getWeekMonday(new Date(trade.FirstBuyExecTime));
      keys.add(toWeekKey(monday));
    });

    // Add weeks with existing reviews
    Object.keys(weeklyReviews).forEach(key => keys.add(key));

    // Always include current week
    keys.add(toWeekKey(getWeekMonday(new Date())));

    return Array.from(keys).sort((a, b) => new Date(b) - new Date(a));
  }, [trades, weeklyReviews]);

  const computeWeeklyData = (weekKey) => {
    const monday = new Date(weekKey + 'T00:00:00');
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.FirstBuyExecTime);
      return tradeDate >= monday && tradeDate <= sunday;
    });

    // Group by day
    const dailyMap = {};
    weekTrades.forEach(trade => {
      const dateKey = new Date(trade.FirstBuyExecTime).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { trades: [], totalPL: 0, winners: 0, losers: 0 };
      }
      dailyMap[dateKey].trades.push(trade);
      dailyMap[dateKey].totalPL += trade.profitLoss;
      if (trade.profitLoss > 0) dailyMap[dateKey].winners++;
      else if (trade.profitLoss < 0) dailyMap[dateKey].losers++;
    });

    const dailyBreakdown = Object.entries(dailyMap)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, data]) => ({
        date,
        trades: data.trades.length,
        totalPL: data.totalPL,
        winners: data.winners,
        losers: data.losers,
      }));

    const totalPL = weekTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const winners = weekTrades.filter(t => t.profitLoss > 0).length;
    const losers = weekTrades.filter(t => t.profitLoss < 0).length;
    const totalTrades = weekTrades.length;
    const winRate = totalTrades > 0 ? ((winners / totalTrades) * 100).toFixed(1) : '0';
    const totalProfits = weekTrades.filter(t => t.profitLoss > 0).reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLosses = Math.abs(weekTrades.filter(t => t.profitLoss < 0).reduce((sum, t) => sum + t.profitLoss, 0));
    const profitFactor = totalLosses === 0 ? (totalProfits > 0 ? 'Inf' : '0') : (totalProfits / totalLosses).toFixed(2);
    const totalVolume = weekTrades.reduce((sum, t) => sum + (t.Quantity || 0), 0);

    const dayPLs = dailyBreakdown.map(d => d.totalPL);
    const bestDay = dayPLs.length > 0 ? Math.max(...dayPLs) : 0;
    const worstDay = dayPLs.length > 0 ? Math.min(...dayPLs) : 0;

    // Collect daily notes within the week
    const weekNotes = [];
    for (let d = new Date(monday); d <= sunday; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      if (notes[dateKey]) {
        const stripped = stripHtml(notes[dateKey]);
        if (stripped.trim()) {
          weekNotes.push({ date: dateKey, text: stripped });
        }
      }
    }

    return {
      weeklyStats: { totalPL, totalTrades, winners, losers, winRate, profitFactor, bestDay, worstDay, totalVolume },
      dailyBreakdown,
      tradeCount: totalTrades,
      notes: weekNotes,
    };
  };

  const handleGenerateReview = async (weekKey) => {
    setLoading(true);
    setError(null);
    try {
      const data = computeWeeklyData(weekKey);
      const token = await currentUser.getIdToken();
      const API_URL = process.env.REACT_APP_STRIPE_API_URL || '';
      const response = await fetch(`${API_URL}/api/ai/weekly-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          setError('AI Weekly Review is available on the Pro plan.');
        } else if (response.status === 429) {
          setError('AI service is busy. Please try again in a moment.');
        } else {
          setError(errData.error || 'Failed to generate weekly review.');
        }
        return;
      }

      const result = await response.json();
      const reviewEntry = {
        review: result.review,
        goals: result.goals,
        generatedAt: new Date().toISOString(),
        weekLabel: getWeekLabel(new Date(weekKey + 'T00:00:00')),
      };

      setWeeklyReviews(prev => {
        const updated = { ...prev, [weekKey]: reviewEntry };
        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          updateDoc(userDocRef, { weeklyReviews: updated });
        }
        return updated;
      });

      setExpandedWeeks(prev => ({ ...prev, [weekKey]: true }));
    } catch (err) {
      console.error('Weekly review error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoals = async (weekKey) => {
    setSavingGoals(true);
    try {
      setWeeklyReviews(prev => {
        const updated = {
          ...prev,
          [weekKey]: { ...prev[weekKey], goals: goalsText },
        };
        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          updateDoc(userDocRef, { weeklyReviews: updated });
        }
        return updated;
      });
      setEditingGoals(null);
    } catch (err) {
      console.error('Save goals error:', err);
    } finally {
      setSavingGoals(false);
    }
  };

  const handleDeleteReview = async (weekKey) => {
    setWeeklyReviews(prev => {
      const updated = { ...prev };
      delete updated[weekKey];
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        updateDoc(userDocRef, { weeklyReviews: updated });
      }
      return updated;
    });
  };

  const toggleWeek = (weekKey) => {
    setExpandedWeeks(prev => ({ ...prev, [weekKey]: !prev[weekKey] }));
  };

  if (!isPro) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8899AA' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10024;</div>
        <h2 style={{ color: '#fff', marginBottom: '8px' }}>Weekly Reviews</h2>
        <p>AI Weekly Reviews are available on the Pro plan.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
      <style>{`@keyframes aiSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <span style={{ fontSize: '24px', marginRight: '10px' }}>&#10024;</span>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '22px', fontWeight: '600' }}>Weekly Reviews</h2>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(255, 87, 87, 0.15)',
          border: '1px solid rgba(255, 87, 87, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: '#ff5757',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {(showAllWeeks ? weekKeys : weekKeys.slice(0, 10)).map(weekKey => {
        const review = weeklyReviews[weekKey];
        const isCurrent = isCurrentWeek(weekKey);
        const isExpanded = expandedWeeks[weekKey];
        const weekData = computeWeeklyData(weekKey);
        const label = getWeekLabel(new Date(weekKey + 'T00:00:00'));

        return (
          <div
            key={weekKey}
            style={{
              backgroundColor: '#1A2B44',
              border: '1px solid #2B3D55',
              borderLeft: isCurrent ? '3px solid #b388ff' : '1px solid #2B3D55',
              borderRadius: '12px',
              marginBottom: '12px',
              overflow: 'hidden',
            }}
          >
            {/* Week header - always visible */}
            <div
              onClick={() => toggleWeek(weekKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#8899AA', fontSize: '14px', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>&#9654;</span>
                <span style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>{label}</span>
                {isCurrent && <span style={{ color: '#b388ff', fontSize: '11px', backgroundColor: 'rgba(179, 136, 255, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>This Week</span>}
                {weekData.tradeCount > 0 && (
                  <span style={{ color: '#8899AA', fontSize: '13px' }}>
                    {weekData.tradeCount} trades &middot; <span style={{ color: weekData.weeklyStats.totalPL >= 0 ? theme.colors.green : theme.colors.red }}>${weekData.weeklyStats.totalPL.toFixed(2)}</span>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {review ? (
                  <span style={{ color: '#b388ff', fontSize: '12px' }}>&#10024; Reviewed</span>
                ) : weekData.tradeCount > 0 ? (
                  <span style={{ color: '#8899AA', fontSize: '12px' }}>Ready for review</span>
                ) : null}
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ padding: '0 20px 20px' }}>
                {!review ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    {weekData.tradeCount === 0 ? (
                      <p style={{ color: '#8899AA', fontSize: '14px' }}>No trades this week.</p>
                    ) : (
                      <button
                        onClick={() => handleGenerateReview(weekKey)}
                        disabled={loading}
                        style={{
                          background: loading ? '#555' : 'linear-gradient(135deg, #667eea, #764ba2)',
                          color: '#fff',
                          border: 'none',
                          padding: '12px 28px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        {loading ? (
                          <>
                            <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'aiSpin 1s linear infinite', display: 'inline-block' }} />
                            Generating...
                          </>
                        ) : (
                          <>&#10024; Generate Weekly Review</>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Review content */}
                    <div style={{ color: '#d0d0e0', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                      {renderMarkdown(review.review)}
                    </div>

                    {/* Goals section */}
                    <div style={{
                      backgroundColor: '#0F1D2F',
                      border: '1px dashed #2B3D55',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: '#b388ff', fontWeight: '600', fontSize: '15px' }}>Goals for Next Week</span>
                        {editingGoals !== weekKey && (
                          <button
                            onClick={() => { setEditingGoals(weekKey); setGoalsText(review.goals || ''); }}
                            style={{ background: 'none', border: '1px solid #2B3D55', color: '#8899AA', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {editingGoals === weekKey ? (
                        <div>
                          <textarea
                            value={goalsText}
                            onChange={(e) => setGoalsText(e.target.value)}
                            style={{
                              width: '100%',
                              minHeight: '120px',
                              backgroundColor: '#1A2B44',
                              border: '1px solid #2B3D55',
                              borderRadius: '8px',
                              color: '#d0d0e0',
                              padding: '12px',
                              fontSize: '14px',
                              lineHeight: '1.6',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                              boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button
                              onClick={() => handleSaveGoals(weekKey)}
                              disabled={savingGoals}
                              style={{
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 16px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                cursor: savingGoals ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {savingGoals ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingGoals(null)}
                              style={{ background: 'none', border: '1px solid #2B3D55', color: '#8899AA', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#d0d0e0', fontSize: '14px', lineHeight: '1.6' }}>
                          {review.goals ? renderMarkdown(review.goals) : <span style={{ color: '#556677' }}>No goals set. Click Edit to add goals.</span>}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleGenerateReview(weekKey)}
                        disabled={loading}
                        style={{
                          background: 'none',
                          border: '1px solid #2B3D55',
                          color: '#8899AA',
                          padding: '6px 16px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {loading ? (
                          <>
                            <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'aiSpin 1s linear infinite', display: 'inline-block' }} />
                            Regenerating...
                          </>
                        ) : (
                          'Regenerate'
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteReview(weekKey)}
                        style={{
                          background: 'none',
                          border: '1px solid rgba(255, 87, 87, 0.3)',
                          color: '#ff5757',
                          padding: '6px 16px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>

                    {review.generatedAt && (
                      <div style={{ color: '#556677', fontSize: '11px', marginTop: '12px' }}>
                        Generated {new Date(review.generatedAt).toLocaleString()}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!showAllWeeks && weekKeys.length > 10 && (
        <button
          onClick={() => setShowAllWeeks(true)}
          style={{
            display: 'block',
            margin: '0 auto',
            background: 'none',
            border: '1px solid #2B3D55',
            color: '#8899AA',
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          View {weekKeys.length - 10} more week{weekKeys.length - 10 === 1 ? '' : 's'}
        </button>
      )}

      {weekKeys.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8899AA' }}>
          <p>No trading weeks found. Import trade data to get started.</p>
        </div>
      )}
    </div>
  );
};

export default WeeklyReviewScreen;
