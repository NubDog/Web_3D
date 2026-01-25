import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './../components/Header/header';
import Footer from './../components/Footer/Footer';
import CheckOut from './../components/CheckOut/CheckOut';
import CheckOutShiping from './../components/CheckOut/CheckOut-Shiping';
import CheckOutPayment from './../components/CheckOut/CheckOut-Payment';
import CheckOutFinal from './../components/CheckOut/CheckOut-Final';
import './../styles/components/CheckOut/CheckOut.css';
import { getHotLine } from '../../config/app.config';

type CheckoutStep = 'checkout' | 'shipping' | 'payment' | 'final';

interface VehicleDetail {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    loai: string;
    danh_muc_id: number;
    trang_thai: string;
    bien_so: string;
    so_km: number;
    chinh_sach_id: number;
    so_khung: string;
    ngay_tao: string;
    ngay_cap_nhat: string;
    img: string;
    gia_thue: number;
    model: string;
}

const CheckOutPage = () => {
    const [step, setStep] = useState<CheckoutStep>('checkout');
    const [checkoutData, setCheckoutData] = useState({});
    const location = useLocation();
    const { product } = location.state || {}; // product now only contains { id }
    const [vehiclePrice, setVehiclePrice] = useState<number | null>(null);

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/phuong-tien';

    useEffect(() => {
        const fetchVehiclePrice = async () => {
            if (product?.id) {
                try {
                    const response = await fetch(API_URL);
                    const result = await response.json();
                    if (result.success) {
                        const vehicle = result.data.find((v: VehicleDetail) => v.phuong_tien_id === product.id);
                        if (vehicle) {
                            setVehiclePrice(vehicle.gia_thue);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch vehicle price", error);
                }
            }
        };
        fetchVehiclePrice();
    }, [product]);

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

    const handleNextFromPayment = (paymentData: any) => {
        setCheckoutData({ ...checkoutData, ...paymentData });
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
                <p>Giá thuê cơ bản trong một ngày: {vehiclePrice ? vehiclePrice.toLocaleString('vi-VN') : '...'} VNĐ</p>
            </div>

            {step === 'checkout' && <CheckOut onNext={handleNextFromCheckout} />}
            {step === 'shipping' && <CheckOutShiping onNext={handleNextFromShipping} onBack={handleBack} checkoutData={checkoutData} />}
            {step === 'payment' && <CheckOutPayment checkoutData={checkoutData} onBack={handleBack} onNext={handleNextFromPayment} />}
            {step === 'final' && <CheckOutFinal checkoutData={checkoutData} />}

            <div className="checkOut-product-support col-980">
                <p>Bạn cần hỗ trợ thêm? <span><a href="#">Chat ngay <i className="fa-brands fa-telegram"></i></a></span> hoặc gọi {getHotLine()}</p>
            </div>
            <Footer />
        </div>
    )
}

export default CheckOutPage;