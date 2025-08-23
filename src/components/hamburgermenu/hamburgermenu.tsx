import "./hamburgermenu.css";

const HamburgerMenu = () => {
    return (
        <div className="hamburger">
            <input className="checkbox" type="checkbox" />
            <svg fill="none" viewBox="0 0 50 50" height="28" width="28">
                <path
                    className="lineTop line"
                    strokeLinecap="round"
                    strokeWidth="4"
                    stroke="black"
                    d="M6 11L44 11"
                />
                <path
                    className="lineMid line"
                    strokeLinecap="round"
                    strokeWidth="4"
                    stroke="black"
                    d="M6 24H43"
                />
                <path
                    className="lineBottom line"
                    strokeLinecap="round"
                    strokeWidth="4"
                    stroke="black"
                    d="M6 37H43"
                />
            </svg>
        </div>
    )
}

export default HamburgerMenu;