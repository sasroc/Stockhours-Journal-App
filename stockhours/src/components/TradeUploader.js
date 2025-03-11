import React from 'react';
import * as XLSX from 'xlsx';
import { theme } from '../theme';

const TradeUploader = ({ setTradeData }) => {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      setTradeData(data);
    };
    
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ margin: '20px' }}>
      <label style={{ color: theme.colors.white }}>
        Upload Trade Data (Excel):
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          style={{ marginLeft: '10px' }}
        />
      </label>
    </div>
  );
};

export default TradeUploader;