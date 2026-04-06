import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import StatsDashboard from './components/StatsDashboard';
import ReportsScreen from './components/ReportsScreen';
import ImportsScreen from './components/ImportsScreen';
import DateRangePicker from './components/DateRangePicker';
import { theme } from './theme';

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
import SchwabCallback from './components/SchwabCallback';
import WebullCallback from './components/WebullCallback';
import WeeklyReviewScreen from './components/WeeklyReviewScreen';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import FAQScreen from './components/FAQScreen';
import BrokersScreen from './components/BrokersScreen';
import OnboardingModal from './components/OnboardingModal';

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
  background-color: #0A1628;
  color: ${theme.colors.white};
`;

const FullScreenLoader = ({ message = 'Loading...' }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    backgroundColor: '#0A1628',
    color: '#fff'
  }}>
    {message}
  </div>
);

// Merges CSV-sourced trade groups with Schwab-sourced trade groups.
// Schwab transactions are identified by _schwabActivityId and deduplicated.
const mergeWithSchwabData = (csvGroups, schwabGroups) => {
  if (!schwabGroups || schwabGroups.length === 0) return csvGroups || [];
  const groupMap = new Map();
  (csvGroups || []).forEach(group => {
    const key = `${group.Symbol}-${group.Strike}-${group.Expiration}`;
    groupMap.set(key, { ...group, Transactions: [...(group.Transactions || [])] });
  });
  (schwabGroups || []).forEach(sg => {
    const key = `${sg.Symbol}-${sg.Strike}-${sg.Expiration}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, { ...sg, Transactions: [...(sg.Transactions || [])] });
    } else {
      const existing = groupMap.get(key);
      const existingIds = new Set(existing.Transactions.map(tx => tx._schwabActivityId).filter(Boolean));
      (sg.Transactions || []).forEach(tx => {
        if (!tx._schwabActivityId || !existingIds.has(tx._schwabActivityId)) {
          existing.Transactions.push(tx);
          if (tx._schwabActivityId) existingIds.add(tx._schwabActivityId);
        }
      });
    }
  });
  return Array.from(groupMap.values());
};

