import { useState, useEffect, useRef, type FormEvent } from 'react';
import './../../styles/components/SignIn_SignUp/SignIn_SignUp.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NguoiDung {
  ten_dang_nhap: string;
  mat_khau: string;
  vai_tro: string;
  trang_thai: string;
  ho_ten: string;
  email: string;
}

const SignIn: React.FC<{ onSwitchToSignUp: () => void }> = ({ onSwitchToSignUp }) => {
  const [nguoiDung, setNguoiDung] = useState<NguoiDung[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ ten_dang_nhap: '', mat_khau: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Chỉ cần gọi hàm login từ context
      await login(identifier, password);
      // Việc điều hướng đã được xử lý bên trong context
    } catch (err) {
      console.error("Login failed:", err); // Lỗi đã được set trong context, ở đây chỉ log ra
    }
  };
  const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/nguoi-dung';

  // useEffect(() => {
  //     const fetchData = async () => {
  //         try {
  //             const fieldsNguoiDung = 'ten_dang_nhap,mat_khau,vai_tro,trang_thai,ho_ten,email';
  //             const response = await fetch (`${API_URL}?fields=${fieldsNguoiDung}`);

  //             if (!response.ok) {
  //                 throw new Error('Lỗi khi tải dữ liệu');
  //             }

  //             const result = await response.json();

  //             if (result.success) {
  //                 const activeUsers = result.data.filter((user: NguoiDung) => user.trang_thai === 'active');

  //                 setNguoiDung(activeUsers);
  //             }
  //         } catch (err: any) {
  //             setError(err.message);
  //         } finally {
  //             setLoading(false);
  //         }
  //     };
  //     fetchData();
  // }, []);



  return (
    <div className="signin-signup-container">
      <form
        className="signin-signup-form"
        onSubmit={handleSubmit}
      >
        <div className="signin-signup-field">
          <label htmlFor="identifier" className="signin-signup-label">Tên đăng nhập hoặc Email</label>
          <div className="signin-signup-input-wrapper">
            <i className="fa-regular fa-user" aria-hidden="true"></i>

            <input
              id="identifier"
              name="ten_dang_nhap"
              className="signin-signup-input"
              autoComplete="username"
              type="text"
              placeholder="Nhập tên đăng nhập hoặc email"
              // onChange phải gọi setIdentifier
              onChange={(e) => setIdentifier(e.target.value)}
              value={identifier} // value phải được gán vào state
              required
            />
          </div>
        </div>

        <div className="signin-signup-field">
          <label htmlFor="mat_khau" className="signin-signup-label">Mật khẩu</label>
          <div className="signin-signup-input-wrapper">
            <i className="fa-solid fa-lock" aria-hidden="true"></i>

            <input
              type="password"
              placeholder="Mật khẩu"
              // onChange phải gọi setPassword
              onChange={(e) => setPassword(e.target.value)}
              id="mat_khau"
              className="signin-signup-input"
              name="mat_khau"
              autoComplete="current-password"
              value={password}
              required
            />
            <i className="fa-solid fa-eye" aria-hidden="true"></i>
          </div>
        </div>

        <div className="signin-signup-row">
          <label className="signin-signup-remember">
            <input type="checkbox" className="signin-signup-checkbox" />
            <span>Nhớ tôi</span>
          </label>

          <button type="button" className="signin-signup-link">
            Quên mật khẩu?
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button className="signin-signup-button-submit">
          <span className="signin-signup-button-submit-circle" aria-hidden="true">
            <span className="signin-signup-button-submit-icon arrow"></span>
          </span>
          <span className="signin-signup-button-submit-text">Đăng nhập</span>
        </button>

        <p className="signin-signup-text">
          Không có tài khoản?{' '}
          <button type="button" className="signin-signup-link" onClick={onSwitchToSignUp} >Đăng ký</button>
        </p>

        <p className="signin-signup-text signin-signup-text--divider">Hoặc với</p>

        <div className="signin-signup-row">
          <button type="button" className="signin-signup-btn signin-signup-btn--google">
            <svg
              version="1.1"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              aria-hidden="true"
            >
              <path fill="#FBBB00" d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256 c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456 C103.821,274.792,107.225,292.797,113.47,309.408z"></path>
              <path fill="#518EF8" d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451 c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535 c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z"></path>
              <path fill="#28B446" d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512 c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771 c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z"></path>
              <path fill="#F14336" d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012 c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0 C318.115,0,375.068,22.126,419.404,58.936z"></path>
            </svg>
            <span>Google</span>
          </button>

          <button type="button" className="signin-signup-btn signin-signup-btn--apple">
            <i className="fa-brands fa-apple" aria-hidden="true"></i>
            <span>Apple</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignIn;