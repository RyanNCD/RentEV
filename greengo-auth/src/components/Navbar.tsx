import { Link, useNavigate } from "react-router-dom";

export default function Navbar(){
  const nav = useNavigate();
  return (
    <header className="header">
      <div className="container header-in">
        <Link to="/home" className="brand" style={{gap:6}}>
          <img src="/logo.png" alt="Logo" style={{height:80}} />
  <div className="brand-text" style={{marginLeft:"6px"}}>GREENGO</div>
        </Link>

        <nav className="nav">
          <a href="#">Trang chủ</a>
          <a href="#">Về chúng tôi</a>
          <a href="#">Bảng giá</a>
          <a href="#">Kí gửi xe</a>
        </nav>

        <div className="actions">
          <button className="btn btn-ghost" onClick={()=>nav("/login")}>Đăng nhập</button>
          <button className="btn btn-primary">Đăng kí</button>
        </div>
      </div>
    </header>
  );
}
