import React from 'react';
import './../../styles/components/CheckOut/CheckOut-Final.css';
import Sub_Button from './../Button/Sub-Button/Sub-Button';
import { useNavigate } from 'react-router-dom';

interface CheckOutFinalProps {
    checkoutData: any;
}

const CheckOutFinal: React.FC<CheckOutFinalProps> = ({ checkoutData }) => {
    const navigate = useNavigate();

    // Debug: In ra dữ liệu để kiểm tra
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
                
                <h1>Đặt thuê thành công!</h1>
                <p className='checkOut-final-message'>
                    Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi. 
                    Đơn thuê của bạn đã được tạo thành công và đang chờ xét duyệt.
                </p>

                <div className='checkOut-final-info'>
                    <h3>Thông tin đơn thuê:</h3>
                    <div className='checkOut-final-details'>
                        <div className='detail-row'>
                            <span className='detail-label'>Phương tiện:</span>
                            <span className='detail-value'>{checkoutData.product?.product_name || 'N/A'}</span>
                        </div>
                        <div className='detail-row'>
                            <span className='detail-label'>Địa điểm nhận:</span>
                            <span className='detail-value'>{`${checkoutData.diaChiChiTiet || ''}, ${checkoutData.quanHuyen || ''}`.trim().replace(/^,|,$/, '') || 'N/A'}</span>
                        </div>
                        <div className='detail-row'>
                            <span className='detail-label'>Ngày thuê:</span>
                            <span className='detail-value'>{checkoutData.ngayMuon || 'N/A'}</span>
                        </div>
                        <div className='detail-row'>
                            <span className='detail-label'>Ngày trả:</span>
                            <span className='detail-value'>{checkoutData.ngayTra || 'N/A'}</span>
                        </div>
                        <div className='detail-row'>
                            <span className='detail-label'>Số ngày thuê:</span>
                            <span className='detail-value'>{checkoutData.rentalDays || 'N/A'} ngày</span>
                        </div>
                        <div className='detail-row'>
                            <span className='detail-label'>Phương thức thanh toán:</span>
                            <span className='detail-value'>
                                {checkoutData.paymentMethod === 'card' ? 'Thanh toán bằng thẻ' : 
                                 checkoutData.paymentMethod === 'cash' ? 'Thanh toán tiền mặt' : 'Chưa chọn'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className='checkOut-final-payment-summary'>
                    <h3>Chi tiết thanh toán:</h3>
                    <div className='payment-summary-details'>
                        <div className='detail-row'>
                            <span className='detail-label'>Tiền thuê xe:</span>
                            <span className='detail-value'>{(checkoutData.rentalAmount || 0).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <div className='detail-row'>
                            <span className='detail-label'>Tiền đặt cọc:</span>
                            <span className='detail-value'>{(checkoutData.depositAmount || 0).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <div className='detail-row total-row'>
                            <span className='detail-label'>Tổng thanh toán:</span>
                            <span className='detail-value'>{(checkoutData.totalAmount || 0).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    </div>
                </div>

                <div className='checkOut-final-next-steps'>
                    <h3>Các bước tiếp theo:</h3>
                    <ul>
                        <li>Chúng tôi sẽ xem xét và phê duyệt đơn thuê của bạn trong vòng 24h</li>
                        <li>Bạn sẽ nhận được email xác nhận khi đơn được duyệt</li>
                        <li>Nhân viên sẽ liên hệ với bạn để sắp xếp thời gian giao xe</li>
                        <li>Vui lòng chuẩn bị giấy tờ tùy thân khi nhận xe</li>
                    </ul>
                </div>

                <div className='checkOut-final-contact'>
                    <p>Cần hỗ trợ? Liên hệ hotline: <strong>27082004</strong></p>
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
