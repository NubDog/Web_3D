import React, { useEffect } from 'react';
import './css/fileManager.css';
import { useR2} from '../../hooks/useR2'; //hook này dùng để kết nối đến với R2

const FileManager: React.FC = () => {
  // const {files, loading, fetchFiles} = useR2();

  // useEffect(() => {
  //   fetchFiles(); //lấy danh sách từ file R2
  // }, []);

  // if (loading) return (
  //   <p>Đang tải sếp ơi chờ chút...</p>
  // );

  // if (files.length === 0) {
  //   return (
  //     <p>Không có file nào trong R2 Storage</p>
  //   );
  // }

  return (
    
    <div className= 'container_list_file'>

      <div className= "side_bar">
        <div className= "side_bar_header">
          <img src = "../../../public/logo.svg" className= "side_bar-header_logo"></img>
        </div>

        <div className= "side_bar_body"></div>

        <div className= "side_bar_footer"></div>
      </div>

      <div className= "main_content"></div>


      {/* <h2>Danh sách file trong R2 Storage</h2> */}

      {/*  nút này để reload lại danh sách file */}
      {/* <button
        onClick={fetchFiles}
        disabled={loading}
      >
        Tải lại danh sách
      </button>

      <p>Tổng số file trong R2 Storage: {files.length}</p> */}

      {/* Bắt đầu danh sách file */}
      {/* {files.map(
        (file, index) => (
          <div key={index}>
            <h2>{file.key}</h2>
            <p>kích thước file: {file.size / 1024} Mb</p>
            <p>Ngày upload: {new Date(file.uploaded).toLocaleString('vi-VN')}</p>
          </div>
        )
      )} */}
    </div>
  )



}

export default FileManager;