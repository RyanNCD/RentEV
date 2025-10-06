export default function Navbar() {
  return (
    <header className="nav-wrap">
      <div className="container nav">
        <div className="brand">
          <img src="/logo.png" alt="GreenGo" />
          <span>GREENGO</span>
        </div>

        <nav className="nav-links">
          <a className="active">Trang chủ</a>
          <a>Về chúng tôi</a>
          <a>Bảng giá</a>
          <a>Kí gửi xe</a>
        </nav>

        <div className="nav-cta">
          <a className="btn ghost" href="/login">Đăng nhập</a>
          <a className="btn primary sm" href="/register">Đăng kí →</a>
        </div>
      </div>
    </header>
  );
}
