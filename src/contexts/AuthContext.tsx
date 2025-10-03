// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api, User, getCurrentUser, isAuthenticated, isAdmin } from '@/utils/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  checkAuth: () => boolean;
  checkAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await api.login(email, password);
      setUser(result.user);
      
      // Redirect based on role
      if (result.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/home');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const result = await api.register(data);
      setUser(result.user);
      router.push('/home');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local data even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const checkAuth = () => {
    return isAuthenticated();
  };

  const checkAdmin = () => {
    return isAdmin();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateUser, 
      checkAuth, 
      checkAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hooks for protecting pages
export function useAuthRequired(redirectTo: string = '/login') {
  const { checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!checkAuth()) {
      alert('กรุณาเข้าสู่ระบบก่อนเพื่อเข้าถึงหน้านี้');
      router.push(redirectTo);
    }
  }, [checkAuth, router, redirectTo]);

  return checkAuth();
}

export function useAdminRequired(redirectTo: string = '/home') {
  const { checkAuth, checkAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!checkAuth()) {
      alert('กรุณาเข้าสู่ระบบก่อนเพื่อเข้าถึงหน้า Admin');
      router.push('/login');
      return;
    }

    if (!checkAdmin()) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้า Admin\nเฉพาะผู้ดูแลระบบเท่านั้น');
      router.push(redirectTo);
      return;
    }
  }, [checkAuth, checkAdmin, router, redirectTo]);

  return checkAuth() && checkAdmin();
}

// Higher-order component for protecting pages
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { requireAdmin?: boolean; redirectTo?: string } = {}
) => {
  const AuthenticatedComponent = (props: P) => {
    const router = useRouter();
    const { checkAuth, checkAdmin } = useAuth();
    const { requireAdmin = false, redirectTo = '/login' } = options;

    useEffect(() => {
      if (!checkAuth()) {
        alert('กรุณาเข้าสู่ระบบก่อนเพื่อเข้าถึงหน้านี้');
        router.push('/login');
        return;
      }

      if (requireAdmin && !checkAdmin()) {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้\nเฉพาะผู้ดูแลระบบเท่านั้น');
        router.push(redirectTo);
        return;
      }
    }, [checkAuth, checkAdmin, router]);

    if (!checkAuth() || (requireAdmin && !checkAdmin())) {
      return (
        <div className="min-h-screen w-full bg-[#EBE6DE] flex flex-col items-center justify-center">
          <p className="text-2xl text-[#69806C] font-['Iceland']">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  return AuthenticatedComponent;
};