import react from 'react';
import SignInComponent from '../components/SignIn_SignUp/SigIn';
import SignUpComponent from '../components/SignIn_SignUp/SignUp';
import './../styles/pages/SignIn_SingUp/SignIn_SingUp.css'
import Header from './../components/Header/header';

const SignInPage = () => {
    return (
        <div className='signin-signup-page'>
            <Header />
            <SignInComponent />
            <SignUpComponent />
        </div>
    )
}

export default SignInPage;