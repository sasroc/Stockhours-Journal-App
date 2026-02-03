import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscription, setSubscription] = useState({ status: 'inactive', plan: 'none' });
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const getDefaultSubscription = () => ({
    status: 'inactive',
    plan: 'none',
  });

  const createUserDocument = async (user, email) => {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: email || user.email || '',
      isAdmin: false,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      tradeData: [],
      uploadedFiles: [],
      lastUpdated: serverTimestamp(),
      subscription: {
        status: 'inactive',
        plan: 'none',
        updatedAt: serverTimestamp()
      }
    });
    return userRef;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setSubscriptionLoading(true);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.isAdmin === true);
            const nextSubscription = userData.subscription || getDefaultSubscription();
            setSubscription({
              status: nextSubscription.status || 'inactive',
              plan: nextSubscription.plan || 'none'
            });
            if (!userData.subscription) {
              await updateDoc(userDocRef, { subscription: { ...getDefaultSubscription(), updatedAt: serverTimestamp() } });
            }
          } else {
            setIsAdmin(false);
            setSubscription(getDefaultSubscription());
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          setSubscription(getDefaultSubscription());
        }
      } else {
        setIsAdmin(false);
        setSubscription(getDefaultSubscription());
      }
      setCurrentUser(user);
      setLoading(false);
      setSubscriptionLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await createUserDocument(user, email);
    return user;
  };

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login timestamp and ensure trade data fields exist
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
          tradeData: userData.tradeData || [],
          uploadedFiles: userData.uploadedFiles || [],
          lastUpdated: userData.lastUpdated || serverTimestamp()
        });
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      const userDocData = userDoc.exists() ? userDoc.data() : null;

      if (!userDocData) {
        await createUserDocument(user, user.email);
      }

      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        tradeData: userDocData?.tradeData || [],
        uploadedFiles: userDocData?.uploadedFiles || [],
        lastUpdated: userDocData?.lastUpdated || serverTimestamp()
      });

      return user;
    } catch (error) {
      throw error;
    }
  };

  const signUpWithApple = async () => {
    const provider = new OAuthProvider('apple.com');
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await createUserDocument(user, user.email);
    }

    await updateDoc(userDocRef, {
      lastLogin: serverTimestamp(),
      tradeData: userDoc.exists() ? userDoc.data().tradeData || [] : [],
      uploadedFiles: userDoc.exists() ? userDoc.data().uploadedFiles || [] : [],
      lastUpdated: userDoc.exists() ? userDoc.data().lastUpdated || serverTimestamp() : serverTimestamp()
    });

    return user;
  };

  function logout() {
    return signOut(auth);
  }

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      throw error;
    }
  }

  const isSubscribed = subscription.status === 'active' || subscription.status === 'trialing';
  const isPro = isSubscribed && subscription.plan === 'pro';

  const refreshSubscription = async () => {
    if (!currentUser) return;
    setSubscriptionLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const nextSubscription = userData.subscription || getDefaultSubscription();
        setSubscription({
          status: nextSubscription.status || 'inactive',
          plan: nextSubscription.plan || 'none'
        });
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const value = {
    currentUser,
    isAdmin,
    loading,
    subscription,
    subscriptionLoading,
    isSubscribed,
    isPro,
    refreshSubscription,
    signup,
    login,
    signInWithGoogle,
    signUpWithApple,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 