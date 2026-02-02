// TradeLens/stockhours/src/components/ImportsScreen.js
import React from 'react';
import { theme } from '../theme';

const ImportsScreen = ({ uploadedFiles, onDeleteFile }) => {
  return (
    <div style={{ color: theme.colors.white }}>
      <h2 style={{ marginBottom: '20px' }}>Imports Screen</h2>
      {uploadedFiles.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        <div>
          <p style={{ marginBottom: '15px' }}>Uploaded Files:</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {uploadedFiles.map((file, index) => (
              <li
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  backgroundColor: '#1a1a1a',
                  marginBottom: '10px',
                  borderRadius: '4px',
                }}
              >
                <span>{file.name}</span>
                <button
                  onClick={() => onDeleteFile(file.name)}
                  style={{
                    backgroundColor: theme.colors.red,
                    color: theme.colors.white,
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImportsScreen;