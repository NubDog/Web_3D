import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./App.css";
import BabylonTankViewer from "./components/babylon";
import FileManager from "./components/ManagerFile_R2Storage/FileManager";
import TestConectSql from "./components/test_conect-sql";
import Admin_dashboard from "./components/Admin/admin_dashboard/admin_dashboard";
import UserAdmin from "./components/Admin/admin-users/admin-users";
import PhuongTienList from "./components/Admin/Phuong_tien/Danhsach";
import CustomerDetail from "./components/Admin/admin-users/custom/CustomerDetail";
import PhuongTienModal from "./components/Admin/Phuong_tien/addPhuongtien";

import AdminLayout from "./components/Admin/adminLayout";

// Import trang HomePage
import HomePage from "./pages/HomePage";
import EditComponents from "./components/EditComponents/EditComponents";
import DanhMucPhuongTienList from "./components/Admin/Danh_muc_phuong_tien/Danhsachdanhmuc";
import ChinhSachGiaList from "./components/Admin/Chinh_sach_gia/Danhsach";
import Store from "./pages/Store";
import OrderList from "./components/Admin/Admin_Order/OrderList";
import OrderDetail from "./components/Admin/Admin_Order/OrderDetail";
import { AuthProvider } from "./components/contexts-login-tam-thoi/AuthContext";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/store" element={<Store />} />

          {/* Trang edit components */}
          <Route path="/edit-components" element={<EditComponents />} />

          {/* Muốn vào trang admin gõ /admin nha mấy thằng lồn */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="users" />} />
            <Route path="admin_dashboard" element={<Admin_dashboard />} />
            <Route path="users" element={<UserAdmin />} />
            <Route
              path="users/:userId/customer-detail"
              element={<CustomerDetail />}
            />

            <Route path="phuong-tien" element={<PhuongTienList />} />
            <Route path="phuong-tien/them/:id?" element={<PhuongTienModal />} />
            <Route
              path="danh-muc-phuong-tien"
              element={<DanhMucPhuongTienList />}
            />
            <Route path="chinh-sach-gia" element={<ChinhSachGiaList />} />

              <Route path="orders/:status" element={<OrderList />} />
              <Route path="order/:orderId" element={<OrderDetail />} />
          </Route>

          {/* <Route path="/babylon" element={<BabylonTankViewer />} />
          <Route path="/test-sql" element={<TestConectSql />} /> 
          */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
