import React, { useState, useEffect } from 'react';
import './../../styles/Header/Header.css'
import './../../styles/Header/Responsive.css'
import Logo from './../Logo/logo.tsx'
import Button from '../Button/Button.tsx'
import { useAuth } from '../../contexts/AuthContext';
interface danhMucPhuongTien {
    ten_danh_muc: string;
}

interface Header {
    id?: string;
}

const Header = ({id}: Header) => {
    const [danhMucPhuongTien, setDanhMucPhuongTien] = useState<danhMucPhuongTien[]>([]);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
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
                <li className="header-menu_items"><a href="#">Cửa hàng</a></li>
                
                {danhMucPhuongTien.slice(0, 10).map((item, index) => (
                    <li key={index} className="header-menu_items"><a href="#">{item.ten_danh_muc}</a></li>
                ))}

                <li className="header-menu_items"><a href="#">Hỗ trợ</a></li>
                <li className="header-menu_items"><a href="#"><i className="fa-solid fa-magnifying-glass"></i></a></li>
            </ul>

            <div className="user-login">
                {currentUser ? (
                    <Button conttent={`Xin chào, ${currentUser.ho_ten}`} />
                ) : (
                    <Button conttent="Đăng nhập / đăng ký" />
                )}
            </div>
        </div>
    )
}

export default Header;