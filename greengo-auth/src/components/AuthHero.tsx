import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Demo accounts với role-based routing
const DEMO_ACCOUNTS = [
  { email: "admin@greengo.vn", password: "admin123", role: "admin", redirect: "/admin" },
  { email: "staff@greengo.vn", password: "staff123", role: "staff", redirect: "/staff" },
  { email: "demo@greengo.vn", password: "greengo123", role: "renter", redirect: "/home" },
];

/** Trang đăng nhập (dùng trực tiếp trong router) */
export default function AuthHero() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setError(null);

    // Kiểm tra tài khoản demo
    const account = DEMO_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === email.trim().toLowerCase() && acc.password === password
    );

    if (account) {
      // Lưu role vào localStorage (trong thực tế dùng JWT token)
      localStorage.setItem("userRole", account.role);
      localStorage.setItem("userEmail", account.email);
      nav(account.redirect);
    } else {
      setError("Email hoặc mật khẩu không đúng");
    }
  };

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <div className="auth-grid">
        {/* Khối hero bên trái */}
        <aside className="card" style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <img src="/logo.png" alt="GreenGo" style={{ width: 160, height: "auto", marginBottom: "20px" }} />
          <div style={{ textAlign: "center" }}>
            <h1 style={{ margin: "12px 0", color: "var(--primary-700)" }}>Chào mừng trở lại!</h1>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Đăng nhập để tiếp tục hành trình của bạn cùng GreenGo
            </p>
          </div>
        </aside>

        {/* Form đăng nhập bên phải */}
        <form onSubmit={onSubmit} className="card" style={{ padding: 20 }}>
          <h2 style={{ marginTop: 0, color: "var(--primary-700)" }}>Đăng nhập</h2>
          <p className="subtitle" style={{ marginTop: 6 }}>Nhập thông tin để truy cập tài khoản</p>

          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <label className="label">Địa chỉ Email</label>
            <input
              className="input"
              type="email"
              required
              placeholder="ban@greengo.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="label" style={{ marginTop: 4 }}>Mật khẩu</label>
            <input
              className="input"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", color:"#991b1b", padding:"10px 12px", borderRadius:10 }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" style={{ width: "100%", marginTop: 6 }} type="submit">
              Đăng nhập ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
