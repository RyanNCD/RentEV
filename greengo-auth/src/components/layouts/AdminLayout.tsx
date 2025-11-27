// File: src/components/layouts/AdminLayout.tsx (Bản full đã fix lỗi)

import { Outlet, Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminLayout.css"; 

// === LỖI CỦA ÔNG LÀ DO THIẾU "export default" Ở DÒNG NÀY ===
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const homeLink = user?.role === "ADMIN" ? "/dashboard/overview" : "/dashboard/checkin";

  return (
    <div className="admin-layout">
      {/* THANH SIDEBAR BÊN TRÁI */}
      <aside className="admin-sidebar">
        <Link to={homeLink} className="admin-sidebar__brand">
          GREENGO Dashboard
        </Link>
        
        <nav className="admin-sidebar__nav">
          <NavLink to={homeLink} end>Tổng quan</NavLink>

          {user?.role === "STAFF" && (
            <>
              <NavLink to="/dashboard/checkin">Giao nhận xe</NavLink>
              <NavLink to="/dashboard/vehicles">Quản lý Xe</NavLink>
              {/* Ẩn quản lý trạm khỏi staff theo yêu cầu */}
              {/* <NavLink to="/dashboard/stations">Quản lý Trạm</NavLink> */}
              <NavLink to="/dashboard/users">Quản lý User</NavLink>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <NavLink to="/dashboard/staffs">Quản lý Staff</NavLink>
              <NavLink to="/dashboard/revenue">Doanh thu</NavLink>
              <NavLink to="/dashboard/penalties">Bảng giá phạt</NavLink>
            </>
          )}
        </nav>
        
        <div className="admin-sidebar__footer">
          <button onClick={logout} className="btn-logout">
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* PHẦN NỘI DUNG CHÍNH BÊN PHẢI */}
      <div className="admin-main">
        <header className="admin-header">
          <span>Chào mừng, {user?.fullName || user?.email}</span>
        </header>
        
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}