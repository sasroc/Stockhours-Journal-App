import React, { useEffect, useRef } from 'react';

// Props: symbol, buyTime (ISO), buyPrice, sellTime (ISO), sellPrice
const TradingViewChart = ({ symbol, buyTime, buyPrice, sellTime, sellPrice }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    // Remove previous widget if any
    if (container) {
      container.innerHTML = '';
    }
    // TradingView widget embed
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol ? symbol.toUpperCase() : 'AAPL',
          interval: '1',
          timezone: 'America/New_York',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#18191c',
          container_id: `tv_chart_${symbol}`,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          withdateranges: true,
          studies: [],
          overrides: {
            'paneProperties.background': '#18191c',
            'paneProperties.vertGridProperties.color': '#23242a',
            'paneProperties.horzGridProperties.color': '#23242a',
          },
          // Add marks for buy/sell after chart is ready
          studies_overrides: {},
          custom_css_url: '',
          // This callback is only available in the library, not the embed. For the embed, we use a workaround below.
        });
      }
    };
    if (container) container.appendChild(script);

    // Workaround: add arrows after widget loads
    const tryAddArrows = () => {
      // TradingView embed does not support direct API for shapes, but we can use the "marks" feature if available in the widget config.
      // For a more advanced integration, the TradingView Charting Library is required (not available for free/public use).
      // Here, we just display the chart; arrows are a visual placeholder for now.
    };
    setTimeout(tryAddArrows, 5000); // Try after 5s

    // Cleanup
    return () => {
      if (container) container.innerHTML = '';
    };
  }, [symbol, buyTime, buyPrice, sellTime, sellPrice]);

  return (
    <div style={{ width: '100%', height: '400px', minHeight: 350 }}>
      <div ref={containerRef} id={`tv_chart_${symbol}`} style={{ width: '100%', height: '100%' }} />
      {/* If you want to show a legend for arrows, add here */}
    </div>
  );
};

export default TradingViewChart; 