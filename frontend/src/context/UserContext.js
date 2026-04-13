import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

const STORAGE_KEY = 'onboarding_user';

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (employee) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employee));
    setUser(employee);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const isHR = user?.role === 'hr';
  const isManager = user?.role === 'manager';

  return (
    <UserContext.Provider value={{ user, login, logout, isHR, isManager }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
}
