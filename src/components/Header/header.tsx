import React from 'react';
import './../../styles/Header/Header.css'
import './../../styles/Header/Responsive.css'
import Logo from './../Logo/logo.tsx'
import Button from '../Button/Button.tsx'

const Header = () => {
    return (
        <div className="header">
            <Logo />
            <ul className="header-menu">
                <li className="header-menu_items"><a href="#">Cửa hàng</a></li>
                <li className="header-menu_items"><a href="#">Ô tô</a></li>
                <li className="header-menu_items"><a href="#">Xe máy</a></li>
                <li className="header-menu_items"><a href="#">Xe đạp</a></li>
                <li className="header-menu_items"><a href="#">Xe điện</a></li>
                <li className="header-menu_items"><a href="#">Máy bay</a></li>
                <li className="header-menu_items"><a href="#">Tàu thủy</a></li>
                <li className="header-menu_items"><a href="#">Thiết bị quay phim</a></li>
                <li className="header-menu_items"><a href="#">Hỗ trợ</a></li>
                <li className="header-menu_items"><a href="#"><i className="fa-solid fa-magnifying-glass"></i></a></li>
            </ul>

            <div className="user-login">
                <Button conttent="Đăng nhập / đăng ký" />
            </div>
        </div>
    )
}

export default Header;