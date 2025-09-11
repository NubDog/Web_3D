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
    const Lamborghini_model_Millennio = "https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev/Lamborghini%20Terzo%20Millennio.glb";
    const Mercedes_model_Maybach = "https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev/Mersedes%20Benz%20Maybach%20GLS%20600.glb"; // dùng 4G thì nên đóng dòng này lại không là nó bú sạch dữ liệu đấy

    return (
        <div className="home-page">
            <Header />

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
            />

            <button className="suv-button-view" onClick={() => {
                document.getElementById('suv-banner')?.scrollIntoView({ behavior: 'smooth' });
            }}>
                <i className="icon-down fa-solid fa-angle-down"></i>
            </button>

            <button className="suv-button-view" onClick={() => {
                document.getElementById('hypercar-banner')?.scrollIntoView({ behavior: 'smooth' });
            }}>
                <i className="icon-up fa-solid fa-angle-up"></i>
            </button>

            <BigBanner
                id="suv-banner"
                main_title="SUV"
                sub_title="Giới thiệu dòng SUV" 
                link_content="Tìm hiểu thêm"
                link_sub_content="Thuê SUV"
                model_url={Mercedes_model_Maybach}
            />

            <button className="suv-button-view" onClick={() => {
                document.getElementById('hypercar-banner')?.scrollIntoView({ behavior: 'smooth' });
            }}>
                <i className="icon-down fa-solid fa-angle-down"></i>
            </button>
        </div>
    )
}

export default HomePage;