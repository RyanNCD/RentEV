
import AuthForm from "../components/AuthForm";
import "./auth-page.css";
import logo from "../assets/logo.png";

export default function RegisterPage() {
  return (
    <div className="auth-layout">
      <aside className="auth-hero">
        <div className="auth-hero__inner">
          <img src={logo} alt="GreenGo" className="auth-hero__logo" />
          <h2 className="auth-hero__title">Chào mừng đến với GreenGo!</h2>
          <p className="auth-hero__desc">Đăng ký để bắt đầu hành trình của bạn cùng chúng tôi</p>
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-panel__head">
          <h1>Đăng ký</h1>
          <p>Nhập thông tin để tạo tài khoản</p>
        </div>

        <div className="auth-panel__form">
          <AuthForm mode="register" />
        </div>

        

        <div className="auth-panel__footer">
          <span>Đã có tài khoản?</span>
          <a href="/login">Đăng nhập</a>
        </div>

        <div className="auth-legal">
          <a href="#">Điều khoản</a>
          <span>•</span>
          <a href="#">Bảo mật</a>
          <span>•</span>
          <a href="#">Hỗ trợ</a>
        </div>
      </main>
    </div>
  );
}
