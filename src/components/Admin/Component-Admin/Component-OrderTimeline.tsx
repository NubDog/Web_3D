import React from 'react';
import './css/OrderTimeline.css'; 
import { FaCheckCircle, FaSpinner, FaCircle, FaTimesCircle } from 'react-icons/fa';

type OrderStatus = 'CHO_DUYET' | 'DA_DUYET' | 'DANG_THUE' | 'DA_TRA' | 'HOAN_TAT' | 'TU_CHOI';

interface OrderTimelineProps {
  status: OrderStatus;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ status }) => {
  const steps = [
    { name: 'CHO_DUYET', label: 'Chờ Duyệt' },
    { name: 'DA_DUYET', label: 'Đã Duyệt' },
    { name: 'DANG_THUE', label: 'Đang Thuê' },
    { name: 'DA_TRA', label: 'Đã Trả' },
    { name: 'HOAN_TAT', label: 'Hoàn Tất' },
  ];

  const getStepStatus = (stepName: OrderStatus, currentStatus: OrderStatus) => {
    if (currentStatus === 'TU_CHOI' && stepName === 'CHO_DUYET') {
        return 'rejected';
    }
    const currentIndex = steps.findIndex(s => s.name === currentStatus);
    const stepIndex = steps.findIndex(s => s.name === stepName);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return <FaCheckCircle className="icon-completed" />;
      case 'current':
        return <FaSpinner className="icon-current spin" />;
      case 'rejected':
        return <FaTimesCircle className="icon-rejected" />;
      default:
        return <FaCircle className="icon-pending" />;
    }
  };

  return (
    <div className="timeline-container">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.name as OrderStatus, status);
        return (
          <React.Fragment key={step.name}>
            <div className={`timeline-step ${stepStatus}`}>
              <div className="timeline-icon">{getIcon(stepStatus)}</div>
              <div className="timeline-label">{step.label}</div>
            </div>
            {index < steps.length - 1 && <div className={`timeline-connector ${getStepStatus(steps[index+1].name as OrderStatus, status) !== 'pending' ? 'completed' : ''}`}></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default OrderTimeline;