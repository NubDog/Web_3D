import { useState, type FormEvent } from 'react';
import './../styles/pages/SignIn_SingUp/SignIn_SingUp.css';
import Header from './../components/Header/header';

const Forgot_password: React.FC = () => {
    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api';

    const [email, setEmail] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [step, setStep] = useState<number>(1);
    const [token, setToken] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    const emailCheck = async (e: FormEvent) => {
        e.preventDefault();

        if (!email || email.trim() === '') {
            alert('Vui lòng nhập email');
            return;
        }

        setIsLoading(true);
        
        try {
            const encodedEmail = encodeURIComponent(email.trim());
            const response = await fetch(`${API_URL}/quen-mat-khau/${encodedEmail}`);

            const result = await response.json();

            if (result.success) {
                alert('✅ Đã gửi mã khôi phục, vui lòng kiểm tra email!');
                setStep(2);
            } else {
                alert('❌ Lỗi: ' + result.error);
            }
        } catch (err: any) {
            console.error(err);
            alert('❌ Lỗi kết nối server');
        } finally {
            setIsLoading(false);
        }
    };

    const otpCheckVerify = async (e: FormEvent) => {
        e.preventDefault();

        if (!token || token.trim() === '') {
            alert("Vui lòng nhập mã xác nhận");
            return;
        }

        if (!newPassword || newPassword.trim() === '') {
            alert("Vui lòng nhập mật khẩu mới");
            return;
        }

        if (newPassword.length < 6) {
            alert("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp");
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await fetch(`${API_URL}/xac-nhan-doi-mat-khau`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),       
                    token: token.trim(),
                    newPassword: newPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                alert("✅ Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.");
                window.location.href = '/signin'; 
            } else {
                alert("❌ Lỗi: " + result.error);
            }
        } catch (err) {
            console.error(err);
            alert("❌ Lỗi kết nối server");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="signin-signup-container" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px'
            }}>
                {step === 1 && (
                    <form 
                        className="signin-signup-form" 
                        onSubmit={emailCheck}
                        style={{
                            maxWidth: '450px',
                            width: '100%',
                            animation: 'fadeIn 0.5s ease-in-out'
                        }}
                    >
                        <div className="forgot-password-header" style={{textAlign: 'center', marginBottom: '35px'}}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 20px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                            }}>
                                <i className="fa-solid fa-key" style={{fontSize: '36px', color: 'white'}}></i>
                            </div>
                            <h2 style={{
                                margin: '0 0 12px 0', 
                                fontSize: '28px', 
                                fontWeight: '700', 
                                color: '#2d3748'
                            }}>
                                Quên mật khẩu?
                            </h2>
                            <p style={{
                                color: '#718096', 
                                fontSize: '15px', 
                                margin: '0',
                                lineHeight: '1.6'
                            }}>
                                Nhập email của bạn để nhận mã khôi phục
                            </p>
                        </div>

                        <div className="signin-signup-field">
                            <label htmlFor="email_forgot" className="signin-signup-label" style={{
                                color: '#4a5568',
                                fontWeight: '600',
                                marginBottom: '8px'
                            }}>
                                Email khôi phục
                            </label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-regular fa-envelope" aria-hidden="true" style={{color: '#a0aec0'}}></i>
                                <input 
                                    type="email" 
                                    id='email_forgot'
                                    placeholder='example@email.com'
                                    className="signin-signup-input"
                                    autoComplete='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{color: '#2d3748'}}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="signin-signup-button-submit"
                            disabled={isLoading}
                            style={{marginTop: '25px'}}
                        >
                            <span className="signin-signup-button-submit-circle" aria-hidden="true">
                                <span className="signin-signup-button-submit-icon arrow"></span>
                            </span>
                            <span className="signin-signup-button-submit-text">
                                {isLoading ? "Đang gửi..." : "Gửi mã xác nhận"}
                            </span>
                        </button>

                        <p className="signin-signup-text" style={{textAlign: 'center', marginTop: '20px', color: '#718096'}}>
                            Nhớ mật khẩu?{' '}
                            <a href="/signin" className="signin-signup-link" style={{
                                color: '#667eea',
                                fontWeight: '600',
                                textDecoration: 'none'
                            }}>
                                Đăng nhập ngay
                            </a>
                        </p>
                    </form>
                )}

                {/* Bước 2: Nhập OTP và Mật khẩu mới */}
                {step === 2 && (
                    <form 
                        className="signin-signup-form" 
                        onSubmit={otpCheckVerify}
                        style={{
                            maxWidth: '450px',
                            width: '100%',
                            animation: 'fadeIn 0.5s ease-in-out'
                        }}
                    >
                        <div className="forgot-password-header" style={{textAlign: 'center', marginBottom: '35px'}}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 20px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                            }}>
                                <i className="fa-solid fa-shield-halved" style={{fontSize: '36px', color: 'white'}}></i>
                            </div>
                            <h2 style={{
                                margin: '0 0 12px 0', 
                                fontSize: '28px', 
                                fontWeight: '700', 
                                color: '#2d3748'
                            }}>
                                Đặt lại mật khẩu
                            </h2>
                            <p style={{
                                color: '#718096', 
                                fontSize: '14px', 
                                margin: '0 0 8px 0'
                            }}>
                                Mã xác nhận đã được gửi đến
                            </p>
                            <p style={{
                                color: '#667eea', 
                                fontSize: '15px', 
                                fontWeight: '600', 
                                margin: '0',
                                wordBreak: 'break-all'
                            }}>
                                {email}
                            </p>
                        </div>

                        {/* Input OTP */}
                        <div className="signin-signup-field">
                            <label htmlFor="otp_input" className="signin-signup-label" style={{
                                color: '#4a5568',
                                fontWeight: '600',
                                marginBottom: '8px'
                            }}>
                                Mã xác nhận (OTP)
                            </label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-solid fa-hashtag" aria-hidden="true" style={{color: '#a0aec0'}}></i>
                                <input 
                                    type="text" 
                                    id='otp_input'
                                    placeholder='Nhập mã 6 số'
                                    className="signin-signup-input"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                    maxLength={6}
                                    pattern="[0-9]*"
                                    required
                                    style={{
                                        color: '#2d3748',
                                        letterSpacing: '4px',
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Mật khẩu mới */}
                        <div className="signin-signup-field">
                            <label htmlFor="new_password" className="signin-signup-label" style={{
                                color: '#4a5568',
                                fontWeight: '600',
                                marginBottom: '8px'
                            }}>
                                Mật khẩu mới
                            </label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-solid fa-lock" aria-hidden="true" style={{color: '#a0aec0'}}></i>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    id='new_password'
                                    placeholder='Ít nhất 6 ký tự'
                                    className="signin-signup-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                    required
                                    style={{color: '#2d3748'}}
                                />
                                <i 
                                    className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} 
                                    aria-hidden="true"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{cursor: 'pointer', color: '#a0aec0'}}
                                ></i>
                            </div>
                        </div>

                        {/* Xác nhận mật khẩu */}
                        <div className="signin-signup-field">
                            <label htmlFor="confirm_password" className="signin-signup-label" style={{
                                color: '#4a5568',
                                fontWeight: '600',
                                marginBottom: '8px'
                            }}>
                                Xác nhận mật khẩu
                            </label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-solid fa-lock-open" aria-hidden="true" style={{color: '#a0aec0'}}></i>
                                <input 
                                    type={showConfirmPassword ? "text" : "password"}
                                    id='confirm_password'
                                    placeholder='Nhập lại mật khẩu mới'
                                    className="signin-signup-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={6}
                                    required
                                    style={{color: '#2d3748'}}
                                />
                                <i 
                                    className={showConfirmPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} 
                                    aria-hidden="true"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{cursor: 'pointer', color: '#a0aec0'}}
                                ></i>
                            </div>
                        </div>

                        {/* Validation message */}
                        {newPassword && confirmPassword && newPassword !== confirmPassword && (
                            <div style={{
                                background: '#fff5f5',
                                border: '1px solid #feb2b2',
                                borderRadius: '8px',
                                padding: '12px',
                                marginTop: '12px',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <i className="fa-solid fa-circle-exclamation" style={{color: '#f56565'}}></i>
                                <span style={{color: '#c53030', fontSize: '13px', fontWeight: '500'}}>
                                    Mật khẩu xác nhận không khớp
                                </span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="signin-signup-button-submit"
                            disabled={isLoading || (newPassword !== confirmPassword && confirmPassword !== '')}
                            style={{marginTop: '20px'}}
                        >
                            <span className="signin-signup-button-submit-circle" aria-hidden="true">
                                <span className="signin-signup-button-submit-icon arrow"></span>
                            </span>
                            <span className="signin-signup-button-submit-text">
                                {isLoading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
                            </span>
                        </button>

                        <button 
                            type="button" 
                            onClick={() => {
                                setStep(1);
                                setToken('');
                                setNewPassword('');
                                setConfirmPassword('');
                            }}
                            style={{
                                marginTop: '20px',
                                width: '100%',
                                padding: '12px',
                                background: 'transparent',
                                border: 'none',
                                color: '#667eea',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#5a67d8'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}
                        >
                            <i className="fa-solid fa-arrow-left"></i>
                            Quay lại nhập email
                        </button>
                    </form>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
};

export default Forgot_password;
