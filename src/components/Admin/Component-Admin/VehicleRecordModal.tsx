import React from 'react';
import './css/VehicleRecordModal.css'; 

interface RecordData {
    title: string;
    km: number | null;
    fuel: string | null;
    notes: string | null;
    imageUrls: string[];
}

interface VehicleRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: RecordData | null;
}

const VehicleRecordModal: React.FC<VehicleRecordModalProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content record-modal">
                <div className="modal-header">
                    <h2>{data.title}</h2>
                    <button type="button" onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="record-details">
                        <p><strong>Số KM:</strong> {data.km?.toLocaleString('vi-VN') || 'N/A'} km</p>
                        <p><strong>Mức xăng:</strong> {data.fuel || 'N/A'}</p>
                        <p><strong>Ghi chú hư hỏng:</strong> {data.notes || 'Không có'}</p>
                    </div>
                    <hr />
                    <h3>Ảnh minh chứng</h3>
                    <div className="image-gallery">
                        {data.imageUrls.length > 0 ? (
                            data.imageUrls.map((url, index) => (
                               <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={url}
                                        alt={`Minh chứng ${index + 1}`}
                                    />
                                </a>
                            ))
                        ) : (
                            <p>Không có ảnh minh chứng.</p>
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="button-secondary" onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default VehicleRecordModal;