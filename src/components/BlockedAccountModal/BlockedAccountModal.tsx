import React from 'react';
import './BlockedAccountModal.css';

interface BlockedAccountModalProps {
    onClose: () => void;
    hotline?: string;
}

const BlockedAccountModal: React.FC<BlockedAccountModalProps> = ({ 
    onClose, 
    hotline = '0123 456 789' 
}) => {
    return (
        <div className="blocked-modal-overlay" onClick={onClose}>
            <div className="blocked-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="blocked-icon">
                    <i className="fa-solid fa-lock"></i>
                </div>

                <h2 className="blocked-title">Tài khoản đã bị khóa</h2>

                <p className="blocked-message">
                    Tài khoản của bạn đã bị khóa do <strong>vi phạm điều khoản sử dụng</strong>.
                </p>

                <div className="blocked-instructions">
                    <h4>📞 Để mở khóa tài khoản:</h4>
                    <ul>
                        <li>Thanh toán các khoản phí vi phạm đang chờ xử lý</li>
                        <li>Liên hệ hotline: <strong>{hotline}</strong></li>
                        <li>Gửi email đến: <strong>support@sharkrent.vn</strong></li>
                    </ul>
                </div>

                <button className="blocked-close-btn" onClick={onClose}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default BlockedAccountModal;
