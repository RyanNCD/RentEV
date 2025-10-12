import { useState } from "react";
import { useNavigate } from "react-router-dom";

/** Trang đăng nhập (dùng trực tiếp trong router) */
export default function AuthHero() {
  const nav = useNavigate();

  // demo: có thể đổi sang state/validate thật
  const [email, setEmail] = useState("demo@greengo.vn");
  const [password, setPassword] = useState("greengo123");
  const [error, setError] = useState<string | null>(null);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setError(null);

    // TODO: gọi API thật. Demo: cho qua nếu dùng demo@greengo.vn / greengo123
    if (email.trim().toLowerCase() === "demo@greengo.vn" && password === "greengo123") {
      nav("/home");
    } else {
      setError("Email hoặc mật khẩu không đúng (demo: demo@greengo.vn / greengo123)");
    }
  };

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <div className="auth-grid">
        {/* Khối hero bên trái */}
        <aside className="hero">
          <div className="hero-inner" style={{ padding: 24 }}>
            <img src="/logo.png" alt="GreenGo" style={{ width: 160, height: "auto" }} />
            <div className="hero-text" style={{ textAlign: "center" }}>
              <h1 style={{ margin: "12px 0", color: "var(--primary-700)" }}>Chào mừng trở lại!</h1>
              <p style={{ margin: 0, color: "var(--muted)" }}>
                Đăng nhập để tiếp tục hành trình của bạn cùng GreenGo
              </p>
            </div>
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
