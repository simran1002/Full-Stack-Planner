import React from 'react';

// Define User interface
interface User {
  id: number;
  email: string;
  name: string;
}

// Define AuthContext type
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => boolean; // New function to check authentication status
}

// Create context with a default undefined value
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  // State hooks
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Debug authentication state changes
  React.useEffect(() => {
    console.log('Auth state changed:', { 
      isAuthenticated, 
      hasToken: !!token, 
      hasLocalToken: !!localStorage.getItem('token')
    });
  }, [isAuthenticated, token]);

  // Function to fetch user data
  const fetchUserData = React.useCallback(async (authToken: string | null = token) => {
    if (!authToken) return null;
    
    try {
      const response = await fetch('http://localhost:8080/user/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        return userData;
      } else if (response.status === 401) {
        throw new Error('401 Unauthorized');
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }, [token]);

  // Initialize authentication state
  React.useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      console.log('Initializing auth with token:', storedToken ? 'exists' : 'none');
      
      if (!storedToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Set token immediately
      setToken(storedToken);
      setIsAuthenticated(true);
      
      try {
        const userData = await fetchUserData(storedToken);
        if (userData) {
          setUser(userData);
          console.log('User authenticated from stored token');
        } else {
          // Don't clear token on network errors
          console.warn('Could not fetch user data, but keeping token');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Only clear token if unauthorized
        if (error instanceof Error && error.message.includes('401')) {
          console.log('Unauthorized, clearing token');
          localStorage.removeItem('token');
          setToken(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, [fetchUserData]);

  // Function to check if user is authenticated
  const checkAuth = React.useCallback(() => {
    const hasToken = !!localStorage.getItem('token');
    console.log('Checking auth status:', { hasToken, isAuthenticated });
    return hasToken || isAuthenticated;
  }, [isAuthenticated]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      console.log('Login successful, setting token and auth state');
      
      // Store token
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('Registration successful, setting token and auth state');
      
      // Store token
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    console.log('Logging out, clearing token and auth state');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Context value
  const contextValue = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated,
    isLoading,
    checkAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
