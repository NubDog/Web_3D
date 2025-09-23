import React from 'react';
import './../../styles/components/CheckOut/CheckOut-Final.css';
import Sub_Button from './../Button/Sub-Button/Sub-Button';
import { useNavigate } from 'react-router-dom';

interface CheckOutFinalProps {
    checkoutData: any;
}

const CheckOutFinal: React.FC<CheckOutFinalProps> = ({ checkoutData }) => {
    const navigate = useNavigate();

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
                            <span className='detail-value'>{checkoutData.dia_diem_nhan || checkoutData.dia_chi_chi_tiet}</span>
                        </div>
                        <div className='detail-row'>
                            <span className='detail-label'>Ngày thuê:</span>
                            <span className='detail-value'>{checkoutData.ngay_bat_dau || checkoutData.ngay_muon}</span>
                        </div>
                        <div className='detail-row'>
                            <span className='detail-label'>Ngày trả:</span>
                            <span className='detail-value'>{checkoutData.ngay_ket_thuc || checkoutData.ngay_tra}</span>
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
