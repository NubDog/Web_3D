import { useState } from 'react';
import Button from '../Button/Button';
import './ChangePasswordModal.css';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (oldPassword: string, newPassword: string) => Promise<void>;
    isLoading?: boolean;
}

const ChangePasswordModal = ({ isOpen, onClose, onSubmit, isLoading = false }: ChangePasswordModalProps) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (oldPassword === newPassword) {
            setError('Mật khẩu mới phải khác mật khẩu cũ');
            return;
        }

        try {
            await onSubmit(oldPassword, newPassword);
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi đổi mật khẩu');
        }
    };

    const handleClose = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="ChangePasswordModal-overlay" onClick={handleClose}>
            <div className="ChangePasswordModal-content" onClick={(e) => e.stopPropagation()}>
                <div className="ChangePasswordModal-header">
                    <h2>Đổi mật khẩu</h2>
                    <button 
                        className="ChangePasswordModal-close" 
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="ChangePasswordModal-form">
                    {error && (
                        <div className="ChangePasswordModal-error">
                            {error}
                        </div>
                    )}

                    <div className="ChangePasswordModal-field">
                        <label htmlFor="oldPassword">Mật khẩu cũ</label>
                        <input
                            type="password"
                            id="oldPassword"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="ChangePasswordModal-field">
                        <label htmlFor="newPassword">Mật khẩu mới</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="ChangePasswordModal-field">
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="ChangePasswordModal-actions">
                        <button 
                            type="button" 
                            className="ChangePasswordModal-cancel"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Hủy
                        </button>
                        <Button 
                            conttent={isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
                            onClick={() => {}} // Form submit sẽ handle
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
