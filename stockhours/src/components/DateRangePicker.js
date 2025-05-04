import React, { useState, useEffect, useRef } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // Main style file
import 'react-date-range/dist/theme/default.css'; // Theme CSS file
import { format } from 'date-fns';
import { theme } from '../theme';

const DateRangePicker = ({ onDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: null, // Initially null to represent "all dates"
      endDate: null,
      key: 'selection',
    },
  ]);
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false); // Track if user is selecting the end date
  const pickerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

  return (
    <div style={{ position: 'relative' }} ref={pickerRef}>
      {/* Date Range Display Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#2a2a2a',
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
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            padding: '10px',
            width: isMobile ? '300px' : 'auto',
          }}
        >
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
      )}
    </div>
  );
};

export default DateRangePicker;