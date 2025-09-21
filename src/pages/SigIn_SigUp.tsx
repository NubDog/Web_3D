import react from 'react';
import SignIn_SignUp from '../components/SignIn_SignUp/SigIn_SignUp';
import Header from './../components/Header/header';

const SignIn_SigUp = () => {
    return (
        <div className='signin-signup-page'>
            <Header />
            <SignIn_SignUp />
        </div>
    )
}

export default SignIn_SigUp;