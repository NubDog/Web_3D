import { useState, useEffect, useRef } from 'react';
import './../../styles/components/Card/MiniCard.css';
import './../../styles/components/Card/Card.css';

const MiniCard = () => {
    const cardBoxRef = useRef<HTMLDivElement>(null);
    const [clickCount, setClickCount] = useState(0);

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
    return (
        <div className="Card-container">
            <div className="Card-title-container">
                <h2 className="Card-title">Shark Eat Rice tạo nên mọi khác biệt. <span>Thêm nhiều lý do để thuê cùng chúng tôi</span></h2>
            </div>

            <div className="Card-box" ref={cardBoxRef}>
                <div className="Card-scroll-buttons">
                    <button className={clickCount === 0 ? 'non-active' : 'active'} onClick={handleScrollLeft} aria-label="Scroll Left">
                        <i className="icon-scroll fa-solid fa-angle-left"></i>
                    </button>
                    <button className={clickCount >= 2 ? 'non-active' : 'active'} onClick={handleScrollRight} aria-label="Scroll Right">
                        <i className="icon-scroll fa-solid fa-angle-right"></i>
                    </button>
                </div>
                <div className="Card-content MiniCard-content MiniCard-box-blue">
                    <div className="Card-content-title-link">
                        <a href="#"></a>
                    </div>
                    <div className="Card-content-title">
                        <i className="fa-brands fa-telegram"></i>
                        <p>
                            <span>Đổi xe miễn phí, </span>
                            nhận điểm tín dụng cho lần thuê tới
                        </p>
                    </div>
                </div>

                <div className="Card-content MiniCard-content MiniCard-box-green">
                    <div className="Card-content-title-link">
                        <a href="#"></a>
                    </div>
                    <div className="Card-content-title">
                        <i className="fa-brands fa-xbox"></i>
                        <p>
                            Thanh toán hàng tháng thật dễ dàng. Bao gồm lựa chọn
                            <span> lãi suất 0%</span>
                        </p>
                    </div>
                </div>

                <div className="Card-content MiniCard-content MiniCard-box-purple">
                    <div className="Card-content-title-link">
                        <a href="#"></a>
                    </div>
                    <div className="Card-content-title">
                        <i className="fa-brands fa-twitch"></i>
                        <p>
                            Thêm yêu cầu của riêng bạn.
                            <span> Khắc kết hợp biể tượng cảm xúc, tên và số miễn phí.</span>
                        </p>
                    </div>
                </div>

                <div className="Card-content MiniCard-content MiniCard-box-green">
                    <div className="Card-content-title-link">
                        <a href="#"></a>
                    </div>
                    <div className="Card-content-title">
                        <i className="fa-brands fa-dropbox"></i>
                        <p>
                            Giao hàng miễn phí
                        </p>
                    </div>
                </div>

                <div className="Card-content MiniCard-content MiniCard-box-darkblue">
                    <div className="Card-content-title-link">
                        <a href="#"></a>
                    </div>
                    <div className="Card-content-title">
                        <i className="fa-brands fa-opencart"></i>
                        <p>
                            Trải nghiệm
                            <span> thuê đa phương tiện được cá nhân hóa </span>
                            với
                            <span> ứng dụng Shark Ear Rice Store.</span>
                        </p>
                    </div>
                </div>

                <div className="Card-content MiniCard-content MiniCard-box-gradiant">
                    <div className="Card-content-title-link">
                        <a href="#"></a>
                    </div>
                    <div className="Card-content-title">
                        <i className="fa-brands fa-ubuntu"></i>
                        <p>
                            <span> Tuỳ chỉnh </span>
                            xe của bạn và tạo phong cách riêng cho chiến mã
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MiniCard;