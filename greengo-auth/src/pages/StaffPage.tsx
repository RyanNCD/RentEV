import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import StatsCard from "../components/StatsCard";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";

type Tab = "overview" | "checkin" | "checkout" | "verify" | "payment";

// Mock data for staff
const mockVehiclesAtStation = [
  { id: "EV001", type: "VinFast VF8", plate: "29A-12345", battery: "85%", status: "available", nextBooking: "14:00" },
  { id: "EV002", type: "Tesla Model 3", plate: "29A-67890", battery: "92%", status: "rented", returnTime: "16:30" },
  { id: "EV003", type: "Hyundai Kona", plate: "29B-11111", battery: "45%", status: "charging", estFull: "11:30" },
  { id: "EV009", type: "VinFast VF9", plate: "29E-99999", battery: "100%", status: "available", nextBooking: "-" },
];

const mockPendingCheckIns = [
  { bookingId: "BK001", customer: "Nguyễn Văn A", phone: "0901234567", vehicle: "EV001", time: "14:00", verified: true },
  { bookingId: "BK003", customer: "Lê Văn C", phone: "0923456789", vehicle: "EV009", time: "15:30", verified: false },
];

const mockPendingCheckOuts = [
  { bookingId: "BK002", customer: "Trần Thị B", phone: "0912345678", vehicle: "EV002", returnTime: "16:30", duration: "2 ngày" },
];

const mockPayments = [
  { id: "PAY001", customer: "Nguyễn Văn A", amount: 1200000, type: "rental", status: "paid" },
  { id: "PAY002", customer: "Trần Thị B", amount: 500000, type: "deposit", status: "pending" },
  { id: "PAY003", customer: "Phạm Thị D", amount: 200000, type: "extra", status: "paid" },
];

