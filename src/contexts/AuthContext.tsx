import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  authRequired: boolean;
  authenticated: boolean;
  loading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authRequired, setAuthRequired] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/auth/status', {
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error('Failed to check auth status');
      }

      const data = await response.json();
      setAuthRequired(data.authRequired);
      setAuthenticated(data.authenticated);
      setError(null);
    } catch (err) {
      console.error('Error checking auth status:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const login = async (password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      setAuthenticated(true);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setAuthenticated(false);
      setError(null);
    } catch (err) {
      console.error('Error logging out:', err);
      setError('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authRequired,
        authenticated,
        loading,
        login,
        logout,
        error,
      }}
    >
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

