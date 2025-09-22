import React from 'react';
import './../../styles/components/CheckOut/CheckOut-Shiping.css';
import Input from '../Input/input';
import Sub_Button from '../Button/Sub-Button/Sub-Button';

interface CheckOutShipingProps {
    onNext: () => void;
    onBack: () => void;
}

const CheckOutShiping: React.FC<CheckOutShipingProps> = ({ onNext, onBack }) => {
    return (
        <div className='checkOut-shiping col-980'>
            <div className='checkout-back-button' onClick={onBack}>
                <i className="fa-solid fa-arrow-left"></i>
                <p>Quay lại</p>
            </div>
            <h1>Chúng tôi giao xe cho bạn đến địa chỉ nào?</h1>
            <h2>Nhập tên của bạn và địa chỉ trước khi sáp nhập:</h2>

            <form className='checkOut-shiping-form'>
                <Input />
                <Input />
                <Input />
                <Input />
                <Input />

                <h3>Thông tin liên hệ của bạn là gì?</h3>
                <Input />
                <Input />
                <Sub_Button content='Tiếp tục đến phần thanh toán' onClick={onNext} />
            </form>

        </div>
    )
}

export default CheckOutShiping;