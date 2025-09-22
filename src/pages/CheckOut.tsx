import React, { useState } from 'react';
import Header from './../components/Header/header';
import Footer from './../components/Footer/Footer';
import CheckOut from './../components/CheckOut/CheckOut';
import CheckOutShiping from './../components/CheckOut/CheckOut-Shiping';
import CheckOutPayment from './../components/CheckOut/CheckOut-Payment';
import './../styles/components/CheckOut/CheckOut.css';

type CheckoutStep = 'checkout' | 'shipping' | 'payment';

const CheckOutPage = () => {
    const [step, setStep] = useState<CheckoutStep>('checkout');

    const handleNext = () => {
        if (step === 'checkout') {
            setStep('shipping');
        } else if (step === 'shipping') {
            setStep('payment');
        }
    };

    const handleBack = () => {
        if (step === 'shipping') {
            setStep('checkout');
        } else if (step === 'payment') {
            setStep('shipping');
        }
    };


    return (
        <div className='cheackOut-container'>
            <Header />
            <div className='cheackOut-header col-980'>
                <h3>Thanh Toán</h3>
                <p>Tổng giá trị đơn thuê: 999999$</p>   
            </div>

            {step === 'checkout' && <CheckOut onNext={handleNext} />}
            {step === 'shipping' && <CheckOutShiping onNext={handleNext} onBack={handleBack} />}
            {step === 'payment' && <CheckOutPayment onBack={handleBack} />}
            
            <div className="checkOut-product-support col-980">
                <p>Bạn cần hỗ trợ thêm? <span><a href="#">Chat ngay <i className="fa-brands fa-telegram"></i></a></span> hoặc gọi 27082004</p>
            </div>
            <Footer />
        </div>
    )
}

export default CheckOutPage;