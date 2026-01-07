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
    const [dailyPrice, setDailyPrice] = useState(0);
    const [discountRate, setDiscountRate] = useState(0);

    const vehicleId = checkoutData.product?.id || checkoutData.product?.product_id;

    if (!currentUser) {
        return (
            <div>
                <h2>Vui lòng đăng nhập để tiếp tục</h2>
            </div>
        )
    }

    React.useEffect(() => {
        const fetchData = async () => {
            if (vehicleId) {
                try {

                    const vehicleResponse = await fetch('https://r2-api.sharkeatrice.workers.dev/api/phuong-tien');
                    const vehicleResult = await vehicleResponse.json();
                    let currentChinhSachId = null;

                    if (vehicleResult.success) {
                        const vehicle = vehicleResult.data.find((v: any) => v.phuong_tien_id === vehicleId);
                        if (vehicle) {
                            setDailyPrice(vehicle.gia_thue);
                            currentChinhSachId = vehicle.chinh_sach_id;
                        }
                    }


                    if (currentChinhSachId) {
                        const policyResponse = await fetch('https://r2-api.sharkeatrice.workers.dev/api/chinh-sach-gia');
                        const policyResult = await policyResponse.json();

                        if (policyResult.success) {
                            const policy = policyResult.data.find((p: any) => p.chinh_sach_id === currentChinhSachId);
                            if (policy && policy.ty_le_giam) {
                                setDiscountRate(policy.ty_le_giam);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch data", error);
                }
            }
        };
        fetchData();
    }, [vehicleId]);

    const rentalDays = checkoutData.rentalDays || 1;
    const totalRentalPrice = dailyPrice * rentalDays;
    const discountAmount = totalRentalPrice * (discountRate / 100);
    const finalRentalPrice = totalRentalPrice - discountAmount;
    const depositAmount = finalRentalPrice * 0.5;

    const handleConfirmBooking = async () => {
        if (!currentUser || !currentUser.nguoi_dung_id) {
            alert("Không thể xác thực người dùng. Vui lòng đăng nhập lại.");
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
                alert('Lỗi lấy thông tin khách hàng, vui lòng cập nhật hồ sơ cá nhân.');
                setIsProcessing(false);
                return;
            }

            const apiData = {
                khach_hang_id: khachHangId,
                phuong_tien_id: checkoutData.product?.product_id || checkoutData.product?.id,
                ngay_bat_dau: checkoutData.ngayMuon,
                ngay_ket_thuc: checkoutData.ngayTra,
                dia_diem_nhan: "99 Tô Hiến Thành",
                dia_diem_tra: "99 Tô Hiến Thành"
            };


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
                    totalAmount: finalRentalPrice + depositAmount,
                    rentalAmount: finalRentalPrice,
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
                        <span className='rental-summary-label'>Giá thuê xe 1 ngày:</span>
                        <span className='rental-summary-value'>{dailyPrice.toLocaleString('vi-VN')} VNĐ</span>
                    </div>

                    <div className='rental-summary-row'>
                        <span className='rental-summary-label'>Số ngày thuê:</span>
                        <span className='rental-summary-value'>{rentalDays} ngày</span>
                    </div>

                    <div className='rental-summary-row rental-summary-subtotal'>
                        <span className='rental-summary-label'>Thành tiền:</span>
                        <span className='rental-summary-value'>{totalRentalPrice.toLocaleString('vi-VN')} VNĐ</span>
                    </div>

                    {discountRate > 0 && (
                        <>
                            <div className='rental-summary-row rental-summary-discount'>
                                <span className='rental-summary-label'>Ưu đãi giảm giá ({discountRate}%):</span>
                                <span className='rental-summary-value'>Tiết kiệm</span>
                            </div>

                            <div className='rental-summary-row rental-summary-discount'>
                                <span className='rental-summary-label'>Số tiền được giảm:</span>
                                <span className='rental-summary-value'>-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                        </>
                    )}

                    <div className='rental-summary-row rental-summary-final-total'>
                        <span className='rental-summary-label'>Tổng tiền thuê:</span>
                        <span className='rental-summary-value'>{finalRentalPrice.toLocaleString('vi-VN')} VNĐ</span>
                    </div>

                    <div className='rental-summary-row rental-summary-deposit'>
                        <span className='rental-summary-label'>Tiền đặt cọc (ước tính):</span>
                        <span className='rental-summary-value'>{depositAmount.toLocaleString('vi-VN')} VNĐ</span>
                    </div>

                    <div className='rental-summary-total'>
                        <div className='rental-summary-row'>
                            <span className='rental-summary-label'>Tổng thanh toán khi nhận xe:</span>
                            <span className='rental-summary-value'>{(finalRentalPrice + depositAmount).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    </div>

                    <div className='rental-summary-note'>
                        <p>* Số tiền đặt cọc sẽ được hoàn trả lại sau khi bạn trả xe nguyên vẹn.</p>
                    </div>
                </div>
            </div>

            <div className='checkOut-rental-summary'>
                <h2>Địa điểm nhận và trả xe</h2>

                <div className='rental-summary-content'>
                    <div className='rental-summary-row'>
                        <span className='rental-summary-label'>Địa điểm nhận xe:</span>
                        <span className='rental-summary-value'>99 Tô Hiến Thành</span>
                    </div>

                    <div className='rental-summary-row'>
                        <span className='rental-summary-label'>Địa điểm trả xe:</span>
                        <span className='rental-summary-value'>99 Tô Hiến Thành</span>
                    </div>
                </div>
            </div>

            <h1>Thông tin thanh toán & Hợp đồng</h1>

            <div className='payment-notice' style={{ marginTop: '20px', marginBottom: '30px' }}>
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

            <div className='checkOut-payment-confirm-button' style={{ textAlign: 'center', marginTop: '20px' }}>
                <Sub_Button
                    content={isProcessing ? "Đang xử lý đơn..." : "Xác Nhận Đặt Thuê Xe"}
                    onClick={handleConfirmBooking}
                />
            </div>

        </div>
    )
}

export default CheckOutPayment;