import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./sidebar.css";

import {
  FaTachometerAlt,
  FaUsers,
  FaCar,
  FaChevronDown,
  FaBars,
  FaClipboardList,
  FaExclamationTriangle,
} from "react-icons/fa";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [openDropdown, setOpenDropdown] = useState("");

  const handleDropdownToggle = (dropdownName: string) => {
    if (isOpen) {
      setOpenDropdown(openDropdown === dropdownName ? "" : dropdownName);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        {isOpen && <h3>🫄 Admin Panel</h3>}
        <button onClick={onToggle} className="toggle-btn">
          <FaBars />
        </button>
      </div>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/admin/admin_dashboard" className="nav-link">
            <FaTachometerAlt className="nav-icon" />
            {isOpen && <span>Dashboard</span>}
          </NavLink>
        </li>

        <li className="dropdown-item">
          <div
            className="nav-link dropdown-toggle"
            onClick={() => handleDropdownToggle("management")}
          >
            <div className="nav-link-main">
              <FaUsers className="nav-icon" />
              {isOpen && <span>Quản lý</span>}
            </div>
            {isOpen && (
              <FaChevronDown
                className={`dropdown-arrow ${
                  openDropdown === "management" ? "open" : ""
                }`}
              />
            )}
          </div>
          {isOpen && (
            <ul
              className={`dropdown-menu ${
                openDropdown === "management" ? "open" : ""
              }`}
            >
              <li>
                <NavLink to="/admin/users" className="nav-link">
                  - Quản lý Người dùng
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/phuong-tien" className="nav-link">
                  - Quản lý Phương tiện
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/danh-muc-phuong-tien" className="nav-link">
                  - Danh mục Phương tiện
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/chinh-sach-gia" className="nav-link">
                  - Chính sách giá
                </NavLink>
              </li>
            </ul>
          )}

        

        </li>
      </ul>

      <li className="dropdown-item">
          <div
            className="nav-link dropdown-toggle"
            onClick={() => handleDropdownToggle("orders")}
          >
            <div className="nav-link-main">
              <FaClipboardList className="nav-icon" />
              {isOpen && <span>Đơn Thuê</span>}
            </div>
            {isOpen && (
              <FaChevronDown
                className={`dropdown-arrow ${
                  openDropdown === "orders" ? "open" : ""
                }`}
              />
            )}
          </div>
          {isOpen && (
            <ul
              className={`dropdown-menu ${
                openDropdown === "orders" ? "open" : ""
              }`}
            >
              <li>
                <NavLink to="/admin/orders/all" className="nav-link">
                  - Tất cả đơn
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/orders/pending" className="nav-link">
                  - Đơn chờ duyệt
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/orders/approved" className="nav-link">
                  - Đã duyệt
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/orders/active" className="nav-link">
                  - Đang thuê
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/orders/returned" className="nav-link">
                  - Đã trả
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/orders/completed" className="nav-link">
                  - Đã hoàn tất
                </NavLink>
              </li>
              <li>
              <NavLink to="/admin/orders/cancelled" className="nav-link">
                - Đã hủy
              </NavLink>
            </li>
          </ul>
          )}
        </li>
        <li>
          <NavLink to="/admin/violations" className="nav-link">
            <FaExclamationTriangle className="nav-icon" />
            {isOpen && <span>Vi phạm</span>}
          </NavLink>
        </li>
    </div>
  );
};

export default Sidebar;
