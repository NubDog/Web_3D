import React, { useState, useEffect } from 'react';

import '../../styles/Card/Card.css';
import Lamborghini_model_Sian from './../../assets/Lamborghini Sian FKP 37.png';


interface PhuongTien {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    trang_thai: string;
    gia_co_ban: number;
    chinh_sach_id: number;
    loai: string;
}

interface ChinhSachGia {
    chinh_sach_id: number;
}

const Card = () => {
    const [phuongTien, setPhuongTien] = useState<PhuongTien[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [chinhSachGia, setChinhSachGia] = useState<ChinhSachGia[]>([]);

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/phuong-tien';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fields = 'phuong_tien_id,ten_phuong_tien,trang_thai,chinh_sach_id,gia_co_ban,loai';
                const response = await fetch(`${API_URL}?fields=${fields}`);

                if (!response.ok) {
                    throw new Error('Lỗi khi tải dữ liệu');
                }

                const result = await response.json();
                // console.log(result); // log ra dữ liệu ở console

                // lọc ra các xe hoạt động
                const activeVehecles = result.data.filter((pt: PhuongTien) => pt.trang_thai === 'Hoạt động');

                if (result.success) {
                    setPhuongTien(activeVehecles);
                } else {
                    throw new Error(result.error || 'Không thể lấy dữ liệu');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        console.log('Đang tải danh sách xe người ơi...');
    }

    if (loading === true) {
        console.log('Tải xong danh sách xe rồi người ơi...');
    }

    if (error) {
        console.log('Lỗi rồi người ơi...: {error}');
    }

    return (
        <div className="Card-container">
            <div className="Card-title">
                <span>Thế hệ mới nhất.</span>
                Xem ngay có gì mới.
            </div>

            <div className="Card-box">
                {phuongTien.map((pt) => (
                    <div className="Card-content" key={pt.phuong_tien_id}>
                        <div className="Card-content-title-link">
                            <a href="#">
                                <img src={Lamborghini_model_Sian} alt={pt.ten_phuong_tien} />
                            </a>
                        </div>
                        <div className="Card-content-title">
                            <p className="Card-content-title-text">Thuê ngay</p>
                            <h3 className="Card-content-title-header">{pt.ten_phuong_tien}</h3>
                            <p className="Card-content-title-subtitle">{pt.loai}</p>
                            <p className="Card-content-title-price">{pt.chinh_sach_id}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Card;