import '../../styles/BigBanner/BigBanner.css'
import LinkA from '../LinkA/linkA.tsx'
import BabylonScene from '../babylon.tsx'

interface BigbannerProps {
    main_title: string;
    sub_title: string;

    link_content: string;
    link_sub_content: string;
    model_url: string;
    id?: string;
}

const BigBanner = ({main_title, sub_title, link_content, link_sub_content, model_url, id}: BigbannerProps) => {
    return (
        <div className="big-banner" id={id}>
            <div className="model-container">
                <div className="model-container-inner">
                    <BabylonScene modelUrl={model_url} />
                </div>
            </div>
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
        </div>
    )
}

export default BigBanner;
