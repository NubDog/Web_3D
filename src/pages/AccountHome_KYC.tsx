import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import './../styles/pages/AccountHome_KYC/AccountHome_KYC.css';

const AccountHome_KYC = () => {
    return (
        <div className="account-home-kyc-container">
            <Header />
            <div className="account-home-kyc-content">
                <h1>Thông tin tài khoản</h1>
            </div>
            <Footer />
        </div>
    )
}

export default AccountHome_KYC;