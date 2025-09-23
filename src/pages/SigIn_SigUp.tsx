import react, {useState} from 'react';
import SignInComponent from '../components/SignIn_SignUp/SigIn';
import SignUpComponent from '../components/SignIn_SignUp/SignUp';
import './../styles/pages/SignIn_SingUp/SignIn_SingUp.css'
import Header from './../components/Header/header';

const SignInPage = () => {
     const [isLoginView, setIsLoginView] = useState(true);

    const showSignUp = () => setIsLoginView(false);

    const showLogin = () => setIsLoginView(true);
    return (
        <div className='signin-signup-page'>
            <Header />
             {isLoginView 
                ? <SignInComponent onSwitchToSignUp={showSignUp} /> 
                : <SignUpComponent onSwitchToLogin={showLogin} />
            }
        </div>
    )
}

export default SignInPage;