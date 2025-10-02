import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

interface User {
  nguoi_dung_id: number;
  ho_ten: string;
  email: string;
  vai_tro: string; // 'admin', 'user', etc.
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  // Hàm login phải nhận vào TÊN ĐĂNG NHẬP và MẬT KHẨU
  login: (identifier: string, mat_khau: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, mat_khau: string) => {
    setLoading(true);
    setError(null);
    try {
      const isEmail = identifier.includes('@');
      const payload = {
        [isEmail ? 'email' : 'ten_dang_nhap']: identifier,
        mat_khau,
      };

      // Gọi API bằng fetch
      const response = await fetch('http://127.0.0.1:8787/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success || !result.data) {
        // Ném lỗi từ server để component SignIn có thể bắt
        throw new Error(result.error || 'Tên đăng nhập hoặc mật khẩu không đúng.');
      }
      
      const userData: User = result.data;
      setCurrentUser(userData);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      
      if (userData.vai_tro === 'admin') {
          navigate('/admin');
      } else {
          navigate('/');
      }

    } catch (err: any) {
      setError(err.message);
      throw err; // Ném lỗi ra ngoài
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    navigate('/signin');
  };

  const value = { currentUser, loading, error, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook tùy chỉnh để sử dụng context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};