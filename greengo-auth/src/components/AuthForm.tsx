// File: src/components/AuthForm.tsx (Bản nâng cấp fix 400)

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Import cả 2 "vũ khí"
import { register } from "../services/auth"; // (Service cho Register)
import { useAuth } from "../context/AuthContext"; // (Context cho Login)

// (Ông tự import CSS cho Form này nhé, ví dụ: import "./AuthForm.css")

type Props = Readonly<{
  mode: "login" | "register";
}>;

export default function AuthForm({ mode }: Props) {
  // === 1. STATE CHO 6 TRƯỜNG ===
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [identityCard, setIdentityCard] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginContext } = useAuth(); // Lấy hàm login từ context

  const isLogin = mode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLogin) {
      // --- XỬ LÝ LOGIN ---
      try {
        const redirectTo = (location.state as any)?.from?.pathname as string | undefined;
        await loginContext(email, password, redirectTo);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Đăng nhập thất bại");
      } finally {
        setLoading(false);
      }
    } else {
      // --- XỬ LÝ REGISTER (Fix lỗi 400 theo API image_a02ea6.png) ---
      const registerData = {
        fullName,
        email,
        password,
        phone,
        identityCard,
        driverLicense,
      };
      
      try {
        await register(registerData); // Gọi API register (6 món)
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login");
      } catch (err: any) {
        setError(err.response?.data?.message || "Đăng ký thất bại.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    // (Tôi dùng style tạm, ông dùng className CSS của ông nhé)
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* === 2. CÁC TRƯỜNG CHỈ HIỆN KHI ĐĂNG KÝ === */}
      {!isLogin && (
        <>
          <div>
            <label>Họ và tên</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required style={{width: '100%', padding: '0.5rem'}} />
          </div>
          <div>
            <label>Số điện thoại</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={{width: '100%', padding: '0.5rem'}} />
          </div>
        </>
      )}

      {/* 2 trường chung (Email, Pass) */}
      <div>
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{width: '100%', padding: '0.5rem'}} />
      </div>
      <div>
        <label>Mật khẩu</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{width: '100%', padding: '0.5rem'}} />
        {/* (Thêm nút "Hiện" ở đây nếu ông muốn) */}
      </div>

      {/* === 3. CÁC TRƯỜNG CHỈ HIỆN KHI ĐĂNG KÝ === */}
      {!isLogin && (
        <>
          <div>
            <label>CCCD/CMND</label>
            <input type="text" value={identityCard} onChange={e => setIdentityCard(e.target.value)} required style={{width: '100%', padding: '0.5rem'}} />
          </div>
          <div>
            <label>Bằng lái xe (Số GPLX)</label>
            <input type="text" value={driverLicense} onChange={e => setDriverLicense(e.target.value)} required style={{width: '100%', padding: '0.5rem'}} />
          </div>
        </>
      )}
      
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem', background: 'green', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        {loading ? "Đang xử lý..." : (isLogin ? "Đăng nhập" : "Đăng ký")}
      </button>
    </form>
  );
}