import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './../styles/pages/StoreBike/StoreBike.css';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import Button from '../components/Button/Button';
import StoreBikeGalleryCard from '../components/StoreBike/StoreGalleryCard';
import StoreBikeProduct from './../components/StoreBike/StoreBikeProduct';
import BannerCardSection from './../components/StoreComponents/BannerCardSection';
import TitleBanner from './../components/TitleBanner/TitleBanner';
import useVisibilityPercentage from '../hooks/useVisibilityPercentage';
import videoShowcase from '../assets/Video ShowCase/Ninja H2： Vol.10 Ninja H2R - BUILT BEYOND BELIEF.mp4';
import placeholderBike from '../assets/Ninja H2R.png';

import GalleryBike from './../assets/Gallery img/Gallery Bike.png'
import GalleryBike_DJIOsmo from './../assets/Gallery img/DJI launches Osmo Action 4.png';
import GalleryBike_FuelSaver from './../assets/Gallery img/GalleryBike_FuelSaver.jpg';
import GalleryBike_Style from './../assets/Gallery img/GalleryBike_Style.jpg';
import GalleryBike_Safety from './../assets/Gallery img/GalleryBike_Safety.png';
import GalleryBike_Tech from './../assets/Gallery img/GalleryBike_Tech.jpg';
import GalleryBike_off_road from './../assets/Gallery img/GalleryBike_off_road.jpg';
import { SmoothStepBlock } from '@babylonjs/core';

import Bannerimg1 from './../assets/Banner img/2023-YAMAHA-MT-07.png';
import Bannerimg2 from './../assets/Banner img/7-7-2.png';
import Bannerimg3 from './../assets/Banner img/464dcfd2-42b3-471f-b1de-14559b12e46d.png';
import Bannerimg4 from './../assets/Banner img/MG_Facelift_V85-Travel-NuovaGamma_box_1920x1440_moto-intera_2.png';

interface PhuongTien {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    trang_thai: string;
    gia_co_ban: number;
    chinh_sach_id: number;
    danh_muc_id: number;
    loai: string;
    bien_so: string;
    so_km: number;
    img: string;
    gia_thue: string;
}

interface ChinhSachGia {
    chinh_sach_id: number;
    gia_co_ban: number;
    ten_chinh_sach: string;
}

interface ProductInfor {
    phuong_tien_id: string;
    ten_phuong_tien: string;
    trang_thai: string;
    chinh_sach_id: string;
    loai: string;
    img: string;
    danh_muc_id: string;
    bien_so: string;
    so_km: string;
}

const informationCardGallery = [
    {
        card_title: "Nhỏ gọn và sự tiện lợi",
        card_subtitle: "Đưa bạn đi đến mọi nẻo đường",
        card_img: GalleryBike,
        card_link: "#",
    },

    {
        card_title: "DJI và mũ bảo hiểm",
        card_subtitle: "Sự kết hợp tuyệt vời",
        card_img: GalleryBike_DJIOsmo,
        card_link: "#",
    },

    {
        card_title: "Cân mọi địa hình",
        card_subtitle: "Vượt đèo trèo núi",
        card_img: GalleryBike_off_road,
        card_link: "#",
    },

    {
        card_title: "Tiết kiệm xăng tối đa",
        card_subtitle: "Vận hành êm ái, nhẹ ví tiền",
        card_img: GalleryBike_FuelSaver,
        card_link: "#",
    },

    {
        card_title: "Thiết kế thời thượng",
        card_subtitle: "Phong cách hiện đại, cá tính mọi nơi",
        card_img: GalleryBike_Style,
        card_link: "#",
    },

    {
        card_title: "An toàn tối đa",
        card_subtitle: "Phanh ABS và công nghệ chống trượt",
        card_img: GalleryBike_Safety,
        card_link: "#",
    },

    {
        card_title: "Công nghệ hiện đại",
        card_subtitle: "Màn hình thông minh, kết nối điện thoại",
        card_img: GalleryBike_Tech,
        card_link: "#",
    }
]

