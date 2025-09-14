import { useEffect, useReducer, useState } from 'react';
import './../styles/HomePage/HomePage.css';
import './../components/BigBanner/BigBanner.tsx'
import '../index.css'
import './../components/Logo/logo.tsx'

// import các components ở đây
import Header from './../components/Header/header.tsx'
import BigBanner from './../components/BigBanner/BigBanner.tsx'
import placeholder_image_url from './../assets/Battfield 6.jpg';
import SmallBanner from './../components/SmallBanner/SmallBanner.tsx'


const HomePage = () => {
    // Model từ URL bên ngoài
    const Lamborghini_model_Millennio = "https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev/Lamborghini%20Terzo%20Millennio.glb";
    const Lamborghini_model_Urus = "https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev/Lamborghini%20Urus%20Performante.glb"; // dùng 4G thì nên đóng dòng này lại không là nó bú sạch dữ liệu đấy

    const helicopter_image = "https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev/Helicopter.jpg";

    return (
        <div className="home-page">
            <Header 
                id="header-home"
            />

            <div className="ribbon">
                <h2>Thanh toán hàng tháng thật dễ dàng. Bao gồm lựa chọn lãi suất 0%.</h2>
                <a href="#">Tìm hiểu thêm</a>   
            </div>
            
            <BigBanner 
                id="hypercar-banner"
                main_title="Hypercar"
                sub_title="Giới thiệu dòng Hypercar" 
                link_content="Tìm hiểu thêm"
                link_sub_content="Thuê Hypercar"
                model_url={Lamborghini_model_Millennio}
                placeholder_image_url={placeholder_image_url}
            />

            <button className="suv-button-view" onClick={() => {
                document.getElementById('suv-banner')?.scrollIntoView({ behavior: 'smooth' });
            }}>
                <i className="icon-down fa-solid fa-angle-down"></i>
            </button>

            <button className="suv-button-view" onClick={() => {
                document.getElementById('header-home')?.scrollIntoView({ behavior: 'smooth' });
            }}>
                <i className="icon-up fa-solid fa-angle-up"></i>
            </button>

            <BigBanner
                id="suv-banner"
                main_title="SUV"
                sub_title="Giới thiệu dòng SUV" 
                link_content="Tìm hiểu thêm"
                link_sub_content="Thuê SUV"
                model_url={Lamborghini_model_Urus}
                placeholder_image_url={placeholder_image_url}
            />

            <button className="suv-button-view" onClick={() => {
                document.getElementById('hypercar-banner')?.scrollIntoView({ behavior: 'smooth' });
            }}>
                <i className="icon-down fa-solid fa-angle-down"></i>
            </button>

            <SmallBanner
                id="small-banner"
                title="Trực thăngthăng"
                subtitle="Thoải mái ngắm thành phồ từ trên cao với những góc nhìn tuyệt vời"
                content="Thuê ngay trực thăng để có trải nghiệm tuyệt vời nhất"
                main_link="Thuê trực thăng"
                sub_link="Tìm hiểu thêm"
                image={helicopter_image}
            />


        </div>
    )
}

export default HomePage;