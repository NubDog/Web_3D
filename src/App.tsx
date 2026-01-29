import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import HomePage from "./pages/HomePage";
import EditComponents from "./components/EditComponents/EditComponents";
import DanhMucPhuongTienList from "./components/Admin/Danh_muc_phuong_tien/Danhsachdanhmuc";
import ChinhSachGiaList from "./components/Admin/Chinh_sach_gia/Danhsach";
import Store from "./pages/Store";
import SearchPage from "./pages/SearchPage/SearchPage";
import OrderList from "./components/Admin/Admin_Order/OrderList";
import OrderDetail from "./components/Admin/Admin_Order/OrderDetail";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthProvider2 } from "./components/contexts-login-tam-thoi/AuthContext";
import SignInPage from "./pages/SigIn_SigUp";
import SignUp from "./components/SignIn_SignUp/SignUp";
import ViolationList from "./components/Admin/admin-vipham/ViolationList";
import CheckOut from "./pages/CheckOut";
import ProductDetailPage from "./pages/ProductDetailPage";
import AccountHome from "./pages/AccountHome";
import AccountHome_KYC from "./pages/AccountHome_KYC";
import BaoTriList from "./components/Admin/Bao_tri/Baotri";
import StoreBike from "./pages/StoreBike";
import StoreHypercar from "./pages/StoreHypercar";
import StoreSUV from "./pages/StoreSUV/StoreSUV";
import AccountOrder from "./pages/AccountOrder";
import UserContract from "./pages/UserContract";
import AdminDashboardReportRental from "./components/Admin/admin_dashboard/admin_dashboard_report-rental/admin_dashboard_report-rental";
import AdminReportingOverTime from "./components/Admin/admin_dashboard/admin_dashboard_report-rental/admin_reporting_over_time";
import AdminReportingCustomer from "./components/Admin/admin_dashboard/admin_dashboard_report-rental/admin_reporting_customer";
import AdminReportingVehicle from "./components/Admin/admin_dashboard/admin_dashboard_report-rental/admin_reporting_vehicle";
import AdminReportingLocation from "./components/Admin/admin_dashboard/admin_dashboard_report-rental/admin_reporting_location";
import AdminReportingStatus from "./components/Admin/admin_dashboard/admin_dashboard_report-rental/admin_reporting_status";
import AdminReportingFinance from "./components/Admin/admin_dashboard/admin_dashboard_report-rental/admin_reporting_finance";
import AdminRoute from "./components/Admin/AdminRoute";
import BaoTriChiTiet from "./components/Admin/Bao_tri/Bao_tri_chitiet";
import BaoTritrangthai from "./components/Admin/Bao_tri/Bao_tri_List";
import HieuPhuongTienList from "./components/Admin/Hieu_phuong_tien/addHieupt";
import HanBaoTri from "./components/Admin/Bao_tri/Han_Bao_Tri";
import Forgot_password from "./pages/Forgot_password";
import Danhsachphanloaipt from "./components/Admin/Phan_loai_hieu_pt/Danhsachphanloaipt";
import Phuongtienchitietadmin from "./components/Admin/Phuong_tien/Phuongtienchitiet";
import UserViolations from "./pages/UserViolations/UserViolations";
import ConfigForm from "./components/Admin/Config/ConfigForm";
import SupportChatPage from "./pages/SupportChat";
import { ConfigProvider } from "./contexts/ConfigContext";

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/store" element={<Store />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/support" element={<SupportChatPage />} />
            <Route path="/store/store-bike" element={<StoreBike />} />
            <Route path="/store/store-hypercar" element={<StoreHypercar />} />
            <Route path="/store/store-suv" element={<StoreSUV />} />
            <Route path="/user/order" element={<AccountOrder />} />
            <Route path="/user/contract" element={<UserContract />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/account_home" element={<AccountHome />} />
            <Route path="/forgot_password" element={<Forgot_password />} />
            <Route path="/user/violations" element={<UserViolations />} />
            <Route
              path="/account_home/account_home_kyc"
              element={<AccountHome_KYC />}
            />
            <Route path="/checkout" element={<CheckOut />} />
            <Route path="/product_detail" element={<ProductDetailPage />} />
            {/* <Route path="/signup" element={<SignUp />} /> */}
            {/* Trang edit components */}
            <Route path="/edit-components" element={<EditComponents />} />
            {/* Muốn vào trang admin gõ /admin nha mấy thằng lồn */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="users" />} />
                <Route path="admin_dashboard" element={<Admin_dashboard />} />
                <Route
                  path="admin_dashboard_report-rental"
                  element={<AdminDashboardReportRental />}
                />
                <Route
                  path="AdminReportingOverTime"
                  element={<AdminReportingOverTime />}
                />
                <Route
                  path="AdminReportingCustomer"
                  element={<AdminReportingCustomer />}
                />
                <Route
                  path="AdminReportingVehicle"
                  element={<AdminReportingVehicle />}
                />
                <Route
                  path="AdminReportingLocation"
                  element={<AdminReportingLocation />}
                />
                <Route
                  path="AdminReportingStatus"
                  element={<AdminReportingStatus />}
                />
                <Route
                  path="AdminReportingFinance"
                  element={<AdminReportingFinance />}
                />
                <Route path="users" element={<UserAdmin />} />
                <Route
                  path="users/:userId/customer-detail"
                  element={<CustomerDetail />}
                />

                <Route path="phuong-tien" element={<PhuongTienList />} />
                <Route
                  path="phuong-tien/them/:id?"
                  element={<PhuongTienModal />}
                />
                <Route
                  path="phuong-tien/xem/:id"
                  element={<Phuongtienchitietadmin />}
                />
                <Route
                  path="danh-muc-phuong-tien"
                  element={<DanhMucPhuongTienList />}
                />
                <Route path="hieu-phuong-tien" element={<HieuPhuongTienList />} />
                <Route path="chinh-sach-gia" element={<ChinhSachGiaList />} />

                <Route path="orders/:status" element={<OrderList />} />
                <Route path="order/:orderId" element={<OrderDetail />} />
                <Route path="violations" element={<ViolationList />} />
                <Route path="bao_tri" element={<BaoTriList />} />
                <Route path="bao_tri/chitiet/:id" element={<BaoTriChiTiet />} />
                <Route path="bao_tri/:status" element={<BaoTritrangthai />} />
                <Route path="han_bao_tri" element={<HanBaoTri />} />
                <Route
                  path="phan_loai_hieu_xe"
                  element={<Danhsachphanloaipt />}
                />
                <Route path="config" element={<ConfigForm />} />
              </Route>
            </Route>
          //{" "}
            {/* <Route path="/babylon" element={<BabylonTankViewer />} />
          // <Route path="/test-sql" element={<TestConectSql />} /> 
          // */}
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000} // Tự động đóng sau 3 giây
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
