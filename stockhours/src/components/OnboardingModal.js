import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const OnboardingModal = ({ open, onClose, editMode = false }) => {
  const { currentUser, tradingProfile, refreshTradingProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [goals, setGoals] = useState('');
  const [maxLossPercent, setMaxLossPercent] = useState('');
  const [maxLossDollars, setMaxLossDollars] = useState('');
  const [targetGainPercent, setTargetGainPercent] = useState('');
  const [targetGainDollars, setTargetGainDollars] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && editMode && tradingProfile) {
      setGoals(tradingProfile.goals || '');
      setMaxLossPercent(tradingProfile.maxLossPercent != null ? String(tradingProfile.maxLossPercent) : '');
      setMaxLossDollars(tradingProfile.maxLossDollars != null ? String(tradingProfile.maxLossDollars) : '');
      setTargetGainPercent(tradingProfile.targetGainPercent != null ? String(tradingProfile.targetGainPercent) : '');
      setTargetGainDollars(tradingProfile.targetGainDollars != null ? String(tradingProfile.targetGainDollars) : '');
    }
    if (open) setStep(1);
  }, [open, editMode, tradingProfile]);

  if (!open) return null;

  const parseNum = (val) => val !== '' ? parseFloat(val) : null;

  const handleSave = async (skipped = false) => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const profile = {
        goals: skipped ? (tradingProfile?.goals || '') : goals.trim(),
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

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  };

  const cardStyle = {
    backgroundColor: '#121F35',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '520px',
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #233350',
    position: 'relative',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    color: '#8899AA',
    marginBottom: '8px',
    fontWeight: 500,
  };

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

  const stepIndicator = (
    <div style={{ fontSize: '12px', color: '#8899AA', marginBottom: '8px' }}>
      Step {step} of 2
    </div>
  );

  const title = editMode ? 'Update Your Strategy' : (step === 1 ? 'Your Trading Goals' : 'Your Strategy Rules');

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && editMode && onClose()}>
      <div style={cardStyle}>
        {stepIndicator}
        <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#fff' }}>{title}</h2>
        {!editMode && step === 1 && (
          <p style={{ color: '#8899AA', fontSize: '14px', margin: '0 0 24px' }}>
            Tell us what you're working toward — your AI coaching will be tailored to your goals.
          </p>
        )}
        {!editMode && step === 2 && (
          <p style={{ color: '#8899AA', fontSize: '14px', margin: '0 0 24px' }}>
            Set per-trade rules so AI can flag when you're breaking your own strategy.
          </p>
        )}
        {editMode && (
          <p style={{ color: '#8899AA', fontSize: '14px', margin: '0 0 24px' }}>
            Update your trading goals and per-trade strategy rules.
          </p>
        )}

        {(step === 1 || editMode) && (
          <div style={{ marginBottom: editMode ? '20px' : 0 }}>
            <label style={labelStyle}>What are your goals as a trader?</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={4}
              placeholder="e.g., Build consistent income, grow my account 10% per month, become more disciplined..."
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>
        )}

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
                    onChange={(e) => setMaxLossPercent(e.target.value)}
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
                    onChange={(e) => setMaxLossDollars(e.target.value)}
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
                    onChange={(e) => setTargetGainPercent(e.target.value)}
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
                    onChange={(e) => setTargetGainDollars(e.target.value)}
                    placeholder="e.g., 500"
                    style={{ ...inputStyle, paddingLeft: '26px' }}
                  />
                </div>
              </div>
              <div style={hintStyle}>Your profit target per trade</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '28px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(step === 2 && !editMode) && (
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
