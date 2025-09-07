// src/components/Admin/AdminLayout.tsx

import React, { useState } from 'react'; // Import useState
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar/sidebar';
import './adminLayout..css';

const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="admin-layout">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <main 
        className={`admin-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;