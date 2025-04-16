import React, { useState, useEffect, useRef } from 'react';
import StatsDashboard from './components/StatsDashboard';
import ReportsScreen from './components/ReportsScreen';
import TradesScreen from './components/TradesScreen';
import DateRangePicker from './components/DateRangePicker';
import ImportsScreen from './components/ImportsScreen';
import { theme } from './theme';
import logo from './assets/clocklogo.PNG';
import blackSHlogo from './assets/blackSHlogo.PNG';
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
  const [uploadedFiles, setUploadedFiles] = useState([]);
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
  const importsButtonRef = useRef(null);
  const importsTooltipRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const generateTransactionKey = (transaction, index) => {
    const execTime = new Date(transaction.ExecTime);
    const normalizedExecTime = new Date(
      execTime.getFullYear(),
      execTime.getMonth(),
      execTime.getDate(),
      execTime.getHours(),
      execTime.getMinutes(),
      execTime.getSeconds()
    ).toISOString();
    return `${transaction.Symbol}-${transaction.Strike}-${transaction.Expiration}-${normalizedExecTime}-${transaction.Side}-${transaction.Quantity}-${transaction.Price}-${transaction.PosEffect}-${transaction.OrderType}-${index}`;
  };

  const generateGroupKey = (trade) => {
    return `${trade.Symbol}-${trade.Strike}-${trade.Expiration}`;
  };

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

        const tradeDataRaw = data
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

        const transformedData = tradeDataRaw.map(row => {
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
          } else {
            // Handle string date format like "4/8/25 10:30:51"
            const dateTimeParts = execTime.split(' ');
            const dateParts = dateTimeParts[0].split('/');
            const timeParts = dateTimeParts[1].split(':');
            const month = parseInt(dateParts[0], 10) - 1; // JS months are 0-based
            const day = parseInt(dateParts[1], 10);
            const year = 2000 + parseInt(dateParts[2], 10); // Assuming 20XX
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            const seconds = parseInt(timeParts[2], 10);
            execTime = new Date(year, month, day, hours, minutes, seconds).toISOString();
            tradeDate = `${month + 1}/${day}/${year}`;
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
            Type: row['Type'] || 'UNKNOWN', // Preserve CALL/PUT
          };
        });

        // Group transactions by Symbol, Strike, and Expiration
        const groupedByTrade = transformedData.reduce((acc, trade, index) => {
          const groupKey = generateGroupKey(trade);
          if (!acc[groupKey]) {
            acc[groupKey] = { Transactions: new Map(), fileRefs: new Set() };
          }
          const txKey = generateTransactionKey(trade, index);
          acc[groupKey].Transactions.set(txKey, trade);
          acc[groupKey].fileRefs.add(file.name);
          return acc;
        }, {});

        const newGroupedTrades = Object.entries(groupedByTrade).map(([key, value]) => ({
          Symbol: value.Transactions.values().next().value.Symbol,
          Strike: value.Transactions.values().next().value.Strike,
          Expiration: value.Transactions.values().next().value.Expiration,
          Transactions: Array.from(value.Transactions.values()),
          fileRefs: value.fileRefs
        }));

        // Deduplicate and update state
        setUploadedFiles(prev => {
          const newFiles = [...prev, { name: file.name, trades: [] }];
          const tradeMap = new Map();

          // Process existing trades
          prev.forEach(file => {
            file.trades.forEach(tradeEntry => {
              const groupKey = generateGroupKey(tradeEntry.trade);
              if (!tradeMap.has(groupKey)) {
                tradeMap.set(groupKey, {
                  trade: {
                    Symbol: tradeEntry.trade.Symbol,
                    Strike: tradeEntry.trade.Strike,
                    Expiration: tradeEntry.trade.Expiration,
                    Transactions: new Map()
                  },
                  fileRefs: new Set()
                });
              }
              tradeEntry.trade.Transactions.forEach((tx, idx) => {
                const txKey = generateTransactionKey(tx, idx);
                tradeMap.get(groupKey).trade.Transactions.set(txKey, tx);
              });
              tradeEntry.fileRefs.forEach(ref => tradeMap.get(groupKey).fileRefs.add(ref));
            });
          });

          // Process new trades
          newGroupedTrades.forEach(newTrade => {
            const groupKey = generateGroupKey(newTrade);
            if (!tradeMap.has(groupKey)) {
              tradeMap.set(groupKey, {
                trade: {
                  Symbol: newTrade.Symbol,
                  Strike: newTrade.Strike,
                  Expiration: newTrade.Expiration,
                  Transactions: new Map()
                },
                fileRefs: new Set()
              });
            }
            const existingTrade = tradeMap.get(groupKey);
            newTrade.Transactions.forEach((newTx, idx) => {
              const txKey = generateTransactionKey(newTx, idx);
              existingTrade.trade.Transactions.set(txKey, newTx);
            });
            newTrade.fileRefs.forEach(ref => existingTrade.fileRefs.add(ref));
          });

          // Convert transaction Maps back to arrays
          const updatedFiles = newFiles.map(f => ({
            name: f.name,
            trades: Array.from(tradeMap.values())
              .filter(entry => entry.fileRefs.has(f.name))
              .map(entry => ({
                trade: {
                  ...entry.trade,
                  Transactions: Array.from(entry.trade.Transactions.values())
                },
                fileRefs: Array.from(entry.fileRefs)
              }))
          }));

          setTradeData(Array.from(tradeMap.values()).map(entry => ({
            ...entry.trade,
            Transactions: Array.from(entry.trade.Transactions.values())
          })));
          return updatedFiles;
        });

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        alert('Error parsing file. Please ensure it is a valid Excel or CSV file.');
        console.error('File parsing error:', error);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleDeleteFile = (fileName) => {
    setUploadedFiles(prev => {
      const fileToDelete = prev.find(file => file.name === fileName);
      if (!fileToDelete) return prev;

      const remainingFiles = prev.filter(file => file.name !== fileName);
      const tradeMap = new Map();

      remainingFiles.forEach(file => {
        file.trades.forEach(tradeEntry => {
          const groupKey = generateGroupKey(tradeEntry.trade);
          if (!tradeMap.has(groupKey)) {
            tradeMap.set(groupKey, {
              trade: {
                Symbol: tradeEntry.trade.Symbol,
                Strike: tradeEntry.trade.Strike,
                Expiration: tradeEntry.trade.Expiration,
                Transactions: new Map()
              },
              fileRefs: new Set()
            });
          }
          tradeEntry.trade.Transactions.forEach((tx, idx) => {
            const txKey = generateTransactionKey(tx, idx);
            tradeMap.get(groupKey).trade.Transactions.set(txKey, tx);
          });
          tradeEntry.fileRefs.forEach(ref => tradeMap.get(groupKey).fileRefs.add(ref));
        });
      });

      const updatedFiles = remainingFiles.map(file => ({
        name: file.name,
        trades: Array.from(tradeMap.values())
          .filter(entry => entry.fileRefs.has(file.name))
          .map(entry => ({
            trade: {
              ...entry.trade,
              Transactions: Array.from(entry.trade.Transactions.values())
            },
            fileRefs: Array.from(entry.fileRefs)
          }))
      }));

      setTradeData(Array.from(tradeMap.values()).map(entry => ({
        ...entry.trade,
        Transactions: Array.from(entry.trade.Transactions.values())
      })));

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return updatedFiles;
    });
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

  const handleImportsClick = () => {
    setCurrentScreen('Imports');
  };

  return (
    <div className="App" style={{ backgroundColor: '#000', minHeight: '100vh', color: theme.colors.white }}>
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
        <div style={{ marginLeft: 'auto' }}>
          <DateRangePicker onDateChange={handleDateChange} />
        </div>
      </header>

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
            ref={fileInputRef}
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

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={importsButtonRef}
            onClick={handleImportsClick}
            onMouseEnter={(e) => { importsTooltipRef.current.style.visibility = 'visible'; }}
            onMouseLeave={(e) => { importsTooltipRef.current.style.visibility = 'hidden'; }}
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
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M15 2H9v4" />
              <path d="M12 12l2 2-6 6H6v-2l6-6z" />
            </svg>
            <span
              ref={importsTooltipRef}
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
              Imports
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
          marginLeft: (isHalfScreen && !isSidebarOpen) ? '0' : '70px',
          marginRight: '70px',
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
                width: '100%',
                maxWidth: '1600px',
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
                width: '100%',
                maxWidth: '1600px',
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
        ) : currentScreen === 'Trades' ? (
          <>
            <img src={logo} alt="Clock Logo" style={{ width: '200px', marginBottom: '20px' }} />
            <div
              style={{
                width: '100%',
                maxWidth: '1400px',
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
        ) : currentScreen === 'Imports' ? (
          <>
            <img src={logo} alt="Clock Logo" style={{ width: '200px', marginBottom: '20px' }} />
            <div
              style={{
                width: '100%',
                maxWidth: '1400px',
                backgroundColor: '#0d0d0d',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <ImportsScreen uploadedFiles={uploadedFiles} onDeleteFile={handleDeleteFile} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default App;