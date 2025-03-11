import React from 'react';
import * as XLSX from 'xlsx';
import { theme } from '../theme';

const TradeUploader = ({ setTradeData }) => {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
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
          data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Parse as array of arrays
        } else {
          const binaryStr = event.target.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        }

        console.log('Raw Data:', data); // Debug: Log raw parsed data

        // Find the "Filled Orders" and "Canceled Orders" sections
        const filledOrdersStart = data.findIndex(row => row[0] === 'Filled Orders');
        const canceledOrdersStart = data.findIndex(row => row[0] === 'Canceled Orders');
        if (filledOrdersStart === -1) {
          throw new Error('Filled Orders section not found in the CSV');
        }

        // Extract headers (skip the first two empty columns)
        const headers = data[filledOrdersStart + 1].slice(2); // ['Exec Time', 'Spread', 'Side', ...]
        console.log('Headers:', headers); // Debug: Log extracted headers

        // Extract filled orders data (up to but not including "Canceled Orders")
        const filledOrdersEnd = canceledOrdersStart !== -1 ? canceledOrdersStart : data.length;
        const filledOrdersData = data
          .slice(filledOrdersStart + 2, filledOrdersEnd)
          .filter(row => row.length > 2 && (typeof row[2] === 'string' || typeof row[2] === 'number')) // Accept string or number
          .map(row => {
            const rowData = row.slice(2); // Skip first two empty columns
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = rowData[index];
            });
            return obj;
          });

        console.log('Filled Orders Data:', filledOrdersData); // Debug: Log filled orders data

        // Transform the data (no Status filter since all orders in "Filled Orders" are FILLED)
        const transformedData = filledOrdersData.map(row => {
          const posEffect = row['Pos Effect'] || 'UNKNOWN';
          const symbol = row['Symbol'] || 'UNKNOWN'; // Extract symbol from 'Symbol' column

          // Convert Excel serial date to readable format if numeric
          let expiration = row['Exp'] || 'N/A';
          if (!isNaN(expiration)) {
            const date = XLSX.SSF.parse_date_code(parseFloat(expiration));
            expiration = `${date.d} ${date.m} ${date.y}`; // e.g., "14 MAR 25"
          }

          // Handle Qty as a number or string
          let qty = row['Qty'];
          if (typeof qty === 'string') {
            qty = parseInt(qty.replace('+', '')) || 0; // Handle string case with + sign
          } else {
            qty = parseInt(qty) || 0; // Handle number case directly
          }

          return {
            ExecTime: row['Exec Time'] || 'N/A',
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

        console.log('Transformed Data:', transformedData); // Debug: Log transformed data

        // Group by Symbol, Strike, and Expiration
        const groupedByTrade = transformedData.reduce((acc, trade) => {
          const key = `${trade.Symbol}-${trade.Strike}-${trade.Expiration}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(trade);
          return acc;
        }, {});

        // Convert grouped data to an array of trades
        const groupedTrades = Object.keys(groupedByTrade).map(key => ({
          Symbol: groupedByTrade[key][0].Symbol,
          Strike: groupedByTrade[key][0].Strike,
          Expiration: groupedByTrade[key][0].Expiration,
          Transactions: groupedByTrade[key],
        }));

        console.log('Grouped Trades:', groupedTrades); // Debug log
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

  return (
    <div style={{ margin: '20px' }}>
      <label style={{ color: theme.colors.white }}>
        Upload Trade Data (Excel or CSV):
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          style={{ marginLeft: '10px' }}
        />
      </label>
    </div>
  );
};

export default TradeUploader;