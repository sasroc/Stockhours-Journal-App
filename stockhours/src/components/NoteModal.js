import React, { useState, useEffect, useRef } from 'react';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/QuillEditor.css';

const NoteModal = ({ isOpen, onClose, date, existingNote = '', onNoteSaved }) => {
  const [note, setNote] = useState('');
  const { currentUser } = useAuth();
  const quillRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNote(existingNote || '');
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

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ]
    }
  };

  const formats = [
    'header',
    'font',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link', 'image'
  ];

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
          backgroundColor: '#121F35',
          padding: '32px',
          borderRadius: '16px',
          maxWidth: '800px',
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
          <div style={{ 
            backgroundColor: '#1B2B43',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <ReactQuill
              ref={quillRef}
              value={note}
              onChange={setNote}
              modules={modules}
              formats={formats}
              placeholder="Add your notes for this trading day..."
              style={{
                backgroundColor: '#1B2B43',
                color: theme.colors.white,
              }}
              theme="snow"
              preserveWhitespace={true}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#344563',
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
              backgroundColor: theme.colors.teal,
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