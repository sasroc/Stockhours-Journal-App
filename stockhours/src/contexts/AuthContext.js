import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.isAdmin === true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, invitationCode) => {
    let userCredential = null;
    let userRef = null;
    
    try {
      // Query for the invitation code
      const codesRef = collection(db, 'invitationCodes');
      const q = query(codesRef, where('code', '==', invitationCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid invitation code');
      }
      
      const codeDoc = querySnapshot.docs[0];
      const codeData = codeDoc.data();
      
      if (codeData.used) {
        throw new Error('Invitation code has already been used');
      }
      
      // Create the user with Firebase Auth
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create the user document in Firestore
      userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: email,
        isAdmin: false,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      
      // Mark the invitation code as used
      await updateDoc(codeDoc.ref, {
        used: true,
        usedBy: user.uid,
        usedAt: serverTimestamp(),
        usedByEmail: email
      });
      
      return user;
      
    } catch (error) {
      // Cleanup if we created a user but something else failed
      if (userCredential?.user) {
        try {
          await userCredential.user.delete();
        } catch (deleteError) {
          console.error('Error cleaning up Firebase Auth user:', deleteError);
        }
      }
      
      if (userRef) {
        try {
          await deleteDoc(userRef);
        } catch (deleteError) {
          console.error('Error cleaning up Firestore user document:', deleteError);
        }
      }
      
      throw error;
    }
  };

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login timestamp
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp()
      });
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
    isAdmin,
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 