import { useState, type FormEvent } from 'react';
import './../styles/pages/SignIn_SingUp/SignIn_SingUp.css';

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
        <div className="signin-signup-container">
            {step === 1 && (
                <form className="signin-signup-form" onSubmit={emailCheck}>
                    <div className="forgot-password-header">
                        <i className="fa-solid fa-key" style={{fontSize: '48px', color: '#6c63ff', marginBottom: '20px'}}></i>
                        <h2 style={{margin: '0 0 10px 0', fontSize: '24px', fontWeight: '600', color: 'black'}}>Quên mật khẩu?</h2>
                        <p style={{color: '#666', fontSize: '14px', margin: '0 0 30px 0'}}>
                            Nhập email của bạn để nhận mã khôi phục
                        </p>
                    </div>

                    <div className="signin-signup-field">
                        <label htmlFor="email_forgot" className="signin-signup-label">
                            Email khôi phục
                        </label>
                        <div className="signin-signup-input-wrapper">
                            <i className="fa-regular fa-envelope" aria-hidden="true"></i>
                            <input 
                                type="email" 
                                id='email_forgot'
                                placeholder='example@email.com'
                                className="signin-signup-input"
                                autoComplete='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="signin-signup-button-submit"
                        disabled={isLoading}
                    >
                        <span className="signin-signup-button-submit-circle" aria-hidden="true">
                            <span className="signin-signup-button-submit-icon arrow"></span>
                        </span>
                        <span className="signin-signup-button-submit-text">
                            {isLoading ? "Đang gửi..." : "Gửi mã xác nhận"}
                        </span>
                    </button>

                    <p className="signin-signup-text">
                        Nhớ mật khẩu?{' '}
                        <a href="/signin" className="signin-signup-link" style={{color: '#6c63ff'}}>
                            Đăng nhập ngay
                        </a>
                    </p>
                </form>
            )}

            {step === 2 && (
                <form className="signin-signup-form" onSubmit={otpCheckVerify}>
                    <div className="forgot-password-header">
                        <i className="fa-solid fa-shield-halved" style={{fontSize: '48px', color: '#6c63ff', marginBottom: '20px'}}></i>
                        <h2 style={{margin: '0 0 10px 0', fontSize: '24px', fontWeight: '600'}}>Đặt lại mật khẩu</h2>
                        <p style={{color: '#666', fontSize: '14px', margin: '0 0 20px 0'}}>
                            Mã xác nhận đã được gửi đến
                        </p>
                        <p style={{color: '#6c63ff', fontSize: '14px', fontWeight: '500', margin: '0 0 30px 0'}}>
                            {email}
                        </p>
                    </div>

                    <div className="signin-signup-field">
                        <label htmlFor="otp_input" className="signin-signup-label">
                            Mã xác nhận (OTP)
                        </label>
                        <div className="signin-signup-input-wrapper">
                            <i className="fa-solid fa-hashtag" aria-hidden="true"></i>
                            <input 
                                type="text" 
                                id='otp_input'
                                placeholder='Nhập mã 6 số'
                                className="signin-signup-input"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                maxLength={6}
                                pattern="[0-9]*"
                                required
                            />
                        </div>
                    </div>

                    <div className="signin-signup-field">
                        <label htmlFor="new_password" className="signin-signup-label">
                            Mật khẩu mới
                        </label>
                        <div className="signin-signup-input-wrapper">
                            <i className="fa-solid fa-lock" aria-hidden="true"></i>
                            <input 
                                type={showPassword ? "text" : "password"}
                                id='new_password'
                                placeholder='Ít nhất 6 ký tự'
                                className="signin-signup-input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                            <i 
                                className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} 
                                aria-hidden="true"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{cursor: 'pointer'}}
                            ></i>
                        </div>
                    </div>

                    <div className="signin-signup-field">
                        <label htmlFor="confirm_password" className="signin-signup-label">
                            Xác nhận mật khẩu
                        </label>
                        <div className="signin-signup-input-wrapper">
                            <i className="fa-solid fa-lock-open" aria-hidden="true"></i>
                            <input 
                                type={showConfirmPassword ? "text" : "password"}
                                id='confirm_password'
                                placeholder='Nhập lại mật khẩu mới'
                                className="signin-signup-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                            <i 
                                className={showConfirmPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} 
                                aria-hidden="true"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{cursor: 'pointer'}}
                            ></i>
                        </div>
                    </div>

                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p style={{color: '#ff4444', fontSize: '12px', marginTop: '-10px', marginBottom: '10px'}}>
                            ⚠️ Mật khẩu xác nhận không khớp
                        </p>
                    )}

                    <button 
                        type="submit" 
                        className="signin-signup-button-submit"
                        disabled={isLoading}
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
                        onClick={() => setStep(1)}
                        className="signin-signup-text"
                        style={{
                            marginTop: '15px', 
                            background: 'none', 
                            border: 'none', 
                            color: '#6c63ff', 
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        ← Quay lại nhập email
                    </button>
                </form>
            )}
        </div>
    );
};

export default Forgot_password;
