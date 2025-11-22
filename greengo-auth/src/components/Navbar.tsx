// File: src/components/Navbar.tsx (Bản full đã fix tất cả lỗi)

import { type JSX } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import hook từ Context
import "./navbar.css"; // CSS của ông

// 1. Định nghĩa Props (Đã fix lỗi SonarQube)
type Props = Readonly<{
  logoSrc?: string;
  brandText?: string;
}>;

// 2. Sửa cú pháp hàm (Fix lỗi đỏ lòm)
export default function Navbar(props: Props): JSX.Element {
  
  // 3. Destructure và gán default bên trong hàm
  const {
    logoSrc = "/images/logo.png", // (Tôi sửa /imges/ thành /images/ cho chuẩn)
    brandText = "GreenGo",
  } = props;

  // 4. Lấy state từ Context
  const { user, logout } = useAuth();

  return (
    <header className="nav">
      <div className="nav__inner">
        
        {/* LEFT: Brand (Đã dùng logoSrc, brandText -> Hết lỗi "unused") */}
        <Link to="/home" className="nav__brand" aria-label="Trang chủ GreenGo">
          {logoSrc ? (
            <img src={logoSrc} alt={brandText} className="nav__logo" />
          ) : (
            <span className="nav__brand-text">{brandText}</span>
          )}
        </Link>

        {/* CENTER: Links */}
        <nav className="nav__links">
          <NavLink to="/home" className={({ isActive }) => `nav__link ${isActive ? "active" : ""}`}>
            Trang chủ
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav__link ${isActive ? "active" : ""}`}>
            Giới thiệu
          </NavLink>
          <NavLink to="/pricing" className={({ isActive }) => `nav__link ${isActive ? "active" : ""}`}>
            Bảng giá
          </NavLink>

          {/* CHỈ HIỂN THỊ KHI ĐÃ LOGIN */}
          {user && (
            <>
              <NavLink to="/profile" className={({ isActive }) => `nav__link ${isActive ? "active" : ""}`}>
                Hồ sơ
              </NavLink>

              {/* Thêm: Link đến Dashboard nếu là Admin/Staff */}
              {(user.role === "ADMIN" || user.role === "STAFF") && (
                <NavLink to="/dashboard" className={({ isActive }) => `nav__link ${isActive ? "active" : ""}`}>
                  Quản lý
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* RIGHT: Auth actions (Đã fix logic) */}
        <div className="nav__actions">
          {user ? (
            // === ĐÃ ĐĂNG NHẬP ===
            <>
              <div className="nav__user-info">
                <div className="nav__user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName || user.email} />
                  ) : (
                    <span className="nav__user-initial">
                      {(user.fullName || user.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="nav__user-name">
                  {user.fullName || user.email}
                </span>
              </div>
              <button onClick={logout} className="btn btn--ghost">
                Đăng xuất
              </button>
            </>
          ) : (
            // === CHƯA ĐĂNG NHẬP ===
            <>
              <Link to="/login" className="btn btn--ghost">Đăng nhập</Link>
              <Link to="/register" className="btn btn--primary">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}