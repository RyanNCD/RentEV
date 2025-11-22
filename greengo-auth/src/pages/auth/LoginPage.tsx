// Thêm import { Link } từ react-router-dom
import { Link } from "react-router-dom"; 
import AuthForm from "../../components/AuthForm";
import "../auth-page.css";
import logo from "../../../public/images/logo.png";

export default function LoginPage() {
  return (
    <div className="auth-layout">
      {/* LEFT: hero gradient */}
      <aside className="auth-hero">
        <div className="auth-hero__inner">
          <img src={logo} alt="GreenGo" className="auth-hero__logo" />
          <h2 className="auth-hero__title">Chào mừng trở lại!</h2>
          <p className="auth-hero__desc">Đăng nhập để tiếp tục hành trình của bạn cùng chúng tôi</p>
        </div>
      </aside>

      {/* RIGHT: form */}
      <main className="auth-panel">
        <div className="auth-panel__head">
          <h1>Đăng nhập</h1>
          <p>Nhập thông tin để truy cập tài khoản</p>
        </div>

        <div className="auth-panel__form">
          {/* Component này làm đúng rồi, giữ nguyên */}
          <AuthForm mode="login" />
        </div>

        <div className="auth-panel__footer">
          <span>Chưa có tài khoản?</span>
          {/* === SỬA Ở ĐÂY === */}
          {/* Dùng <Link> của React Router, không dùng <a> */}
          <Link to="/register">Đăng ký miễn phí</Link>
          {/* === HẾT SỬA === */}
        </div>

        <div className="auth-legal">
          {/* (Góp ý) Nếu đây là trang nội bộ, cũng nên dùng Link */}
          <Link to="/terms">Điều khoản</Link>
          <span>•</span>
          <Link to="/privacy">Bảo mật</Link>
          <span>•</span>
          <Link to="/support">Hỗ trợ</Link>
        </div>
      </main>
    </div>
  );
}