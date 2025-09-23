import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
// Bạn có thể import thêm các component và CSS cần thiết ở đây

const ProductDetailPage = () => {
    const location = useLocation();
    
    // Lấy dữ liệu sản phẩm từ state, nếu không có thì dùng đối tượng rỗng
    const { product } = location.state || {};

    // Nếu không có dữ liệu sản phẩm (ví dụ: người dùng tự gõ URL)
    if (!product) {
        return (
            <div>
                <Header />
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h2>Không tìm thấy thông tin sản phẩm.</h2>
                    <RouterLink to="/store">Quay lại cửa hàng</RouterLink>
                </div>
                <Footer />
            </div>
        );
    }

    // Nếu có dữ liệu, hiển thị thông tin chi tiết
    return (
        <div>
            <Header />
            <div style={{ padding: '40px', maxWidth: '980px', margin: 'auto' }}>
                <h1>{product.product_name}</h1>
                <img 
                    src={product.img} 
                    alt={product.product_name} 
                    style={{ width: '100%', maxWidth: '600px', borderRadius: '12px' }} 
                />
                <h2>{product.product_category}</h2>
                <p style={{ fontSize: '24px', color: '#1d1d1f' }}>
                    Giá: {product.product_price ? product.product_price.toLocaleString('vi-VN') + ' VNĐ/ngày' : 'Vui lòng liên hệ'}
                </p>
                {/* Tại đây bạn có thể thêm các thông tin chi tiết khác và nút "Thuê ngay" */}
            </div>
            <Footer />
        </div>
    );
};

export default ProductDetailPage;
