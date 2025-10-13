import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import StatsCard from "../components/StatsCard";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";

type Tab = "overview" | "vehicles" | "customers" | "staff" | "reports";

// Mock data
const mockVehicles = [
  { id: "EV001", type: "VinFast VF8", station: "Quận 1", battery: "85%", status: "available", plate: "29A-12345" },
  { id: "EV002", type: "Tesla Model 3", station: "Quận 3", battery: "92%", status: "rented", plate: "29A-67890" },
  { id: "EV003", type: "Hyundai Kona", station: "Quận 1", battery: "45%", status: "charging", plate: "29B-11111" },
  { id: "EV004", type: "VinFast VF9", station: "Quận 7", battery: "100%", status: "available", plate: "29C-22222" },
  { id: "EV005", type: "BYD Atto 3", station: "Quận 2", battery: "68%", status: "maintenance", plate: "29D-33333" },
];

const mockCustomers = [
  { id: "C001", name: "Nguyễn Văn A", phone: "0901234567", license: "012345678", totalRentals: 15, status: "verified" },
  { id: "C002", name: "Trần Thị B", phone: "0912345678", license: "087654321", totalRentals: 8, status: "verified" },
  { id: "C003", name: "Lê Văn C", phone: "0923456789", license: "123456789", totalRentals: 3, status: "pending" },
  { id: "C004", name: "Phạm Thị D", phone: "0934567890", license: "234567890", totalRentals: 22, status: "risk" },
];

const mockStaff = [
  { id: "S001", name: "Nguyễn Minh E", station: "Quận 1", phone: "0945678901", totalHandovers: 145, rating: 4.8 },
  { id: "S002", name: "Võ Thị F", station: "Quận 3", phone: "0956789012", totalHandovers: 98, rating: 4.9 },
  { id: "S003", name: "Hoàng Văn G", station: "Quận 7", phone: "0967890123", totalHandovers: 203, rating: 4.7 },
];

