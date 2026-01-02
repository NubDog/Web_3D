import React, { useState } from 'react';
import './../../styles/components/CheckOut/CheckOut-Payment.css';
import Sub_Button from './../Button/Sub-Button/Sub-Button';
import { useAuth } from './../../contexts/AuthContext';

interface CheckOutPaymentProps {
    checkoutData: any;
    onBack: () => void;
    onNext: (data?: any) => void;
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

    const dailyPrice = checkoutData.product?.product_totalPrice || 0;
    const rentalDays = checkoutData.rentalDays || 1;
    const totalRentalPrice = dailyPrice * rentalDays;
    const depositAmount = totalRentalPrice * 5; 

    const handleConfirmBooking = async () => {
        if (!currentUser || !currentUser.nguoi_dung_id) {
            alert("Không thể xác thực người dùng. Vui lòng đăng nhập lại.");
            return;
        }

        setIsProcessing(true);
        try {
            // Lấy thông tin khách hàng
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
                alert('Lỗi lấy thông tin khách hàng, vui lòng cập nhật hồ sơ cá nhân.');
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

            // Gọi API tạo đơn
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
                
                onNext({ 
                    ...checkoutData, 
                    paymentMethod: 'pay_later', 
                    totalAmount: totalRentalPrice + depositAmount,
                    rentalAmount: totalRentalPrice,
                    depositAmount: depositAmount
                });
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

            <div className='checkOut-rental-summary'>
                <h2>Chi tiết hóa đơn dự kiến</h2>
                
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
                        <span className='rental-summary-label'>Tiền đặt cọc (ước tính):</span>
                        <span className='rental-summary-value'>{depositAmount.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    
                    <div className='rental-summary-total'>
                        <div className='rental-summary-row'>
                            <span className='rental-summary-label'>Tổng thanh toán khi nhận xe:</span>
                            <span className='rental-summary-value'>{(totalRentalPrice + depositAmount).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    </div>
                    
                    <div className='rental-summary-note'>
                        <p>* Số tiền đặt cọc sẽ được hoàn trả lại sau khi bạn trả xe nguyên vẹn.</p>
                    </div>
                </div>
            </div>
            
            <h1>Thông tin thanh toán & Hợp đồng</h1>
            
            <div className='payment-notice' style={{marginTop: '20px', marginBottom: '30px'}}>
                <div className='payment-notice-header'>
                    <i className="fa-solid fa-file-contract"></i>
                    <span>Quy trình thanh toán</span>
                </div>
                <div className='payment-notice-content'>
                    <div className='payment-notice-item'>
                        <i className="fa-solid fa-handshake"></i>
                        <p>Bạn <strong>không cần thanh toán ngay bây giờ</strong>. Việc thanh toán sẽ diễn ra khi bạn gặp nhân viên giao xe.</p>
                    </div>
                    <div className='payment-notice-item'>
                        <i className="fa-solid fa-money-bill-transfer"></i>
                        <p>Chúng tôi chấp nhận thanh toán bằng <strong>Tiền mặt</strong> hoặc <strong>Chuyển khoản QR Code</strong>.</p>
                    </div>
                    <div className='payment-notice-item'>
                        <i className="fa-solid fa-clipboard-check"></i>
                        <p>Bạn sẽ kiểm tra xe, ký hợp đồng thuê xe, sau đó mới tiến hành thanh toán và đặt cọc.</p>
                    </div>
                    <div className='payment-notice-item warning'>
                        <i className="fa-solid fa-shield-alt"></i>
                        <p>Lưu ý: Không chuyển khoản đặt cọc qua tin nhắn mạng xã hội để tránh lừa đảo.</p>
                    </div>
                </div>
            </div>

            <div className='checkOut-payment-confirm-button' style={{textAlign: 'center', marginTop: '20px'}}>
                <Sub_Button 
                    content={isProcessing ? "Đang xử lý đơn..." : "Xác Nhận Đặt Thuê Xe"} 
                    onClick={handleConfirmBooking} 
                />
            </div>

        </div>
    )
}

export default CheckOutPayment;