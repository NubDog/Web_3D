import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../styles/components/Header/Header.css'
import './../../styles/components/Header/Responsive.css'
import Logo from './../Logo/logo.tsx'
import Button from '../Button/Button.tsx'
import Button_logout from '../Button/Button_logout.tsx'
import { useAuth } from '../../contexts/AuthContext';
interface danhMucPhuongTien {
    ten_danh_muc: string;
}

interface HeaderProps {
    id?: string;
}

const Header: React.FC<HeaderProps> = ({id}) => {
    const navigate = useNavigate();
    const [danhMucPhuongTien, setDanhMucPhuongTien] = useState<danhMucPhuongTien[]>([]);
    const [loading, setLoading] = useState(false);
    const { currentUser, logout  } = useAuth();
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

     const adminRoles = ['admin', 'NhanVien'];
    const isUserAdmin = currentUser && adminRoles.includes(currentUser.vai_tro);


    const fetchDanhMucPhuongTien = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/Admin/danh-muc-phuong-tien');
            if (!response.ok) throw new Error('response.statusText');
            const json = await response.json();
            if (!json.success) throw new Error(json.error || "Lỗi khi tải danh mục phương tiện");
            setDanhMucPhuongTien(json.data);
        } catch (error) {
            console.error('Lỗi khi tải danh mục phương tiện:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDanhMucPhuongTien();
    }, []);

    return (
        <div className="header" id={id}>
            <Logo />
            <ul className="header-menu">
                <li className="header-menu_items"><a href="/store">Cửa hàng</a></li>
                
                {danhMucPhuongTien.slice(0, 10).map((item, index) => (
                    <li key={index} className="header-menu_items"><a href="#">{item.ten_danh_muc}</a></li>
                ))}

                <li className="header-menu_items"><a href="#">Hỗ trợ</a></li>
                <li className="header-menu_items"><a href="#"><i className="fa-solid fa-magnifying-glass"></i></a></li>
            </ul>

            <div className="user-login">
                 {currentUser ? (
                    <div className="user-info">
                        <div className="welcome-container">
                            <span className="welcome-message">
                                Chào, {currentUser.ho_ten}
                            </span>
                            {isUserAdmin && (
                                <div className="user-dropdown">
                                    <button onClick={() => navigate('/admin')}>
                                        <i className="fa-solid fa-shield-halved"></i>
                                        Trang Quản trị
                                    </button>
                                </div>
                            )}
                        </div>
                        <Button_logout />
                    </div>
                ) : (
                    <Button 
                        conttent="Đăng nhập / đăng ký" 
                        onClick={() => navigate('/signin')}
                    />
                )}
            </div>
        </div>
    )
}

export default Header;