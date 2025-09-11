import React from 'react';
import './../styles/HomePage/HomePage.css';
import './../components/BigBanner/BigBanner.tsx'
import '../index.css'
import './../components/Logo/logo.tsx'

// import các components ở đây
import Header from './../components/Header/header.tsx'
import BigBanner from './../components/BigBanner/BigBanner.tsx'


const HomePage = () => {
    // Model từ URL bên ngoài
    const lamborghini_model_Revuelto = "https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev/Lamborghini%20Terzo%20Millennio.glb";

    return (
        <div className="home-page">
            <Header />

            <div className="ribbon">
                <h2>Thanh toán hàng tháng thật dễ dàng. Bao gồm lựa chọn lãi suất 0%.</h2>
                <a href="#">Tìm hiểu thêm</a>   
            </div>
            
            <BigBanner 
                main_title="Hypercar" 
                sub_title="Giới thiệu dòng Hypercar" 
                link_content="Tìm hiểu thêm"
                link_sub_content="Thuê Hypercar"
                model_url={lamborghini_model_Revuelto}
            />
        </div>
    )
}

export default HomePage;