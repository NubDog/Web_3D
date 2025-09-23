import { useState, useEffect, type ChangeEvent,  type FormEvent} from 'react';
import './../../styles/components/SignIn_SignUp/SignIn_SignUp.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header/header';
import locations from '../../data/data.json';

interface District {
    Id: string;
    Name: string;
}
interface Province {
    Id: string;
    Name: string;
    Districts: District[];
}

const SignUp: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        // Thông tin NguoiDung
        ho_ten: '',
        ten_dang_nhap: '',
        email: '',
        so_dien_thoai: '',
        mat_khau: '',
        // Thông tin KhachHang
        ngay_sinh: '',
        dia_chi: '',
        tinh: '',
        thanh_pho: '',
        ma_buu_chinh: '',
        quoc_gia: 'VN', 
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [provinces] = useState<Province[]>(locations);
    const [districts, setDistricts] = useState<District[]>([]);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');

    useEffect(() => {
        if (formData.tinh) {
            const selectedProvince = provinces.find(p => p.Name === formData.tinh);
            setDistricts(selectedProvince ? selectedProvince.Districts : []);
            setFormData(prev => ({ ...prev, thanh_pho: '' }));
        } else {
            setDistricts([]);
        }
    }, [formData.tinh, provinces]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provinceName = e.target.value;
        const selectedProvince = provinces.find(p => p.Name === provinceName);
        setFormData(prev => ({ ...prev, tinh: provinceName, thanh_pho: '' }));
        setDistricts(selectedProvince ? selectedProvince.Districts : []);
    };

     const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file); // Lưu lại đối tượng file
            setAvatarPreview(URL.createObjectURL(file)); // Tạo URL tạm thời để xem trước
        }
    };

     const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const data = new FormData();
        
        for (const key in formData) {
            data.append(key, (formData as any)[key]);
        }
        
        if (avatarFile) {
            data.append('avatar', avatarFile);
        }

        try {
            const response = await fetch('http://127.0.0.1:8787/api/nguoi-dung', {
                method: 'POST',
                // headers: {
                //     'Content-Type': 'application/json',
                // },
                body: data, 
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

    const nextStep = () => {
        setStep(step + 1);
    };
    const prevStep = () => setStep(step - 1);

  return (
    <div className="signin-signup-container">
            <form className="signin-signup-form" onSubmit={handleSubmit}>
                <h2 style={{textAlign: 'center', marginBottom: '20px', color: 'black', fontWeight: 'bold', fontSize: '20px'}}>Đăng Ký Tài Khoản</h2>
                
                {/* --- STEP 1: THÔNG TIN TÀI KHOẢN --- */}
                {step === 1 && (
                    <>
                        <div className="signin-signup-field">
                            <label htmlFor="ho_ten" className="signin-signup-label">Họ và tên</label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-regular fa-user" aria-hidden="true"></i>
                                <input id="ho_ten" name="ho_ten" type="text" value={formData.ho_ten} onChange={handleChange} className="signin-signup-input" placeholder="Họ và tên" required />
                            </div>
                        </div>
                        <div className="signin-signup-field">
                            <label htmlFor="ten_dang_nhap" className="signin-signup-label">Tên đăng nhập</label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-regular fa-user-circle" aria-hidden="true"></i>
                                <input id="ten_dang_nhap" name="ten_dang_nhap" type="text" value={formData.ten_dang_nhap} onChange={handleChange} className="signin-signup-input" placeholder="Tên đăng nhập" required />
                            </div>
                        </div>
                        <div className="signin-signup-field">
                            <label htmlFor="email" className="signin-signup-label">Email</label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-regular fa-envelope" aria-hidden="true"></i>
                                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="signin-signup-input" placeholder="Email" required />
                            </div>
                        </div>
                        <div className="signin-signup-field">
                            <label htmlFor="so_dien_thoai" className="signin-signup-label">Số điện thoại</label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-solid fa-phone" aria-hidden="true"></i>
                                <input id="so_dien_thoai" name="so_dien_thoai" type="tel" value={formData.so_dien_thoai} onChange={handleChange} className="signin-signup-input" placeholder="Số điện thoại" required pattern="\d{10}" title="Số điện thoại phải có 10 chữ số." />
                            </div>
                        </div>
                        <div className="signin-signup-field">
                            <label htmlFor="mat_khau" className="signin-signup-label">Mật khẩu</label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-solid fa-lock" aria-hidden="true"></i>
                                <input id="mat_khau" name="mat_khau" type="password" value={formData.mat_khau} onChange={handleChange} className="signin-signup-input" placeholder="Mật khẩu" required />
                            </div>
                        </div>
                        <button type="button" className="signin-signup-button-submit" onClick={nextStep}>
                            <span className="signin-signup-button-submit-circle">
                                <span className="signin-signup-button-submit-icon arrow"></span>
                            </span>
                           <span className="signin-signup-button-submit-text">Tiếp theo</span>
                        </button>
                    </>
                )}

                {/* --- STEP 2: THÔNG TIN CÁ NHÂN --- */}
                {step === 2 && (
                     <>
                      <div className="signin-signup-field" style={{ alignItems: 'center' }}>
                            <label htmlFor="avatar-upload" className="avatar-uploader">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Xem trước avatar" className="avatar-preview" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        <i className="fa-solid fa-camera"></i>
                                        <span>Tải lên ảnh đại diện</span>
                                    </div>
                                )}
                            </label>
                            <input id="avatar-upload" name="avatar" type="file" onChange={handleAvatarChange} accept="image/*" style={{ display: 'none' }} />
                        </div>
                        <div className="signin-signup-field">
                            <label htmlFor="ngay_sinh" className="signin-signup-label">Ngày sinh</label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-regular fa-calendar" aria-hidden="true"></i>
                                <input id="ngay_sinh" name="ngay_sinh" type="date" value={formData.ngay_sinh} onChange={handleChange} className="signin-signup-input" required />
                            </div>
                        </div>

                        <div className="signin-signup-field">
                            <label htmlFor="tinh" className="signin-signup-label">Tỉnh/Thành phố</label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-solid fa-map-location-dot" aria-hidden="true"></i>
                                <select id="tinh" name="tinh" value={formData.tinh} onChange={handleProvinceChange} className="signin-signup-input" required>
                                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                                    {provinces.map(p => <option key={p.Id} value={p.Name}>{p.Name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="signin-signup-field">
                            <label htmlFor="thanh_pho" className="signin-signup-label">Quận/Huyện</label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-solid fa-map" aria-hidden="true"></i>
                                <select id="thanh_pho" name="thanh_pho" value={formData.thanh_pho} onChange={handleChange} className="signin-signup-input" required disabled={!formData.tinh}>
                                    <option value="">-- Chọn Quận/Huyện --</option>
                                    {districts.map(d => <option key={d.Id} value={d.Name}>{d.Name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="signin-signup-field">
                            <label htmlFor="dia_chi" className="signin-signup-label">Địa chỉ chi tiết</label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-regular fa-address-card" aria-hidden="true"></i>
                                <input id="dia_chi" name="dia_chi" type="text" value={formData.dia_chi} onChange={handleChange} className="signin-signup-input" placeholder="Số nhà, tên đường, phường/xã..." required />
                            </div>
                        </div>

                        <div className="signin-signup-field">
                            <label htmlFor="ma_buu_chinh" className="signin-signup-label">Mã bưu chính</label>
                            <div className="signin-signup-input-wrapper">
                                <i className="fa-solid fa-envelopes-bulk" aria-hidden="true"></i>
                                <input id="ma_buu_chinh" name="ma_buu_chinh" type="text" value={formData.ma_buu_chinh} onChange={handleChange} className="signin-signup-input" placeholder="Ví dụ: 550000 (không bắt buộc)" />
                            </div>
                        </div>

                        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <button type="button" className="signin-signup-button-submit" onClick={prevStep} style={{ flex: 1 }}>
                               <span className="signin-signup-button-submit-text" style={{margin: 0}}>Quay lại</span>
                           </button>
                           <button type="submit" className="signin-signup-button-submit" disabled={loading} style={{ flex: 1 }}>
                               <span className="signin-signup-button-submit-circle">
                                   <span className="signin-signup-button-submit-icon arrow"></span>
                               </span>
                               <span className="signin-signup-button-submit-text">{loading ? 'Đang xử lý...' : 'Đăng ký'}</span>
                           </button>
                        </div>
                    </>
                )}
                 <p className="signin-signup-text" style={{marginTop: '15px'}}>
                    Đã có tài khoản? 
                    <a href="#" onClick={onSwitchToLogin} className="signin-signup-link">
                        Đăng nhập
                    </a>
                </p>
            </form>
        </div>
  );
};

export default SignUp;