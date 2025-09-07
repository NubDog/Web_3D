import "./App.css";
import PhuongTienList from "./components/Admin/Phuong_tien/Danhsach";

import BabylonTankViewer from "./components/babylon";
import FileManager from "./components/ManagerFile_R2Storage/FileManager";
import TestConectSql from "./components/test_conect-sql";

function App() {
  return (
    <div>
      {/* <BabylonTankViewer /> */}
      <PhuongTienList />
      {/* <TestConectSql /> */}
    </div>
  );
}

export default App;
