import "./App.css";
import PhuongTienList from "./components/Admin/Phuong_tien/Danhsach";
import BabylonTankViewer from "./components/babylon";
import FileManager from "./components/ManagerFile_R2Storage/FileManager";
import TestConectSql from "./components/test_conect-sql";
import UserAdmin from "./admin/admin-users/admin-users";

function App() {
  return (
    <div>
      {/* <BabylonTankViewer /> */}
      <PhuongTienList />
      <FileManager />
      <UserAdmin />
      {/* <TestConectSql /> */}
    </div>
  );
}

export default App;
