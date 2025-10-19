import { NavLink, Link } from "react-router-dom";
import "./navbar.css";

type Props = {
  logoSrc?: string; // ví dụ "/images/logo.svg"
  brandText?: string;
};

export default function Navbar({ logoSrc = "/images/logo.svg", brandText = "GreenGo" }: Props) {
  return (
    <header className="nav">
      <div className="nav__inner">
        {/* LEFT: Brand */}
        <Link to="/home" className="nav__brand" aria-label="Trang chủ GreenGo">
          {logoSrc ? (
            <img src={logoSrc} alt={brandText} className="nav__logo" />
          ) : (
            <span className="nav__brand-text">{brandText}</span>
          )}
        </Link>

        {/* CENTER: Links */}
        <nav className="nav__links">
          <NavLink to="/home" className={({isActive}) => `nav__link ${isActive ? "active" : ""}`}>
            Trang chủ
          </NavLink>
          <NavLink to="/about" className={({isActive}) => `nav__link ${isActive ? "active" : ""}`}>
            Giới thiệu
          </NavLink>
          <NavLink to="/pricing" className={({isActive}) => `nav__link ${isActive ? "active" : ""}`}>
            Bảng giá
          </NavLink>
          <NavLink to="/profile" className={({isActive}) => `nav__link ${isActive ? "active" : ""}`}>
            Hồ sơ
          </NavLink>
        </nav>

        {/* RIGHT: Auth actions */}
        
      

        <div className="nav__actions">
          <Link to="/login" className="btn btn--ghost">Đăng nhập</Link>
          <Link to="/register" className="btn btn--primary">Đăng ký</Link>
        </div>
      </div>
    </header>
  );
}
