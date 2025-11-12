import { Link, useLocation } from "react-router-dom";

// [Inference] BE có thể trả về status như "Booking"/"PENDING"/"PAID"...
// Ánh xạ sang tiếng Việt để hiển thị nhất quán.
const toVietnameseStatus = (status: unknown): string => {
  const raw = String(status || "").toUpperCase();
  const map: Record<string, string> = {
    BOOKING: "Đang đặt",
    PENDING: "Đang đặt",
    PAID: "Đã thanh toán",
    IN_PROGRESS: "Đang thuê",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
    CANCELED: "Đã hủy",
  };
  return map[raw] || String(status || "—");
};

const formatDateVi = (value: unknown): string => {
  const d = new Date(String(value || ""));
  if (isNaN(d.getTime())) return "—"; // Tránh "Invalid Date"
  return d.toLocaleString("vi-VN");
};

const pickTotal = (contract: any): number => {
  // Ưu tiên totalCost; fallback các tên khác thường gặp từ BE.
  const n = Number(
    contract?.totalCost ?? contract?.totalMoney ?? contract?.amount ?? contract?.total ?? 0
  );
  return isNaN(n) ? 0 : n;
};

export default function PaymentSuccessPage() {
  const location = useLocation();
  const contract = (location.state as any)?.contract;

  if (contract) {
    const total = pickTotal(contract);
    const statusVi = toVietnameseStatus(contract.status);
    return (
      <div style={{ padding: "2rem", maxWidth: "720px", margin: "auto" }}>
        <h1 style={{ color: "green", textAlign: "center" }}>Thanh toán thành công!</h1>
        <div style={{ marginTop: "1rem", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "1rem" }}>
          <h2>Thông tin đặt thuê xe</h2>
          <p><strong>Mã đơn:</strong> {contract.id}</p>
          <p><strong>Xe:</strong> {contract.vehicleName}</p>
          <p><strong>Thời gian:</strong> {formatDateVi(contract.startDate)} - {formatDateVi(contract.endDate)}</p>
          <p><strong>Tổng tiền:</strong> {total.toLocaleString("vi-VN")} VNĐ</p>
          <p><strong>Trạng thái:</strong> {statusVi}</p>
        </div>
        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link to="/profile" className="btn-primary">Xem lịch sử thuê xe</Link>
          <Link to="/" className="btn-secondary">Quay về trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ color: "green" }}>Thanh toán thành công!</h1>
      <p>Không có dữ liệu đơn thuê xe để hiển thị.</p>
      <div style={{ marginTop: "1rem" }}>
        <Link to="/profile" className="btn-primary">Xem lịch sử thuê xe</Link>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <Link to="/" className="btn-secondary">Quay về trang chủ</Link>
      </div>
    </div>
  );
}