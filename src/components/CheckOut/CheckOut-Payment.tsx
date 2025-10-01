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

    // Tính toán giá thuê
    const dailyPrice = checkoutData.product?.product_totalPrice || 0;
    const rentalDays = checkoutData.rentalDays || 1;
    const totalRentalPrice = dailyPrice * rentalDays;
    const depositAmount = totalRentalPrice * 5; // Tiền cọc gấp 5 lần tổng tiền thuê

    const handlePayment = async () => {
        if (!currentUser || !currentUser.nguoi_dung_id) {
            alert("Không thể xác thực người dùng. Vui lòng đăng nhập lại.");
            setIsProcessing(false);
            return;
        }

        setIsProcessing(true);
        try {
            let khachHangId = null;
            try {
                const customerResponse = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/customers/by-user/${currentUser.nguoi_dung_id}`);
                const customerResult = await customerResponse.json();
                
                if (customerResult.success && customerResult.data) {
                    khachHangId = customerResult.data.khach_hang_id;
                } else {
                    throw new Error('Không tìm thấy thông tin khách hàng');
                }
            } catch (error) {
                alert('Lỗi lấy thông tin khách hàng: ' + error);
                setIsProcessing(false);
                return;
            }

            const apiData = {
                khach_hang_id: khachHangId,
                phuong_tien_id: checkoutData.product?.product_id || checkoutData.product?.id,
                ngay_bat_dau: checkoutData.ngayMuon,
                ngay_ket_thuc: checkoutData.ngayTra,  
                dia_diem_nhan: `${checkoutData.diaChiChiTiet || ''}, ${checkoutData.quanHuyen || ''}`.trim(),
                dia_diem_tra: `${checkoutData.diaChiChiTiet || ''}, ${checkoutData.quanHuyen || ''}`.trim()
            };

            console.log('=== DỮ LIỆU GỬI CHO API ===');
            console.log('currentUser:', currentUser);
            console.log('khachHangId thật:', khachHangId);
            console.log('checkoutData:', checkoutData);
            console.log('apiData chuẩn bị gửi:', apiData);
            console.log('========================');

            const response = await fetch('https://r2-api.sharkeatrice.workers.dev/api/don-thue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData)
            });

            const result = await response.json();

            if (result.success) {
                console.log('Tạo đơn thuê thành công:', result);
                onNext();
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

            {/* Form hiển thị chi tiết giá thuê */}
            <div className='checkOut-rental-summary'>
                <h2>Chi tiết hóa đơn thuê xe</h2>
                
                <div className='rental-summary-content'>
                    <div className='rental-summary-row'>
                        <span className='rental-summary-label'>Giá thuê xe (1 ngày):</span>
                        <span className='rental-summary-value'>{dailyPrice.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    
                    <div className='rental-summary-row'>
                        <span className='rental-summary-label'>Số ngày thuê:</span>
                        <span className='rental-summary-value'>{rentalDays} ngày</span>
                    </div>
                    
                    <div className='rental-summary-row rental-summary-subtotal'>
                        <span className='rental-summary-label'>Tổng tiền thuê:</span>
                        <span className='rental-summary-value'>{totalRentalPrice.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    
                    <div className='rental-summary-row rental-summary-deposit'>
                        <span className='rental-summary-label'>Tiền đặt cọc:</span>
                        <span className='rental-summary-value'>{depositAmount.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    
                    <div className='rental-summary-total'>
                        <div className='rental-summary-row'>
                            <span className='rental-summary-label'>Tổng thanh toán:</span>
                            <span className='rental-summary-value'>{(totalRentalPrice + depositAmount).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    </div>
                    
                    <div className='rental-summary-note'>
                        <p>* Số tiền đặt cọc sẽ được hoàn trả lại sau khi phương tiện được trả</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckOutPayment;