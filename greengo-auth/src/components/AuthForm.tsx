import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Mode = "login" | "register";
type Props = { mode: Mode; onSwitch: () => void };

export default function AuthForm({ mode, onSwitch }: Props) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 👉 Giả lập đăng nhập thành công
    if (mode === "login") {
      alert("Đăng nhập thành công!");
      navigate("/home"); // ✅ chuyển sang trang home
    } else {
      alert("Đăng ký thành công!");
      navigate("/login"); // ✅ quay lại login sau khi đăng ký
    }
  };

  return (
    <section className="panel">
      <div className="lang">
        <button className="lang-btn">VIE 🇻🇳</button>
      </div>

      <div className="panel-inner">
        <h2 className="title">{mode === "login" ? "Đăng nhập" : "Đăng kí"}</h2>
        <p className="subtitle">
          {mode === "login"
            ? "Nhập thông tin để truy cập tài khoản"
            : "Nhập thông tin để đăng kí tài khoản"}
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Địa chỉ Email</span>
            <input
              type="email"
              placeholder={mode === "login" ? "Đăng nhập email" : "example@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <div className="input-wrap">
              <input
                type={show ? "text" : "password"}
                placeholder="Nhập mật khẩu của bạn"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
              />
              <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)}>
                {show ? "🙈" : "👁️"}
              </button>
            </div>
          </label>

          {mode === "login" && (
            <div className="row between">
              <label className="check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <button className="link" type="button">Quên mật khẩu?</button>
            </div>
          )}

          <button className="primary" type="submit">
            {mode === "login" ? "Đăng nhập ngay" : "Đăng kí ngay"}
          </button>
        </form>
      </div>
    </section>
  );
}
