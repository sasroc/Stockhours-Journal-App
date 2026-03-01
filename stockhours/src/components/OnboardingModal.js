import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const GOAL_OPTIONS = [
  { emoji: '📈', label: 'Grow my account consistently' },
  { emoji: '🛡️', label: 'Build risk discipline' },
  { emoji: '💼', label: 'Become a full-time trader' },
  { emoji: '💰', label: 'Supplement my income' },
  { emoji: '🧘', label: 'Reduce emotional trading' },
  { emoji: '🎯', label: 'Improve my entries & exits' },
  { emoji: '📚', label: 'Master a specific strategy' },
  { emoji: '🏆', label: 'Hit monthly profit targets' },
];

const PRESET_LABELS = new Set(GOAL_OPTIONS.map(o => o.label));

const OnboardingModal = ({ open, onClose, editMode = false }) => {
  const { currentUser, tradingProfile, refreshTradingProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState(new Set());
  const [otherGoal, setOtherGoal] = useState('');
  const [maxLossPercent, setMaxLossPercent] = useState('');
  const [maxLossDollars, setMaxLossDollars] = useState('');
  const [targetGainPercent, setTargetGainPercent] = useState('');
  const [targetGainDollars, setTargetGainDollars] = useState('');
  const [saving, setSaving] = useState(false);
  const [hoveredGoal, setHoveredGoal] = useState(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    if (editMode && tradingProfile) {
      const existing = tradingProfile.goals || '';
      const parts = existing.split('; ').filter(Boolean);
      const matched = new Set();
      const unmatched = [];
      for (const part of parts) {
        if (PRESET_LABELS.has(part)) matched.add(part);
        else unmatched.push(part);
      }
      setSelectedGoals(matched);
      setOtherGoal(unmatched.join('; '));
      setMaxLossPercent(tradingProfile.maxLossPercent != null ? String(tradingProfile.maxLossPercent) : '');
      setMaxLossDollars(tradingProfile.maxLossDollars != null ? String(tradingProfile.maxLossDollars) : '');
      setTargetGainPercent(tradingProfile.targetGainPercent != null ? String(tradingProfile.targetGainPercent) : '');
      setTargetGainDollars(tradingProfile.targetGainDollars != null ? String(tradingProfile.targetGainDollars) : '');
    } else if (!editMode) {
      setSelectedGoals(new Set());
      setOtherGoal('');
      setMaxLossPercent('');
      setMaxLossDollars('');
      setTargetGainPercent('');
      setTargetGainDollars('');
    }
  }, [open, editMode, tradingProfile]);

  if (!open) return null;

  const toggleGoal = (label) => {
    setSelectedGoals(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const buildGoalsString = () => {
    const parts = Array.from(selectedGoals).sort();
    const trimmed = otherGoal.trim();
    if (trimmed) parts.push(trimmed);
    return parts.join('; ');
  };

  const parseNum = (val) => val !== '' ? parseFloat(val) : null;

  const handleSave = async (skipped = false) => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const profile = {
        goals: skipped ? (tradingProfile?.goals || '') : buildGoalsString(),
        maxLossPercent: skipped ? (tradingProfile?.maxLossPercent ?? null) : parseNum(maxLossPercent),
        maxLossDollars: skipped ? (tradingProfile?.maxLossDollars ?? null) : parseNum(maxLossDollars),
        targetGainPercent: skipped ? (tradingProfile?.targetGainPercent ?? null) : parseNum(targetGainPercent),
        targetGainDollars: skipped ? (tradingProfile?.targetGainDollars ?? null) : parseNum(targetGainDollars),
        onboardingCompleted: true,
      };
      await updateDoc(userDocRef, { tradingProfile: profile });
      await refreshTradingProfile();
      onClose();
    } catch (err) {
      console.error('Error saving trading profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const title = editMode ? 'Update Your Strategy' : (step === 1 ? 'Your Trading Goals' : 'Your Strategy Rules');

  const inputStyle = {
    width: '100%',
    backgroundColor: '#0A1628',
    color: '#fff',
    border: '1px solid #2B3D55',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    color: '#8899AA',
    marginBottom: '8px',
    fontWeight: 500,
  };

  const hintStyle = {
    fontSize: '12px',
    color: '#8899AA',
    marginTop: '6px',
  };

  const btnPrimary = {
    backgroundColor: '#2DD4BF',
    color: '#0A1628',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: saving ? 'not-allowed' : 'pointer',
    opacity: saving ? 0.7 : 1,
  };

  const btnSecondary = {
    backgroundColor: 'transparent',
    color: '#8899AA',
    border: '1px solid #2B3D55',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    cursor: 'pointer',
  };

  const stepBar = (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
      {[1, 2].map(i => (
        <div
          key={i}
          style={{
            flex: 1,
            height: '3px',
            borderRadius: '2px',
            backgroundColor: i <= step ? '#2DD4BF' : '#2B3D55',
            transition: 'background-color 0.2s',
          }}
        />
      ))}
    </div>
  );

  const goalChipStyle = (label) => {
    const sel = selectedGoals.has(label);
    const hov = hoveredGoal === label;
    return {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '12px 14px',
      backgroundColor: sel ? 'rgba(45, 212, 191, 0.1)' : hov ? '#0F2540' : '#0D1B2E',
      border: `1.5px solid ${sel ? '#2DD4BF' : '#2B3D55'}`,
      borderRadius: '10px',
      cursor: 'pointer',
      textAlign: 'left',
      width: '100%',
      boxSizing: 'border-box',
      minHeight: '64px',
      transition: 'background-color 0.12s, border-color 0.12s',
    };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && editMode && onClose()}
    >
      <div
        style={{
          backgroundColor: '#121F35',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '520px',
          width: '100%',
          boxSizing: 'border-box',
          border: '1px solid #233350',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {!editMode && stepBar}

        <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#fff', fontWeight: 700 }}>{title}</h2>

        {!editMode && step === 1 && (
          <p style={{ color: '#8899AA', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.5 }}>
            Select everything that applies — your AI coaching will be tailored around these goals.
          </p>
        )}
        {!editMode && step === 2 && (
          <p style={{ color: '#8899AA', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.5 }}>
            Set per-trade rules so AI can flag when you're breaking your own strategy.
          </p>
        )}
        {editMode && (
          <p style={{ color: '#8899AA', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.5 }}>
            Update your trading goals and per-trade strategy rules.
          </p>
        )}

        {/* ── Goals step ── */}
        {(step === 1 || editMode) && (
          <div style={{ marginBottom: editMode ? '24px' : 0 }}>
            {editMode && (
              <div style={{ ...labelStyle, marginBottom: '14px' }}>Trading goals</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {GOAL_OPTIONS.map(option => (
                <button
                  key={option.label}
                  onClick={() => toggleGoal(option.label)}
                  onMouseEnter={() => setHoveredGoal(option.label)}
                  onMouseLeave={() => setHoveredGoal(null)}
                  style={goalChipStyle(option.label)}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>
                    {option.emoji}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    color: selectedGoals.has(option.label) ? '#2DD4BF' : '#CBD5E1',
                    fontWeight: selectedGoals.has(option.label) ? 600 : 400,
                    lineHeight: 1.35,
                    flex: 1,
                  }}>
                    {option.label}
                  </span>
                  {selectedGoals.has(option.label) && (
                    <span style={{ color: '#2DD4BF', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            <div>
              <label style={{ ...labelStyle, fontSize: '12px', color: '#6B7C93', marginBottom: '6px' }}>
                Something else?
              </label>
              <input
                type="text"
                value={otherGoal}
                onChange={e => setOtherGoal(e.target.value)}
                placeholder="Describe your goal..."
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* ── Rules step ── */}
        {(step === 2 || editMode) && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Max loss per position</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={maxLossPercent}
                    onChange={e => setMaxLossPercent(e.target.value)}
                    placeholder="e.g., 10"
                    style={{ ...inputStyle, paddingRight: '32px' }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8899AA', fontSize: '13px', pointerEvents: 'none' }}>%</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8899AA', fontSize: '13px', pointerEvents: 'none' }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={maxLossDollars}
                    onChange={e => setMaxLossDollars(e.target.value)}
                    placeholder="e.g., 500"
                    style={{ ...inputStyle, paddingLeft: '26px' }}
                  />
                </div>
              </div>
              <div style={hintStyle}>The most you're willing to lose on a single trade before cutting</div>
            </div>

            <div>
              <label style={labelStyle}>Target gain per position</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={targetGainPercent}
                    onChange={e => setTargetGainPercent(e.target.value)}
                    placeholder="e.g., 10"
                    style={{ ...inputStyle, paddingRight: '32px' }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8899AA', fontSize: '13px', pointerEvents: 'none' }}>%</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8899AA', fontSize: '13px', pointerEvents: 'none' }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={targetGainDollars}
                    onChange={e => setTargetGainDollars(e.target.value)}
                    placeholder="e.g., 500"
                    style={{ ...inputStyle, paddingLeft: '26px' }}
                  />
                </div>
              </div>
              <div style={hintStyle}>Your profit target per trade</div>
            </div>
          </div>
        )}

        {/* ── Bottom bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '28px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {step === 2 && !editMode && (
              <button style={btnSecondary} onClick={() => setStep(1)}>Back</button>
            )}
            {step === 1 && !editMode && (
              <button style={btnPrimary} onClick={() => setStep(2)}>Next</button>
            )}
            {(step === 2 || editMode) && (
              <button style={btnPrimary} disabled={saving} onClick={() => handleSave(false)}>
                {saving ? 'Saving...' : (editMode ? 'Save Changes' : 'Finish')}
              </button>
            )}
          </div>
          {!editMode && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              style={{
                background: 'none',
                border: 'none',
                color: '#8899AA',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px',
              }}
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
