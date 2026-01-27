import React from 'react';
import '../../styles/components/Footer/Footer.css';
// import { getHotLine } from '../../../config/app.config'
import { useConfig } from '../../contexts/ConfigContext';
import compliance from '../../assets/logo-local-compliance.png';

const Footer = () => {
    const { config } = useConfig();
    return (
        <div className="footer">
            <div className="footer-container">
                <ul>
                    <li>Mua sắm và tìm hiểu</li>
                    <li>Cửa hàng</li>
                    <li>Trực thăng</li>
                    <li>Du thuyền</li>
                    <li>Hypercar</li>
                    <li>FlyCam</li>
                    <li>Motorbike</li>
                    <li>SUV</li>
                    <li>Thẻ quà tặng</li>
                </ul>

                <ul>
                    <li>Tài khoản</li>
                    <li>Quản lý tài khoản của bạn</li>
                    <li>Quản lý đơn hàng của bạn</li>
                    <li>Quản lý thẻ quà tặng của bạn</li>
                    <li>Quản lý đơn hàng của bạn</li>
                    <li>Quản lý thẻ quà tặng của bạn</li>
                </ul>

                <ul>
                    <li>Dành cho doanh nghiệp</li>
                    <li>Shark Eat Rice và Doanh Nghiệp</li>
                    <li>Mua hàng cho Doanh Nghiệp</li>
                    <li>Hỗ trợ doanh nghiệp</li>

                    <li className="li-title">Giá trị cốt lõi của Shark Eat Rice</li>
                    <li>Tầm nhìn và sứ mệnh</li>
                    <li>Quyền lợi khách hàng</li>
                    <li>Quyền riêng tư</li>
                    <li>Đổi mới chuổi cung ứng</li>
                </ul>

                <ul>
                    <li>Về Shark Eat Rice</li>
                    <li>Giới thiệu</li>
                    <li>Lãnh đạo của Shark Eat Rice</li>
                    <li>Newsroom</li>
                    <li>Đạo đức & Quy Tắc</li>
                    <li>Truyền thông</li>
                    <li>Sự kiện</li>
                    <li>Liên hệ Shark Eat Rice</li>
                </ul>

                <div className="Footer-shop">
                    <p>Xem thêm cách để thuê phương tiện.</p>
                    <a>Tìm cửa hàng gần bạn.</a>
                    <p>Hoặc gọi {config.CONTACT.HOTLINE}</p>
                </div>
            </div>

            <div className="copyright">
                <p>© 2025 Shark Eat Rice.Bảo lưu mọi quyền.</p>
                <a>Chính Sách Quyền Riêng Tư</a>
                <a>Điều Khoản & Điều Kiện</a>
                <a>Cho Thuê Và Hoàn Tiền</a>
                <a>Pháp Lý</a>
            </div>

            <div className="compliance">
                <p>
                    Công Ty TNHH Shark Eat Rice Việt Nam <br />
                    ĐKKD số 0313510827, do Sở KH&ĐT thành phố Hồ Chí Minh cấp ngày 28 tháng 10 năm 2015 <br />
                    Giấy phép kinh doanh số 0313510827/KD-0137 do Sở Công Thương thành phố Hồ Chí Minh cấp ngày 23 tháng 5 năm 2018 <br />
                    Địa chỉ: Phòng 901, Ngôi Nhà Đức Tại Tp. Hồ Chí Minh, số 33, đường Lê Duẩn, Phường Bến Nghé, Quận 1, thành phố Hồ Chí Minh, Việt Nam <br />
                    Điện thoại: {config.CONTACT.HOTLINE} <br />
                </p>

                <img src={compliance} alt="compliance" />
            </div>
        </div>
    )
}

export default Footer;