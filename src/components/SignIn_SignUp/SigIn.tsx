import { useState, useEffect, useRef} from 'react';
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

const SignIn: React.FC = () => {
    const [nguoiDung, setNguoiDung] = useState<NguoiDung[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(email, password);

        const user = nguoiDung.find(
            (user) => user.email == email && user.mat_khau == password
        );
        if (user) {
            console.log("Đăng nhập thành công");
            const userToSave = {
                ho_ten: user.ho_ten,
                email: user.email,
                vai_tro: user.vai_tro,
            }

            login(userToSave);
            navigate('/');
        } else {
            console.log("Đăng nhập thất bại");
        }
    }

    const API_URL = 'http://127.0.0.1:8787/api/nguoi-dung';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fieldsNguoiDung = 'ten_dang_nhap,mat_khau,vai_tro,trang_thai,ho_ten,email';
                const response = await fetch (`${API_URL}?fields=${fieldsNguoiDung}`);

                if (!response.ok) {
                    throw new Error('Lỗi khi tải dữ liệu');
                }

                const result = await response.json();

                if (result.success) {
                    const activeUsers = result.data.filter((user: NguoiDung) => user.trang_thai === 'active');

                    setNguoiDung(activeUsers);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

  return (
    <div className="signin-signup-container">
      <form
        className="signin-signup-form"
        onSubmit={handleSubmit}
      >
        <div className="signin-signup-field">
          <label htmlFor="email" className="signin-signup-label">Email</label>
          <div className="signin-signup-input-wrapper">
            <i className="fa-regular fa-envelope" aria-hidden="true"></i>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="signin-signup-input"
              placeholder="Email"
              autoComplete="email"
            />
          </div>
        </div>

        <div className="signin-signup-field">
          <label htmlFor="password" className="signin-signup-label">Mật khẩu</label>
          <div className="signin-signup-input-wrapper">
            <i className="fa-solid fa-lock" aria-hidden="true"></i>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="signin-signup-input"
              placeholder="Mật khẩu"
              autoComplete="current-password"
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

        <button className="signin-signup-button-submit">
            <span className="signin-signup-button-submit-circle" aria-hidden="true">
            <span className="signin-signup-button-submit-icon arrow"></span>
            </span>
            <span className="signin-signup-button-submit-text">Đăng nhập</span>
        </button>

        <p className="signin-signup-text">
          Không có tài khoản?{' '}
          <button type="button" className="signin-signup-link" onClick={() => navigate('/signup')}>Đăng ký</button>
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