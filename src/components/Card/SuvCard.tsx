import {useState, useEffect, useRef} from 'react';

import './../../styles/Card/Card.css';
import BaseCard from './BaseCard';

interface PhuongTien {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    trang_thai: string;
    gia_co_ban: number;
    chinh_sach_id: number;
    danh_muc_id: number;
    loai: string;
    img?: string;
}

const SuvCard = () => {
    const [phuongTien, setPhuongTien] = useState<PhuongTien[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/phuong-tien';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fieldsPhuongTien = 'phuong_tien_id,ten_phuong_tien,trang_thai,chinh_sach_id,loai,img,danh_muc_id';
                const response = await fetch(`${API_URL}?fields=${fieldsPhuongTien}`);


                if (!response.ok) {
                    throw new Error('Lỗi khi tải dữ liệu');
                }

                const result = await response.json();

                if (result.success) {
                    const activeVehicles = result.data.filter((pt: PhuongTien) => pt.trang_thai === 'SAN_SANG');
                    const activeVehiclesSuv = activeVehicles.filter((pt: PhuongTien) => pt.danh_muc_id == 3).slice(0, 10);
                    setPhuongTien(activeVehiclesSuv);
                } else {
                    throw new Error('Không thể lấy dữ liệu từ API');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [])

    const data = phuongTien.map((pt) => ({
        id: pt.phuong_tien_id,
        img: pt.img,
        product_name: pt.ten_phuong_tien,
        product_category: pt.loai,
        product_price: pt.gia_co_ban,
    }));

    console.log("Du lieu suvcard", data);

    return (
        <BaseCard
            card_title="To, rộng rãi."
            card_subtitle=" Lựa chọn hoàn hảo cho chuyến đi cùng gia đình."
            data={data}
            Card_content_customMiddle="Card-content-customMiddle"
        />
    )
}

export default SuvCard;