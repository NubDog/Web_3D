import React from 'react';
import './../../styles/components/CheckOut/CheckOut.css';
import Input from './../../components/Input/input';
import imghold from './../../assets/Lamborghini Sian FKP 37.png';
import Sub_Button from './../../components/Button/Sub-Button/Sub-Button';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import Checkbox from './../../components/CheckBox/Checkbox'

interface CheckOutProps {
    onNext: (data: any) => void;
}

const CheckOut: React.FC<CheckOutProps> = ({ onNext }) => {
    const location = useLocation();

    const { product } = location.state || {};

    if (!product) {
        return (
            <div>Hello World</div>
        )
    }

    console.log(product);

    return (
        <div className='cheackOut-container'>
            <div className='cheackOut-content col-980'>

                <div className="checkOut-shipmentgroup">
                    <p>Còn xe</p>
                    <div className="checkOut-product">
                        <img
                            src={product?.img || imghold}
                            alt="imghold"
                        />

                        <div className="checkOut-product-infor">
                            <p>{ product?.product_name }</p>
                            <p>{ product?.product_category }</p>
                            <p>Xem chi tiết</p>
                        </div>
                    </div>

                    <div className="checkOut-product-shipment">
                        <p>Phương thức giao xe của bạn:</p>
                        <div className="checkOut-product-shipment-option">
                            <div className='checkOut-product-shipment-option-time'>
                                <div className="checkOut-product-shipment-option-time-item">
                                    <Checkbox />
                                    <p>Giao xe trực tiếp</p>
                                    <p>Bạn đến chi nhánh để lấy xe</p>
                                </div>

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
                        <Sub_Button content='Tiếp Tục Đến Địa Chỉ Giao Hàng' onClick={() => onNext({ product })} />
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