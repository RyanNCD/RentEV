import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../services/auth"; // ✅ named import
import "./auth.css";
type Props = { mode: "login" | "register" };

export default function AuthForm({ mode }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ email, password });
        // tự động đăng nhập sau đăng ký (tuỳ bạn giữ / bỏ)
        await login({ email, password });
      }
      navigate("/"); // điều hướng khi thành công
    } catch (ex: any) {
      const msg =
        ex?.response?.data?.message ||
        ex?.response?.data?.error ||
        ex?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="auth-form">
      <div className="form-group">
        <label>Email</label>
        <input
          autoComplete="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="form-group">
        <label>Mật khẩu</label>
        <div className="input-with-icon">
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            type={showPwd ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowPwd((s) => !s)}
            aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPwd ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {err && (
        <p className="form-error" role="alert">
          {err}
        </p>
      )}

      <button type="submit" className="primary-btn" disabled={loading}>
        {loading ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Đăng ký"}
      </button>
    </form>
  );
}
