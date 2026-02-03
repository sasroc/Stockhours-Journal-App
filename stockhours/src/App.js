import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import InvitationManager from './components/admin/InvitationManager';
import StatsDashboard from './components/StatsDashboard';
import ReportsScreen from './components/ReportsScreen';
import ImportsScreen from './components/ImportsScreen';
import DateRangePicker from './components/DateRangePicker';
import { theme } from './theme';
import primaryLogo from './assets/1.png';
import secondaryLogo from './assets/2.png';
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
import styled from 'styled-components';
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import DailyStatsScreen from './components/DailyStatsScreen';
import AllTradesScreen from './components/AllTradesScreen';
import ScrollToTopWrapper from './components/ScrollToTopWrapper';
import ProfileSettingsScreen from './components/ProfileSettingsScreen';
import MarketingLanding from './components/MarketingLanding';
import PaywallScreen from './components/PaywallScreen';
import PricingScreen from './components/PricingScreen';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Helper to get YTD date range
const getYTDRange = () => {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1); // January 1st of current year
  const endDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #000;
  color: ${theme.colors.white};
`;

const FullScreenLoader = ({ message = 'Loading...' }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    backgroundColor: '#000',
    color: '#fff'
  }}>
    {message}
  </div>
);

function AppRoutes() {
  const { currentUser, loading, isAdmin, logout, subscription } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tradeData, setTradeData] = useState([]);
  const [filteredTradeData, setFilteredTradeData] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHalfScreen, setIsHalfScreen] = useState(window.innerWidth <= 960);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Dashboard');
  const [dateRange, setDateRange] = useState(getYTDRange()); // Default to Year-to-Date
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const dashboardButtonRef = useRef(null);
  const dashboardTooltipRef = useRef(null);
  const reportsButtonRef = useRef(null);
  const reportsTooltipRef = useRef(null);
  const importsButtonRef = useRef(null);
  const importsTooltipRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileButtonRef = useRef(null);
  const profileTooltipRef = useRef(null);
  const profileMenuRef = useRef(null);
  const dailyStatsButtonRef = useRef(null);
  const dailyStatsTooltipRef = useRef(null);
  const allTradesButtonRef = useRef(null);
  const allTradesTooltipRef = useRef(null);

  // Tag lists (per user)
  const [setupsTags, setSetupsTags] = useState([]);
  const [mistakesTags, setMistakesTags] = useState([]);
  // Track if tag lists are loaded
  const [tagsLoaded, setTagsLoaded] = useState(false);

  // Add ratings state and loading logic
  const [ratings, setRatings] = useState({});
  const [ratingsLoaded, setRatingsLoaded] = useState(false);

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
    const checkMobileDevice = () => {
      const userAgent = window.navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobileDevice(mobileRegex.test(userAgent));
    };

    checkMobileDevice();
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target) &&
          profileButtonRef.current && !profileButtonRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentUser && window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
  }, [currentUser]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/admin/invitations') {
      setCurrentScreen('Invitations');
    } else if (path === '/dashboard') {
      setCurrentScreen('Dashboard');
    } else if (path === '/reports') {
      setCurrentScreen('Reports');
    } else if (path === '/imports') {
      setCurrentScreen('Imports');
    } else if (path === '/dailystats') {
      setCurrentScreen('Daily Stats');
    } else if (path === '/alltrades') {
      setCurrentScreen('All Trades');
    } else if (path === '/settings') {
      setCurrentScreen('Profile Settings');
    }
  }, [location.pathname]);

  useEffect(() => {
    const loadSavedTradeData = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.tradeData) {
              setTradeData(userData.tradeData);
            }
            if (userData.uploadedFiles) {
              setUploadedFiles(userData.uploadedFiles);
            }
          }
        } catch (error) {
          console.error('Error loading saved trade data:', error);
        }
      }
    };

    loadSavedTradeData();
  }, [currentUser]);

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (event) => {
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
            const dateTimeParts = execTime.split(' ');
            const dateParts = dateTimeParts[0].split('/');
            const timeParts = dateTimeParts[1].split(':');
            const month = parseInt(dateParts[0], 10) - 1;
            const day = parseInt(dateParts[1], 10);
            const year = 2000 + parseInt(dateParts[2], 10);
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
            Type: row['Type'] || 'UNKNOWN',
          };
        });

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

        setUploadedFiles(prev => {
          const newFiles = [...prev, { name: file.name, trades: [] }];
          const tradeMap = new Map();

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

          const updatedTradeData = Array.from(tradeMap.values()).map(entry => ({
            ...entry.trade,
            Transactions: Array.from(entry.trade.Transactions.values())
          }));

          setTradeData(updatedTradeData);

          if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            updateDoc(userDocRef, {
              tradeData: updatedTradeData,
              uploadedFiles: updatedFiles,
              lastUpdated: new Date()
            }).catch(error => {
              console.error('Error saving trade data:', error);
            });
          }

          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          return updatedFiles;
        });
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

      const updatedTradeData = Array.from(tradeMap.values()).map(entry => ({
        ...entry.trade,
        Transactions: Array.from(entry.trade.Transactions.values())
      }));

      setTradeData(updatedTradeData);

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        updateDoc(userDocRef, {
          tradeData: updatedTradeData,
          uploadedFiles: remainingFiles,
          lastUpdated: new Date()
        }).catch(error => {
          console.error('Error saving updated trade data:', error);
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return remainingFiles;
    });
  };

  const handleDateChange = (startDate, endDate) => {
    setDateRange({ startDate, endDate });
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleReportsClick = () => {
    navigate('/reports');
  };

  const handleImportsClick = () => {
    navigate('/imports');
  };

  const handleDailyStatsClick = () => {
    navigate('/dailystats');
  };

  const handleAllTradesClick = () => {
    navigate('/alltrades');
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  const handleProfileSettingsClick = () => {
    setIsProfileMenuOpen(false);
    navigate('/settings');
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

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
          {!isMobileDevice && (
            <img
              src={secondaryLogo}
              alt="TradeLens Logo"
              style={{ height: '50px', marginRight: '15px' }}
            />
          )}
          <h2 style={{ 
            margin: 0, 
            fontSize: isMobileDevice ? '18px' : '24px', 
            color: theme.colors.white,
            paddingRight: isMobileDevice ? '10px' : '0'
          }}>
            {currentScreen}
          </h2>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/invitations')}
              style={{
                padding: '8px 16px',
                backgroundColor: theme.colors.green,
                color: theme.colors.white,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Manage Invitations
            </button>
          )}
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
          display: (isHalfScreen && !isSidebarOpen) ? 'none' : 'flex',
          padding: '20px 0',
          boxSizing: 'border-box',
          zIndex: 900,
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
            ref={dailyStatsButtonRef}
            onClick={handleDailyStatsClick}
            onMouseEnter={(e) => { dailyStatsTooltipRef.current.style.visibility = 'visible'; }}
            onMouseLeave={(e) => { dailyStatsTooltipRef.current.style.visibility = 'hidden'; }}
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
              ref={dailyStatsTooltipRef}
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
              Daily Stats
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={allTradesButtonRef}
            onClick={handleAllTradesClick}
            onMouseEnter={(e) => { allTradesTooltipRef.current.style.visibility = 'visible'; }}
            onMouseLeave={(e) => { allTradesTooltipRef.current.style.visibility = 'hidden'; }}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span
              ref={allTradesTooltipRef}
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
              All Trades
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

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginTop: 'auto', paddingBottom: '0' }}>
          <div
            ref={profileButtonRef}
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            onMouseEnter={(e) => { profileTooltipRef.current.style.visibility = 'visible'; }}
            onMouseLeave={(e) => { profileTooltipRef.current.style.visibility = 'hidden'; }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: theme.colors.green,
              borderRadius: '50%',
              cursor: 'pointer',
              marginBottom: '0',
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span
              ref={profileTooltipRef}
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
              Profile
            </span>
          </div>
          {isProfileMenuOpen && (
            <div
              ref={profileMenuRef}
              style={{
                position: 'absolute',
                right: '-120px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#1a1a1a',
                padding: '10px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                minWidth: '160px',
              }}
            >
              <button
                onClick={handleProfileSettingsClick}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme.colors.white,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .65.38 1.24.97 1.51.31.15.65.23 1 .23H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </button>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme.colors.white,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
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
        {location.pathname === '/admin/invitations' ? (
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
            <InvitationManager />
          </div>
        ) : location.pathname === '/dashboard' ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <img
                src={primaryLogo}
                alt="TradeLens Logo"
                style={{
                  width: '140px',
                  height: 'auto',
                  filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6))',
                }}
              />
              <h1
                style={{
                  color: theme.colors.white,
                  margin: 0,
                  fontSize: '32px',
                  letterSpacing: '0.5px',
                }}
              >
                TradeLens
              </h1>
            </div>
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
              <StatsDashboard tradeData={filteredTradeData} isMobileDevice={isMobileDevice} isHalfScreen={isHalfScreen} />
            </div>
          </>
        ) : location.pathname === '/reports' ? (
          <>
            <img src={primaryLogo} alt="TradeLens Logo" style={{ width: '200px', marginBottom: '20px' }} />
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
              <ReportsScreen 
                tradeData={filteredTradeData} 
                setupsTags={setupsTags}
                mistakesTags={mistakesTags}
                tradeRatings={ratings}
              />
            </div>
          </>
        ) : location.pathname === '/imports' ? (
          <>
            <img src={primaryLogo} alt="TradeLens Logo" style={{ width: '200px', marginBottom: '20px' }} />
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
        ) : location.pathname === '/dailystats' ? (
          <>
            <img src={primaryLogo} alt="TradeLens Logo" style={{ width: '200px', marginBottom: '20px' }} />
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
              <DailyStatsScreen tradeData={filteredTradeData} />
            </div>
          </>
        ) : location.pathname === '/alltrades' ? (
          <>
            <img src={primaryLogo} alt="TradeLens Logo" style={{ width: '200px', marginBottom: '20px' }} />
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
              <AllTradesScreen 
                tradeData={filteredTradeData}
                ratings={ratings}
                setRatings={setRatings}
              />
            </div>
          </>
        ) : location.pathname === '/settings' ? (
          <>
            <img src={primaryLogo} alt="TradeLens Logo" style={{ width: '200px', marginBottom: '20px' }} />
            <div
              style={{
                width: '100%',
                maxWidth: '900px',
                backgroundColor: '#0d0d0d',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <ProfileSettingsScreen currentUser={currentUser} subscription={subscription} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function AppRoutesWrapper() {
  const { currentUser, isSubscribed, subscriptionLoading } = useAuth();

  const HomeRoute = () => {
    if (!currentUser) {
      return <MarketingLanding />;
    }
    if (subscriptionLoading) {
      return <FullScreenLoader />;
    }
    return isSubscribed ? <Navigate to="/dashboard" replace /> : <Navigate to="/paywall" replace />;
  };
  
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/pricing" element={<PricingScreen />} />
      <Route path="/login" element={<Login />} />
      <Route path="/paywall" element={<ProtectedRoute requireSubscription={false}><PaywallScreen /></ProtectedRoute>} />
      <Route path="/admin/invitations" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/imports" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/dailystats" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/alltrades" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTopWrapper>
          <AppContainer>
            <AppRoutesWrapper />
          </AppContainer>
        </ScrollToTopWrapper>
      </Router>
    </AuthProvider>
  );
}

export default App;