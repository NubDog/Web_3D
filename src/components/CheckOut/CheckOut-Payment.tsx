import React, { useState } from 'react';
import './../../styles/components/CheckOut/CheckOut-Payment.css';
import MasterCard from './../Card/MasterCard';
import Sub_Button from './../Button/Sub-Button/Sub-Button';
import { useAuth } from './../../contexts/AuthContext';

interface CheckOutPaymentProps {
    checkoutData: any;
    onBack: () => void;
    onNext: () => void;
}

const CheckOutPayment: React.FC<CheckOutPaymentProps> = ({ checkoutData, onBack, onNext }) => {
    const { currentUser } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    if (!currentUser) {
        return (
            <div>
                <h2>Vui lòng đăng nhập để tiếp tục</h2>
            </div>
        )
    }

    console.log(checkoutData);

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // Chuẩn bị dữ liệu theo format API
            const apiData = {
                khach_hang_id: 1, // TODO: Cần thêm user_id vào AuthContext hoặc lấy từ API khác
                phuong_tien_id: checkoutData.product?.product_id || checkoutData.product?.id || 1, // Fallback tạm thời
                ngay_bat_dau: checkoutData.ngayMuon, // Từ CheckOut-Shiping
                ngay_ket_thuc: checkoutData.ngayTra, // Từ CheckOut-Shiping  
                dia_diem_nhan: `${checkoutData.diaChiChiTiet || ''}, ${checkoutData.quanHuyen || ''}`.trim(),
                dia_diem_tra: `${checkoutData.diaChiChiTiet || ''}, ${checkoutData.quanHuyen || ''}`.trim()
            };

            console.log('=== DỮ LIỆU GỬI CHO API ===');
            console.log('checkoutData nhận được:', checkoutData);
            console.log('product object:', checkoutData.product);
            console.log('ngayMuon:', checkoutData.ngayMuon);
            console.log('ngayTra:', checkoutData.ngayTra);
            console.log('apiData chuẩn bị gửi:', apiData);
            console.log('currentUser:', currentUser);
            console.log('========================');

            const response = await fetch('http://localhost:8787/api/don-thue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData)
            });

            const result = await response.json();

            if (result.success) {
                console.log('Tạo đơn thuê thành công:', result);
                onNext(); // Chuyển đến bước final
            } else {
                alert('Lỗi tạo đơn thuê: ' + result.error);
            }
        } catch (error) {
            console.error('Lỗi gọi API:', error);
            alert('Có lỗi xảy ra khi tạo đơn thuê');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className='checkOut-payment col-980'>
             <div className='checkout-back-button' onClick={onBack}>
                <i className="fa-solid fa-arrow-left"></i>
                <p>Quay lại</p>
            </div>
            <h1>Bạn muốn thanh toán bằng phương thức nào?</h1>

            <div className='checkOut-payment-option'>
                <div className='checkOut-payment-option-card-group'>
                    <h3>Thanh toán bằng thẻ:</h3>

                    <div className='checkOut-payment-option-card' tabIndex={0}>
                        <MasterCard />
                    </div>
                    <div className='checkOut-payment-option-card-button'>
                        <Sub_Button 
                            content={isProcessing ? "Đang xử lý..." : "Thanh toán"} 
                            onClick={handlePayment} 
                        />
                    </div>
                </div>

                <div className="checkOut-payment-option-cash-group">
                    <h3>Thanh toán bằng tiền mặt:</h3>

                    <div className="checkOut-payment-option-cash-card" tabIndex={0}>
                        <Sub_Button 
                            content={isProcessing ? "Đang xử lý..." : "Thanh toán"} 
                            onClick={handlePayment} 
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckOutPayment;