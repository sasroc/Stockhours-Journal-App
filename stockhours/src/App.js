// StockHours-Journal-App/stockhours/src/App.js

import React, { useState, useEffect, useRef } from 'react';
import StatsDashboard from './components/StatsDashboard';
import ReportsScreen from './components/ReportsScreen';
import TradesScreen from './components/TradesScreen';
import DateRangePicker from './components/DateRangePicker';
import { theme } from './theme';
import logo from './assets/clocklogo.PNG'; // Clock logo
import blackSHlogo from './assets/blackSHlogo.PNG'; // Stock Hours logo
import * as XLSX from 'xlsx';
import './App.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [tradeData, setTradeData] = useState([]);
  const [filteredTradeData, setFilteredTradeData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHalfScreen, setIsHalfScreen] = useState(window.innerWidth <= 960);
  const [currentScreen, setCurrentScreen] = useState('Dashboard');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

  const dashboardButtonRef = useRef(null);
  const dashboardTooltipRef = useRef(null);
  const reportsButtonRef = useRef(null);
  const reportsTooltipRef = useRef(null);
  const tradesButtonRef = useRef(null);
  const tradesTooltipRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const halfScreen = window.innerWidth <= 960;
      setIsHalfScreen(halfScreen);
      if (!halfScreen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!tradeData.length) {
      setFilteredTradeData([]);
      return;
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      setFilteredTradeData(tradeData);
      return;
    }

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);

    const filtered = tradeData
      .map((trade) => {
        const filteredTransactions = trade.Transactions.filter((transaction) => {
          const execTime = new Date(transaction.ExecTime);
          return execTime >= startDate && execTime <= endDate;
        });
        return { ...trade, Transactions: filteredTransactions };
      })
      .filter((trade) => trade.Transactions.length > 0);

    setFilteredTradeData(filtered);
  }, [tradeData, dateRange]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        let data;
        if (file.name.endsWith('.csv')) {
          const text = event.target.result;
          const workbook = XLSX.read(text, { type: 'string' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        } else {
          const binaryStr = event.target.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        }

        const tradeHistoryStart = data.findIndex(row => row[0] === 'Account Trade History');
        if (tradeHistoryStart === -1) {
          throw new Error('Account Trade History section not found in the CSV');
        }

        const sectionHeaders = data[tradeHistoryStart + 1].slice(1);

        const tradeData = data
          .slice(tradeHistoryStart + 2)
          .filter(row => row.length >= sectionHeaders.length && (typeof row[1] === 'string' || typeof row[1] === 'number'))
          .map(row => {
            const rowData = row.slice(1);
            const obj = {};
            sectionHeaders.forEach((header, index) => {
              obj[header] = rowData[index];
            });
            return obj;
          });

        const transformedData = tradeData.map(row => {
          const posEffect = row['Pos Effect'] || 'UNKNOWN';
          const symbol = row['Symbol'] || 'UNKNOWN';

          let execTime = row['Exec Time'] || 'N/A';
          let tradeDate = 'N/A';
          if (!isNaN(execTime)) {
            const serialDate = parseFloat(execTime);
            const date = XLSX.SSF.parse_date_code(serialDate);
            tradeDate = `${date.m}/${date.d}/${date.y}`;
            const hours = Math.floor((serialDate % 1) * 24);
            const minutes = Math.floor(((serialDate % 1) * 24 - hours) * 60);
            const seconds = Math.floor((((serialDate % 1) * 24 - hours) * 60 - minutes) * 60);
            execTime = new Date(date.y, date.m - 1, date.d, hours, minutes, seconds).toISOString();
          }

          let expiration = row['Exp'] || 'N/A';
          if (!isNaN(expiration)) {
            const date = XLSX.SSF.parse_date_code(parseFloat(expiration));
            expiration = `${date.d} ${date.m} ${date.y}`;
          }

          let qty = row['Qty'];
          if (typeof qty === 'string') {
            qty = parseInt(qty.replace('+', '')) || 0;
          } else {
            qty = parseInt(qty) || 0;
          }

          return {
            ExecTime: execTime,
            TradeDate: tradeDate,
            Side: row['Side'] || 'N/A',
            Quantity: qty,
            Symbol: symbol,
            Expiration: expiration,
            Strike: parseFloat(row['Strike']) || 0,
            Price: parseFloat(row['Price']) || 0,
            OrderType: row['Order Type'] || 'N/A',
            PosEffect: posEffect.includes('OPEN') ? 'OPEN' : posEffect.includes('CLOSE') ? 'CLOSE' : 'UNKNOWN',
          };
        });

        const groupedByTrade = transformedData.reduce((acc, trade) => {
          const key = `${trade.Symbol}-${trade.Strike}-${trade.Expiration}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(trade);
          return acc;
        }, {});

        const groupedTrades = Object.keys(groupedByTrade).map(key => ({
          Symbol: groupedByTrade[key][0].Symbol,
          Strike: groupedByTrade[key][0].Strike,
          Expiration: groupedByTrade[key][0].Expiration,
          Transactions: groupedByTrade[key],
        }));

        setTradeData(groupedTrades);
      } catch (error) {
        alert('Error parsing file. Please ensure it is a valid Excel or CSV file.');
        console.error('File parsing error:', error);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleDateChange = (startDate, endDate) => {
    setDateRange({ startDate, endDate });
  };

  const handleDashboardClick = () => {
    setCurrentScreen('Dashboard');
  };

  const handleReportsClick = () => {
    setCurrentScreen('Reports');
  };

  const handleTradesClick = () => {
    setCurrentScreen('Trades');
  };

  return (
    <div className="App" style={{ backgroundColor: '#000', minHeight: '100vh', color: theme.colors.white }}>
      {/* Header with logo, hamburger menu (if half screen), screen title, and date picker */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          padding: '10px 20px',
          borderBottom: '1px solid #333',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          boxSizing: 'border-box',
          zIndex: 1000,
        }}
      >
        {/* Left Section: Hamburger, Logo, and Title */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isHalfScreen && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.white,
                cursor: 'pointer',
                marginRight: '10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '30px',
                height: '30px',
              }}
            >
              <div style={{ width: '20px', height: '3px', backgroundColor: theme.colors.white, margin: '2px 0' }} />
              <div style={{ width: '20px', height: '3px', backgroundColor: theme.colors.white, margin: '2px 0' }} />
              <div style={{ width: '20px', height: '3px', backgroundColor: theme.colors.white, margin: '2px 0' }} />
            </button>
          )}
          <img
            src={blackSHlogo}
            alt="Stock Hours Trading Logo"
            style={{ height: '50px', marginRight: '15px' }}
          />
          <h2 style={{ margin: 0, fontSize: '24px', color: theme.colors.white }}>
            {currentScreen}
          </h2>
        </div>

        {/* Right Section: Date Range Picker */}
        <div style={{ marginLeft: 'auto' }}>
          <DateRangePicker onDateChange={handleDateChange} />
        </div>
      </header>

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: '71px',
          left: 0,
          width: '50px',
          height: 'calc(100% - 71px)',
          backgroundColor: '#1a1a1a',
          display: (isHalfScreen && !isSidebarOpen) ? 'none' : 'block',
          padding: '20px 0',
          boxSizing: 'border-box',
          zIndex: 900,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <label
            htmlFor="sidebar-file-upload"
            onMouseEnter={(e) => { e.target.querySelector('.tooltip').style.visibility = 'visible'; }}
            onMouseLeave={(e) => { e.target.querySelector('.tooltip').style.visibility = 'hidden'; }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: theme.colors.green,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '24px',
              color: theme.colors.white,
              marginBottom: '20px',
              position: 'relative',
            }}
          >
            +
            <span
              className="tooltip"
              style={{
                visibility: 'hidden',
                position: 'absolute',
                left: '50px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#333',
                color: theme.colors.white,
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                zIndex: 1001,
              }}
            >
              Add Trade(s)
            </span>
          </label>
          <input
            id="sidebar-file-upload"
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={dashboardButtonRef}
            onClick={handleDashboardClick}
            onMouseEnter={(e) => { dashboardTooltipRef.current.style.visibility = 'visible'; }}
            onMouseLeave={(e) => { dashboardTooltipRef.current.style.visibility = 'hidden'; }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: theme.colors.green,
              borderRadius: '50%',
              cursor: 'pointer',
              marginBottom: '20px',
              position: 'relative',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute' }}
            >
              <rect x="4" y="4" width="6" height="6" />
              <rect x="4" y="12" width="6" height="6" />
              <rect x="12" y="4" width="6" height="6" />
              <rect x="12" y="12" width="6" height="6" />
            </svg>
            <span
              ref={dashboardTooltipRef}
              className="tooltip"
              style={{
                visibility: 'hidden',
                position: 'absolute',
                left: '50px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#333',
                color: theme.colors.white,
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                zIndex: 1001,
              }}
            >
              Dashboard
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={reportsButtonRef}
            onClick={handleReportsClick}
            onMouseEnter={(e) => { reportsTooltipRef.current.style.visibility = 'visible'; }}
            onMouseLeave={(e) => { reportsTooltipRef.current.style.visibility = 'hidden'; }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: theme.colors.green,
              borderRadius: '50%',
              cursor: 'pointer',
              marginBottom: '20px',
              position: 'relative',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute' }}
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
              <line x1="10" y1="8" x2="10" y2="16" />
              <line x1="14" y1="8" x2="14" y2="16" />
            </svg>
            <span
              ref={reportsTooltipRef}
              className="tooltip"
              style={{
                visibility: 'hidden',
                position: 'absolute',
                left: '50px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#333',
                color: theme.colors.white,
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                zIndex: 1001,
              }}
            >
              Reports
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={tradesButtonRef}
            onClick={handleTradesClick}
            onMouseEnter={(e) => { tradesTooltipRef.current.style.visibility = 'visible'; }}
            onMouseLeave={(e) => { tradesTooltipRef.current.style.visibility = 'hidden'; }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: theme.colors.green,
              borderRadius: '50%',
              cursor: 'pointer',
              marginBottom: '20px',
              position: 'relative',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute' }}
            >
              <line x1="8" y1="4" x2="8" y2="8" />
              <rect x="6" y="8" width="4" height="8" />
              <line x1="8" y1="16" x2="8" y2="20" />
              <line x1="16" y1="6" x2="16" y2="9" />
              <rect x="14" y="9" width="4" height="6" />
              <line x1="16" y1="15" x2="16" y2="18" />
            </svg>
            <span
              ref={tradesTooltipRef}
              className="tooltip"
              style={{
                visibility: 'hidden',
                position: 'absolute',
                left: '50px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#333',
                color: theme.colors.white,
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                zIndex: 1001,
              }}
            >
              Trades
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
          marginLeft: (isHalfScreen && !isSidebarOpen) ? '0' : '50px',
          marginTop: '71px',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {currentScreen === 'Dashboard' ? (
          <>
            <img src={logo} alt="Clock Logo" style={{ width: '200px', marginBottom: '20px' }} />
            <h1 style={{ color: theme.colors.white, marginBottom: '20px' }}>Stockhours Journal</h1>
            <div
              style={{
                width: '90%',
                maxWidth: '1200px',
                backgroundColor: '#0d0d0d',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <StatsDashboard tradeData={filteredTradeData} />
            </div>
          </>
        ) : currentScreen === 'Reports' ? (
          <>
            <img src={logo} alt="Clock Logo" style={{ width: '200px', marginBottom: '20px' }} />
            <div
              style={{
                width: '90%',
                maxWidth: '1200px',
                backgroundColor: '#0d0d0d',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <ReportsScreen tradeData={filteredTradeData} />
            </div>
          </>
        ) : (
          <>
            <img src={logo} alt="Clock Logo" style={{ width: '200px', marginBottom: '20px' }} />
            <div
              style={{
                width: '90%',
                maxWidth: '1200px',
                backgroundColor: '#0d0d0d',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <TradesScreen tradeData={filteredTradeData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;