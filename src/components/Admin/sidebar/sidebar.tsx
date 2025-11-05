import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./sidebar.css";
import { useAuth } from "../../../contexts/AuthContext";

import {
  FaTachometerAlt,
  FaUsers,
  FaCar,
  FaChevronDown,
  FaBars,
  FaClipboardList,
  FaExclamationTriangle,
  FaHome,
  FaSignOutAlt,
} from "react-icons/fa";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [openDropdown, setOpenDropdown] = useState("");
  const { logout } = useAuth();

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
        <li className="dropdown-item">
          <div
            className="nav-link dropdown-toggle"
            onClick={() => handleDropdownToggle("maintenance")}
          >
            <div className="nav-link-main">
              <FaClipboardList className="nav-icon" />
              {isOpen && <span>Bảo Trì</span>}
            </div>
            {isOpen && (
              <FaChevronDown
                className={`dropdown-arrow ${
                  openDropdown === "maintenance" ? "open" : ""
                }`}
              />
            )}
          </div>
          {isOpen && (
            <ul
              className={`dropdown-menu ${
                openDropdown === "maintenance" ? "open" : ""
              }`}
            >
              <li>
                <NavLink to="/admin/bao_tri" end className="nav-link">
                  - Tất cả bảo trì
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/bao_tri/cho_duyet" className="nav-link">
                  - Chờ Duyệt
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/bao_tri/da_duyet" className="nav-link">
                  - Đã Duyệt
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/bao_tri/dang_len_lich" className="nav-link">
                  - Đang Lên Lịch
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/bao_tri/dang_bao_tri" className="nav-link">
                  - Đang Bảo Trì
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/bao_tri/cho_kiem_tra_ban_giao"
                  className="nav-link"
                >
                  - Cho Kiểm Tra Bàn Giao
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/bao_tri/da_hoan_thanh" className="nav-link">
                  - Đã Hoàn Thành
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/bao_tri/da_huy" className="nav-link">
                  - Đã Hủy
                </NavLink>
              </li>
            </ul>
          )}
        </li>
      </ul>
      <div className="sidebar-footer">
        {/* Dùng lại cấu trúc ul/li giống như menu chính */}
        <ul className="sidebar-menu">
          <li>
            <NavLink to="/" className="nav-link">
              <FaHome className="nav-icon" />
              {isOpen && <span>Trang chủ</span>}
            </NavLink>
          </li>
          <li>
            <button onClick={logout} className="nav-link btn-logout">
              <FaSignOutAlt className="nav-icon" />
              {isOpen && <span>Đăng xuất</span>}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
