import React from 'react';
import './../styles/HomePage/HomePage.css';
import './../components/BigBanner/BigBanner.tsx'
import '../index.css'
import './../components/Logo/logo.tsx'

// import các components ở đây
import Header from './../components/Header/header.tsx'
import BigBanner from './../components/BigBanner/BigBanner.tsx'

const HomePage = () => {
    return (
        <div className="home-page">
            <Header />

            <div className="ribbon">
                <h2>Thanh toán hàng tháng thật dễ dàng. Bao gồm lựa chọn lãi suất 0%.</h2>
                <a href="#">Tìm hiểu thêm</a>   
            </div>
            
            <BigBanner 
                main_title="Hyper Car" 
                sub_title="Giới thiệu dòng Hyper Car" 
                link_content="Tìm hiểu thêm"
                link_sub_content="Thuê Hyper car"
            />
        </div>
    )
}

export default HomePage;