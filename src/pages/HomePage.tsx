import { useEffect, useReducer, useState } from 'react';
import './../styles/HomePage/HomePage.css';
import './../components/BigBanner/BigBanner.tsx'
import '../index.css'
import './../components/Logo/logo.tsx'
import './../components/Footer/Footer.tsx'

// import các components ở đây
import Header from './../components/Header/header.tsx'
import BigBanner from './../components/BigBanner/BigBanner.tsx'
import placeholder_image_url from './../assets/Battfield 6.jpg';
import SmallBanner from './../components/SmallBanner/SmallBanner.tsx'
import Footer from './../components/Footer/Footer.tsx'
import helicopter_image from './../assets/Helicopters isometric.png';
import flycam_image from './../assets/Mavic Pro Flycam.png';
import motorcycle_image from './../assets/Ninja H2R.png';
import vinfast_image from './../assets/Vinfast VF 9.png';

const HomePage = () => {
    // Model từ URL bên ngoài
    // const Lamborghini_model_Millennio = "https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev/Lamborghini%20Terzo%20Millennio.glb";
    const Lamborghini_model_Millennio = "https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev/vespa.glb";
    const Lamborghini_model_Urus = "https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev/Lamborghini%20Urus%20Performante.glb"; // dùng 4G thì nên đóng dòng này lại không là nó bú sạch dữ liệu đấy

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
                sub_title="Đỉnh cao trong sự xa hoa" 
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
                sub_title="Dòng xe sinh ra là để dành cho gia đình" 
                link_content="Tìm hiểu thêm"
                link_sub_content="Thuê SUV"
                model_url={Lamborghini_model_Urus}
                placeholder_image_url={placeholder_image_url}
            />

            <button className="suv-button-view" onClick={() => {
                document.getElementById('small-banner')?.scrollIntoView({ behavior: 'smooth' });
            }}>
                <i className="icon-down fa-solid fa-angle-down"></i>
            </button>

            <div className='small-banner-container'>
                <SmallBanner
                    id="small-banner"
                    title="HELICOPTERS"
                    subtitle="Thoải mái ngắm thành phồ từ trên cao với những góc nhìn tuyệt vời."
                    content="Thuê ngay trực thăng"
                    main_link="Tìm hiểu thêm"
                    sub_link="Thuê trực thăng"
                    image={helicopter_image}
                />

                <SmallBanner
                    id="small-banner"
                    title="Flycam"
                    subtitle="Ghi lại những khoảnh khắc tuyệt vời nhất của bạn"
                    content="Theo dõi để biết thêm chi tiết"
                    main_link="Tìm hiểu thêm"
                    sub_link="Xem giá"
                    image={flycam_image}
                />

                <SmallBanner
                    id="small-banner"
                    title="Motorcycle"
                    subtitle="Cơn gió nhẹ nhàng lướt qua má bạn tựa như nụ hôn ngọt ngào của tình đầu"
                    content="Thuê ngay xe máy để có trải nghiệm tuyệt vời nhất"
                    main_link="Tìm hiểu thêm"
                    sub_link="Xem giá"
                    image={motorcycle_image}
                />

                <SmallBanner
                    id="small-banner"
                    title="Vinfast VF9"
                    subtitle="Không gian rộng rãi đủ để chờ cả thế giới của bạn"
                    content="Lên xe thôi nào!"
                    main_link="Tìm hiểu thêm"
                    sub_link="Xem giá"
                    image={vinfast_image}
                />
            </div>


            <Footer />
        </div>
    )
}

export default HomePage;