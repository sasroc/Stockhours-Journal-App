import React, { useState, useRef, useEffect } from 'react';
import { theme } from '../theme';

const TagSelectionModal = ({ isOpen, onClose, onSave, setupsTags, mistakesTags, selectedSetups = [], selectedMistakes = [], onAddNewTag }) => {
  const [localSelectedSetups, setLocalSelectedSetups] = useState(selectedSetups);
  const [localSelectedMistakes, setLocalSelectedMistakes] = useState(selectedMistakes);
  const [showSetupsDropdown, setShowSetupsDropdown] = useState(false);
  const [showMistakesDropdown, setShowMistakesDropdown] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [activeInput, setActiveInput] = useState(null); // 'setups' or 'mistakes'
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSetupsDropdown(false);
        setShowMistakesDropdown(false);
        setActiveInput(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      setups: localSelectedSetups,
      mistakes: localSelectedMistakes
    });
    onClose();
  };

  const toggleTag = (tag, type) => {
    if (type === 'setup') {
      setLocalSelectedSetups(prev => 
        prev.includes(tag) 
          ? prev.filter(t => t !== tag)
          : [...prev, tag]
      );
    } else {
      setLocalSelectedMistakes(prev => 
        prev.includes(tag) 
          ? prev.filter(t => t !== tag)
          : [...prev, tag]
      );
    }
  };

  const handleAddNewTag = (type) => {
    if (newTagInput.trim()) {
      onAddNewTag(type, newTagInput.trim());
      toggleTag(newTagInput.trim(), type);
      setNewTagInput('');
      setActiveInput(null);
    }
  };

  const renderDropdown = (type, tags, selectedTags, setSelectedTags) => {
    const isActive = activeInput === type;
    const isExpanded = type === 'setup' ? showSetupsDropdown : showMistakesDropdown;
    const color = type === 'setup' ? theme.colors.green : theme.colors.red;

    return (
      <div style={{ position: 'relative' }}>
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#253650',
            borderRadius: '8px',
            cursor: 'pointer',
            border: `1px solid ${isExpanded ? color : '#344563'}`,
            transition: 'all 0.2s ease'
          }}
          onClick={() => {
            if (type === 'setup') {
              setShowSetupsDropdown(!showSetupsDropdown);
              setShowMistakesDropdown(false);
            } else {
              setShowMistakesDropdown(!showMistakesDropdown);
              setShowSetupsDropdown(false);
            }
          }}
        >
          <span style={{ color: theme.colors.white, fontSize: '14px' }}>
            {type === 'setup' ? 'Setups' : 'Mistakes'}
          </span>
          <span style={{ color: theme.colors.white }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
        
        {isExpanded && (
          <div 
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              backgroundColor: '#253650',
              borderRadius: '8px',
              border: `1px solid ${color}`,
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Search/Add new tag input */}
            <div style={{ padding: '8px', borderBottom: '1px solid #333' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={isActive ? newTagInput : ''}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onFocus={() => setActiveInput(type)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNewTag(type);
                    } else if (e.key === 'Escape') {
                      setActiveInput(null);
                      setNewTagInput('');
                    }
                  }}
                  placeholder="Add new tag..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#1B2B43',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: theme.colors.white,
                    fontSize: '14px'
                  }}
                />
                {isActive && (
                  <button
                    onClick={() => handleAddNewTag(type)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: color,
                      color: theme.colors.white,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Add
                  </button>
                )}
              </div>
            </div>

            {/* Tags list */}
            <div style={{ padding: '4px' }}>
              {tags.map(tag => (
                <div
                  key={tag}
                  onClick={() => toggleTag(tag, type)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: selectedTags.includes(tag) ? '#2B3C5A' : 'transparent',
                    color: theme.colors.white,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease',
                    ':hover': {
                      backgroundColor: '#2B3C5A'
                    }
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: `2px solid ${color}`,
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selectedTags.includes(tag) ? color : 'transparent'
                  }}>
                    {selectedTags.includes(tag) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17L4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '14px' }}>{tag}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: theme.colors.black,
        padding: '24px',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90vw',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ color: theme.colors.white, marginBottom: '24px', fontSize: '20px' }}>Add Tags</h2>
        
        {/* Setups Dropdown */}
        <div style={{ marginBottom: '20px' }}>
          {renderDropdown('setup', setupsTags, localSelectedSetups, setLocalSelectedSetups)}
        </div>

        {/* Mistakes Dropdown */}
        <div style={{ marginBottom: '20px' }}>
          {renderDropdown('mistake', mistakesTags, localSelectedMistakes, setLocalSelectedMistakes)}
        </div>

        {/* Selected Tags Display */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {localSelectedSetups.map(tag => (
              <span
                key={`setup-${tag}`}
                style={{
                  background: theme.colors.green,
                  color: theme.colors.white,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {tag}
                <span
                  onClick={() => toggleTag(tag, 'setup')}
                  style={{ cursor: 'pointer', opacity: 0.8, ':hover': { opacity: 1 } }}
                >
                  ×
                </span>
              </span>
            ))}
            {localSelectedMistakes.map(tag => (
              <span
                key={`mistake-${tag}`}
                style={{
                  background: theme.colors.red,
                  color: theme.colors.white,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {tag}
                <span
                  onClick={() => toggleTag(tag, 'mistake')}
                  style={{ cursor: 'pointer', opacity: 0.8, ':hover': { opacity: 1 } }}
                >
                  ×
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#344563',
              color: theme.colors.white,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s ease',
              ':hover': {
                backgroundColor: '#3D5070'
              }
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: theme.colors.green,
              color: theme.colors.white,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s ease',
              ':hover': {
                backgroundColor: '#2ecc71'
              }
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagSelectionModal; 