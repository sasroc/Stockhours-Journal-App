import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 1rem;
  &:hover {
    background-color: #0056b3;
  }
`;

const CodeList = styled.div`
  margin-top: 2rem;
`;

const CodeItem = styled.div`
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Status = styled.span`
  color: #28a745;
`;

export default function InvitationManager() {
  const { isAdmin, currentUser } = useAuth();
  const [codes, setCodes] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      loadCodes();
    }
  }, [isAdmin, currentUser]);

  const loadCodes = async () => {
    try {
      const q = query(collection(db, 'invitationCodes'), where('used', '==', false));
      const querySnapshot = await getDocs(q);
      const loadedCodes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCodes(loadedCodes);
    } catch (error) {
      console.error('Error loading codes:', error);
    }
  };

  const generateCode = async () => {
    try {
      const code = Math.random().toString(36).substring(2, 15);
      await addDoc(collection(db, 'invitationCodes'), {
        code,
        used: false,
        createdAt: new Date()
      });
      loadCodes();
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  if (!isAdmin) {
    return (
      <Container>
        <Title>Access Denied</Title>
        <p>Admin privileges required.</p>
        <p>Current user: {currentUser?.email}</p>
        <p>Admin status: {isAdmin ? 'Yes' : 'No'}</p>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Invitation Code Manager</Title>
      <Button onClick={generateCode}>Generate New Code</Button>
      <CodeList>
        <h3>Available Codes</h3>
        {codes.length === 0 ? (
          <p>No available invitation codes. Generate a new code to get started.</p>
        ) : (
          codes.map(code => (
            <CodeItem key={code.id}>
              <span>{code.code}</span>
              <Status>Available</Status>
            </CodeItem>
          ))
        )}
      </CodeList>
    </Container>
  );
} 