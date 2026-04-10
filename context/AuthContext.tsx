"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: FirebaseUser | null;
  userData: any | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // Unsubscribe from previous user doc listener if it exists
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }

      setUser(currentUser);
      
      if (currentUser) {
        // Real-time listener for custom user data
        unsubscribeUserDoc = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Check if user is banned
            if (data.bannedUntil) {
              const bannedUntil = new Date(data.bannedUntil);
              if (bannedUntil > new Date()) {
                // User is still banned
                setUserData({ ...data, isBanned: true });
              } else {
                setUserData(data);
              }
            } else {
              setUserData(data);
            }

            // Update lastSeen (throttle this in a real app, but for now every session/refresh is fine)
            updateDoc(doc(db, "users", currentUser.uid), {
              lastSeen: new Date().toISOString()
            }).catch(err => console.error("Error updating lastSeen:", err));
          }
          setLoading(false);
        }, (err) => {
          console.error("Error listening to user data:", err);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUserDoc();
    };
  }, []);

  const isAdmin = userData?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin }}>
      {userData?.isBanned ? (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Account Suspended</h1>
          <p className="text-slate-500 max-w-sm mb-8 font-medium">Your account has been suspended for violating community rules. Suspension ends on: <br/><span className="text-red-500 font-bold">{new Date(userData.bannedUntil).toLocaleDateString()} {new Date(userData.bannedUntil).toLocaleTimeString()}</span></p>
          <button onClick={() => auth.signOut()} className="btn-primary px-8">Sign Out</button>
        </div>
      ) : userData?.isArchived ? (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Account Deactivated</h1>
          <p className="text-slate-500 max-w-sm mb-8 font-medium">Your account has been deactivated. Please contact the administration if you believe this is a mistake.</p>
          <button onClick={() => auth.signOut()} className="btn-primary px-8">Sign Out</button>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
