const SHARE_TYPES = new Set(['EQUITY', 'STOCK', 'SHARE', 'SHARES', 'COMMON_STOCK', 'COMMON STOCK']);
const OPTION_TYPES = new Set(['CALL', 'PUT', 'OPTION']);

export const isShareTrade = (trade = {}) => {
  const type = String(trade.Type || trade.type || trade.assetType || '').trim().toUpperCase();
  if (SHARE_TYPES.has(type)) return true;
  if (OPTION_TYPES.has(type)) return false;

  const expiration = String(trade.Expiration || trade.expiration || '').trim().toUpperCase();
  const strike = Number(trade.Strike ?? trade.strike ?? 0);
  return (!expiration || expiration === 'N/A') && (!Number.isFinite(strike) || strike === 0);
};

export const getInstrumentMultiplier = (trade) => (isShareTrade(trade) ? 1 : 100);

export const getInstrumentLabel = (trade = {}) => {
  if (isShareTrade(trade)) return 'Shares';
  return `${trade.Expiration || ''} ${trade.Strike || ''} ${trade.Type || ''}`.trim();
};
