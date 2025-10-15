
import AuthForm from "../components/AuthForm";
import "./auth-page.css"; // ⬅️ stylesheet mới (bên dưới)
import logo from "../assets/logo.png"; // thay bằng logo của bạn

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
          <AuthForm mode="login" />
        </div>

       

        <div className="auth-panel__footer">
          <span>Chưa có tài khoản?</span>
          <a href="/register">Đăng ký miễn phí</a>
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
