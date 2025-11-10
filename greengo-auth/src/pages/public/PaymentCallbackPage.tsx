// File: src/lib/pages/public/PaymentCallbackPage.tsx

import { useEffect, useState } from "react";
// Import useSearchParams để đọc URL
import { useSearchParams, Link } from "react-router-dom"; 
import { verifyPaymentCallback } from "../../services/payment"; // Import

export default function PaymentCallbackPage() {
  // Lấy toàn bộ ?a=1&b=2... trên URL
  const [searchParams] = useSearchParams(); 
  
  const [status, setStatus] = useState<"LOADING" | "SUCCESS" | "FAILED">("LOADING");
  const [message, setMessage] = useState("Đang xác thực giao dịch...");

  useEffect(() => {
    // Lấy Response Code của VNPay
    const responseCode = searchParams.get("vnp_ResponseCode");
    // Lấy toàn bộ query string (vnp_Amount=...)
    const queryString = searchParams.toString(); 

    const verifyPayment = async () => {
      if (!responseCode) {
        setStatus("FAILED");
        setMessage("Lỗi: Không tìm thấy mã giao dịch.");
        return;
      }

      if (responseCode === "00") {
        // Giao dịch (phía VNPay) thành công
        try {
          // GỌI BE CỦA MÌNH để xác thực (chống giả mạo)
          // (Gọi hàm /api/payment/vnpay-return)
          const verifyResult = await verifyPaymentCallback(queryString);
          
          // (Giả sử BE trả về { success: true, ... })
          if (verifyResult.success) {
            setStatus("SUCCESS");
            setMessage("Thanh toán thành công! Cảm ơn bạn.");
          } else {
            setStatus("FAILED");
            setMessage(verifyResult.message || "Lỗi: Xác thực thanh toán thất bại (phía BE).");
          }
        } catch (err) {
          setStatus("FAILED");
          setMessage("Lỗi: Không thể kết nối đến server để xác thực.");
        }
      } else {
        // Giao dịch (phía VNPay) thất bại (Ví dụ: Hủy, Sai OTP...)
        setStatus("FAILED");
        setMessage("Thanh toán thất bại hoặc đã bị hủy.");
      }
    };
    
    verifyPayment();
  }, [searchParams]); // Chạy 1 lần khi URL thay đổi

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      {status === "LOADING" && <h2>{message}</h2>}
      
      {status === "SUCCESS" && (
        <>
          <h1 style={{ color: "green" }}>Thanh toán Thành công!</h1>
          <p>{message}</p>
          <Link to="/profile" className="btn-primary">Xem lịch sử thuê xe</Link>
        </>
      )}
      
      {status === "FAILED" && (
        <>
          <h1 style={{ color: "red" }}>Thanh toán Thất bại!</h1>
          <p>{message}</p>
          <Link to="/home" className="btn-secondary">Quay về trang chủ</Link>
        </>
      )}
    </div>
  );
}