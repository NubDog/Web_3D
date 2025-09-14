import { useState} from 'react';
import '../../styles/SmallBanner/SmallBanner.css';
import LinkA from '../LinkA/linkA.tsx';

interface SmallBannerProps {
    id?: string;
    title: string;
    subtitle: string;
    content: string;
    main_link: string;
    sub_link: string;
    image: string;
}

const SmallBanner = ( {id, title, subtitle, content, main_link, sub_link, image}: SmallBannerProps ) => {
    return (
        <div id={id} className="SmallBanner-container">
            <img src={image}/>
            <h2>{title}</h2>
            <p>{subtitle}</p>
            <p id='last-subtitle'>{content}</p>

            <div className='SmallBanner-link'>
                <LinkA content_link={main_link} />
                <LinkA content_link={sub_link} />
            </div>
        </div>
    )
}

export default SmallBanner;