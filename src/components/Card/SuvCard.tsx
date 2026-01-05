import { useState, useEffect } from 'react';

import './../../styles/components/Card/Card.css';
import BaseCard from './BaseCard';

interface PhuongTien {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    trang_thai: string;
    gia_thue: number;
    chinh_sach_id: number;
    danh_muc_id: number;
    loai: string;
    img?: string;
}



const SuvCard = () => {
    const [phuongTien, setPhuongTien] = useState<PhuongTien[]>([]);

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/phuong-tien';

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Thêm gia_thue vào danh sách fields cần lấy
                const fieldsPhuongTien = 'phuong_tien_id,ten_phuong_tien,trang_thai,gia_thue,loai,img,danh_muc_id';
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
                console.error('Error fetching SuvCard data:', err.message);
            }
        };

        fetchData();
    }, [])

    const data = phuongTien.map((pt) => ({
        id: pt.phuong_tien_id,
        img: pt.img,
        product_name: pt.ten_phuong_tien,
        product_category: pt.loai,
        product_price: pt.gia_thue,
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