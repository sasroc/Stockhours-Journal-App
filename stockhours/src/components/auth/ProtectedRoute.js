import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, requireSubscription = true }) {
  const { currentUser, isSubscribed, subscriptionLoading } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (subscriptionLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }

  if (requireSubscription && !isSubscribed) {
    return <Navigate to="/paywall" replace />;
  }

  return children;
}