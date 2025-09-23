import React, { useState } from 'react';
import './Login.css'; // File CSS để tạo kiểu

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = 'http://127.0.0.1:8787/login';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(''); // Xóa thông báo cũ
        setIsLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage(data.message);
                setIsSuccess(true);
                // Bạn có thể lưu token hoặc thông tin người dùng vào localStorage tại đây
                // Ví dụ: localStorage.setItem('user', JSON.stringify(data.data));
            } else {
                setMessage(data.error);
                setIsSuccess(false);
            }
        } catch (error) {
            setMessage('Lỗi kết nối đến server. Vui lòng thử lại.');
            setIsSuccess(false);
            console.error('Lỗi khi gửi yêu cầu:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>Đăng nhập</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="username">Tên đăng nhập:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>
                {message && (
                    <div className={`message ${isSuccess ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;