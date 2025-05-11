import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const NotesContext = createContext();

// Helper function to standardize date format
const standardizeDate = (date) => {
  if (!date) return '';
  
  // If it's already in YYYY-MM-DD format, return as is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // Handle MM/DD/YYYY format
  if (typeof date === 'string' && date.includes('/')) {
    const [month, day, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Handle Date object
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }

  // Handle YYYY/MM/DD format
  if (typeof date === 'string' && date.includes('/')) {
    const [year, month, day] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return date;
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState({});
  const { currentUser } = useAuth();

  // Fetch notes when auth state changes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        let fetchedNotes = {};
        
        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().tradeNotes) {
            const rawNotes = userDoc.data().tradeNotes;
            fetchedNotes = Object.entries(rawNotes).reduce((acc, [date, note]) => {
              const standardizedDate = standardizeDate(date);
              if (standardizedDate) {
                acc[standardizedDate] = note;
              }
              return acc;
            }, {});
          }
        } else {
          const localNotes = localStorage.getItem('tradeNotes');
          if (localNotes) {
            const rawNotes = JSON.parse(localNotes);
            fetchedNotes = Object.entries(rawNotes).reduce((acc, [date, note]) => {
              const standardizedDate = standardizeDate(date);
              if (standardizedDate) {
                acc[standardizedDate] = note;
              }
              return acc;
            }, {});
          }
        }
        
        setNotes(fetchedNotes);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    fetchNotes();
  }, [currentUser]);

  const saveNote = async (date, noteContent) => {
    try {
      const standardizedDate = standardizeDate(date);
      if (!standardizedDate) {
        console.error('Invalid date format:', date);
        return;
      }

      const newNotes = {
        ...notes,
        [standardizedDate]: noteContent
      };

      // Update local state immediately
      setNotes(newNotes);

      // Update storage
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { tradeNotes: newNotes });
      } else {
        localStorage.setItem('tradeNotes', JSON.stringify(newNotes));
      }

      return true;
    } catch (error) {
      console.error('Error saving note:', error);
      // Revert local state if save fails
      setNotes(notes);
      return false;
    }
  };

  const getNote = (date) => {
    if (!date) return '';
    const standardizedDate = standardizeDate(date);
    return notes[standardizedDate] || '';
  };

  const hasNote = (date) => {
    if (!date) return false;
    const standardizedDate = standardizeDate(date);
    return Boolean(notes[standardizedDate]);
  };

  return (
    <NotesContext.Provider value={{ notes, saveNote, getNote, hasNote }}>
      {children}
    </NotesContext.Provider>
  );
}; 