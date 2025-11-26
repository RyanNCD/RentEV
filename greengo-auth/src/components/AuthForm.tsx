// File: src/components/AuthForm.tsx (Bản nâng cấp fix 400)

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Import cả 2 "vũ khí"
import { register, verifyOtp, resendVerificationEmail } from "../services/auth"; // (Service cho Register)
import { useAuth } from "../context/AuthContext"; // (Context cho Login)
import type { LoginResponseFromBE } from "../services/auth";

// (Ông tự import CSS cho Form này nhé, ví dụ: import "./AuthForm.css")

const DEVICE_STORAGE_KEY = "greengo_trusted_device_id";

const generateDeviceId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
};

const getDeviceIdFromStorage = (): string | null => {
  if (typeof window === "undefined") return null;
  let stored = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (!stored) {
    stored = generateDeviceId();
    localStorage.setItem(DEVICE_STORAGE_KEY, stored);
  }
  return stored;
};

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
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<{ otpRequestId: string; redirectTo?: string; deviceId?: string } | null>(null);
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [resendOtpLoading, setResendOtpLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginContext, completeLoginWithToken } = useAuth(); // Lấy hàm login từ context

  const isLogin = mode === "login";

  useEffect(() => {
    const stored = getDeviceIdFromStorage();
    if (stored) {
      setDeviceId(stored);
    }
  }, []);

  const resolveDeviceId = (): string | undefined => {
    let current = deviceId;
    if (!current) {
      current = getDeviceIdFromStorage();
      if (current) {
        setDeviceId(current);
      }
    }
    return current ?? undefined;
  };

  const stopOtpCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setOtpCountdown(0);
  };

  const startOtpCountdown = (seconds = 360) => {
    stopOtpCountdown();
    setOtpCountdown(seconds);
    countdownRef.current = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      stopOtpCountdown();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpStep) {
      await handleOtpSubmit();
      return;
    }
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    if (isLogin) {
      try {
        const redirectTo = (location.state as any)?.from?.pathname as string | undefined;
        const currentDeviceId = resolveDeviceId();
        const result = await loginContext(email, password, redirectTo, currentDeviceId);
        handleLoginResult(result, redirectTo, currentDeviceId);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Đăng nhập thất bại");
      } finally {
        setLoading(false);
      }
    } else {
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
        setRegistrationSuccess(true);
        setInfoMessage("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.");
      } catch (err: any) {
        setError(err.response?.data?.message || "Đăng ký thất bại.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLoginResult = (result: LoginResponseFromBE, redirectTo?: string, currentDeviceId?: string, isResend?: boolean) => {
    if (result.token) {
      stopOtpCountdown();
      return;
    }
    if (result.requiresOtp && result.otpRequestId) {
      setOtpStep({ otpRequestId: result.otpRequestId, redirectTo, deviceId: currentDeviceId });
      setInfoMessage(result.message ?? "Nhập mã OTP vừa được gửi tới email của bạn.");
      setAwaitingEmailVerification(false);
      setOtpCode("");
      if (!isResend) {
        setRememberDevice(false);
      }
      startOtpCountdown();
      return;
    }
    if (result.requiresEmailVerification) {
      setAwaitingEmailVerification(true);
      setInfoMessage(result.message ?? "Email chưa được xác thực. Hãy kiểm tra hộp thư.");
      stopOtpCountdown();
      return;
    }
    setError(result.message || "Đăng nhập thất bại.");
  };

  const handleOtpSubmit = async () => {
    if (!otpStep) return;
    setLoading(true);
    setError(null);
    try {
      const response = await verifyOtp({
        otpRequestId: otpStep.otpRequestId,
        code: otpCode,
        rememberDevice,
        deviceId: otpStep.deviceId || resolveDeviceId(),
      });
      if (response.token) {
        completeLoginWithToken(response.token, otpStep.redirectTo);
        setOtpStep(null);
        setOtpCode("");
        setRememberDevice(false);
        stopOtpCountdown();
      } else {
        setError(response.message || "OTP không hợp lệ.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Xác thực OTP thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError("Vui lòng nhập email trước khi yêu cầu gửi lại.");
      return;
    }
    setResendLoading(true);
    setError(null);
    try {
      await resendVerificationEmail(email);
      setInfoMessage("Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư đến.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể gửi lại email xác thực.");
    } finally {
      setResendLoading(false);
    }
  };

  const resetOtpStep = () => {
    setOtpStep(null);
    setOtpCode("");
    setInfoMessage(null);
    setRememberDevice(false);
    stopOtpCountdown();
  };

  const handleResendOtp = async () => {
    if (!otpStep) return;
    setResendOtpLoading(true);
    setError(null);
    try {
      const currentDeviceId = otpStep.deviceId || resolveDeviceId();
      const result = await loginContext(email, password, otpStep.redirectTo, currentDeviceId);
      handleLoginResult(result, otpStep.redirectTo, currentDeviceId, true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể gửi lại OTP, vui lòng thử lại.");
    } finally {
      setResendOtpLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {!otpStep && (
        <>
          {!isLogin && (
            <>
              <div>
                <label>Họ và tên</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required style={{width: '100%', padding: '0.5rem'}} />
              </div>
              <div>
                <label>Số điện thoại</label>
                <input
                  type="text"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  style={{width: '100%', padding: '0.5rem'}}
                  placeholder="Ví dụ: 0901234567"
                />
              </div>
            </>
          )}

          <div>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{width: '100%', padding: '0.5rem'}} />
          </div>
          <div>
            <label>Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{width: '100%', padding: '0.5rem'}} />
          </div>

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
        </>
      )}

      {otpStep && (
        <>
          <div>
            <label>Nhập mã OTP</label>
            <input
              type="text"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              required
              style={{width: '100%', padding: '0.5rem'}}
              maxLength={6}
            />
          </div>
          <p>Mã OTP đã được gửi tới email của bạn. Vui lòng nhập trong vòng 5 phút.</p>
          <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
            />
            <span>Ghi nhớ thiết bị này</span>
          </label>
          <small>Chỉ bật tuỳ chọn này trên thiết bị cá nhân để bỏ qua OTP trong 30 ngày.</small>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={otpCountdown > 0 || resendOtpLoading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: '1px solid #16a34a',
                background: otpCountdown > 0 ? '#e5e7eb' : '#ffffff',
                color: otpCountdown > 0 ? '#9ca3af' : '#16a34a',
                cursor: otpCountdown > 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {resendOtpLoading
                ? "Đang gửi..."
                : otpCountdown > 0
                  ? `Gửi lại OTP (${otpCountdown}s)`
                  : "Gửi lại OTP"}
            </button>
            {otpCountdown > 0 && (
              <small>Bạn có thể gửi lại sau {otpCountdown}s</small>
            )}
          </div>
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
      {infoMessage && <p style={{ color: "#166534" }}>{infoMessage}</p>}

      {awaitingEmailVerification && (
        <button
          type="button"
          disabled={resendLoading}
          onClick={handleResendVerification}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #16a34a', background: 'white', color: '#16a34a', cursor: 'pointer' }}
        >
          {resendLoading ? "Đang gửi..." : "Gửi lại email xác thực"}
        </button>
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ flex: "1", padding: '0.75rem', background: 'green', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? "Đang xử lý..." : otpStep ? "Xác nhận OTP" : (isLogin ? "Đăng nhập" : "Đăng ký")}
        </button>
        {otpStep && (
          <button
            type="button"
            onClick={resetOtpStep}
            style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
          >
            Đăng nhập lại
          </button>
        )}
        {!isLogin && registrationSuccess && (
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #16a34a', background: 'white', color: '#16a34a', cursor: 'pointer' }}
          >
            Đến trang đăng nhập
          </button>
        )}
      </div>
    </form>
  );
}