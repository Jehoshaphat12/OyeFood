import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Vendor, VendorLocation } from '../types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { VendorAuthService } from '../services/vendorAuthService';

// Match the exact shape your UI is sending
export interface RegisterInput {
  owner: string; email: string; phone: string; password: string;
  name: string; desc: string; category: string; open: string; close: string; location: VendorLocation;
}

interface AuthContextType {
  vendor: Vendor | null;
  loading: boolean;
  login(id: string, password: string): Promise<string | void>;
  register(i: RegisterInput): Promise<string | void>; // Takes the whole object
  logout(): void;
  update(patch: Partial<Vendor>): Promise<void>;
}

const AuthCtx = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth outside provider');
  return c;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const { getDoc, doc } = await import('firebase/firestore');
        const { firestore } = await import('../lib/firebase');
        const snap = await getDoc(doc(firestore, 'vendors', fbUser.uid));
        if (snap.exists()) {
          setVendor(snap.data() as Vendor);
        }
      } else {
        setVendor(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login: AuthContextType['login'] = async (id, password) => {
    try {
      const v = await VendorAuthService.login(id, password);
      setVendor(v);
    } catch (error: any) {
      // Return friendly error messages based on Firebase Auth errors
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        return 'Invalid email/phone or password.';
      }
      return error.message;
    }
  };

  const register: AuthContextType['register'] = async (input) => {
    try {
      const v = await VendorAuthService.register(input);
      setVendor(v);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return 'An account with this email already exists.';
      }
      return error.message;
    }
  };

  const logout = async () => {
    await VendorAuthService.logout();
    setVendor(null);
  };

  const update: AuthContextType['update'] = async (patch) => {
    if (!vendor) return;
    const { doc, updateDoc } = await import('firebase/firestore');
    const { firestore } = await import('../lib/firebase');
    
    await updateDoc(doc(firestore, 'vendors', vendor.id), patch);
    setVendor(prev => prev ? { ...prev, ...patch } : null);
  };

  return (
    <AuthCtx.Provider value={{ vendor, loading, login, register, logout, update }}>
      {children}
    </AuthCtx.Provider>
  );
}