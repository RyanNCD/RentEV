// File: src/lib/pages/public/ProfilePage.tsx (Bản full đã fix gạch vàng)

// 1. Import thêm "useCallback"
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getRentalHistory } from "../../services/rental";
import { type IRentalHistoryItem } from "../../types";
import "../profile.css";
// (Thêm "export default" cho chuẩn file)
export default function ProfilePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<IRentalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Bọc hàm fetchHistory bằng useCallback
  // (useCallback "nhớ" hàm này, nó không bị tạo lại mỗi lần render)
  const fetchHistory = useCallback(async () => {
    try {
      // Gọi API (Giả sử BE đã làm API này)
      const data = await getRentalHistory();
      setHistory(data);
    } catch (err) {
      console.error("Không thể tải lịch sử thuê:", err);
    } finally {
      setLoading(false);
    }
  }, []); // 3. Mảng dependency rỗng, vì nó không phụ thuộc state/props nào

  
  // 4. Sửa lại useEffect
  // (Nó chỉ chạy 1 lần khi mount, gọi hàm fetchHistory đã nhớ)
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]); // 5. Phụ thuộc vào hàm fetchHistory (đã bọc bởi useCallback)

  // (Phần JSX giữ nguyên)
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Hồ sơ của bạn</h1>
      <h3>Xin chào, {user?.fullName || user?.email}</h3>
      <p>Vai trò: {user?.role}</p>
      
      <hr style={{ margin: "2rem 0" }} />
      
      <h2>Lịch sử thuê xe</h2>
      {loading ? (
        <p>Đang tải lịch sử...</p>
      ) : (
        <ul>
          {history.length > 0 ? (history as IRentalHistoryItem[]).map((item) => {
            const start = item.startTime ? new Date(item.startTime) : null;
            const end = item.endTime ? new Date(item.endTime) : null;
            const dayRange = `${start ? start.toLocaleDateString("vi-VN") : "—"} - ${end ? end.toLocaleDateString("vi-VN") : "—"}`;
            const amount = item.totalCost && item.totalCost > 0 ? `${Number(item.totalCost).toLocaleString("vi-VN")} VNĐ` : "—";
            const status = String(item.status || "").toUpperCase();
            const statusVi = {
              BOOKING: "Đang đặt",
              PENDING: "Đang đặt",
              PAID: "Đã thanh toán",
              PAID2: "Đã thanh toán",
              SUCCESS: "Đã thanh toán",
              IN_PROGRESS: "Đang thuê",
              COMPLETED: "Hoàn tất",
              CANCELLED: "Đã hủy",
              CANCELED: "Đã hủy",
            }[status] || item.status || "—";

            return (
              <li key={item.rentalId} style={{
                listStyle: "none",
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <strong style={{ fontSize: 16 }}>{item.vehicleName || "Xe không rõ"}</strong>
                  <span style={{ color: "#666" }}>Thời gian: {dayRange}</span>
                  <span style={{ color: "#666" }}>Trạng thái: {statusVi}</span>
                </div>
                <div style={{ fontWeight: 600, color: amount !== "—" ? "#111" : "#999" }}>{amount !== "—" ? amount : "Chưa xác định"}</div>
              </li>
            );
          }) : (
            <p>Bạn chưa có chuyến thuê nào.</p>
          )}
        </ul>
      )}
    </div>
  );
}