const StoreBike = () => {
    const navigate = useNavigate();
    const [phuongTien, setPhuongTien] = useState<PhuongTien[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const cardBoxRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (cardBoxRef.current) {
            const element = cardBoxRef.current;
            element.scrollBy({ left: -420, behavior: 'smooth'});
        }
    }

    const scrollRight = () => {
        if (cardBoxRef.current) {
            const element = cardBoxRef.current;
            element.scrollBy({ left: 420, behavior: 'smooth' });
        }
    }
    // const [videoScale, setVideoScale] = useState(1);
    // const [videoWidth, setVideoWidth] = useState(0);
    // const [videoHeight, setVideoHeight] = useState(0);

    // Kỹ thuật video tự co lại theo cuộn màn hình sẻ được làm sau
    // const [videoContainerRef, visibilityPercentage, isVideoVisible] = useVisibilityPercentage({
    //     threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    //     rootMargin: '0px',
    //     continuous: true
    // });


    // useEffect(() => {
    //     if (visibilityPercentage == 67) {
    //         setVideoWidth(1912);
    //         setVideoHeight(1080);
    //     }
    //     if (visibilityPercentage > 70) {
    //         setVideoWidth(1854);
    //         setVideoHeight(1048);
    //     }
    //     if (visibilityPercentage > 80) {
    //         setVideoWidth(1796);
    //         setVideoHeight(1015);
    //     }
    //     if (visibilityPercentage > 90) {
    //         setVideoWidth(1738);
    //         setVideoHeight(981);
    //     }
    //     if (visibilityPercentage > 100) {
    //         setVideoWidth(1680);
    //         setVideoHeight(949);
    //     }
        
    // }, [visibilityPercentage]);

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/phuong-tien';
    const API_URL_CHINH_SACH_GIA = 'https://r2-api.sharkeatrice.workers.dev/api/chinh-sach-gia';

    // Fetch data từ API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const fieldsPhuongTien = 'phuong_tien_id,ten_phuong_tien,trang_thai,chinh_sach_id,loai,img,gia_thue,danh_muc_id,bien_so,so_km';
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
                    const activeVehiclesBike = activeVehicles.filter((pd: PhuongTien) => pd.danh_muc_id == 1);

                    const vehiclesWithPrice = activeVehiclesBike.map((pt: PhuongTien) => {
                        const chinhSach = resultChinhSachGia.data.find((cs: ChinhSachGia) => cs.chinh_sach_id === pt.chinh_sach_id);
                        return {
                            ...pt,
                            gia_co_ban: chinhSach ? chinhSach.gia_co_ban : 0,
                            ten_chinh_sach: chinhSach ? chinhSach.ten_chinh_sach : 'Không có chính sách'
                        }
                    });

                    setPhuongTien(vehiclesWithPrice);
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

    const handleViewDetail = (product: PhuongTien) => {
        navigate('/product_detail', {
            state: {
                product: {
                    id: product.phuong_tien_id,
                    product_name: product.ten_phuong_tien,
                    product_category: product.loai,
                    product_price: product.gia_co_ban,
                    img: product.img,
                    gia_thue: product.gia_thue
                }
            }
        });
    };

    console.log(phuongTien);

    if (loading) {
        return (
            <div className="store-bike-page">
                <Header />
                <div className="store-bike-loading">
                    <h2>Đang tải dữ liệu xe máy...</h2>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="store-bike-page">
                <Header />
                <div className="store-bike-error">
                    <h2>Có lỗi xảy ra: {error}</h2>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="store-bike-page">
            <Header />
            
            <div className="store-bike-hero col-1658" ref={heroRef}>
                <div className="store-bike-container">
                    <div className="store-bike-title-section">
                        <h2 className="store-bike-title">
                            Xe máy
                        </h2>
                        <p className="store-bike-subtitle">Bạn muốn đi đâu? <br/> Nó đưa bạn tới đó</p>
                    </div>
                </div>
                
                <div className="store-bike-video-container">
                    <video 
                        className="store-bike-video"
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        controls={false}
                    >
                        <source src={videoShowcase} type="video/mp4" />
                        Trình duyệt của bạn không hỗ trợ video.
                    </video>
                </div>
            </div>

            <div className="storeBike-about">
                <div className="storeBike-title">
                    <h2> TÌM HIỂU XE MÁY.</h2>
                </div>

                <div id="storeBike_Gallery" className="storeBike-about-gallery">

                    <div className="Card-scroll-buttons">
                        <button
                            className="active left"
                            aria-label="Scroll Left"
                            onClick={scrollLeft}
                        >
                            <i className="icon-scroll fa-solid fa-angle-left"></i>
                        </button>

                        <button 
                            className="active" 
                            aria-label="Scroll Right"
                            onClick={scrollRight}
                        >
                            <i className="icon-scroll fa-solid fa-angle-right"></i>
                        </button>
                    </div>

                    <div className="storeBike_gallery_containerCard" ref={cardBoxRef}>
                        {informationCardGallery.map((item, index) => (
                            <StoreBikeGalleryCard
                                key = {index}
                                card_title = {item.card_title}
                                card_subtitle = {item.card_subtitle}
                                card_img = {item.card_img}
                                card_link = {item.card_link}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="StoreBike-product">
                <div className="storeBike-title">
                    <h2>Khám phá dòng sản phẩm.</h2>
                </div>
                
                <div className="StoreBike-product-container">
                    <div className="Card-scroll-buttons">
                        <button
                            className="active left"
                            aria-label="Scroll Left"
                            onClick={scrollLeft}
                        >
                            <i className="icon-scroll fa-solid fa-angle-left"></i>
                        </button>

                        <button 
                            className="active" 
                            aria-label="Scroll Right"
                            onClick={scrollRight}
                        >
                            <i className="icon-scroll fa-solid fa-angle-right"></i>
                        </button>
                    </div>
                    
                    <div className="StoreBike-product-box" ref={cardBoxRef}>
                        {phuongTien.map((bike) => (
                            <StoreBikeProduct
                                key = {bike.phuong_tien_id}
                                id = {bike.phuong_tien_id}
                                src_img = {bike.img}
                                ten_phuong_tien = {bike.ten_phuong_tien}
                                loai = {bike.loai}
                                gia_thue = {bike.gia_thue}
                                bien_so = {bike.bien_so}
                                gia_co_ban = {bike.gia_co_ban}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="BannerCardSection">

                <div className="BannerCard-container col-1658">

                    <TitleBanner
                        title="Xe mô tô 2 bánh."
                    />
                    
                    <div className="BannerCard-content">
                        <BannerCardSection
                            img = {Bannerimg1}
                            title = "Thuê xe máy. Tiện lợi vượt mong đợi."
                            subtitle = "Lên kế hoạch cho chuyến đi của bạn? Với dịch vụ thuê xe máy của chúng tôi, bạn có thể dễ dàng chọn lựa chiếc xe ưng ý, tận hưởng sự tự do di chuyển và khám phá mọi ngóc ngách."
                            link = "Xem ngay bộ sưu tập xe >"
                        />
                        <BannerCardSection
                            img = {Bannerimg2}
                            title = "Trải nghiệm hoàn hảo. Khám phá tự do."
                            subtitle = "Tận hưởng cảm giác tự do tuyệt đối khi vi vu trên chiếc xe máy thuê. Xe luôn được bảo dưỡng định kỳ, trang bị đầy đủ an toàn, đảm bảo chuyến đi của bạn luôn suôn sẻ và đáng nhớ."
                            link = "Tìm hiểu thêm về dịch vụ >"
                        />
                    </div>

                </div>

                <div className="BannerCard-container col-1658">

                    <TitleBanner
                        title="Xe mô tô 2 bánh."
                    />
                    
                    <div className="BannerCard-content">
                        <BannerCardSection
                            img = {Bannerimg3}
                            title = "Khám phá Việt Nam. Với mức giá tốt nhất."
                            subtitle = "Dịch vụ thuê xe máy giúp bạn tiết kiệm chi phí di chuyển, linh hoạt lịch trình và trải nghiệm địa phương một cách chân thực nhất. Bắt đầu cuộc phiêu lưu của bạn ngay hôm nay!"
                            link = "Xem bảng giá chi tiết >"
                        />
                        <BannerCardSection
                            img = {Bannerimg4}
                            title = "Hỗ trợ tận tâm. Mọi lúc mọi nơi."
                            subtitle = "Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7, từ lúc đặt xe đến khi kết thúc hành trình. An tâm trên mọi cung đường với sự đồng hành chuyên nghiệp."
                            link = "Liên hệ hỗ trợ >"
                        />
                    </div>

                </div>

            </div>

            <Footer />
        </div>
    );
};

export default StoreBike;