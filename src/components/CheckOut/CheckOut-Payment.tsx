import React from 'react';
import './../../styles/components/CheckOut/CheckOut-Payment.css';
import MasterCard from './../Card/MasterCard';
import ButtonCardCheckOut from './../Button/Button-Card-CheckOut/Button-Card-CheckOut';
import Sub_Button from './../Button/Sub-Button/Sub-Button';

interface CheckOutPaymentProps {
    onBack: () => void;
}

const CheckOutPayment: React.FC<CheckOutPaymentProps> = ({ onBack }) => {
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
                        <Sub_Button content="Thanh toán" onClick={() => {}} />
                    </div>
                </div>

                <div className="checkOut-payment-option-cash-group">
                    <h3>Thanh toán bằng tiền mặt:</h3>

                    <div className="checkOut-payment-option-cash-card" tabIndex={0}>
                        <Sub_Button content="Thanh toán" onClick={() => {}} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckOutPayment;