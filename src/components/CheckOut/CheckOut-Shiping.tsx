import React, { useState, useEffect } from 'react';
import './../../styles/components/CheckOut/CheckOut-Shiping.css';
import Input from '../Input/input';
import Sub_Button from '../Button/Sub-Button/Sub-Button';
import { useAuth } from '../../contexts/AuthContext';

interface CheckOutShipingProps {
    onNext: (data: any) => void;
    onBack: () => void;
    checkoutData?: any;
}

const CheckOutShiping: React.FC<CheckOutShipingProps> = ({ onNext, onBack, checkoutData }) => {
    const { currentUser } = useAuth();

    const [ngayMuon, setNgayMuon] = useState('');
    const [ngayTra, setNgayTra] = useState('');

    const [soDienThoai, setSoDienThoai] = useState(currentUser?.so_dien_thoai || '');
    const [email, setEmail] = useState(currentUser?.email || '');

    const [diaDiemNhan, setDiaDiemNhan] = useState('');
    const [diaDiemTra, setDiaDiemTra] = useState('');

    useEffect(() => {
        if (currentUser) {
            if (!soDienThoai) setSoDienThoai(currentUser.so_dien_thoai || '');
            if (!email) setEmail(currentUser.email || '');
        }
    }, [currentUser]);

    const calculateRentalDays = (startDate: string, endDate: string): number => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const timeDifference = end.getTime() - start.getTime();
        const dayDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        return dayDifference > 0 ? dayDifference : 0;
    };

    const rentalDays = calculateRentalDays(ngayMuon, ngayTra);

    const handleChangeNgayMuon = (e: React.ChangeEvent<HTMLInputElement>) => setNgayMuon(e.target.value);
    const handleChangeNgayTra = (e: React.ChangeEvent<HTMLInputElement>) => setNgayTra(e.target.value);
    const handleChangeSDT = (e: React.ChangeEvent<HTMLInputElement>) => setSoDienThoai(e.target.value);
    const handleChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
    const handleChangeDiaDiemNhan = (e: React.ChangeEvent<HTMLInputElement>) => setDiaDiemNhan(e.target.value);
    const handleChangeDiaDiemTra = (e: React.ChangeEvent<HTMLInputElement>) => setDiaDiemTra(e.target.value);

    const handleSubmit = () => {
        if (!ngayMuon || !ngayTra || !soDienThoai || !email || !diaDiemNhan || !diaDiemTra) {
            alert('Vui lòng điền đầy đủ thông tin: ngày thuê, liên hệ, và địa điểm nhận/trả xe.');
            return;
        }

        if (rentalDays <= 0) {
            alert('Ngày trả phải sau ngày mượn ít nhất 1 ngày.');
            return;
        }

        onNext({
            ngayMuon,
            ngayTra,
            soDienThoai,
            email,
            diaDiemNhan,
            diaDiemTra,
            rentalDays,
            tongTienDuKien: rentalDays * (checkoutData?.product?.price || 0)
        });
    };

    return (
        <div className='checkOut-shiping col-980'>
            <div className='checkout-back-button' onClick={onBack}>
                <i className="fa-solid fa-arrow-left"></i>
                <p>Quay lại</p>
            </div>

            <h1>Thông tin thuê xe</h1>
            <h2>Vui lòng chọn thời gian và xác nhận thông tin liên hệ:</h2>

            <form className='checkOut-shiping-form'>

                <div className="date-selection-group" style={{ marginBottom: '20px' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Ngày nhận xe:</p>
                        <Input
                            placeholder=''
                            value={ngayMuon}
                            onChange={handleChangeNgayMuon}
                            type='date'
                        />
                    </div>

                    <div>
                        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Ngày trả xe:</p>
                        <Input
                            placeholder=''
                            value={ngayTra}
                            onChange={handleChangeNgayTra}
                            type='date'
                        />
                    </div>
                </div>

                {rentalDays > 0 && (
                    <div style={{
                        padding: '15px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '8px',
                        margin: '10px 0 20px 0',
                        border: '1px solid #90caf9',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: 0, color: '#1565c0', fontWeight: 'bold' }}>
                            <i className="fa-regular fa-clock"></i> Tổng thời gian thuê: {rentalDays} ngày
                        </p>
                    </div>
                )}

                <h3>Thông tin liên hệ (Để nhân viên xác nhận):</h3>
                <Input
                    placeholder='Số điện thoại'
                    value={soDienThoai}
                    onChange={handleChangeSDT}
                    type='text'
                />
                <Input
                    placeholder='Email'
                    value={email}
                    onChange={handleChangeEmail}
                    type='text'
                />

                <h3>Nhập địa điểm nhận và trả xe:</h3>
                <Input
                    placeholder='Địa điểm nhận xe'
                    value={diaDiemNhan}
                    onChange={handleChangeDiaDiemNhan}
                    type='text'
                />
                <Input
                    placeholder='Địa điểm trả xe'
                    value={diaDiemTra}
                    onChange={handleChangeDiaDiemTra}
                    type='text'
                />


                <Sub_Button
                    content='Gửi Yêu Cầu Thuê Xe'
                    onClick={handleSubmit}
                />
            </form>
        </div>
    )
}

export default CheckOutShiping;