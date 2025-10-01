import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; 

const AdminRoute: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Kiểm tra xem người dùng có tồn tại VÀ vai trò có phải là 'admin' không
 if (currentUser && ['admin', 'NhanVien'].includes(currentUser.vai_tro)) {
  return <Outlet />;
}

  // Nếu không, chuyển hướng về trang đăng nhập
  return <Navigate to="/" replace />;
};

export default AdminRoute;