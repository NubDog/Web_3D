import React, { createContext, useState, useContext, type ReactNode } from 'react';

interface User {
  id: number;
  ho_ten: string;
  vai_tro: string;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, mat_khau: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

   const login = async (identifier: string, mat_khau: string): Promise<User> => {
    const isEmail = identifier.includes('@');
    const body = {
        password: mat_khau,
        ...(isEmail ? { email: identifier } : { username: identifier })
    };

    const response = await fetch('http://127.0.0.1:8787/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const result = await response.json();
    
    if (result.success && result.user) {
        setUser(result.user);
        return result.user; 
    } else {
        throw new Error(result.error || 'Đăng nhập thất bại.');
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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