function AppRoutes() {
  const { currentUser, loading, logout, subscription, tradingProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tradeData, setTradeData] = useState([]);
  const [schwabTradeData, setSchwabTradeData] = useState([]);
  const [filteredTradeData, setFilteredTradeData] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHalfScreen, setIsHalfScreen] = useState(window.innerWidth <= 960);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Dashboard');
  const [dateRange, setDateRange] = useState(getYTDRange()); // Default to Year-to-Date
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [hoveredSidebarItem, setHoveredSidebarItem] = useState(null);

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
  const weeklyReviewButtonRef = useRef(null);
  const weeklyReviewTooltipRef = useRef(null);

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

  // Merge CSV data and Schwab data into one unified dataset for display
  const effectiveTradeData = useMemo(
    () => mergeWithSchwabData(tradeData, schwabTradeData),
    [tradeData, schwabTradeData]
  );

  useEffect(() => {
    if (!effectiveTradeData.length) {
      setFilteredTradeData([]);
      return;
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      setFilteredTradeData(effectiveTradeData);
      return;
    }

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);

    const filtered = effectiveTradeData
      .map((trade) => {
        const filteredTransactions = trade.Transactions.filter((transaction) => {
          const execTime = new Date(transaction.ExecTime);
          return execTime >= startDate && execTime <= endDate;
        });
        return { ...trade, Transactions: filteredTransactions };
      })
      .filter((trade) => trade.Transactions.length > 0);

    setFilteredTradeData(filtered);
  }, [effectiveTradeData, dateRange]);

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
    if (path === '/dashboard') {
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
    } else if (path === '/weekly-reviews') {
      setCurrentScreen('Weekly Reviews');
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
            if (userData.schwabTradeData) {
              setSchwabTradeData(userData.schwabTradeData);
            } else if (userData.tradeData) {
              // One-time migration: extract Schwab transactions from the legacy mixed tradeData
              // and save them to the dedicated schwabTradeData field so future CSV uploads
              // cannot overwrite them.
              const schwabGroups = userData.tradeData.filter(g =>
                Array.isArray(g.Transactions) && g.Transactions.some(tx => tx._schwabActivityId)
              );
              if (schwabGroups.length > 0) {
                setSchwabTradeData(schwabGroups);
                updateDoc(userDocRef, { schwabTradeData: schwabGroups }).catch(() => {});
              }
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

  // --- IBKR Activity Statement CSV parser ---
  const parseIBKROptionSymbol = (symbolStr) => {
    // IBKR human-readable format: "SPY 18MAR26 580.0 P" or "TSLA 21MAR26 320.0 C"
    const MONTH_MAP = { JAN:1, FEB:2, MAR:3, APR:4, MAY:5, JUN:6, JUL:7, AUG:8, SEP:9, OCT:10, NOV:11, DEC:12 };
    const match = symbolStr.trim().match(
      /^([A-Z0-9.]+)\s+(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})\s+([\d.]+)\s+([CP])$/i
    );
    if (!match) return null;
    const [, underlying, dd, mon, yy, strikeStr, type] = match;
    const month = MONTH_MAP[mon.toUpperCase()];
    const day = parseInt(dd, 10);
    const year = 2000 + parseInt(yy, 10);
    const strike = parseFloat(strikeStr);
    // Match thinkorswim expiration format: "${day} ${month} ${year}"
    const expiration = `${day} ${month} ${year}`;
    return { underlying, strike, expiration, type: type.toUpperCase() === 'C' ? 'CALL' : 'PUT' };
  };

  const parseIBKRData = (data) => {
    const headerRow = data.find(row => row[0] === 'Trades' && row[1] === 'Header');
    if (!headerRow) throw new Error('No Trades section found in IBKR file.');

    // Build column index map: header cols start at position 2
    const colIdx = {};
    headerRow.slice(2).forEach((col, i) => { colIdx[String(col).trim()] = i + 2; });

    // Only process Order rows for Stocks and Options (skip SubTotal, Total, ClosedLot, etc.)
    // IBKR sometimes truncates the category to "Equity and Index Opts" so match 'opts' too
    const tradeRows = data.filter(row => {
      const cat = String(row[colIdx['Asset Category']] || '').toLowerCase();
      return (
        row[0] === 'Trades' &&
        row[1] === 'Data' &&
        row[2] === 'Order' &&
        (cat.includes('stock') || cat.includes('option') || cat.includes('opts'))
      );
    });

    if (tradeRows.length === 0) {
      throw new Error('No trade rows found in IBKR file. Make sure the Activity Statement includes Trades.');
    }

    return tradeRows.map(row => {
      const assetCategory = String(row[colIdx['Asset Category']] || '');
      const isOption = assetCategory.toLowerCase().includes('option') || assetCategory.toLowerCase().includes('opts');
      const rawSymbol = String(row[colIdx['Symbol']] || '').trim();
      const rawDateTime = row[colIdx['Date/Time']];
      const rawQty = row[colIdx['Quantity']];
      const quantity = typeof rawQty === 'number' ? rawQty : parseFloat(String(rawQty).replace(/,/g, '')) || 0;
      const price = parseFloat(row[colIdx['T. Price']]) || 0;
      const code = String(row[colIdx['Code']] || '').trim();

      // IBKR dates arrive as Excel serial numbers (XLSX auto-converts them)
      // Use the same XLSX.SSF.parse_date_code approach as the thinkorswim parser
      let execTime, tradeDate;
      if (typeof rawDateTime === 'number') {
        const serialDate = rawDateTime;
        const date = XLSX.SSF.parse_date_code(serialDate);
        const y = date.y, m = date.m, d = date.d;
        tradeDate = `${m}/${d}/${y}`;
        const hours = Math.floor((serialDate % 1) * 24);
        const minutes = Math.floor(((serialDate % 1) * 24 - hours) * 60);
        const seconds = Math.floor((((serialDate % 1) * 24 - hours) * 60 - minutes) * 60);
        const constructed = new Date(y, m - 1, d, hours, minutes, seconds);
        execTime = isNaN(constructed.getTime())
          ? new Date(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.000Z`).toISOString()
          : constructed.toISOString();
      } else {
        // Fallback: string format "2023-01-20, 09:30:00"
        const dateTimeStr = String(rawDateTime || '').trim();
        const parsedDate = new Date(dateTimeStr.replace(', ', 'T'));
        execTime = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
        tradeDate = isNaN(parsedDate.getTime()) ? 'N/A' :
          `${parsedDate.getMonth() + 1}/${parsedDate.getDate()}/${parsedDate.getFullYear()}`;
      }

      // Side from quantity sign; PosEffect from Code (O=open, C=close; may include "O;P", "C;P", "A"=assignment, "Ex"=exercise)
      const side = quantity >= 0 ? 'BUY' : 'SELL';
      const absQty = Math.abs(quantity);
      let posEffect = 'UNKNOWN';
      if (/^O/i.test(code)) posEffect = 'OPEN';
      else if (/^C/i.test(code) || code === 'A' || code === 'Ex') posEffect = 'CLOSE';

      if (isOption) {
        const parsed = parseIBKROptionSymbol(rawSymbol);
        if (!parsed) return null; // skip unparseable option symbols
        return {
          ExecTime: execTime, TradeDate: tradeDate, Side: side, Quantity: absQty,
          Symbol: parsed.underlying, Expiration: parsed.expiration, Strike: parsed.strike,
          Price: price, OrderType: 'IBKR', PosEffect: posEffect, Type: parsed.type,
        };
      } else {
        return {
          ExecTime: execTime, TradeDate: tradeDate, Side: side, Quantity: absQty,
          Symbol: rawSymbol, Expiration: 'N/A', Strike: 0,
          Price: price, OrderType: 'IBKR', PosEffect: posEffect, Type: 'EQUITY',
        };
      }
    }).filter(Boolean);
  };
  // --- end IBKR parser ---

  // --- MooMoo CSV parser ---
  const parseMooMooData = (data) => {
    // Header row is data[0]; data rows start at data[1]
    // Columns: 0=Side, 1=Symbol, 2=Name, 6=Status, 8=Order Time,
    //          18=Fill Qty, 19=Fill Price, 21=Fill Time
    const MONTH_MAP = {
      Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
      Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
    };

    const parseMooMooDateTime = (dtStr) => {
      // "Apr 2, 2026 09:45:45 ET"
      const match = String(dtStr || '').trim().match(
        /^(\w+)\s+(\d+),\s+(\d{4})\s+(\d+):(\d+):(\d+)/
      );
      if (!match) return { execTime: new Date().toISOString(), tradeDate: 'N/A' };
      const [, mon, day, year, hh, mm, ss] = match;
      const month = MONTH_MAP[mon] || 1;
      const d = new Date(parseInt(year, 10), month - 1, parseInt(day, 10), parseInt(hh, 10), parseInt(mm, 10), parseInt(ss, 10));
      return {
        execTime: isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(),
        tradeDate: `${month}/${parseInt(day, 10)}/${year}`,
      };
    };

    const parseMooMooOptionName = (nameStr) => {
      // "TSLA 260402 370.00C" or "SPY 260402 656.00C" or "MU 260402 370.00P"
      const match = String(nameStr || '').trim().match(
        /^([A-Z0-9.]+)\s+(\d{6})\s+([\d.]+)([CP])$/i
      );
      if (!match) return null;
      const [, underlying, dateCode, strikeStr, type] = match;
      const yy = parseInt(dateCode.slice(0, 2), 10);
      const mm = parseInt(dateCode.slice(2, 4), 10);
      const dd = parseInt(dateCode.slice(4, 6), 10);
      const year = 2000 + yy;
      // Match the same expiration format used by TOS/IBKR parsers: "${day} ${month} ${year}"
      const expiration = `${dd} ${mm} ${year}`;
      return {
        underlying,
        strike: parseFloat(strikeStr),
        expiration,
        type: type.toUpperCase() === 'C' ? 'CALL' : 'PUT',
      };
    };

    const result = [];
    // Track current order's metadata for continuation (partial-fill) rows
    let lastSide = null, lastName = null, lastSymbol = null, lastStatus = null;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 19) continue;

      const side = String(row[0] || '').trim();
      const symbol = String(row[1] || '').trim();
      const name = String(row[2] || '').trim();
      const status = String(row[6] || '').trim();

      const isContinuationRow = side === '' && symbol === '';

      if (!isContinuationRow) {
        // Main order row — update running context
        lastSide = side;
        lastSymbol = symbol;
        lastName = name;
        lastStatus = status;
      }

      // Skip failed/unfilled orders
      if (lastStatus !== 'Filled') continue;

      // Parse fill qty and price from cols 18 and 19
      const fillQtyRaw = row[18];
      const fillPriceRaw = row[19];
      const fillTimeRaw = row[21] || row[8]; // fall back to Order Time if Fill Time is empty

      const fillQty = typeof fillQtyRaw === 'number'
        ? fillQtyRaw
        : parseInt(String(fillQtyRaw || '0').replace(/,/g, ''), 10);
      if (!fillQty || fillQty <= 0) continue;

      const fillPrice = typeof fillPriceRaw === 'number'
        ? fillPriceRaw
        : parseFloat(String(fillPriceRaw || '0').replace(/,/g, ''));

      const { execTime, tradeDate } = parseMooMooDateTime(fillTimeRaw);
      const buySell = (lastSide || '').toLowerCase() === 'buy' ? 'BUY' : 'SELL';
      const parsed = parseMooMooOptionName(lastName);

      if (parsed) {
        result.push({
          ExecTime: execTime,
          TradeDate: tradeDate,
          Side: buySell,
          Quantity: fillQty,
          Symbol: parsed.underlying,
          Expiration: parsed.expiration,
          Strike: parsed.strike,
          Price: fillPrice,
          OrderType: 'MooMoo',
          PosEffect: 'UNKNOWN',
          Type: parsed.type,
        });
      } else {
        // Equity / unrecognised symbol
        result.push({
          ExecTime: execTime,
          TradeDate: tradeDate,
          Side: buySell,
          Quantity: fillQty,
          Symbol: lastSymbol || 'UNKNOWN',
          Expiration: 'N/A',
          Strike: 0,
          Price: fillPrice,
          OrderType: 'MooMoo',
          PosEffect: 'UNKNOWN',
          Type: 'EQUITY',
        });
      }
    }

    if (result.length === 0) {
      throw new Error('No filled trades found in MooMoo file.');
    }

    // Post-process: infer PosEffect (OPEN/CLOSE) by tracking running position per group.
    // MooMoo doesn't emit open/close markers; the StatsDashboard requires them for P&L.
    const groups = new Map();
    result.forEach(tx => {
      const key = `${tx.Symbol}-${tx.Strike}-${tx.Expiration}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(tx);
    });

    groups.forEach(txs => {
      txs.sort((a, b) => new Date(a.ExecTime) - new Date(b.ExecTime));
      let runningQty = 0; // positive = long, negative = short

      txs.forEach(tx => {
        if (runningQty === 0) {
          // Flat — opening a new position
          tx.PosEffect = 'OPEN';
          runningQty += tx.Side === 'BUY' ? tx.Quantity : -tx.Quantity;
        } else if (runningQty > 0) {
          // Currently long
          if (tx.Side === 'BUY') {
            tx.PosEffect = 'OPEN'; // adding to long
            runningQty += tx.Quantity;
          } else {
            tx.PosEffect = 'CLOSE'; // reducing / closing long
            runningQty -= tx.Quantity;
            if (runningQty < 0) runningQty = 0;
          }
        } else {
          // Currently short
          if (tx.Side === 'SELL') {
            tx.PosEffect = 'OPEN'; // adding to short
            runningQty -= tx.Quantity;
          } else {
            tx.PosEffect = 'CLOSE'; // reducing / closing short
            runningQty += tx.Quantity;
            if (runningQty > 0) runningQty = 0;
          }
        }
      });
    });

    return result;
  };
  // --- end MooMoo parser ---

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

        // Auto-detect broker format
        const isIBKR = data.some(row => Array.isArray(row) && row[0] === 'Trades' && row[1] === 'Header');
        const isMooMoo = Array.isArray(data[0]) && String(data[0][0] || '').replace(/^\uFEFF/, '') === 'Side' && data[0][7] === 'Filled@Avg Price';

        let transformedData;
        if (isIBKR) {
          transformedData = parseIBKRData(data);
        } else if (isMooMoo) {
          transformedData = parseMooMooData(data);
        } else {
          // thinkorswim format
          const tradeHistoryStart = data.findIndex(row => row[0] === 'Account Trade History');
          if (tradeHistoryStart === -1) {
            throw new Error('Unrecognized file format. Please upload a thinkorswim, IBKR Activity Statement, or MooMoo CSV.');
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

          transformedData = tradeDataRaw.map(row => {
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
        }

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

  const apiBase = process.env.REACT_APP_STRIPE_API_URL || '';

  const handleSchwabSync = async () => {
    if (!currentUser || !apiBase) return { error: 'Not configured.' };
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${apiBase}/api/schwab/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Sync failed.' };
      }
      if (data.reconnectRequired) {
        return { reconnectRequired: true, error: data.error };
      }
      if (data.schwabTradeData) {
        setSchwabTradeData(data.schwabTradeData);
      }
      return { success: true, transactionsImported: data.transactionsImported };
    } catch (err) {
      return { error: err.message || 'Sync failed.' };
    }
  };

  const handleWebullSync = async () => {
    if (!currentUser || !apiBase) return { error: 'Not configured.' };
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${apiBase}/api/webull/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Sync failed.' };
      }
      if (data.reconnectRequired) {
        return { reconnectRequired: true, error: data.error };
      }
      if (data.tradeData) {
        setTradeData(data.tradeData);
      }
      return { success: true, transactionsImported: data.transactionsImported };
    } catch (err) {
      return { error: err.message || 'Sync failed.' };
    }
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

  const handleWeeklyReviewsClick = () => {
    navigate('/weekly-reviews');
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
    <div className="App" style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: theme.colors.white }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#1B2B43',
          padding: '10px 20px',
          borderBottom: '1px solid #344563',
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
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                overflow: 'hidden',
                backgroundColor: '#0C1829',
                border: '1px solid #1E2D48',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6), 0 0 18px rgba(0, 123, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '15px',
              }}
            >
              <img
                src={secondaryLogo}
                alt="TradeBetter Logo"
                style={{
                  width: '66px',
                  height: '66px',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  transform: 'scale(1.1) translateX(7px)',
                  display: 'block',
                }}
              />
            </div>
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
          backgroundColor: '#1B2B43',
          display: (isHalfScreen && !isSidebarOpen) ? 'none' : 'flex',
          padding: '12px 0',
          boxSizing: 'border-box',
          zIndex: 900,
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <label
            htmlFor="sidebar-file-upload"
            onMouseEnter={(e) => { e.target.querySelector('.tooltip').style.visibility = 'visible'; }}
            onMouseLeave={(e) => { e.target.querySelector('.tooltip').style.visibility = 'hidden'; }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              backgroundColor: theme.colors.teal,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '22px',
              color: theme.colors.white,
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
                backgroundColor: '#344563',
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

        <div style={{ position: 'relative', width: '100%' }}>
          <div
            ref={dashboardButtonRef}
            onClick={handleDashboardClick}
            onMouseEnter={() => { dashboardTooltipRef.current.style.visibility = 'visible'; setHoveredSidebarItem('dashboard'); }}
            onMouseLeave={() => { dashboardTooltipRef.current.style.visibility = 'hidden'; setHoveredSidebarItem(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '44px',
              backgroundColor: location.pathname === '/dashboard' ? theme.colors.tealLight : (hoveredSidebarItem === 'dashboard' ? theme.colors.tealSubtle : 'transparent'),
              borderLeft: location.pathname === '/dashboard' ? `3px solid ${theme.colors.teal}` : '3px solid transparent',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.15s ease',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={location.pathname === '/dashboard' ? theme.colors.teal : theme.colors.gray}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M6 9.5V21h12V9.5" />
              <rect x="10" y="14" width="4" height="7" rx="1" />
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
                backgroundColor: '#344563',
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

        <div style={{ position: 'relative', width: '100%' }}>
          <div
            ref={dailyStatsButtonRef}
            onClick={handleDailyStatsClick}
            onMouseEnter={() => { dailyStatsTooltipRef.current.style.visibility = 'visible'; setHoveredSidebarItem('dailyStats'); }}
            onMouseLeave={() => { dailyStatsTooltipRef.current.style.visibility = 'hidden'; setHoveredSidebarItem(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '44px',
              backgroundColor: location.pathname === '/dailystats' ? theme.colors.tealLight : (hoveredSidebarItem === 'dailyStats' ? theme.colors.tealSubtle : 'transparent'),
              borderLeft: location.pathname === '/dailystats' ? `3px solid ${theme.colors.teal}` : '3px solid transparent',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.15s ease',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={location.pathname === '/dailystats' ? theme.colors.teal : theme.colors.gray}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
                backgroundColor: '#344563',
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

        <div style={{ position: 'relative', width: '100%' }}>
          <div
            ref={allTradesButtonRef}
            onClick={handleAllTradesClick}
            onMouseEnter={() => { allTradesTooltipRef.current.style.visibility = 'visible'; setHoveredSidebarItem('allTrades'); }}
            onMouseLeave={() => { allTradesTooltipRef.current.style.visibility = 'hidden'; setHoveredSidebarItem(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '44px',
              backgroundColor: location.pathname === '/alltrades' ? theme.colors.tealLight : (hoveredSidebarItem === 'allTrades' ? theme.colors.tealSubtle : 'transparent'),
              borderLeft: location.pathname === '/alltrades' ? `3px solid ${theme.colors.teal}` : '3px solid transparent',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.15s ease',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={location.pathname === '/alltrades' ? theme.colors.teal : theme.colors.gray}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
                backgroundColor: '#344563',
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

        <div style={{ position: 'relative', width: '100%' }}>
          <div
            ref={reportsButtonRef}
            onClick={handleReportsClick}
            onMouseEnter={() => { reportsTooltipRef.current.style.visibility = 'visible'; setHoveredSidebarItem('reports'); }}
            onMouseLeave={() => { reportsTooltipRef.current.style.visibility = 'hidden'; setHoveredSidebarItem(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '44px',
              backgroundColor: location.pathname === '/reports' ? theme.colors.tealLight : (hoveredSidebarItem === 'reports' ? theme.colors.tealSubtle : 'transparent'),
              borderLeft: location.pathname === '/reports' ? `3px solid ${theme.colors.teal}` : '3px solid transparent',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.15s ease',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={location.pathname === '/reports' ? theme.colors.teal : theme.colors.gray}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="20" x2="20" y2="20" />
              <rect x="5" y="12" width="4" height="8" rx="1" />
              <rect x="10" y="8" width="4" height="12" rx="1" />
              <rect x="15" y="5" width="4" height="15" rx="1" />
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
                backgroundColor: '#344563',
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

        <div style={{ position: 'relative', width: '100%' }}>
          <div
            ref={weeklyReviewButtonRef}
            onClick={handleWeeklyReviewsClick}
            onMouseEnter={() => { weeklyReviewTooltipRef.current.style.visibility = 'visible'; setHoveredSidebarItem('weeklyReview'); }}
            onMouseLeave={() => { weeklyReviewTooltipRef.current.style.visibility = 'hidden'; setHoveredSidebarItem(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '44px',
              backgroundColor: location.pathname === '/weekly-reviews' ? theme.colors.tealLight : (hoveredSidebarItem === 'weeklyReview' ? theme.colors.tealSubtle : 'transparent'),
              borderLeft: location.pathname === '/weekly-reviews' ? `3px solid ${theme.colors.teal}` : '3px solid transparent',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.15s ease',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={location.pathname === '/weekly-reviews' ? theme.colors.teal : theme.colors.gray}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M15 14l-3 3-1.5-1.5" />
            </svg>
            <span
              ref={weeklyReviewTooltipRef}
              className="tooltip"
              style={{
                visibility: 'hidden',
                position: 'absolute',
                left: '50px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#344563',
                color: theme.colors.white,
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                zIndex: 1001,
              }}
            >
              Weekly Reviews
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <div
            ref={importsButtonRef}
            onClick={handleImportsClick}
            onMouseEnter={() => { importsTooltipRef.current.style.visibility = 'visible'; setHoveredSidebarItem('imports'); }}
            onMouseLeave={() => { importsTooltipRef.current.style.visibility = 'hidden'; setHoveredSidebarItem(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '44px',
              backgroundColor: location.pathname === '/imports' ? theme.colors.tealLight : (hoveredSidebarItem === 'imports' ? theme.colors.tealSubtle : 'transparent'),
              borderLeft: location.pathname === '/imports' ? `3px solid ${theme.colors.teal}` : '3px solid transparent',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.15s ease',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={location.pathname === '/imports' ? theme.colors.teal : theme.colors.gray}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
                backgroundColor: '#344563',
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

        <div style={{ position: 'relative', width: '100%', marginTop: 'auto', paddingBottom: '0' }}>
          <div
            ref={profileButtonRef}
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            onMouseEnter={() => { profileTooltipRef.current.style.visibility = 'visible'; setHoveredSidebarItem('profile'); }}
            onMouseLeave={() => { profileTooltipRef.current.style.visibility = 'hidden'; setHoveredSidebarItem(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '44px',
              backgroundColor: location.pathname === '/profile-settings' ? theme.colors.tealLight : (hoveredSidebarItem === 'profile' ? theme.colors.tealSubtle : 'transparent'),
              borderLeft: location.pathname === '/profile-settings' ? `3px solid ${theme.colors.teal}` : '3px solid transparent',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.15s ease',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={location.pathname === '/profile-settings' ? theme.colors.teal : theme.colors.gray}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
                backgroundColor: '#344563',
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
                backgroundColor: '#1B2B43',
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
        {location.pathname === '/dashboard' ? (
          <>
            <div
              style={{
                width: '100%',
                maxWidth: '1600px',
                backgroundColor: '#0F1D2F',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <StatsDashboard tradeData={filteredTradeData} isMobileDevice={isMobileDevice} isHalfScreen={isHalfScreen} tradingProfile={tradingProfile} />
            </div>
          </>
        ) : location.pathname === '/reports' ? (
          <>

            <div
              style={{
                width: '100%',
                maxWidth: '1600px',
                backgroundColor: '#0F1D2F',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              <ReportsScreen
                tradeData={filteredTradeData}
                setupsTags={setupsTags}
                mistakesTags={mistakesTags}
                tradeRatings={ratings}
                tradingProfile={tradingProfile}
              />
            </div>
          </>
        ) : location.pathname === '/imports' ? (
          <>

            <div
              style={{
                width: '100%',
                maxWidth: '1400px',
                backgroundColor: '#0F1D2F',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <ImportsScreen uploadedFiles={uploadedFiles} onDeleteFile={handleDeleteFile} currentUser={currentUser} onSchwabSync={handleSchwabSync} onWebullSync={handleWebullSync} />
            </div>
          </>
        ) : location.pathname === '/dailystats' ? (
          <>

            <div
              style={{
                width: '100%',
                maxWidth: '1400px',
                backgroundColor: '#0F1D2F',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <DailyStatsScreen tradeData={filteredTradeData} tradingProfile={tradingProfile} />
            </div>
          </>
        ) : location.pathname === '/alltrades' ? (
          <>

            <div
              style={{
                width: '100%',
                maxWidth: '1400px',
                backgroundColor: '#0F1D2F',
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
                tradingProfile={tradingProfile}
              />
            </div>
          </>
        ) : location.pathname === '/settings' ? (
          <>

            <div
              style={{
                width: '100%',
                maxWidth: '900px',
                backgroundColor: '#0F1D2F',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <ProfileSettingsScreen currentUser={currentUser} subscription={subscription} />
            </div>
          </>
        ) : location.pathname === '/weekly-reviews' ? (
          <>
            <div
              style={{
                width: '100%',
                maxWidth: '1400px',
                backgroundColor: '#0F1D2F',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <WeeklyReviewScreen tradeData={filteredTradeData} tradingProfile={tradingProfile} tradeRatings={ratings} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function AppRoutesWrapper() {
  const { currentUser, isSubscribed, subscriptionLoading, tradingProfile: wrapperTradingProfile, profileLoaded: wrapperProfileLoaded } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (wrapperProfileLoaded && currentUser && !wrapperTradingProfile?.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [wrapperProfileLoaded, currentUser, wrapperTradingProfile]);

  const HomeRoute = () => {
    if (!currentUser) {
      return <MarketingLanding />;
    }
    if (subscriptionLoading) {
      return <FullScreenLoader />;
    }
    return isSubscribed ? <Navigate to="/dashboard" replace /> : <MarketingLanding />;
  };

  return (
    <>
      <OnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/pricing" element={<PricingScreen />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/faq" element={<FAQScreen />} />
      <Route path="/brokers" element={<BrokersScreen />} />
      <Route path="/login" element={<Login />} />
      <Route path="/paywall" element={<ProtectedRoute requireSubscription={false}><PaywallScreen /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/imports" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/dailystats" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/alltrades" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/weekly-reviews" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
      <Route path="/callback/schwab" element={<ProtectedRoute requireSubscription={false}><SchwabCallback /></ProtectedRoute>} />
      <Route path="/callback/webull" element={<ProtectedRoute requireSubscription={false}><WebullCallback /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
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
