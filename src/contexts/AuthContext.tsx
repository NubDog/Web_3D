import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Định nghĩa kiểu dữ liệu cho người dùng
interface User {
    ho_ten: string;
    email: string;
    vai_tro: string;
    // Bạn có thể thêm các trường thông tin khác của người dùng ở đây
}

// Định nghĩa những gì context sẽ cung cấp
interface AuthContextType {
    currentUser: User | null;
    login: (userData: User) => void;
    logout: () => void;
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tạo Provider Component
// Component này sẽ "bao bọc" ứng dụng của bạn và cung cấp context
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Khi ứng dụng tải lần đầu, kiểm tra xem có thông tin người dùng trong localStorage không
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    // Hàm để đăng nhập
    const login = (userData: User) => {
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData)); // Lưu vào localStorage
    };

    // Hàm để đăng xuất
    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser'); // Xóa khỏi localStorage
    };

    const value = {
        currentUser,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Tạo một hook tùy chỉnh để dễ dàng sử dụng context trong các component khác
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
