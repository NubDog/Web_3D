import { useState, useEffect, useRef } from 'react';

import '../../styles/Card/Card.css';
import Lamborghini_model_Sian from './../../assets/Lamborghini Sian FKP 37.png';


interface PhuongTien {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    trang_thai: string;
    gia_co_ban: number;
    chinh_sach_id: number;
    loai: string;
    img?: string;
}

interface ChinhSachGia {
    chinh_sach_id: number;
    gia_co_ban: number;
    ten_chinh_sach: string;
}


const Card = () => {
    const [phuongTien, setPhuongTien] = useState<PhuongTien[]>([]);
    const [, setChinhSachGia] = useState<ChinhSachGia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const cardBoxRef = useRef<HTMLDivElement>(null);
    const [clickCount, setClickCount] = useState(0);


    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/phuong-tien';
    const API_URL_CHINH_SACH_GIA = 'https://r2-api.sharkeatrice.workers.dev/api/chinh-sach-gia';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fieldsPhuongTien = 'phuong_tien_id,ten_phuong_tien,trang_thai,chinh_sach_id,loai,img';
                const response = await fetch(`${API_URL}?fields=${fieldsPhuongTien}`);
                
                // Fetch dữ liệu chính sách giá
                const fieldsChinhSach = 'chinh_sach_id,gia_co_ban,ten_chinh_sach';
                const responseChinhSachGia = await fetch(`${API_URL_CHINH_SACH_GIA}?fields=${fieldsChinhSach}`);

                if (!response.ok || !responseChinhSachGia.ok) {
                    throw new Error('Lỗi khi tải dữ liệu');
                }

                const result = await response.json();
                const resultChinhSachGia = await responseChinhSachGia.json();

                if (result.success && resultChinhSachGia.success) {
                    // Lọc ra các xe hoạt động
                    const activeVehicles = result.data.filter((pt: PhuongTien) => pt.trang_thai === 'SAN_SANG');
                    
                    // Join dữ liệu: thêm gia_co_ban vào mỗi phương tiện
                    const vehiclesWithPrice = activeVehicles.map((pt: PhuongTien) => {
                        const chinhSach = resultChinhSachGia.data.find((cs: ChinhSachGia) => cs.chinh_sach_id === pt.chinh_sach_id);
                        return {
                            ...pt,
                            gia_co_ban: chinhSach ? chinhSach.gia_co_ban : 0,
                            ten_chinh_sach: chinhSach ? chinhSach.ten_chinh_sach : 'Không có chính sách'
                        };
                    });

                    // console.log('Dữ liệu đã join:', vehiclesWithPrice);
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
    }, []);

    const scrollLeft = () => {
        if (cardBoxRef.current) {
            const element = cardBoxRef.current;
            console.log('Current scroll left:', element.scrollLeft);
            console.log('Scroll width:', element.scrollWidth);
            console.log('Client width:', element.clientWidth);
            console.log('Can scroll left:', element.scrollLeft > 0);
            
            element.scrollBy({ left: -420, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (cardBoxRef.current) {
            const element = cardBoxRef.current;
            console.log('Current scroll left:', element.scrollLeft);
            console.log('Scroll width:', element.scrollWidth);
            console.log('Client width:', element.clientWidth);
            console.log('Can scroll right:', element.scrollLeft < element.scrollWidth - element.clientWidth);
            
            element.scrollBy({ left: 420, behavior: 'smooth' });
        }
    };

    const handleScrollLeft = () => {
        scrollLeft();
        setClickCount(prevCount => prevCount - 1);
    };

    const handleScrollRight = () => {
        scrollRight();
        setClickCount(prevCount => prevCount + 1);
    };

    console.log('Số lần bấm nút cuộn:', clickCount);

    if (loading) {
        console.log('Đang tải danh sách xe người ơi...');
    }

    if (loading === true) {
        console.log('Tải xong danh sách xe rồi người ơi...');
    }

    if (error) {
        console.log('Lỗi rồi người ơi...: {error}');
    }

    // console.log(phuongTien);
    
    
    return (
        <div className="Card-container">
            <div className="Card-title-container col-1617">
                <h2 className="Card-title">Thế hệ mới nhất. <span>Xem ngay có gì mới.</span></h2>
            </div>
            
            <div className="Card-box" ref={cardBoxRef}>
                <div className="Card-scroll-buttons">
                    <button className={clickCount === 0 ? 'non-active' : 'active'} onClick={handleScrollLeft} aria-label="Scroll Left">
                        <i className="icon-scroll fa-solid fa-angle-left"></i>
                    </button>
                    <button onClick={handleScrollRight} aria-label="Scroll Right">
                        <i className="icon-scroll fa-solid fa-angle-right"></i>
                    </button>
                </div>
                {phuongTien.map((pt) => (
                    <div className="Card-content" key={pt.phuong_tien_id}>
                        <div className="Card-content-title-link">
                            <a href="#">
                                <img 
                                    src={pt.img || Lamborghini_model_Sian}
                                    alt={pt.ten_phuong_tien}
                                    onError={(e) => {
                                        e.currentTarget.src = Lamborghini_model_Sian;
                                    }}
                                />
                            </a>
                        </div>
                        <div className="Card-content-title">
                            <p className="Card-content-title-text">Thuê ngay</p>
                            <h3 className="Card-content-title-header">{pt.ten_phuong_tien}</h3>
                            <p className="Card-content-title-subtitle">{pt.loai}</p>
                            <p className="Card-content-title-price">
                                {pt.gia_co_ban ? pt.gia_co_ban.toLocaleString('vi-VN') + ' VNĐ/ngày' : 'Liên hệ để biết giá'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Card;