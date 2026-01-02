import React from 'react';
import './../../styles/components/CheckOut/CheckOut-Final.css';
import Sub_Button from './../Button/Sub-Button/Sub-Button';
import { useNavigate } from 'react-router-dom';

interface CheckOutFinalProps {
    checkoutData: any;
}

const CheckOutFinal: React.FC<CheckOutFinalProps> = ({ checkoutData }) => {
    const navigate = useNavigate();

    console.log('CheckOut Final - checkoutData:', checkoutData);

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className='checkOut-final col-980'>
            <div className='checkOut-final-content'>
                <div className='checkOut-final-icon'>
                    <i className="fa-solid fa-circle-check"></i>
                </div>
                
                <h1>Yêu cầu thuê xe đã được gửi!</h1>
                <p className='checkOut-final-message'>
                    Cảm ơn bạn đã tin tưởng Shark Eat Rice. 
                    Chúng tôi đã nhận được yêu cầu của bạn và đang tiến hành xử lý hồ sơ.
                </p>

                <div className='checkOut-final-info'>
                    <h3>Thông tin đơn thuê:</h3>
                    <div className='checkOut-final-details'>
                        <div className='detail-row'>
                            <span className='detail-label'>Phương tiện:</span>
                            <span className='detail-value'>{checkoutData.product?.product_name || 'N/A'}</span>
                        </div>
                        
                        <div className='detail-row'>
                            <span className='detail-label'>Địa điểm nhận xe:</span>
                            <span className='detail-value'>Tại cửa hàng (Chi nhánh Đà Nẵng)</span>
                        </div>

                        <div className='detail-row'>
                            <span className='detail-label'>Thời gian thuê:</span>
                            <span className='detail-value'>
                                {checkoutData.ngayMuon} - {checkoutData.ngayTra}
                            </span>
                        </div>
                        
                        <div className='detail-row'>
                            <span className='detail-label'>Số ngày thuê:</span>
                            <span className='detail-value'>{checkoutData.rentalDays || 1} ngày</span>
                        </div>

                        <div className='detail-row'>
                            <span className='detail-label'>Hình thức thanh toán:</span>
                            <span className='detail-value' style={{color: '#28a745', fontWeight: 'bold'}}>
                                Thanh toán sau khi ký hợp đồng
                            </span>
                        </div>
                    </div>
                </div>

                <div className='checkOut-final-payment-summary'>
                    <h3>Chi tiết chi phí dự kiến:</h3>
                    <div className='payment-summary-details'>
                        <div className='detail-row'>
                            <span className='detail-label'>Tiền thuê xe:</span>
                            <span className='detail-value'>{(checkoutData.rentalAmount || 0).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <div className='detail-row'>
                            <span className='detail-label'>Tiền đặt cọc (Dự kiến):</span>
                            <span className='detail-value'>{(checkoutData.depositAmount || 0).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <div className='detail-row total-row'>
                            <span className='detail-label'>Tổng thanh toán khi nhận xe:</span>
                            <span className='detail-value'>{(checkoutData.totalAmount || 0).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    </div>
                </div>

                <div className='checkOut-final-next-steps'>
                    <h3>Quy trình tiếp theo:</h3>
                    <ul>
                        <li><i className="fa-solid fa-clock"></i> Đơn thuê sẽ được duyệt trong vòng 30 phút (Giờ hành chính).</li>
                        <li><i className="fa-solid fa-envelope"></i> Bạn sẽ nhận được Email thông báo kết quả duyệt đơn.</li>
                        <li><i className="fa-solid fa-phone"></i> Nhân viên sẽ gọi điện để xác nhận lịch hẹn giao xe.</li>
                        <li><i className="fa-solid fa-id-card"></i> Vui lòng mang theo CCCD/CMND gốc để đối chiếu.</li>
                    </ul>
                </div>

                <div className='checkOut-final-contact'>
                    <p>Cần hỗ trợ gấp? Gọi ngay hotline: <strong>0905 123 456</strong></p>
                </div>

                <div className='checkOut-final-buttons'>
                    <Sub_Button 
                        content='Về trang chủ' 
                        onClick={handleGoHome} 
                    />
                </div>
            </div>
        </div>
    )
}

export default CheckOutFinal;