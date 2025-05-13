import React, { useState, useEffect } from 'react';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const NoteModal = ({ isOpen, onClose, date, existingNote = '', onNoteSaved }) => {
  const [note, setNote] = useState(existingNote);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setNote(existingNote);
    }
  }, [isOpen, existingNote]);

  const handleSave = async () => {
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data() || {};
      const notes = userData.notes || {};
      const updatedNotes = {
        ...notes,
        [date]: note
      };
      
      await updateDoc(userDocRef, {
        notes: updatedNotes
      });
      onNoteSaved(updatedNotes);
    } else {
      const notes = JSON.parse(localStorage.getItem('tradeNotes') || '{}');
      const updatedNotes = {
        ...notes,
        [date]: note
      };
      localStorage.setItem('tradeNotes', JSON.stringify(updatedNotes));
      onNoteSaved(updatedNotes);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#111',
          padding: '32px',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 4px 32px 0 #000a',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: theme.colors.white, marginBottom: '10px' }}>
            {new Date(date.split('-').join('/')).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'long',
              day: '2-digit',
              year: 'numeric'
            })}
          </h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              width: '100%',
              height: '200px',
              padding: '12px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: theme.colors.white,
              fontSize: '14px',
              resize: 'vertical',
              marginBottom: '20px',
            }}
            placeholder="Add your notes for this trading day..."
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#333',
              color: theme.colors.white,
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              backgroundColor: theme.colors.green,
              color: theme.colors.white,
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal; 