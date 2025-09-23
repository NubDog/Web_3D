import React from 'react';
import './../../styles/components/CheckOut/CheckOut-Shiping.css';
import Input from '../Input/input';
import Sub_Button from '../Button/Sub-Button/Sub-Button';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface CheckOutShipingProps {
    onNext: (data: any) => void;
    onBack: () => void;
}

const CheckOutShiping: React.FC<CheckOutShipingProps> = ({ onNext, onBack }) => {
    const location = useLocation();
    const [ho, setHo] = useState('');
    const [ten, setTen] = useState('');
    const [quanHuyen, setQuanHuyen] = useState('');
    const [diaChiChiTiet, setDiaChiChiTiet] = useState('');
    const [ngayMuon, setNgayMuon] = useState('');
    const [ngayTra, setNgayTra] = useState('');
    const [soDienThoai, setSoDienThoai] = useState('');
    const [email, setEmail] = useState('');

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
        setDiaChiChiTiet(e.target.value);
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
                    placeholder='Địa chỉ chi tiết'
                    value={diaChiChiTiet}
                    onChange={handleChange4}
                    type='text'
                />

                <Input 
                    placeholder='Ngày mượn'
                    value={ngayMuon}
                    onChange={handleChange5}
                    type='date'
                />
                <Input 
                    placeholder='Ngày trả'
                    value={ngayTra}
                    onChange={handleChange6}
                    type='date'
                />

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
                <Sub_Button content='Tiếp tục đến phần thanh toán' onClick={() => onNext({ ho, ten, quanHuyen, diaChiChiTiet, ngayMuon, ngayTra, soDienThoai, email })} />
            </form>

        </div>
    )
}

export default CheckOutShiping;