const mockRevenueByStation = [
  { station: "Quận 1", revenue: 145000000, rentals: 234 },
  { station: "Quận 3", revenue: 98000000, rentals: 156 },
  { station: "Quận 7", revenue: 203000000, rentals: 312 },
  { station: "Quận 2", revenue: 87000000, rentals: 134 },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "delete">("view");

  const handleRowClick = (row: any) => {
    setSelectedItem(row);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (row: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedItem(row);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDelete = (row: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedItem(row);
    setModalMode("delete");
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // TODO: Gọi API để lưu thay đổi
    console.log("Saving:", selectedItem);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    // TODO: Gọi API để xóa
    console.log("Deleting:", selectedItem);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: "#10b981",
      rented: "#f59e0b",
      charging: "#3b82f6",
      maintenance: "#ef4444",
      verified: "#10b981",
      pending: "#f59e0b",
      risk: "#ef4444",
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
        {status === "maintenance" && "Bảo trì"}
        {status === "verified" && "Đã xác thực"}
        {status === "pending" && "Chờ xác thực"}
        {status === "risk" && "Rủi ro"}
      </span>
    );
  };

  const sidebarItems = [
    { key: "overview", label: "Tổng quan", icon: "📊" },
    { key: "vehicles", label: "Quản lý xe", icon: "🚗" },
    { key: "customers", label: "Khách hàng", icon: "👥" },
    { key: "staff", label: "Nhân viên", icon: "👨‍💼" },
    { key: "reports", label: "Báo cáo", icon: "📈" },
  ];

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, color: "var(--primary-700)" }}>Quản trị hệ thống</h1>
            <p className="subtitle" style={{ marginTop: "4px" }}>
              Tổng quan và quản lý toàn bộ hệ thống cho thuê EV
            </p>
          </div>
          <button className="btn btn-primary">+ Thêm mới</button>
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
              <StatsCard title="Tổng số xe" value="87" change="+12 so với tháng trước" trend="up" icon="🚗" />
              <StatsCard title="Xe đang cho thuê" value="42" change="48% tỷ lệ sử dụng" trend="neutral" icon="🔑" />
              <StatsCard title="Doanh thu tháng" value="533M VNĐ" change="+18.2%" trend="up" icon="💰" />
              <StatsCard title="Khách hàng mới" value="128" change="+24 tuần này" trend="up" icon="👥" />
            </div>

            <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
              <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Doanh thu theo điểm thuê</h3>
              <DataTable
                columns={[
                  { key: "station", label: "Điểm thuê" },
                  { key: "rentals", label: "Số lượt thuê" },
                  {
                    key: "revenue",
                    label: "Doanh thu",
                    render: (val) => (val / 1000000).toFixed(0) + "M VNĐ",
                  },
                  {
                    key: "avgRevenue",
                    label: "TB/lượt",
                    render: (_, row) => ((row.revenue / row.rentals) / 1000).toFixed(0) + "K",
                  },
                ]}
                data={mockRevenueByStation}
              />
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Hoạt động gần đây</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { time: "10:23", text: "Xe EV001 được giao cho khách hàng C045 tại Quận 1", type: "handover" },
                  { time: "09:15", text: "Nhân viên S003 báo cáo xe EV012 cần bảo trì", type: "maintenance" },
                  { time: "08:45", text: "Khách hàng C089 hoàn tất đặt xe trước online", type: "booking" },
                  { time: "07:30", text: "Xe EV007 được trả về điểm Quận 3", type: "return" },
                ].map((activity, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--muted)", minWidth: "50px" }}>{activity.time}</span>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--primary-500)",
                      }}
                    />
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{activity.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Vehicles Tab */}
        {tab === "vehicles" && (
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "var(--primary-700)" }}>Danh sách xe ({mockVehicles.length})</h3>
              <input
                className="input"
                placeholder="Tìm kiếm xe..."
                style={{ width: "300px" }}
              />
            </div>
            <DataTable
              columns={[
                { key: "id", label: "Mã xe" },
                { key: "type", label: "Loại xe" },
                { key: "plate", label: "Biển số" },
                { key: "station", label: "Điểm thuê" },
                { key: "battery", label: "Pin" },
                { key: "status", label: "Trạng thái", render: (val) => getStatusBadge(val) },
                {
                  key: "actions",
                  label: "Thao tác",
                  render: (_, row) => (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: "13px", padding: "6px 12px" }}
                        onClick={(e) => handleEdit(row, e)}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: "13px", padding: "6px 12px", color: "#ef4444" }}
                        onClick={(e) => handleDelete(row, e)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  ),
                },
              ]}
              data={mockVehicles}
              onRowClick={handleRowClick}
            />
          </div>
        )}

        {/* Customers Tab */}
        {tab === "customers" && (
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "var(--primary-700)" }}>Danh sách khách hàng ({mockCustomers.length})</h3>
              <input
                className="input"
                placeholder="Tìm kiếm khách hàng..."
                style={{ width: "300px" }}
              />
            </div>
            <DataTable
              columns={[
                { key: "id", label: "Mã KH" },
                { key: "name", label: "Họ tên" },
                { key: "phone", label: "Điện thoại" },
                { key: "license", label: "GPLX" },
                { key: "totalRentals", label: "Số lượt thuê" },
                { key: "status", label: "Trạng thái", render: (val) => getStatusBadge(val) },
                {
                  key: "actions",
                  label: "Thao tác",
                  render: (_, row) => (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: "13px", padding: "6px 12px" }}
                        onClick={(e) => handleEdit(row, e)}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: "13px", padding: "6px 12px", color: "#ef4444" }}
                        onClick={(e) => handleDelete(row, e)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  ),
                },
              ]}
              data={mockCustomers}
              onRowClick={handleRowClick}
            />
          </div>
        )}

        {/* Staff Tab */}
        {tab === "staff" && (
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "var(--primary-700)" }}>Danh sách nhân viên ({mockStaff.length})</h3>
              <input
                className="input"
                placeholder="Tìm kiếm nhân viên..."
                style={{ width: "300px" }}
              />
            </div>
            <DataTable
              columns={[
                { key: "id", label: "Mã NV" },
                { key: "name", label: "Họ tên" },
                { key: "station", label: "Điểm thuê" },
                { key: "phone", label: "Điện thoại" },
                { key: "totalHandovers", label: "Số lượt giao/nhận" },
                {
                  key: "rating",
                  label: "Đánh giá",
                  render: (val) => (
                    <span style={{ color: "#f59e0b", fontWeight: 600 }}>⭐ {val}</span>
                  ),
                },
                {
                  key: "actions",
                  label: "Thao tác",
                  render: (_, row) => (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: "13px", padding: "6px 12px" }}
                        onClick={(e) => handleEdit(row, e)}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: "13px", padding: "6px 12px", color: "#ef4444" }}
                        onClick={(e) => handleDelete(row, e)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  ),
                },
              ]}
              data={mockStaff}
              onRowClick={handleRowClick}
            />
          </div>
        )}

        {/* Reports Tab */}
        {tab === "reports" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              <div className="card" style={{ padding: "20px" }}>
                <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Thống kê theo giờ cao điểm</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { time: "07:00 - 09:00", percent: 85 },
                    { time: "12:00 - 14:00", percent: 62 },
                    { time: "17:00 - 19:00", percent: 93 },
                    { time: "20:00 - 22:00", percent: 45 },
                  ].map((slot, idx) => (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "14px" }}>{slot.time}</span>
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>{slot.percent}%</span>
                      </div>
                      <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: slot.percent + "%",
                            height: "100%",
                            background: "var(--primary-500)",
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: "20px" }}>
                <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Dự báo nhu cầu (AI)</h3>
                <div style={{ fontSize: "14px", lineHeight: "1.8", color: "var(--text-secondary)" }}>
                  <p>📈 <strong>Dự đoán:</strong> Nhu cầu thuê xe sẽ tăng 23% vào cuối tuần</p>
                  <p>🚗 <strong>Đề xuất:</strong> Bổ sung 8 xe tại điểm Quận 1 và Quận 7</p>
                  <p>⚡ <strong>Cảnh báo:</strong> Pin trung bình đội xe giảm 5%, cần lên lịch sạc định kỳ</p>
                  <p>👥 <strong>Nhân sự:</strong> Cần thêm 2 nhân viên ca chiều tại Quận 3</p>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ marginTop: 0, color: "var(--primary-700)" }}>Xuất báo cáo</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <button className="btn btn-ghost">📊 Báo cáo doanh thu</button>
                <button className="btn btn-ghost">📈 Báo cáo sử dụng xe</button>
                <button className="btn btn-ghost">👥 Báo cáo khách hàng</button>
                <button className="btn btn-ghost">⚙️ Báo cáo bảo trì</button>
              </div>
            </div>
          </>
        )}
          </div>
        </div>
      </div>

      {/* Detail/Edit Modal */}
      <Modal
        isOpen={isModalOpen && modalMode !== "delete"}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "edit" ? "Chỉnh sửa" : "Chi tiết"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              {modalMode === "edit" ? "Hủy" : "Đóng"}
            </button>
            {modalMode === "edit" && (
              <button className="btn btn-primary" onClick={handleSave}>
                💾 Lưu thay đổi
              </button>
            )}
          </>
        }
      >
        {selectedItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {modalMode === "edit" ? (
              // Edit mode - show form inputs
              <>
                {Object.entries(selectedItem).map(([key, value]) => (
                  <div key={key}>
                    <label className="label" style={{ textTransform: "capitalize" }}>
                      {key}
                    </label>
                    <input
                      className="input"
                      defaultValue={String(value)}
                      style={{ marginTop: "4px" }}
                      onChange={(e) => setSelectedItem({ ...selectedItem, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </>
            ) : (
              // View mode - show readonly data
              <>
                {Object.entries(selectedItem).map(([key, value]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{key}:</span>
                    <span style={{ color: "var(--text-secondary)" }}>{String(value)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isModalOpen && modalMode === "delete"}
        onClose={() => setIsModalOpen(false)}
        title="Xác nhận xóa"
        maxWidth={500}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
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
        {selectedItem && (
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
              {Object.entries(selectedItem).slice(0, 4).map(([key, value]) => (
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


