import React from 'react';
import '../../styles/BigBanner/BigBanner.css'
import LinkA from '../LinkA/linkA.tsx'

interface BigbannerProps {
    main_title: string;
    sub_title: string;

    link_content: string;
    link_sub_content: string;
}

const BigBanner = ({main_title, sub_title, link_content, link_sub_content}: BigbannerProps) => {
    return (
        <div className="big-banner">
            <a href="#">
                <div className="content-banner">
                    <div className="banner-tittle">
                        <h2 className="content-title">{main_title}</h2>
                        <p className="content-subtitle">{sub_title}</p>
                    </div>

                    <div className="banner-link">
                        <LinkA content_link={link_content} />

                        <LinkA content_link={link_sub_content} />
                    </div>
                </div>
            </a>
        </div>
    )
}

export default BigBanner;
