import React from 'react';
import './../../styles/components/CheckOut/CheckOut.css';
import Input from './../../components/Input/input';
import imghold from './../../assets/Lamborghini Sian FKP 37.png';
import Sub_Button from './../../components/Button/Sub-Button/Sub-Button';

interface CheckOutProps {
    onNext: () => void;
}

const CheckOut: React.FC<CheckOutProps> = ({ onNext }) => {
    return (
        <div className='cheackOut-container'>
            <div className='cheackOut-content col-980'>
                <div className='cheackOut-body'>
                    <div className='cheackOut-body-headline'>
                        <h2>Bạn muốn nhận xe ở đâu?</h2>
                    </div>
                    <div className='cheackOut-body-input'>
                        <p>Giao hàng đến: </p>
                        <span><Input /></span>
                        <span><Input /></span>
                    </div>
                </div>

                <div className="checkOut-shipmentgroup">
                    <p>Còn xe</p>
                    <div className="checkOut-product">
                        <img
                            src={imghold}
                            alt="imghold"
                        />

                        <div className="checkOut-product-infor">
                            <p>Lamborghini Sian FKP 37</p>
                            <p>Siêu xe</p>
                            <p>Xem chi tiết</p>
                        </div>
                    </div>

                    <div className="checkOut-product-shipment">
                        <p>Phương thức giao xe của bạn:</p>
                        <div className="checkOut-product-shipment-option">
                            <div className='checkOut-product-shipment-option-time'>
                                <p>Giao xe hôm nay</p>

                                <div className='checkOut-product-shipment-message'>
                                    <p>Một số điều cần ghi nhớ:</p>
                                    <ul>
                                        <li>Nhân viên giao xe sẻ yêu cầu bạn ký tên vào biên bản bào giao và hợp đồng thuê</li>
                                        <li>Thời gian giao xe sẻ là từ 8h sáng cho đến 10h tối tất cả các ngày trong tuần</li>
                                        <li>Sử dụng địa chỉ giao hàng trước khi sáp nhập</li>
                                    </ul>
                                    <a href="#">Xem Chính Sách Giao Xe Của Shark Eat Rice</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="checkOut-button">
                        <Sub_Button content='Tiếp Tục Đến Địa Chỉ Giao Hàng' onClick={onNext} />
                    </div>

                    <div className="checkOut-product-question">
                        <p>Câu hỏi thường gặp về giao hàng</p>
                        <i className="fa-solid fa-angle-down"></i>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckOut;