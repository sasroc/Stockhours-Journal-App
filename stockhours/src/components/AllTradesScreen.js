import React, { useMemo, useState, useEffect } from 'react';
import { theme } from '../theme';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { FaCheck, FaEllipsisH } from 'react-icons/fa';
import TradingViewChart from './TradingViewChart';
import { useLocation } from 'react-router-dom';

const ROWS_PER_PAGE = 50;

function getStatusAndColors(pnl) {
  if (pnl > 0) return { status: 'WIN', color: theme.colors.green };
  if (pnl < 0) return { status: 'LOSS', color: theme.colors.red };
  return { status: 'NEUTRAL', color: '#888' };
}

const getTradeKey = (trade) => {
  // Match the format used in DailyStatsScreen
  return `${trade.symbol || trade.Symbol}-${trade.open.Strike || trade.Strike}-${trade.open.Expiration || trade.Expiration}-${trade.open.ExecTime || trade.FirstBuyExecTime}`;
};

// Placeholder for the detailed view
function TradeDetailView({ trade, onBack, rating, setRating, setupsTags, mistakesTags, setSetupsTags, setMistakesTags, selectedSetups, selectedMistakes, setSelectedSetups, setSelectedMistakes, setRatings, isPro, currentUser }) {
  // Dummy values for fields not in trade object
  const grossPL = trade.netPL;
  const adjustedCost = (trade.entryPrice * trade.open.Quantity * 100).toFixed(2);
  // Format date as 'Tue, May 06, 2025'
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: '2-digit', year: 'numeric' });
  }
  const tradeDate = formatDate(trade.open.ExecTime || trade.open.TradeDate);
  const optionTaken = `${trade.open.Expiration || ''} ${trade.open.Strike || ''} ${trade.open.Type || ''}`;

  // Trade rating state (supports half-stars)
  const [hoverRating, setHoverRating] = React.useState(null);
  const [aiReview, setAiReview] = React.useState(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState(null);

  const handleAIReview = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const token = await currentUser.getIdToken();
      const apiBase = process.env.REACT_APP_STRIPE_API_URL || '';
      const res = await fetch(`${apiBase}/api/ai/trade-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trade: {
            symbol: trade.symbol,
            strike: trade.open.Strike,
            type: trade.open.Type,
            expiration: trade.open.Expiration,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            quantity: trade.open.Quantity,
            netPL: trade.netPL,
            netROI: trade.netROI,
            status: trade.status,
            tradeDate: trade.openDate,
            closeDate: trade.closeDate,
            entryTime: trade.open.ExecTime,
            exitTime: trade.close.ExecTime,
            rating: rating,
            setups: selectedSetups,
            mistakes: selectedMistakes,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setAiError('AI Trade Review is available on the Pro plan.');
        } else if (res.status === 429) {
          setAiError('AI service is busy. Please try again in a moment.');
        } else {
          setAiError(data.error || 'Failed to generate trade review.');
        }
      } else {
        setAiReview(data.review);
      }
    } catch (err) {
      setAiError('Network error. Please check your connection and try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const tradeRating = rating || 0;

  // Star rendering logic for half-stars and hover
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const value = i;
      // Determine fill for this star
      const currentRating = hoverRating !== null ? hoverRating : tradeRating;
      let fill = '#3D5070';
      if (currentRating >= value) {
        fill = '#FFD700'; // full gold
      } else if (currentRating >= value - 0.5) {
        // half-star: use gold gradient on left, gray on right
        fill = 'linear-gradient(90deg, #FFD700 50%, #3D5070 50%)';
      }
      stars.push(
        <span
          key={i}
          style={{
            cursor: 'pointer',
            fontSize: 24,
            color: currentRating >= value ? '#FFD700' : '#3D5070',
            marginRight: 2,
            position: 'relative',
            display: 'inline-block',
            width: 24,
            height: 24,
            transition: 'color 0.15s',
            background: fill.startsWith('linear') ? fill : undefined,
            WebkitBackgroundClip: fill.startsWith('linear') ? 'text' : undefined,
            WebkitTextFillColor: fill.startsWith('linear') ? 'transparent' : undefined,
          }}
          onMouseMove={e => {
            const { left, width } = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - left;
            if (x < width / 2) {
              setHoverRating(value - 0.5);
            } else {
              setHoverRating(value);
            }
          }}
          onMouseLeave={() => setHoverRating(null)}
          onClick={e => {
            const { left, width } = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - left;
            if (x < width / 2) {
              setRating(value - 0.5);
            } else {
              setRating(value);
            }
          }}
          title={`${value} star${value > 1 ? 's' : ''}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  // Tag selector component
  const TagSelector = ({ label, iconColor, tags, setTags, selected, setSelected, setRatings }) => {
    const [adding, setAdding] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [editTag, setEditTag] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [menuTag, setMenuTag] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: iconColor, fontSize: 20 }}>●</span>
          <span style={{ color: '#b3b3c6', fontWeight: 600, fontSize: 16 }}>{label}</span>
          <span style={{ color: '#b3b3c6', fontSize: 20, marginLeft: 'auto' }}>•••</span>
        </div>
        <div style={{ position: 'relative' }}>
          <div
            style={{ width: '100%', background: 'none', color: '#b3b3c6', border: '1px solid #344563', borderRadius: 6, padding: '8px', fontSize: 16, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setDropdownOpen(o => !o)}
          >
            Select tag
          </div>
          {dropdownOpen && (
            <div style={{ position: 'absolute', top: '110%', left: 0, width: '100%', background: '#253650', border: '1px solid #344563', borderRadius: 6, zIndex: 20, maxHeight: 220, overflowY: 'auto', boxShadow: '0 2px 8px #000a' }}>
              {tags.map(tag => (
                <div key={tag} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', color: selected.includes(tag) ? '#888' : '#b3b3c6', fontSize: 16, borderBottom: '1px solid #2B3D55', position: 'relative' }}>
                  {editTag === tag ? (
                    <input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && editValue.trim()) {
                          // Rename tag in tags and selected
                          const newTags = tags.map(t => (t === tag ? editValue.trim() : t));
                          setTags(newTags);
                          setSelected(selected.map(t => (t === tag ? editValue.trim() : t)));
                          setEditTag(null);
                          setEditValue('');
                        } else if (e.key === 'Escape') {
                          setEditTag(null);
                          setEditValue('');
                        }
                      }}
                      style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid #344563', background: '#253650', color: '#fff', fontSize: 15 }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span
                        style={{ flex: 1, cursor: selected.includes(tag) ? 'not-allowed' : 'pointer', opacity: selected.includes(tag) ? 0.5 : 1 }}
                        onClick={() => {
                          if (!selected.includes(tag)) {
                            setSelected([...selected, tag]);
                            setDropdownOpen(false);
                          }
                        }}
                      >{tag}</span>
                      <span
                        style={{ marginLeft: 8, cursor: 'pointer', color: '#888' }}
                        onClick={e => {
                          e.stopPropagation();
                          setMenuTag(menuTag === tag ? null : tag);
                        }}
                        title="Tag options"
                      >
                        <FaEllipsisH />
                      </span>
                      {menuTag === tag && (
                        <div style={{ position: 'absolute', top: 32, right: 0, background: '#253650', border: '1px solid #344563', borderRadius: 6, zIndex: 30, minWidth: 90 }}>
                          <div
                            style={{ padding: '6px 12px', cursor: 'pointer', color: '#b3b3c6' }}
                            onClick={() => {
                              setEditTag(tag);
                              setEditValue(tag);
                              setMenuTag(null);
                            }}
                          >Edit</div>
                          <div
                            style={{ padding: '6px 12px', cursor: 'pointer', color: '#ff4d4f' }}
                            onClick={() => {
                              // Remove tag from tags and all trades
                              setTags(tags.filter(t => t !== tag));
                              setSelected(selected.filter(t => t !== tag));
                              setMenuTag(null);
                              if (setRatings) {
                                setRatings(prev => {
                                  const updated = { ...prev };
                                  Object.keys(updated).forEach(key => {
                                    if (updated[key]?.setups?.includes(tag)) {
                                      updated[key].setups = updated[key].setups.filter(t => t !== tag);
                                    }
                                    if (updated[key]?.mistakes?.includes(tag)) {
                                      updated[key].mistakes = updated[key].mistakes.filter(t => t !== tag);
                                    }
                                  });
                                  return updated;
                                });
                              }
                            }}
                          >Delete</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', color: '#b3b3c6', fontSize: 16 }}>
                <span
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => {
                    setAdding(true);
                    setTimeout(() => {
                      document.getElementById(label + '-add-input')?.focus();
                    }, 0);
                  }}
                >+ Add new tag</span>
              </div>
              {adding && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#253650' }}>
                  <input
                    id={label + '-add-input'}
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        setTags([...tags, newTag.trim()]);
                        setSelected([...selected, newTag.trim()]);
                        setNewTag('');
                        setAdding(false);
                        setDropdownOpen(false);
                      } else if (e.key === 'Escape') {
                        setAdding(false);
                        setNewTag('');
                      }
                    }}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: 4, border: '1px solid #344563', background: '#253650', color: '#fff', fontSize: 16 }}
                    placeholder="New tag"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (newTag.trim()) {
                        setTags([...tags, newTag.trim()]);
                        setSelected([...selected, newTag.trim()]);
                        setNewTag('');
                        setAdding(false);
                        setDropdownOpen(false);
                      }
                    }}
                    style={{ marginLeft: 6, background: theme.colors.green, color: '#fff', border: 'none', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}
                    tabIndex={-1}
                  >
                    <FaCheck />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Show selected tags as chips */}
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selected.map(tag => (
            <span key={tag} style={{ background: '#253650', color: '#b3b3c6', borderRadius: 12, padding: '4px 12px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
              {tag}
              <span
                style={{ marginLeft: 4, cursor: 'pointer', color: '#888' }}
                onClick={() => setSelected(selected.filter(t => t !== tag))}
                title="Remove tag from trade"
              >
                ×
              </span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, background: theme.colors.black, minHeight: 400 }}>
      <button onClick={onBack} style={{ marginBottom: 24, background: theme.colors.green, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Back</button>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 340px', minWidth: 320, maxWidth: 400 }}>
          {/* Header (left-aligned, ticker and date side by side) */}
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: theme.colors.white }}>{trade.symbol}</span>
              <span style={{ fontSize: 18, color: '#b3b3c6', marginTop: 4 }}>{tradeDate}</span>
            </div>
            <div style={{ fontSize: 16, color: '#b3b3c6', marginTop: 2 }}>{optionTaken}</div>
          </div>
          {/* Left container */}
          <div style={{ background: '#1A2B44', borderRadius: 16, padding: '32px 24px 24px 24px', boxShadow: '0 4px 32px 0 #000a', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 600, overflowY: 'auto' }}>
            {/* Net P&L */}
            <div style={{ color: trade.netPL >= 0 ? theme.colors.green : theme.colors.red, fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
              Net P&L<br />
              <span style={{ fontSize: 36 }}>{trade.netPL >= 0 ? '$' : '-$'}{Math.abs(trade.netPL).toFixed(2)}</span>
            </div>
            {/* Side */}
            {(() => {
              const side = (trade.open.Type || '').toUpperCase() === 'PUT' ? 'SHORT' : 'LONG';
              const sideColor = side === 'LONG' ? theme.colors.green : theme.colors.red;
              return (
                <div style={{ color: '#b3b3c6', fontSize: 16 }}>
                  Side <span style={{ color: sideColor, marginLeft: 8 }}>{side}</span>
                </div>
              );
            })()}
            {/* Options traded */}
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Options traded <span style={{ color: '#fff', marginLeft: 8 }}>{trade.open.Quantity}</span></div>
            {/* Net ROI */}
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Net ROI <span style={{ color: trade.netROI >= 0 ? theme.colors.green : theme.colors.red, marginLeft: 8 }}>({trade.netROI >= 0 ? '' : '-'}{Math.abs(trade.netROI).toFixed(2)}%)</span></div>
            {/* Gross P&L */}
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Gross P&L <span style={{ color: trade.netPL >= 0 ? theme.colors.green : theme.colors.red, marginLeft: 8 }}>{trade.netPL >= 0 ? '$' : '-$'}{Math.abs(grossPL).toFixed(2)}</span></div>
            {/* Adjusted Cost */}
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Adjusted Cost <span style={{ color: '#fff', marginLeft: 8 }}>${adjustedCost}</span></div>
            {/* Trade Rating */}
            <div style={{ color: '#b3b3c6', fontSize: 16, display: 'flex', alignItems: 'center' }}>Trade Rating
              <span style={{ marginLeft: 8 }}>
                {renderStars()}
              </span>
            </div>
            {/* Entry Time */}
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Entry Time <span style={{ color: '#fff', marginLeft: 8 }}>{trade.open.ExecTime ? new Date(trade.open.ExecTime).toLocaleTimeString('en-US', { hour12: false }) : '--'}</span></div>
            {/* Exit Time */}
            <div style={{ color: '#b3b3c6', fontSize: 16 }}>Exit Time <span style={{ color: '#fff', marginLeft: 8 }}>{trade.close.ExecTime ? new Date(trade.close.ExecTime).toLocaleTimeString('en-US', { hour12: false }) : '--'}</span></div>
            {/* Setups Tag Selector */}
            <TagSelector label="Setups" iconColor="#7a7aff" tags={setupsTags} setTags={setSetupsTags} selected={selectedSetups} setSelected={setSelectedSetups} setRatings={setRatings} />
            {/* Mistakes Tag Selector */}
            <TagSelector label="Mistakes" iconColor="#FFD700" tags={mistakesTags} setTags={setMistakesTags} selected={selectedMistakes} setSelected={setSelectedMistakes} setRatings={setRatings} />
          </div>
        </div>
        {/* Right: TradingView chart placeholder */}
        <div style={{ flex: '2 1 600px', minWidth: 320, background: '#1A2B44', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <TradingViewChart
            symbol={trade.symbol}
            buyTime={trade.open.ExecTime}
            buyPrice={trade.entryPrice}
            sellTime={trade.close.ExecTime}
            sellPrice={trade.exitPrice}
          />
        </div>
      </div>
      {/* AI Trade Review Section */}
      <div style={{ marginTop: 24 }}>
        {aiLoading ? (
          <div style={{ background: '#1A2B44', border: '1px solid #2B3D55', borderRadius: 12, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              display: 'inline-block', width: 20, height: 20, border: '3px solid #667eea', borderTop: '3px solid transparent', borderRadius: '50%',
              animation: 'aiSpin 1s linear infinite',
            }} />
            <style>{`@keyframes aiSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <span style={{ color: '#d0d0e0', fontSize: 15 }}>Analyzing your trade...</span>
          </div>
        ) : aiError ? (
          <div style={{ background: 'rgba(255, 77, 79, 0.08)', border: '1px solid rgba(255, 77, 79, 0.3)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#ff6b6b', fontSize: 14 }}>{aiError}</span>
            <button
              onClick={handleAIReview}
              style={{ background: '#667eea', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >Retry</button>
          </div>
        ) : aiReview ? (
          <div style={{ background: '#1A2B44', border: '1px solid #2B3D55', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ color: '#b388ff', fontWeight: 700, fontSize: 16 }}>AI Trade Review</span>
              <button
                onClick={() => setAiReview(null)}
                style={{ background: 'none', border: '1px solid #2B3D55', color: '#b3b3c6', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}
              >Dismiss</button>
            </div>
            <div style={{ color: '#d0d0e0', fontSize: 14, lineHeight: 1.7 }}>
              {aiReview.split('\n').map((line, i) => {
                const boldMatch = line.trim().match(/^\*\*(.+?)\*\*$/);
                if (boldMatch) {
                  return <div key={i} style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginTop: i > 0 ? 14 : 0, marginBottom: 4, paddingLeft: 10, borderLeft: '3px solid #b388ff' }}>{boldMatch[1]}</div>;
                }
                if (/^[-•]\s/.test(line.trim())) {
                  const text = line.trim().replace(/^[-•]\s/, '');
                  const parts = text.split(/\*\*(.+?)\*\*/g);
                  return <div key={i} style={{ paddingLeft: 14, position: 'relative', marginBottom: 2 }}><span style={{ position: 'absolute', left: 2 }}>{'\u2022'}</span>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#fff' }}>{p}</strong> : <span key={j}>{p}</span>)}</div>;
                }
                if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
                const parts = line.split(/\*\*(.+?)\*\*/g);
                return <div key={i} style={{ marginBottom: 2 }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#fff' }}>{p}</strong> : <span key={j}>{p}</span>)}</div>;
              })}
            </div>
          </div>
        ) : isPro ? (
          <button
            onClick={handleAIReview}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px',
              fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 2px 12px rgba(102, 126, 234, 0.3)',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ fontSize: 18 }}>{'\u2728'}</span>
            AI Trade Review
          </button>
        ) : (
          <button
            disabled
            style={{
              background: '#2B3D55',
              color: '#888',
              border: 'none',
              borderRadius: 10,
              padding: '12px 28px',
              cursor: 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: 16 }}>{'\uD83D\uDD12'}</span>
            Upgrade for AI Trade Review
          </button>
        )}
      </div>
    </div>
  );
}

const AllTradesScreen = ({ tradeData }) => {
  const location = useLocation();
  const [selectedTrade, setSelectedTrade] = useState(null);
  
  // Check for selected trade from navigation state
  useEffect(() => {
    if (location.state?.selectedTrade) {
      // The trade is already transformed with correct P&L calculations
      setSelectedTrade(location.state.selectedTrade);

      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Flatten all trades
  const allTrades = useMemo(() => {
    if (!tradeData || !tradeData.length) return [];
    
    // First, collect all transactions across all trades
    const allTransactions = tradeData.flatMap(trade => 
      trade.Transactions.map(tx => ({
        ...tx,
        groupKey: `${trade.Symbol}-${trade.Strike}-${trade.Expiration}`
      }))
    );

    // Sort all transactions by date
    const sortedTransactions = allTransactions.sort((a, b) => 
      new Date(a.ExecTime) - new Date(b.ExecTime)
    );

    // Group transactions by their unique trade identifier
    const tradeGroups = new Map();
    sortedTransactions.forEach(tx => {
      if (!tradeGroups.has(tx.groupKey)) {
        tradeGroups.set(tx.groupKey, []);
      }
      tradeGroups.get(tx.groupKey).push(tx);
    });

    // Process each group to find OPEN/CLOSE pairs
    const processedTrades = [];
    tradeGroups.forEach((transactions, groupKey) => {
      let openTx = null;
      let totalBuyQuantity = 0;
      let totalBuyCost = 0;
      let totalSellQuantity = 0;
      let totalSellProceeds = 0;
      const CONTRACT_MULTIPLIER = 100;

      transactions.forEach(tx => {
        if (tx.PosEffect === 'OPEN' && tx.Side === 'BUY') {
          openTx = tx;
          totalBuyQuantity += tx.Quantity;
          totalBuyCost += tx.Quantity * tx.Price * CONTRACT_MULTIPLIER;
        } else if (tx.PosEffect === 'CLOSE' && tx.Side === 'SELL' && openTx) {
          totalSellQuantity += Math.abs(tx.Quantity);
          totalSellProceeds += Math.abs(tx.Quantity) * tx.Price * CONTRACT_MULTIPLIER;

          if (totalSellQuantity >= totalBuyQuantity) {
            const profitLoss = totalSellProceeds - totalBuyCost;
            const netROI = totalBuyCost > 0 ? (profitLoss / totalBuyCost) * 100 : 0;
            
            processedTrades.push({
              openDate: openTx.TradeDate,
              closeDate: tx.TradeDate,
              symbol: openTx.Symbol,
              entryPrice: openTx.Price,
              exitPrice: tx.Price,
              netPL: profitLoss,
              netROI,
              status: getStatusAndColors(profitLoss).status,
              statusColor: getStatusAndColors(profitLoss).color,
              open: openTx,
              close: tx,
            });

            // Reset for next trade
            openTx = null;
            totalBuyQuantity = 0;
            totalBuyCost = 0;
            totalSellQuantity = 0;
            totalSellProceeds = 0;
          }
        }
      });
    });

    // Sort trades by close date (most recent first)
    return processedTrades.sort((a, b) => 
      new Date(b.closeDate) - new Date(a.closeDate)
    );
  }, [tradeData]);

  // Pagination
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(allTrades.length / ROWS_PER_PAGE);
  const paginatedTrades = allTrades.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const { currentUser, isPro } = useAuth();
  // Ratings state: key = tradeKey, value = rating
  const [ratings, setRatings] = useState({});
  // Track if ratings are loaded from Firestore
  const [ratingsLoaded, setRatingsLoaded] = useState(false);

  // Fetch ratings from Firestore on mount (if logged in)
  useEffect(() => {
    const fetchRatings = async () => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.tradeRatings) {
            setRatings(data.tradeRatings);
          }
        }
      } else {
        // Optionally, load from localStorage for guests
        const local = localStorage.getItem('tradeRatings');
        if (local) setRatings(JSON.parse(local));
      }
      setRatingsLoaded(true);
    };
    fetchRatings();
  }, [currentUser]);

  // Save ratings to Firestore (or localStorage) when changed
  useEffect(() => {
    if (!ratingsLoaded) return;
    if (currentUser) {
      const save = async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { tradeRatings: ratings });
      };
      save();
    } else {
      localStorage.setItem('tradeRatings', JSON.stringify(ratings));
    }
  }, [ratings, currentUser, ratingsLoaded]);

  // Tag lists (per user)
  const [setupsTags, setSetupsTags] = useState([]);
  const [mistakesTags, setMistakesTags] = useState([]);
  // Track if tag lists are loaded
  const [tagsLoaded, setTagsLoaded] = useState(false);

  // Fetch tag lists from Firestore on mount (if logged in)
  useEffect(() => {
    const fetchTags = async () => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.setupsTags) setSetupsTags(data.setupsTags);
          if (data.mistakesTags) setMistakesTags(data.mistakesTags);
        }
      } else {
        const setups = localStorage.getItem('setupsTags');
        const mistakes = localStorage.getItem('mistakesTags');
        if (setups) setSetupsTags(JSON.parse(setups));
        if (mistakes) setMistakesTags(JSON.parse(mistakes));
      }
      setTagsLoaded(true);
    };
    fetchTags();
  }, [currentUser]);

  // Save tag lists to Firestore/localStorage
  useEffect(() => {
    if (!tagsLoaded) return;
    if (currentUser) {
      const save = async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { setupsTags, mistakesTags });
      };
      save();
    } else {
      localStorage.setItem('setupsTags', JSON.stringify(setupsTags));
      localStorage.setItem('mistakesTags', JSON.stringify(mistakesTags));
    }
  }, [setupsTags, mistakesTags, currentUser, tagsLoaded]);

  // Handler to set rating or tags for a trade
  const handleSetTradeMeta = (trade, meta) => {
    const key = getTradeKey(trade);
    setRatings(prev => ({ ...prev, [key]: { ...prev[key], ...meta } }));
  };

  if (selectedTrade) {
    const tradeKey = getTradeKey(selectedTrade);
    const tradeMeta = ratings[tradeKey] || {};
    return (
      <TradeDetailView
        trade={selectedTrade}
        onBack={() => setSelectedTrade(null)}
        rating={tradeMeta.rating}
        setRating={value => handleSetTradeMeta(selectedTrade, { rating: value })}
        setupsTags={setupsTags}
        mistakesTags={mistakesTags}
        setSetupsTags={setSetupsTags}
        setMistakesTags={setMistakesTags}
        selectedSetups={tradeMeta.setups || []}
        selectedMistakes={tradeMeta.mistakes || []}
        setSelectedSetups={tags => handleSetTradeMeta(selectedTrade, { setups: tags })}
        setSelectedMistakes={tags => handleSetTradeMeta(selectedTrade, { mistakes: tags })}
        setRatings={setRatings}
        isPro={isPro}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
      <div style={{ background: '#1A2B44', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px #000a' }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: theme.colors.white, minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#253650' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6' }}>Open date</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6' }}>Symbol</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6' }}>Status</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6' }}>Close date</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6' }}>Entry price</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6' }}>Exit price</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6' }}>Net P&L</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6' }}>Net ROI</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3b3c6' }}>Setups</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.length === 0 ? (
                <tr><td colSpan={9} style={{ color: '#888', textAlign: 'center', padding: 32 }}>No trades found.</td></tr>
              ) : paginatedTrades.map((trade, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: '1px solid #23242a', cursor: 'pointer', transition: 'box-shadow 0.2s, border 0.2s' }}
                  onClick={() => setSelectedTrade(trade)}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 0 0 2px ' + theme.colors.green + ', 0 2px 8px #000a';
                    e.currentTarget.style.border = '2px solid ' + theme.colors.green;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.border = 'none';
                    e.currentTarget.style.borderBottom = '1px solid #23242a';
                  }}
                >
                  <td style={{ padding: '10px 8px' }}>{trade.openDate}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>{trade.symbol}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ background: trade.statusColor, color: '#fff', borderRadius: 6, padding: '2px 12px', fontWeight: 600 }}>
                      {trade.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>{trade.closeDate}</td>
                  <td style={{ padding: '10px 8px' }}>${trade.entryPrice?.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px' }}>${trade.exitPrice?.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', color: trade.netPL >= 0 ? theme.colors.green : theme.colors.red, fontWeight: 600 }}>
                    {trade.netPL >= 0 ? '$' : '-$'}{Math.abs(trade.netPL).toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 8px', color: trade.netROI >= 0 ? theme.colors.green : theme.colors.red, fontWeight: 600 }}>
                    {trade.netROI >= 0 ? '' : '-'}{Math.abs(trade.netROI).toFixed(2)}%
                  </td>
                  <td style={{ padding: '10px 8px', color: '#b3b3c6' }}>--</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1A2B44', padding: '12px 20px', borderTop: '1px solid #23242a', color: '#b3b3c6' }}>
          <div>
            Trades per page: <span style={{ color: '#fff', fontWeight: 600 }}>{ROWS_PER_PAGE}</span>
          </div>
          <div>
            {allTrades.length === 0 ? '0' : ((page - 1) * ROWS_PER_PAGE + 1)} - {Math.min(page * ROWS_PER_PAGE, allTrades.length)} of {allTrades.length} trades
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: 'none', border: 'none', color: '#b3b3c6', fontSize: 20, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>{'<'}</button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: 'none', border: 'none', color: '#b3b3c6', fontSize: 20, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>{'>'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllTradesScreen; 