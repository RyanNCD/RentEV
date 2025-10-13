import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar(){
  const nav = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    setUserEmail(localStorage.getItem("userEmail"));
    setUserRole(localStorage.getItem("userRole"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    nav("/login");
  };

  return (
    <header className="header">
      <div className="container header-in">
        <Link to="/home" className="brand" style={{gap:6}}>
          <img src="/logo.png" alt="Logo" style={{height:80}} />
          <div className="brand-text" style={{marginLeft:"6px"}}>GREENGO</div>
        </Link>

        <nav className="nav">
          <Link to="/home">Trang chủ</Link>
          {userRole === "admin" && <Link to="/admin">Quản trị</Link>}
          {userRole === "staff" && <Link to="/staff">Điểm thuê</Link>}
          <a href="#">Về chúng tôi</a>
          <a href="#">Bảng giá</a>
        </nav>

        <div className="actions">
          {userEmail ? (
            <>
              <span style={{ fontSize: "14px", color: "var(--muted)", marginRight: "8px" }}>
                {userEmail}
              </span>
              <button className="btn btn-ghost" onClick={handleLogout}>Đăng xuất</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={()=>nav("/login")}>Đăng nhập</button>
              <button className="btn btn-primary">Đăng kí</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
