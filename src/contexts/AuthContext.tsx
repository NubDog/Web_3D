import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { getConfig } from "../../config/app.config";
import BlockedAccountModal from "../components/BlockedAccountModal/BlockedAccountModal";

interface User {
  nguoi_dung_id: number;
  ho_ten: string;
  email: string;
  vai_tro: string;
  so_dien_thoai?: string;
  trang_thai?: string;  
}


interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (identifier: string, mat_khau: string) => Promise<void>;
  logout: () => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api';


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const config = getConfig()
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();


  useEffect(() => {
    const checkUserStatus = async () => {
      const storedUser = localStorage.getItem("currentUser");

      if (!storedUser) {
        setLoading(false);
        return;
      }

      try {
        const userData: User = JSON.parse(storedUser);

        const response = await fetch(`${API_URL}/check-user-status/${userData.nguoi_dung_id}`);
        const result = await response.json();

        if (!result.success) {
          console.warn('User không tồn tại hoặc lỗi:', result.error);
          logout();
          return;
        }

        if (result.data.trang_thai === 'inactive') {
          setShowBlockedModal(true); 
          // logout();
          return;
        }

        const updatedUser: User = {
          ...userData,
          trang_thai: result.data.trang_thai,
          ho_ten: result.data.ho_ten || userData.ho_ten,
          email: result.data.email || userData.email,
        };

        setCurrentUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      } catch (err) {
        console.error('Lỗi kiểm tra session:', err);
        setCurrentUser(JSON.parse(storedUser));
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
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

      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Tên đăng nhập hoặc mật khẩu không đúng.');
      }

      if (result.data.trang_thai === 'inactive') {
        throw new Error('⛔ Tài khoản của bạn đã bị khóa do vi phạm. Vui lòng liên hệ hỗ trợ.');
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
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setShowBlockedModal(false);
    navigate('/signin');
  };


  const value = { currentUser, loading, error, login, logout };

  return <AuthContext.Provider value={value}>{children}
  {showBlockedModal && (
        <BlockedAccountModal 
          onClose={logout}
          hotline={config.CONTACT.HOTLINE}
        />
  )}
  </AuthContext.Provider>;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};