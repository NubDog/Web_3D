import { useState, useEffect, useRef } from 'react';

import './../../styles/components/Card/Card.css';

import BaseCard from './BaseCard'


interface PhuongTien {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    trang_thai: string;
    gia_thue: number; // Thay gia_co_ban thành gia_thue
    chinh_sach_id: number;
    danh_muc_id: number;
    loai: string;
    img?: string;
}




const Card = () => {
    const [phuongTien, setPhuongTien] = useState<PhuongTien[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const cardBoxRef = useRef<HTMLDivElement>(null);
    const [clickCount, setClickCount] = useState(0);


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
                    // Lọc ra các xe hoạt động và thuộc danh mục id 2 (xe hơi)
                    const activeVehicles = result.data.filter((pt: PhuongTien) => pt.trang_thai === 'SAN_SANG');
                    const activeVehiclesCar = activeVehicles.filter((pt: PhuongTien) => pt.danh_muc_id == 2).slice(0, 10);

                    setPhuongTien(activeVehiclesCar);
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
    }, []);

    const data = phuongTien.map((pt) => ({
        id: pt.phuong_tien_id,
        img: pt.img,
        product_name: pt.ten_phuong_tien,
        product_category: pt.loai,
        // Sử dụng trực tiếp giá thuê từ bảng PhuongTien
        product_price: pt.gia_thue,
    }));

    console.log("Du lieu cardhypercar", data);

    return (
        <BaseCard
            card_title="Siêu xe siêu sang."
            card_subtitle=" Khẳng định đẳng cấp."
            Card_content_customMiddle="Card-content-customMiddle"
            data={data}
        />
    );
}

export default Card;