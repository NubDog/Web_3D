import React from 'react';
import '../SmallBanner/SmallBanner.tsx'
import SmallBanner from '../SmallBanner/SmallBanner.tsx';
import '../../assets/Helicopters.png'

const helicopter_image = "../../assets/Helicopters.png";

const EditComponents = () => {
    return (
        <div>
            <SmallBanner
                id="small-banner"
                title="Trực thăngthăng"
                subtitle="Thoải mái ngắm thành phồ từ trên cao với những góc nhìn tuyệt vời"
                content="Thuê ngay trực thăng để có trải nghiệm tuyệt vời nhất"
                main_link="Thuê trực thăng"
                sub_link="Tìm hiểu thêm"
                image={helicopter_image}
            />
        </div>
    )
}

export default EditComponents;