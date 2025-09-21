import { useState } from 'react';
import './../../styles/components/SignIn_SignUp/SignIn_SignUp.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header/header';

const SignUp: React.FC = () => {
    const [formData, setFormData] = useState({
        ho_ten: '',
        ten_dang_nhap: '',
        email: '',
        so_dien_thoai: '',
        mat_khau: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://127.0.0.1:8787/api/nguoi-dung', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Đăng ký không thành công.');
            }

            console.log("Đăng ký thành công:", result.data);

            const userToLogin = {
                ho_ten: result.data.ho_ten,
                email: result.data.email,
                vai_tro: result.data.vai_tro,
            };
            login(userToLogin);
            navigate('/');

        } catch (err: any) {
            setError(err.message);
            console.error("Lỗi khi đăng ký:", err);
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="signin-signup-container">
      <form
        className="signin-signup-form"
        onSubmit={handleSubmit}
      >
        <div className="signin-signup-field">
          <label htmlFor="ho_ten" className="signin-signup-label">Họ và tên</label>
          <div className="signin-signup-input-wrapper">
            <i className="fa-regular fa-user" aria-hidden="true"></i>
            <input
              id="ho_ten"
              name="ho_ten"
              type="text"
              value={formData.ho_ten}
              onChange={handleChange}
              className="signin-signup-input"
              placeholder="Họ và tên"
              required
            />
          </div>
        </div>

        <div className="signin-signup-field">
          <label htmlFor="ten_dang_nhap" className="signin-signup-label">Tên đăng nhập</label>
          <div className="signin-signup-input-wrapper">
            <i className="fa-regular fa-user-circle" aria-hidden="true"></i>
            <input
              id="ten_dang_nhap"
              name="ten_dang_nhap"
              type="text"
              value={formData.ten_dang_nhap}
              onChange={handleChange}
              className="signin-signup-input"
              placeholder="Tên đăng nhập"
              required
            />
          </div>
        </div>

        <div className="signin-signup-field">
          <label htmlFor="email" className="signin-signup-label">Email</label>
          <div className="signin-signup-input-wrapper">
            <i className="fa-regular fa-envelope" aria-hidden="true"></i>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="signin-signup-input"
              placeholder="Email"
              autoComplete="email"
              required
            />
          </div>
        </div>

         <div className="signin-signup-field">
          <label htmlFor="so_dien_thoai" className="signin-signup-label">Số điện thoại</label>
          <div className="signin-signup-input-wrapper">
            <i className="fa-solid fa-phone" aria-hidden="true"></i>
            <input
              id="so_dien_thoai"
              name="so_dien_thoai"
              type="tel"
              value={formData.so_dien_thoai}
              onChange={handleChange}
              className="signin-signup-input"
              placeholder="Số điện thoại"
              required
            />
          </div>
        </div>

        <div className="signin-signup-field">
          <label htmlFor="password" className="signin-signup-label">Mật khẩu</label>
          <div className="signin-signup-input-wrapper">
            <i className="fa-solid fa-lock" aria-hidden="true"></i>
            <input
              id="password"
              name="mat_khau"
              type="password"
              value={formData.mat_khau}
              onChange={handleChange}
              className="signin-signup-input"
              placeholder="Mật khẩu"
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

        <button type="submit" className="signin-signup-button-submit" disabled={loading}>
            <span className="signin-signup-button-submit-circle" aria-hidden="true">
            <span className="signin-signup-button-submit-icon arrow"></span>
            </span>
            <span className="signin-signup-button-submit-text">{loading ? 'Đang xử lý...' : 'Đăng ký'}</span>
        </button>

      </form>
    </div>
  );
};

export default SignUp;