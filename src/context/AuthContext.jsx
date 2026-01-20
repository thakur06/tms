import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage on initial load
    return !!localStorage.getItem('token');
  });
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        setIsAuthenticated(!!e.newValue);
      }
      if (e.key === 'user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    if (userData) {
      // Ensure we store all relevant user data including role and reportsCount
      const cleanUserData = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        dept: userData.dept,
        role: userData.role || 'employee',
        reportsCount: parseInt(userData.reportsCount) || 0
      };
      localStorage.setItem('user', JSON.stringify(cleanUserData));
      setUser(cleanUserData);
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    // Force redirect to login page since routes are no longer strictly protected
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
