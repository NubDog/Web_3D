import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './../components/Header/header';
import Footer from './../components/Footer/Footer';
import CheckOut from './../components/CheckOut/CheckOut';
import CheckOutShiping from './../components/CheckOut/CheckOut-Shiping';
import CheckOutPayment from './../components/CheckOut/CheckOut-Payment';
import CheckOutFinal from './../components/CheckOut/CheckOut-Final';
import './../styles/components/CheckOut/CheckOut.css';

type CheckoutStep = 'checkout' | 'shipping' | 'payment' | 'final';

const CheckOutPage = () => {
    const [step, setStep] = useState<CheckoutStep>('checkout');
    const [checkoutData, setCheckoutData] = useState({});
    const location = useLocation();
    const { product } = location.state || {};

    if (!product) {
        return (
            <div>Sản phẩm không tồn tại!</div>
        )
    }

    const handleNextFromCheckout = (data: any) => {
        setCheckoutData({ ...checkoutData, ...data });
        setStep('shipping');
    };

    const handleNextFromShipping = (shippingData: any) => {
        setCheckoutData({ ...checkoutData, ...shippingData });
        setStep('payment');
    };

    const handleNextFromPayment = () => {
        setStep('final');
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
                <p>Tổng giá trị đơn thuê: {product.product_price} VNĐ</p>
            </div>

            {step === 'checkout' && <CheckOut onNext={handleNextFromCheckout} />}
            {step === 'shipping' && <CheckOutShiping onNext={handleNextFromShipping} onBack={handleBack} />}
            {step === 'payment' && <CheckOutPayment checkoutData={checkoutData} onBack={handleBack} onNext={handleNextFromPayment} />}
            {step === 'final' && <CheckOutFinal checkoutData={checkoutData} />}

            <div className="checkOut-product-support col-980">
                <p>Bạn cần hỗ trợ thêm? <span><a href="#">Chat ngay <i className="fa-brands fa-telegram"></i></a></span> hoặc gọi 27082004</p>
            </div>
            <Footer />
        </div>
    )
}

export default CheckOutPage;