import React, { useMemo, useState } from 'react';
import { theme } from '../theme';

const ROWS_PER_PAGE = 50;

function getStatusAndColors(pnl) {
  if (pnl > 0) return { status: 'WIN', color: theme.colors.green };
  if (pnl < 0) return { status: 'LOSS', color: theme.colors.red };
  return { status: 'NEUTRAL', color: '#888' };
}

const AllTradesScreen = ({ tradeData }) => {
  // Flatten all trades
  const allTrades = useMemo(() => {
    if (!tradeData || !tradeData.length) return [];
    // Each tradeData item has Transactions array
    return tradeData.flatMap(trade => {
      // Group by closing event (CLOSE/SELL)
      // We'll use similar logic as in StatsDashboard
      const sorted = [...trade.Transactions].sort((a, b) => new Date(a.ExecTime) - new Date(b.ExecTime));
      const positions = [];
      let openTx = null;
      sorted.forEach(tx => {
        if (tx.PosEffect === 'OPEN' && tx.Side === 'BUY') {
          openTx = tx;
        } else if (tx.PosEffect === 'CLOSE' && tx.Side === 'SELL' && openTx) {
          positions.push({ open: openTx, close: tx });
          openTx = null;
        }
      });
      return positions.map(pos => {
        const entryPrice = pos.open.Price;
        const exitPrice = pos.close.Price;
        const quantity = pos.open.Quantity;
        const contractMultiplier = 100;
        const netPL = (exitPrice - entryPrice) * quantity * contractMultiplier * (pos.open.Side === 'BUY' ? 1 : -1);
        const netROI = entryPrice > 0 ? ((exitPrice - entryPrice) / entryPrice) * 100 * (pos.open.Side === 'BUY' ? 1 : -1) : 0;
        return {
          openDate: pos.open.TradeDate,
          closeDate: pos.close.TradeDate,
          symbol: pos.open.Symbol,
          entryPrice,
          exitPrice,
          netPL,
          netROI,
          status: getStatusAndColors(netPL).status,
          statusColor: getStatusAndColors(netPL).color,
        };
      });
    });
  }, [tradeData]);

  // Pagination
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(allTrades.length / ROWS_PER_PAGE);
  const paginatedTrades = allTrades.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <div style={{ padding: '20px', backgroundColor: theme.colors.black }}>
      <div style={{ background: '#18191c', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px #000a' }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: theme.colors.white, minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#23242a' }}>
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
                <tr key={idx} style={{ borderBottom: '1px solid #23242a' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#18191c', padding: '12px 20px', borderTop: '1px solid #23242a', color: '#b3b3c6' }}>
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