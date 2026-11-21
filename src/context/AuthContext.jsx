import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db, ADMIN_UID, ADMIN_EMAIL } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (currentUser) {
        setUser(currentUser);
        const adminMatch =
          currentUser.uid === ADMIN_UID &&
          currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        setIsAdmin(adminMatch);

        if (!adminMatch) {
          const ref = doc(db, "students", currentUser.uid);
          unsubProfile = onSnapshot(
            ref,
            (snap) => {
              setStudentProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
              setLoading(false);
            },
            () => {
              setStudentProfile(null);
              setLoading(false);
            }
          );
        } else {
          setStudentProfile(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setStudentProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, studentProfile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
