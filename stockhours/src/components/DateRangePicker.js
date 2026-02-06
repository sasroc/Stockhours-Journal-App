import React, { useState, useEffect, useRef } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // Main style file
import 'react-date-range/dist/theme/default.css'; // Theme CSS file
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear } from 'date-fns';
import { theme } from '../theme';

// Helper to get YTD date range
const getYTDRange = () => {
  const today = new Date();
  const startDate = startOfYear(today);
  const endDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

const DateRangePicker = ({ onDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const initialYTD = getYTDRange();
  const [dateRange, setDateRange] = useState([
    {
      startDate: initialYTD.startDate, // Default to Year-to-Date
      endDate: initialYTD.endDate,
      key: 'selection',
    },
  ]);
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false); // Track if user is selecting the end date
  const pickerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Set YTD filter on initial mount
  useEffect(() => {
    const { startDate, endDate } = getYTDRange();
    onDateChange(startDate, endDate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle clicks outside the picker to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsSelectingEndDate(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format the display text for the date range
  const displayText =
    dateRange[0].startDate && dateRange[0].endDate
      ? isMobile
        ? `${format(dateRange[0].startDate, 'MM/dd')} - ${format(dateRange[0].endDate, 'MM/dd')}`
        : `${format(dateRange[0].startDate, 'MMM dd, yyyy')} - ${format(dateRange[0].endDate, 'MMM dd, yyyy')}`
      : 'All Dates';

  // Handle date range selection
  const handleSelect = (ranges) => {
    const { startDate, endDate } = ranges.selection;

    if (!isSelectingEndDate) {
      // First selection: Start date only
      setDateRange([{ startDate, endDate: startDate, key: 'selection' }]);
      setIsSelectingEndDate(true);
    } else {
      // Second selection: End date
      if (endDate < startDate) {
        // If the end date is before the start date, swap them
        setDateRange([{ startDate: endDate, endDate: startDate, key: 'selection' }]);
        onDateChange(endDate, startDate);
      } else {
        setDateRange([{ startDate, endDate, key: 'selection' }]);
        onDateChange(startDate, endDate);
      }
      setIsSelectingEndDate(false);
      setIsOpen(false);
    }
  };

  // Reset to "All Dates"
  const handleReset = () => {
    setDateRange([
      {
        startDate: null,
        endDate: null,
        key: 'selection',
      },
    ]);
    onDateChange(null, null);
    setIsSelectingEndDate(false);
    setIsOpen(false);
  };

  // Quick date selection handlers
  const handleQuickSelect = (type) => {
    const today = new Date();
    let startDate, endDate;

    switch (type) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'thisweek':
        startDate = startOfWeek(today, { weekStartsOn: 0 });
        endDate = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case 'thismonth':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'last30days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 29); // 29 to include today
        endDate = new Date(today);
        break;
      case 'lastmonth':
        startDate = startOfMonth(subMonths(today, 1));
        endDate = endOfMonth(subMonths(today, 1));
        break;
      case 'thisquarter':
        startDate = startOfQuarter(today);
        endDate = endOfQuarter(today);
        break;
      case 'yeartodate':
        startDate = startOfYear(today);
        endDate = new Date(today);
        break;
      default:
        return;
    }

    // Ensure we're working with new Date objects
    startDate = new Date(startDate);
    endDate = new Date(endDate);

    // Set the time to start and end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const newRange = [{ startDate, endDate, key: 'selection' }];
    setDateRange(newRange);
    onDateChange(startDate, endDate);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={pickerRef}>
      {/* Date Range Display Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#2B3C5A',
          padding: isMobile ? '8px 12px' : '5px 10px',
          borderRadius: '4px',
          color: theme.colors.white,
          cursor: 'pointer',
          fontSize: isMobile ? '12px' : '14px',
          whiteSpace: 'nowrap',
          minWidth: isMobile ? '120px' : 'auto',
        }}
      >
        <span style={{ marginRight: '5px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayText}</span>
        {dateRange[0].startDate && dateRange[0].endDate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            style={{
              marginLeft: '5px',
              color: theme.colors.red,
              cursor: 'pointer',
              fontSize: isMobile ? '14px' : '16px',
              background: 'none',
              border: 'none',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              minHeight: '20px',
            }}
            aria-label="Clear date range"
          >
            ✕
          </button>
        )}
        <span style={{ marginLeft: '5px', fontSize: isMobile ? '10px' : '12px' }}>▼</span>
      </div>

      {/* Date Range Picker Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '35px' : '40px',
            right: 0,
            zIndex: 1001,
            backgroundColor: '#1B2B43',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            padding: '10px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '10px',
            width: isMobile ? '300px' : 'auto',
          }}
        >
          <div style={{ flex: 1 }}>
            <DateRange
              onChange={handleSelect}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
              months={isMobile ? 1 : 2}
              direction={isMobile ? 'vertical' : 'horizontal'}
              rangeColors={[theme.colors.green]}
              color={theme.colors.green}
              showDateDisplay={false}
              minDate={new Date(2000, 0, 1)}
              maxDate={new Date()}
              showMonthAndYearPickers={true}
              monthDisplayFormat="MMM yyyy"
              className="dark-date-range"
            />
          </div>
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '10px',
              borderLeft: isMobile ? 'none' : '1px solid #344563',
              borderTop: isMobile ? '1px solid #344563' : 'none',
              marginTop: isMobile ? '10px' : '0',
              paddingTop: isMobile ? '10px' : '0',
            }}
          >
            <h4 style={{ color: theme.colors.white, margin: '0 0 10px 0', fontSize: '14px' }}>Quick Select</h4>
            {[
              { label: 'Today', value: 'today' },
              { label: 'This Week', value: 'thisweek' },
              { label: 'This Month', value: 'thismonth' },
              { label: 'Last 30 Days', value: 'last30days' },
              { label: 'Last Month', value: 'lastmonth' },
              { label: 'This Quarter', value: 'thisquarter' },
              { label: 'Year to Date', value: 'yeartodate' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleQuickSelect(option.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #344563',
                  color: theme.colors.white,
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#344563';
                  e.target.style.borderColor = theme.colors.green;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = '#344563';
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;