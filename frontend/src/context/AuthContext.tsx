import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'MANAGER';
  mobile?: string;
  email?: string;
  address?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUserStr = localStorage.getItem('user');

      if (savedToken && savedUserStr) {
        try {
          // Verify token against backend
          setToken(savedToken);
          const response = await api.get('/auth/me');
          if (response.data?.success) {
            const profile = response.data.user;
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          } else {
            clearAuth();
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          clearAuth();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data?.success) {
        const { token, user: profile } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(profile));
        setToken(token);
        setUser(profile);
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (error: any) {
      clearAuth();
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error on backend:', error);
    } finally {
      clearAuth();
      setIsLoading(false);
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
