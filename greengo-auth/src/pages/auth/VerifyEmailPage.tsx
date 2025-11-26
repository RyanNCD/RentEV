import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../../services/auth";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Đang xác thực email...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Token xác thực không hợp lệ.");
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
        setMessage("Email đã được xác thực thành công! Bạn có thể đăng nhập.");
      } catch (error: any) {
        setStatus("error");
        setMessage(error?.response?.data?.message || "Không thể xác thực email. Vui lòng thử lại hoặc yêu cầu gửi lại.");
      }
    };

    void verify();
  }, [searchParams]);

  return (
    <div style={{ maxWidth: "600px", margin: "80px auto", textAlign: "center", padding: "32px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
      <h1 style={{ marginBottom: "16px" }}>Xác thực email</h1>
      <p style={{ color: status === "error" ? "#dc2626" : "#166534" }}>{message}</p>
      <div style={{ marginTop: "24px" }}>
        <Link to="/login" style={{ color: "#16a34a", fontWeight: 600 }}>
          Quay lại trang đăng nhập
        </Link>
      </div>
    </div>
  );
}




