import React from 'react';
import './../../styles/components/CheckOut/CheckOut-Shiping.css';
import Input from '../Input/input';
import Sub_Button from '../Button/Sub-Button/Sub-Button';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface CheckOutShipingProps {
    onNext: (data: any) => void;
    onBack: () => void;
    checkoutData?: any;
}

const CheckOutShiping: React.FC<CheckOutShipingProps> = ({ onNext, onBack, checkoutData }) => {
    // Log để kiểm tra dữ liệu nhận được
    console.log('Dữ liệu từ component trước:', checkoutData);
    
    const [ho, setHo] = useState('');
    const [ten, setTen] = useState('');
    const [quanHuyen, setQuanHuyen] = useState('');
    const [diaDiemNhan, setDiadiemNhan] = useState('');
    const [diadiemTra, setDiadiemTra] = useState('');
    const [ngayMuon, setNgayMuon] = useState('');
    const [ngayTra, setNgayTra] = useState('');
    const [soDienThoai, setSoDienThoai] = useState('');
    const [email, setEmail] = useState('');

    // Hàm tính số ngày giữa hai ngày
    const calculateRentalDays = (startDate: string, endDate: string): number => {
        if (!startDate || !endDate) return 0;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Tính số milliseconds giữa hai ngày
        const timeDifference = end.getTime() - start.getTime();
        
        // Chuyển đổi từ milliseconds sang ngày (1 ngày = 24 * 60 * 60 * 1000 ms)
        const dayDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        
        return dayDifference > 0 ? dayDifference : 0;
    };

    // Tính số ngày thuê
    const rentalDays = calculateRentalDays(ngayMuon, ngayTra);

    const handleChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHo(e.target.value);
    }
    const handleChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTen(e.target.value);
    }
    const handleChange3 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuanHuyen(e.target.value);
    }
    const handleChange4 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDiadiemNhan(e.target.value);
    }
    const handleChange4_1 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDiadiemTra(e.target.value);
    }
    const handleChange5 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNgayMuon(e.target.value);
    }
    const handleChange6 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNgayTra(e.target.value);
    }
    const handleChange7 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSoDienThoai(e.target.value);
    }
    const handleChange8 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    }

    const handleNextClick = () => {
        if (!ho || !ten || !quanHuyen || !diaDiemNhan || !diadiemTra || !ngayMuon || !ngayTra || !soDienThoai || !email) {
            alert('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        if (rentalDays <= 0) {
            alert('Ngày trả phải sau ngày mượn.');
            return;
        }

        onNext({ 
            ho, 
            ten, 
            quanHuyen, 
            diaDiemNhan,
            diadiemTra,
            ngayMuon, 
            ngayTra, 
            soDienThoai, 
            email,
            rentalDays
        });
    };

    return (
        <div className='checkOut-shiping col-980'>
            <div className='checkout-back-button' onClick={onBack}>
                <i className="fa-solid fa-arrow-left"></i>
                <p>Quay lại</p>
            </div>
            <h1>Chúng tôi giao xe cho bạn đến địa chỉ nào?</h1>
            <h2>Nhập tên của bạn và địa chỉ trước khi sáp nhập:</h2>

            <form className='checkOut-shiping-form'>
                <Input 
                    placeholder='Họ'
                    value={ho}
                    onChange={handleChange1}
                    type='text'
                />
                <Input 
                    placeholder='Tên'
                    value={ten}
                    onChange={handleChange2}
                    type='text'
                />
                <Input 
                    placeholder='Quận/Huyện'
                    value={quanHuyen}
                    onChange={handleChange3}
                    type='text'
                />
                <Input 
                    placeholder='Địa điểm nhận xe'
                    value={diaDiemNhan}
                    onChange={handleChange4}
                    type='text'
                />
                <Input 
                    placeholder='Địa điểm trả xe'
                    value={diadiemTra}
                    onChange={handleChange4_1}
                    type='text'
                />

                <p>Ngày mượn</p>
                <Input 
                    placeholder=''
                    value={ngayMuon}
                    onChange={handleChange5}
                    type='date'
                />
                <p>Ngày trả</p>
                <Input 
                    placeholder=''
                    value={ngayTra}
                    onChange={handleChange6}
                    type='date'
                />

                {rentalDays > 0 && (
                    <div style={{ 
                        padding: '10px', 
                        backgroundColor: '#f0f8ff', 
                        borderRadius: '8px', 
                        margin: '10px 0',
                        border: '1px solid #e0e0e0'
                    }}>
                        <p style={{ 
                            margin: 0, 
                            fontWeight: 'bold', 
                            color: '#333' 
                        }}>
                            Tổng số ngày thuê: {rentalDays} ngày
                        </p>
                    </div>
                )}

                <h3>Thông tin liên hệ của bạn là gì?</h3>
                <Input 
                    placeholder='Số điện thoại'
                    value={soDienThoai}
                    onChange={handleChange7}
                    type='text'
                />
                <Input 
                    placeholder='Email'
                    value={email}
                    onChange={handleChange8}
                    type='text'
                />
                <Sub_Button content='Tiếp tục đến phần thanh toán' onClick={handleNextClick} />
            </form>

        </div>
    )
}

export default CheckOutShiping;