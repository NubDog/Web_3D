import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../styles/components/Header/Header.css'
import './../../styles/components/Header/Responsive.css'
import Logo from './../Logo/logo.tsx'
import Button from '../Button/Button.tsx'
import Button_logout from '../Button/Button_logout.tsx'
import { useAuth } from '../../contexts/AuthContext';
import Search from '../../components/Search/Search.tsx'

interface danhMucPhuongTien {
    ten_danh_muc: string;
}

interface HeaderProps {
    id?: string;
}

const Header: React.FC<HeaderProps> = ({ id }) => {
    const navigate = useNavigate();
    const StoreBike = '/store/store-bike';

    const StoreLink = [
        {
            StoreBike
        }
    ]
    const [danhMucPhuongTien, setDanhMucPhuongTien] = useState<danhMucPhuongTien[]>([]);
    const [loading, setLoading] = useState(false);
    const { currentUser, logout } = useAuth();

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
        <div className="header-main" id={id}>
            <Logo />
            <ul className="header-menu">
                <li className="header-menu_items"><a href="/store">Cửa hàng</a></li>
                <li className="header-menu_items"><a href="/store/store-bike">Xe máy</a></li>
                <li className="header-menu_items"><a href="/store/store-hypercar">Siêu xe</a></li>
                <li className="header-menu_items"><a href="/store/store-suv">SUV</a></li>
                <li className="header-menu_items"><a href="/store/store-helicopter">Trực Thăng</a></li>
                <li className="header-menu_items"><a href="/store">Xe đạp</a></li>
                <li className="header-menu_items"><a href="/store">Flycam</a></li>
                <li className="header-menu_items"><a href="/store">Tank</a></li>

                <li className="header-menu_items"><a href="#" onClick={(e) => { e.preventDefault(); navigate('/support'); }}>Hỗ trợ</a></li>
            </ul>

            <div className="user-login" >
                {currentUser ? (
                    <div className="user-info">
                        <div className="welcome-container">
                            <span className="welcome-message">
                                Chào, {currentUser.ho_ten}
                            </span>
                            {isUserAdmin ? (
                                <div className="user-dropdown">
                                    <button onClick={() => navigate('/admin')}>
                                        <i className="fa-solid fa-shield-halved"></i>
                                        Trang Quản trị
                                    </button>
                                </div>
                            ) : (
                                <div className="user-dropdown">
                                    <button onClick={() => navigate('/account_home')}>
                                        <i className="fa-solid fa-user"></i>
                                        Thông tin tài khoản
                                    </button>
                                    <button onClick={() => navigate('/user/order')}>
                                        <i className="fa-solid fa-file-lines"></i>
                                        Đơn thuê của tôi
                                    </button>
                                    <button onClick={() => navigate('/user/contract')}>
                                        <i className="fa-solid fa-file-contract"></i>
                                        Hợp đồng của tôi
                                    </button>
                                    <button onClick={() => navigate('/user/violations')}>
                                        <i className="fa-solid fa-triangle-exclamation"></i>
                                        Vi phạm của tôi
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
                        style={{ backgroundColor: 'transparent', border: 'none' }}
                    />
                )}
            </div>
            <Search placeholder="Tìm kiếm" />
        </div>
    )
}

export default Header;