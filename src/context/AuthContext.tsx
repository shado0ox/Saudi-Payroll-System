import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, UserSafeProfile } from '../types';

interface AuthContextType {
  user: UserSafeProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<boolean>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'apex_payroll_access_token';
const REFRESH_TOKEN_KEY = 'apex_payroll_refresh_token';
const USER_KEY = 'apex_payroll_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSafeProfile | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  });

  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Default admin fallback if not logged in
  useEffect(() => {
    const initAuth = async () => {
      if (accessToken && refreshToken) {
        // Validate profile
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (data.success) {
            setUser(data.data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
          } else {
            // Try refresh
            await refreshAuthToken();
          }
        } catch (e) {
          console.warn('Auth token verification failed on init:', e);
        }
      } else {
        // Auto demo login as admin on first launch
        await autoDemoLoginAdmin();
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const autoDemoLoginAdmin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'AdminPassword123!' })
      });
      const data = await res.json();
      if (data.success) {
        setAccessToken(data.data.tokens.accessToken);
        setRefreshToken(data.data.tokens.refreshToken);
        setUser(data.data.user);
        localStorage.setItem(ACCESS_TOKEN_KEY, data.data.tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.data.tokens.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      }
    } catch (e) {
      console.warn('Auto demo login failed:', e);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!data.success) {
        return { success: false, error: data.error?.message || 'Login failed.' };
      }

      const { user: u, tokens } = data.data;
      setUser(u);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);

      localStorage.setItem(USER_KEY, JSON.stringify(u));
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  };

  const refreshAuthToken = async (): Promise<boolean> => {
    if (!refreshToken) return false;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const data = await res.json();

      if (data.success) {
        const newAccess = data.data.accessToken;
        const newRefresh = data.data.refreshToken;
        setAccessToken(newAccess);
        setRefreshToken(newRefresh);
        localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
        return true;
      } else {
        // Refresh token invalid, clear auth
        logout();
        return false;
      }
    } catch (err) {
      console.error('Failed to refresh token:', err);
      return false;
    }
  };

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    let response = await fetch(url, { ...options, headers });

    // Handle token expiration & retry with token refresh
    if (response.status === 401) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        const latestAccess = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (latestAccess) {
          headers.set('Authorization', `Bearer ${latestAccess}`);
          response = await fetch(url, { ...options, headers });
        }
      }
    }

    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        role: user?.role || null,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        login,
        logout,
        refreshAuthToken,
        authFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
