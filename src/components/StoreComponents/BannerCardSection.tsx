import React from 'react';
import './../../styles/components/StoreComponents/BannerCardSection.css'

const BannerCardSection = () => {
    return (
        <div className="BannerCardSection-container animation-zoom">

            <div className="BannerCardSection-link main-link">
                <a href="#">
                    
                </a>
            </div>

            <div className="BannerCardSection-content">
                <div className="BannerCardSection-title BannerCardSection-width-480">
                    Chọn xe, đặt lịch, lên đường.
                </div>

                <div className="BannerCardSection-subtitle BannerCardSection-width-480">
                    Không cần sở hữu. Chỉ cần trải nghiệm. Hàng trăm mẫu xe chất lượng cao, từ xe số đến xe tay côn, luôn sẵn sàng cho chuyến đi của bạn. Thủ tục nhanh gọn chỉ trong 5 phút.               
                </div>

                <div className="BannerCardSection-link BannerCardSection-width-480">
                    <a href="#">Xem ngay</a>
                </div>
            </div>

        </div>
    )
}

export default BannerCardSection;