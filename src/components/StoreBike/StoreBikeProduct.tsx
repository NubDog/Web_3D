import react from 'react';
import './../../styles/components/StoreBike/CardGallery.css'
import './../../styles/components/StoreBike/StoreBikeProduct.css'
import Placeholder from '../../assets/Ninja H2R.png';
import Sub_Button from '../../components/Button/Sub-Button/Sub-Button'

interface CardProps {
    src_img: string;
    ten_phuong_tien: string;
    loai: string;
    gia_thue: string;
    bien_so: string;
}

const StoreBikeProduct = ({src_img, ten_phuong_tien, loai, gia_thue, bien_so}: CardProps) => {
    return (
        <div className="StoreBikeProduct-container">
            <div className="StoreBikeProduct-img">
                <img src={src_img || Placeholder}>
                </img>
            </div>

            <div className="StoreBikeProduct-content">
                <h2 className="StoreBikeProduct-name text-font-28">
                    {ten_phuong_tien || "Kawasaki Ninja H2R"}
                </h2>

                <p className="StoreBikeProduct-subName text-font-17">
                    {loai || "Xe 2 bánh to độ Police"}
                </p>
                
                <p className="StoreBikeProduct-introduce">
                    Biển số xe: {bien_so || "43A 2708. 2004"}
                </p>

                <p className="StoreBikeProduct-price text-font-17">
                    Giá chỉ từ: {gia_thue || "200.000đ"}
                </p>
            </div>

            <div className="StoreBikeProduct-button">
                <Sub_Button 
                    content = 'Thuê ngay'
                    onClick = {() => {}}
                />
            </div>
        </div>
    )
}

export default StoreBikeProduct;