export default function StaffPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkInForm, setCheckInForm] = useState({ photos: [] as string[], notes: "" });
  const [verifyForm, setVerifyForm] = useState({ licenseVerified: false, idVerified: false });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const handleCheckIn = (booking: any) => {
    setSelectedItem(booking);
    setIsModalOpen(true);
  };

  const handleCheckOut = (booking: any) => {
    setSelectedItem(booking);
    setIsModalOpen(true);
  };

  const handleVerify = (booking: any) => {
    setSelectedItem(booking);
    setIsModalOpen(true);
  };

  const handleDelete = (item: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    // TODO: Gọi API để xóa
    console.log("Deleting:", itemToDelete);
    setDeleteModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: "#10b981",
      rented: "#f59e0b",
      charging: "#3b82f6",
      paid: "#10b981",
      pending: "#f59e0b",
    };
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: 600,
          background: colors[status] + "20",
          color: colors[status],
        }}
      >
        {status === "available" && "Sẵn sàng"}
        {status === "rented" && "Đang thuê"}
        {status === "charging" && "Đang sạc"}
        {status === "paid" && "Đã thanh toán"}
        {status === "pending" && "Chờ thanh toán"}
      </span>
    );
  };

  const sidebarItems = [
    { key: "overview", label: "Tổng quan", icon: "📊" },
    { key: "checkin", label: "Giao xe", icon: "📥" },
    { key: "checkout", label: "Nhận xe", icon: "📤" },
    { key: "verify", label: "Xác thực KH", icon: "✅" },
    { key: "payment", label: "Thanh toán", icon: "💳" },
  ];

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, color: "var(--primary-700)" }}>Quản lý điểm thuê</h1>
            <p className="subtitle" style={{ marginTop: "4px" }}>
              Điểm thuê: <strong>Quận 1</strong> • Nhân viên: <strong>Nguyễn Minh E</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-ghost">📞 Liên hệ Admin</button>
            <button className="btn btn-primary">🚨 Báo cáo sự cố</button>
          </div>
        </div>

        {/* Layout with Sidebar */}
        <div style={{ display: "flex", gap: "24px" }}>
          <Sidebar items={sidebarItems} activeKey={tab} onSelect={(key) => setTab(key as Tab)} />

          {/* Content Area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Overview Tab */}
            {tab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <StatsCard title="Xe tại điểm" value="24" icon="🚗" />
              <StatsCard title="Xe đang thuê" value="9" change="37.5% sử dụng" trend="neutral" icon="🔑" />
              <StatsCard title="Chờ giao xe" value={mockPendingCheckIns.length} icon="📥" />
              <StatsCard title="Chờ nhận xe" value={mockPendingCheckOuts.length} icon="📤" />
            </div>

            <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
              <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Xe tại điểm ({mockVehiclesAtStation.length})</h3>
              <DataTable
                columns={[
                  { key: "id", label: "Mã xe" },
                  { key: "type", label: "Loại xe" },
                  { key: "plate", label: "Biển số" },
                  { key: "battery", label: "Pin" },
                  { key: "status", label: "Trạng thái", render: (val) => getStatusBadge(val) },
                  {
                    key: "nextBooking",
                    label: "Đặt trước",
                    render: (val) => (val !== "-" ? val : <span style={{ color: "var(--muted)" }}>-</span>),
                  },
                  {
                    key: "actions",
                    label: "Thao tác",
                    render: (_, row) => (
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: "13px", padding: "6px 12px", color: "#ef4444" }}
                        onClick={(e) => handleDelete(row, e)}
                      >
                        🗑️ Xóa
                      </button>
                    ),
                  },
                ]}
                data={mockVehiclesAtStation}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="card" style={{ padding: "20px" }}>
                <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Lịch giao xe hôm nay</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {mockPendingCheckIns.map((booking) => (
                    <div
                      key={booking.bookingId}
                      style={{
                        padding: "12px",
                        background: "var(--bg-secondary)",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: "4px" }}>{booking.customer}</div>
                        <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                          {booking.vehicle} • {booking.time}
                        </div>
                      </div>
                      <button className="btn btn-primary" style={{ fontSize: "13px" }} onClick={() => handleCheckIn(booking)}>
                        Giao xe
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: "20px" }}>
                <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Lịch nhận xe hôm nay</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {mockPendingCheckOuts.map((booking) => (
                    <div
                      key={booking.bookingId}
                      style={{
                        padding: "12px",
                        background: "var(--bg-secondary)",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: "4px" }}>{booking.customer}</div>
                        <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                          {booking.vehicle} • {booking.returnTime}
                        </div>
                      </div>
                      <button className="btn btn-primary" style={{ fontSize: "13px" }} onClick={() => handleCheckOut(booking)}>
                        Nhận xe
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Check-in Tab */}
        {tab === "checkin" && (
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Danh sách chờ giao xe</h3>
            <DataTable
              columns={[
                { key: "bookingId", label: "Mã đặt" },
                { key: "customer", label: "Khách hàng" },
                { key: "phone", label: "SĐT" },
                { key: "vehicle", label: "Xe" },
                { key: "time", label: "Giờ nhận" },
                {
                  key: "verified",
                  label: "Xác thực",
                  render: (val) => (val ? "✅ Đã xác thực" : "⏳ Chưa xác thực"),
                },
                {
                  key: "actions",
                  label: "Thao tác",
                  render: (_, row) => (
                    <button className="btn btn-primary" style={{ fontSize: "13px" }} onClick={() => handleCheckIn(row)}>
                      Giao xe
                    </button>
                  ),
                },
              ]}
              data={mockPendingCheckIns}
            />
          </div>
        )}

        {/* Check-out Tab */}
        {tab === "checkout" && (
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Danh sách chờ nhận xe</h3>
            <DataTable
              columns={[
                { key: "bookingId", label: "Mã đặt" },
                { key: "customer", label: "Khách hàng" },
                { key: "phone", label: "SĐT" },
                { key: "vehicle", label: "Xe" },
                { key: "returnTime", label: "Giờ trả" },
                { key: "duration", label: "Thời gian thuê" },
                {
                  key: "actions",
                  label: "Thao tác",
                  render: (_, row) => (
                    <button className="btn btn-primary" style={{ fontSize: "13px" }} onClick={() => handleCheckOut(row)}>
                      Nhận xe
                    </button>
                  ),
                },
              ]}
              data={mockPendingCheckOuts}
            />
          </div>
        )}

        {/* Verify Tab */}
        {tab === "verify" && (
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Khách hàng chờ xác thực</h3>
            <DataTable
              columns={[
                { key: "bookingId", label: "Mã đặt" },
                { key: "customer", label: "Họ tên" },
                { key: "phone", label: "SĐT" },
                {
                  key: "verified",
                  label: "Trạng thái",
                  render: (val) =>
                    val ? (
                      <span style={{ color: "#10b981", fontWeight: 600 }}>✅ Đã xác thực</span>
                    ) : (
                      <span style={{ color: "#f59e0b", fontWeight: 600 }}>⏳ Chờ xác thực</span>
                    ),
                },
                {
                  key: "actions",
                  label: "Thao tác",
                  render: (_, row) =>
                    !row.verified && (
                      <button className="btn btn-primary" style={{ fontSize: "13px" }} onClick={() => handleVerify(row)}>
                        Xác thực
                      </button>
                    ),
                },
              ]}
              data={mockPendingCheckIns}
            />
          </div>
        )}

        {/* Payment Tab */}
        {tab === "payment" && (
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Quản lý thanh toán</h3>
            <DataTable
              columns={[
                { key: "id", label: "Mã thanh toán" },
                { key: "customer", label: "Khách hàng" },
                {
                  key: "amount",
                  label: "Số tiền",
                  render: (val) => (val / 1000).toFixed(0) + "K VNĐ",
                },
                {
                  key: "type",
                  label: "Loại",
                  render: (val) =>
                    val === "rental" ? "Phí thuê" : val === "deposit" ? "Đặt cọc" : "Phụ phí",
                },
                { key: "status", label: "Trạng thái", render: (val) => getStatusBadge(val) },
                {
                  key: "actions",
                  label: "Thao tác",
                  render: (_, row) =>
                    row.status === "pending" && (
                      <button className="btn btn-primary" style={{ fontSize: "13px" }}>
                        Xác nhận
                      </button>
                    ),
                },
              ]}
              data={mockPayments}
            />
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Check-in/out Modal */}
      <Modal
        isOpen={isModalOpen && (tab === "checkin" || tab === "checkout")}
        onClose={() => setIsModalOpen(false)}
        title={tab === "checkin" ? "Giao xe cho khách hàng" : "Nhận xe từ khách hàng"}
        maxWidth={700}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(false)}>
              {tab === "checkin" ? "Hoàn tất giao xe" : "Hoàn tất nhận xe"}
            </button>
          </>
        }
      >
        {selectedItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "14px" }}>
                <div>
                  <strong>Khách hàng:</strong> {selectedItem.customer}
                </div>
                <div>
                  <strong>SĐT:</strong> {selectedItem.phone}
                </div>
                <div>
                  <strong>Xe:</strong> {selectedItem.vehicle}
                </div>
                <div>
                  <strong>Thời gian:</strong> {selectedItem.time || selectedItem.returnTime}
                </div>
              </div>
            </div>

            <div>
              <label className="label">Tình trạng xe</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginTop: "8px" }}>
                {["Thân xe", "Đèn", "Lốp", "Nội thất", "Pin", "Kính"].map((item) => (
                  <label key={item} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: "14px" }}>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Chụp ảnh xe (4 góc + dashboard)</label>
              <button className="btn btn-ghost" style={{ width: "100%", marginTop: "8px" }}>
                📷 Chụp ảnh ({checkInForm.photos.length}/5)
              </button>
            </div>

            <div>
              <label className="label">Ghi chú</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Ghi chú về tình trạng xe, vấn đề phát sinh..."
                value={checkInForm.notes}
                onChange={(e) => setCheckInForm({ ...checkInForm, notes: e.target.value })}
                style={{ marginTop: "8px", resize: "vertical" }}
              />
            </div>

            <div style={{ background: "#fef3c7", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
              ⚠️ <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ tình trạng xe và chụp ảnh đầy đủ trước khi {tab === "checkin" ? "giao" : "nhận"} xe
            </div>
          </div>
        )}
      </Modal>

      {/* Verify Modal */}
      <Modal
        isOpen={isModalOpen && tab === "verify"}
        onClose={() => setIsModalOpen(false)}
        title="Xác thực khách hàng"
        maxWidth={600}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </button>
            <button
              className="btn btn-primary"
              disabled={!verifyForm.licenseVerified || !verifyForm.idVerified}
              onClick={() => setIsModalOpen(false)}
            >
              Xác nhận
            </button>
          </>
        }
      >
        {selectedItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "14px" }}>
                <div style={{ marginBottom: "4px" }}>
                  <strong>Khách hàng:</strong> {selectedItem.customer}
                </div>
                <div>
                  <strong>SĐT:</strong> {selectedItem.phone}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={verifyForm.licenseVerified}
                  onChange={(e) => setVerifyForm({ ...verifyForm, licenseVerified: e.target.checked })}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>Giấy phép lái xe</div>
                  <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                    Kiểm tra giấy phép còn hạn, đối chiếu ảnh, họ tên, số GPLX
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={verifyForm.idVerified}
                  onChange={(e) => setVerifyForm({ ...verifyForm, idVerified: e.target.checked })}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>CMND/CCCD</div>
                  <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                    Kiểm tra giấy tờ tuỳ thân, đối chiếu với hồ sơ trên hệ thống
                  </div>
                </div>
              </label>
            </div>

            <div style={{ background: "#dbeafe", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
              💡 <strong>Hướng dẫn:</strong> Đối chiếu kỹ thông tin trên giấy tờ với hồ sơ đăng ký. Nếu phát hiện sai lệch, liên hệ Admin ngay.
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Xác nhận xóa"
        maxWidth={500}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteModalOpen(false)}>
              Hủy
            </button>
            <button
              className="btn btn-primary"
              style={{ background: "#ef4444" }}
              onClick={handleConfirmDelete}
            >
              🗑️ Xác nhận xóa
            </button>
          </>
        }
      >
        {itemToDelete && (
          <div>
            <div style={{ 
              background: "#fef2f2", 
              border: "1px solid #fecaca", 
              borderRadius: "8px", 
              padding: "16px",
              marginBottom: "16px"
            }}>
              <p style={{ margin: 0, color: "#991b1b", fontSize: "14px" }}>
                ⚠️ <strong>Cảnh báo:</strong> Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "8px" }}>
              {Object.entries(itemToDelete).slice(0, 4).map(([key, value]) => (
                <div key={key} style={{ marginBottom: "8px" }}>
                  <strong style={{ textTransform: "capitalize" }}>{key}:</strong> {String(value)}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}


