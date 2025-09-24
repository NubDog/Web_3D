import { useState, useEffect, useRef} from 'react';
import './../../styles/components/Card/Card.css';
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

interface ChinhSachGia {
    chinh_sach_id: number;
    gia_co_ban: number;
    ten_chinh_sach: string;
}

const CardFlycam = () => {
    const [phuongTien, setPhuongTien] = useState<PhuongTien[]>([]);
    const [, setChinhSachGia] = useState<ChinhSachGia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/phuong-tien';
    const API_URL_CHINH_SACH_GIA = 'https://r2-api.sharkeatrice.workers.dev/api/chinh-sach-gia';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fieldsPhuongTien = 'phuong_tien_id,ten_phuong_tien,trang_thai,chinh_sach_id,loai,img,danh_muc_id';
                const response = await fetch(`${API_URL}?fields=${fieldsPhuongTien}`);
                
                const fieldsChinhSach = 'chinh_sach_id,gia_co_ban,ten_chinh_sach';
                const responseChinhSachGia = await fetch(`${API_URL_CHINH_SACH_GIA}?fields=${fieldsChinhSach}`);

                if (!response.ok || !responseChinhSachGia.ok) {
                    throw new Error('Lỗi khi tải dữ liệu');
                }

                const result = await response.json();
                const resultChinhSachGia = await responseChinhSachGia.json();

                if (result.success && resultChinhSachGia.success) {
                    const activeVehicles = result.data.filter((pt: PhuongTien) => pt.trang_thai === 'SAN_SANG');
                    const activeVehiclesFlycam = activeVehicles.filter((pt: PhuongTien) => pt.danh_muc_id == 9).slice(0, 10);

                    const vehiclesWithPrice = activeVehiclesFlycam.map((pt: PhuongTien) => {
                        const chinhSach = resultChinhSachGia.data.find((cs: ChinhSachGia) => cs.chinh_sach_id === pt.chinh_sach_id);
                        return {
                            ...pt,
                            gia_co_ban: chinhSach ? chinhSach.gia_co_ban : 0,
                            ten_chinh_sach: chinhSach ? chinhSach.ten_chinh_sach : 'Không có chính sách'
                        };
                    });

                    setPhuongTien(vehiclesWithPrice);
                    setChinhSachGia(resultChinhSachGia.data);
                } else {
                    throw new Error('Không thể lấy dữ liệu từ một trong hai API');
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

    return (
        <BaseCard
            card_title="Bay cao và xa."
            card_subtitle=" Ghi lại từng khoản khắc hùng vĩ nhất của bạn."
            data={data}
            Card_content_customMiddle="Card-content-customMiddle"
        />
    )
}

export default CardFlycam;