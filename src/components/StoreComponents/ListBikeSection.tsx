import React from 'react';
import './../../styles/components/StoreComponents/ListBikeSection.css'

const ListBikeSection = () => {
    return (
        <div className="ListBikeSection-container">
            
            <ul className="ListBikeSection-list">
                <li className="ListBikeSection-title">Khám Phá Xe Máy</li>
                <li><a href="#">Khám Phá Tất Cả Xe Máy</a></li>
                <li><a href="#">Xe Ga Phổ Thông</a></li>
                <li><a href="#">Xe Côn Tay Thể Thao</a></li>
                <li><a href="#">Xe Mô Tô Phân Khối Lớn</a></li>
                <li><a href="#">Xe Điện Thông Minh</a></li>
                <li><a href="#">Xe Số Truyền Thống</a></li>
                <li><a href="#">Xe Cổ Điển & Cafe Racer</a></li>
                <li><a href="#">Phụ Kiện Độ Xe</a></li>
                <li><a href="#">Mũ Bảo Hiểm & Trang Bị Lái</a></li>
                <li><a href="#">So Sánh Các Dòng Xe</a></li>
                <li><a href="#">Chọn Xe Phù Hợp Với Bạn</a></li>
            </ul>

            <ul className="ListBikeSection-list">
                <li className="ListBikeSection-title">Mua Xe Máy</li>
                <li><a href="#">Mua Xe Mới</a></li>
                <li><a href="#">Mua Xe Đã Qua Sử Dụng (Chính hãng)</a></li>
                <li><a href="#">Chương Trình Trao Đổi Xe Cũ</a></li>
                <li><a href="#">Tài Chính & Trả Góp</a></li>
                <li><a href="#">Ưu Đãi & Khuyến Mãi</a></li>
                <li><a href="#">Đăng Ký Lái Thử</a></li>
                <li><a href="#">Tìm Đại Lý Gần Nhất</a></li>
            </ul>

            <ul className="ListBikeSection-list">
                <li className="ListBikeSection-title">Tìm Hiểu Thêm Về Xe Máy</li>
                <li><a href="#">Hỗ Trợ Kỹ Thuật & Bảo Dưỡng</a></li>
                <li><a href="#">Hướng Dẫn Lái Xe An Toàn</a></li>
                <li><a href="#">Công Nghệ Xe Máy Mới</a></li>
                <li><a href="#">Phụ Tùng Chính Hãng</a></li>
                <li><a href="#">Cộng Đồng Yêu Xe</a></li>
                <li><a href="#">Chuyến Đi & Lộ Trình Gợi Ý</a></li>
                <li><a href="#">Thuê Xe Máy (Nếu có dịch vụ)</a></li>
                <li><a href="#">Xe Máy Cho Doanh Nghiệp (Giao hàng, dịch vụ)</a></li>
                <li><a href="#">Đào Tạo Lái Xe</a></li>
            </ul>

        </div>
    )
}

export default ListBikeSection;