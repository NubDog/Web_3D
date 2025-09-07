import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- Giữ nguyên toàn bộ phần import của bạn ---
import "./App.css";
import BabylonTankViewer from "./components/babylon";
import FileManager from "./components/ManagerFile_R2Storage/FileManager";
import TestConectSql from "./components/test_conect-sql";
import Admin_dashboard from './components/Admin/admin_dashboard/admin_dashboard';
import UserAdmin from "./components/Admin/admin-users/admin-users";
import PhuongTienList from "./components/Admin/Phuong_tien/Danhsach";
import CustomerDetail from "./components/Admin/admin-users/custom/CustomerDetail"
// Import layout mới đã tạo ở bước trước
import AdminLayout from './components/Admin/adminLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FileManager />} />
        {/* Muốn vào trang admin gõ /admin nha mấy thằng lồn */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="users" />} /> 
          <Route path='admin_dashboard' element={<Admin_dashboard />}/>
          <Route path="users" element={<UserAdmin />} />
          <Route path="users/:userId/customer-detail" element={<CustomerDetail />} />

          <Route path="*" element={
              <div style={{ color: 'blue', padding: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>
                  ĐÂY LÀ TRANG 404 CỦA FRONTEND
              </div>
          } /> 
        
          <Route path="phuong-tien" element={<PhuongTienList />} />
        </Route>
        
        {/* <Route path="/babylon" element={<BabylonTankViewer />} />
        <Route path="/test-sql" element={<TestConectSql />} /> 
        */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;