// File: src/lib/pages/dashboard/StaffManagement.tsx (File mới)

import { useEffect, useMemo, useState } from "react";
import { getStaffList, revokeStaffRole, getStations, updateStaffStation, getRoles, createUser, updateUser } from "../../services/admin";
import { type IUser, type IStation, type IRole } from "../../types";
import { translateRole } from "../../utils/roleTranslations";
import "./StaffManagement.css";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<IStation[]>([]);
  const [updatingStationId, setUpdatingStationId] = useState<string | null>(null);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingStaff, setEditingStaff] = useState<IUser | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    identityCard: "",
    driverLicense: "",
    stationId: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [staffData, stationData, roleData] = await Promise.all([
          getStaffList(),
          getStations(),
          getRoles()
        ]);
        setStaffList(Array.isArray(staffData) ? staffData : []);
        setStations(Array.isArray(stationData) ? stationData : []);
        setRoles(Array.isArray(roleData) ? roleData : []);
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách nhân viên");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.id = "staff-modal-autofill";
    styleTag.innerHTML = `
      .staff-modal input,
      .staff-modal select {
        font-size: 14px;
        border: 1px solid #dce0e4;
      }
      .staff-modal input:-webkit-autofill,
      .staff-modal input:-webkit-autofill:hover,
      .staff-modal input:-webkit-autofill:focus,
      .staff-modal input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0px 1000px #fff inset;
        box-shadow: 0 0 0px 1000px #fff inset;
        border: 1px solid #dce0e4;
        font-size: 14px;
      }
    `;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  const staffRoleId = useMemo(() => {
    const candidate = roles.find(
      (role) => role.roleName?.toLowerCase().includes("staff")
    );
    return candidate?.roleId ?? "";
  }, [roles]);

  const refreshStaffList = async () => {
    const data = await getStaffList();
    setStaffList(Array.isArray(data) ? data : []);
  };

  const handleRevokeRole = async (staffId: string) => {
    if (window.confirm("Bạn chắc chắn muốn thu hồi quyền Staff của nhân viên này? Nhân viên sẽ bị giáng xuống Customer.")) {
      try {
        await revokeStaffRole(staffId);
        // Refresh danh sách sau khi thu hồi quyền
        await refreshStaffList();
      } catch (err: any) {
        alert(err.message || "Thu hồi quyền thất bại!");
      }
    }
  };

  const handleStationAssign = async (staffId: string, stationId: string) => {
    setUpdatingStationId(staffId);
    try {
      const updated = await updateStaffStation(staffId, stationId || null);
      setStaffList(prev => prev.map(staff => staff.userId === staffId ? updated : staff));
    } catch (err: any) {
      alert(err.message || "Cập nhật trạm thất bại!");
    } finally {
      setUpdatingStationId(null);
    }
  };

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      identityCard: "",
      driverLicense: "",
      stationId: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staff: IUser) => {
    setEditingStaff(staff);
    setFormData({
      fullName: staff.fullName || "",
      email: staff.email || "",
      phone: staff.phone || "",
      password: "",
      identityCard: staff.identityCard || "",
      driverLicense: staff.driverLicense || "",
      stationId: staff.stationId || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
    setSaving(false);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!staffRoleId) {
      alert("Không tìm thấy role StaffStation. Vui lòng kiểm tra cấu hình vai trò.");
      return;
    }
    setSaving(true);
    try {
      if (editingStaff) {
        const payload: any = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          identityCard: formData.identityCard,
          driverLicense: formData.driverLicense,
          roleId: editingStaff.roleId || staffRoleId,
          stationId: formData.stationId || null,
        };
        if (formData.password.trim()) {
          payload.passwordHash = formData.password;
        }
        await updateUser(editingStaff.userId, payload);
      } else {
        await createUser({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          passwordHash: formData.password,
          identityCard: formData.identityCard,
          driverLicense: formData.driverLicense,
          roleId: staffRoleId,
          stationId: formData.stationId || null,
        });
      }
      await refreshStaffList();
      closeModal();
    } catch (err: any) {
      alert(err.message || "Lưu nhân viên thất bại!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Đang tải danh sách...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Quản lý Nhân viên (Staff)</h1>
        <button
          onClick={openCreateModal}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          + Thêm staff
        </button>
      </div>
      
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Họ tên</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Email</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Trạm phụ trách</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Role</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((staff) => (
            <tr key={staff.userId}>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{staff.fullName}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{staff.email}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                <select
                  value={staff.stationId || ""}
                  onChange={(e) => handleStationAssign(staff.userId, e.target.value)}
                  disabled={updatingStationId === staff.userId}
                  style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ddd", minWidth: "180px" }}
                >
                  <option value="">-- Chưa gán trạm --</option>
                  {stations.map(station => (
                    <option key={station.stationId} value={station.stationId}>
                      {station.stationName}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{translateRole(staff.roleName || staff.role)}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                <button 
                  onClick={() => openEditModal(staff)}
                  style={{ 
                    padding: "6px 12px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginRight: "8px"
                  }}
                >
                  Sửa
                </button>
                <button 
                  onClick={() => handleRevokeRole(staff.userId)} 
                  style={{ 
                    padding: "6px 12px",
                    backgroundColor: "#ff9800",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Thu hồi quyền Staff
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle} className="staff-modal">
            <h2 style={{ marginBottom: "16px" }}>
              {editingStaff ? "Chỉnh sửa Staff" : "Thêm Staff mới"}
            </h2>
            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={twoColStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Họ tên *</label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Số điện thoại</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="090..."
                  />
                </div>
              </div>

              <div style={twoColStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingStaff}
                    style={{ ...inputStyle, backgroundColor: editingStaff ? "#f4f4f4" : "#fff" }}
                    placeholder="staff@greengo.com"
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    {editingStaff ? "Mật khẩu mới (tuỳ chọn)" : "Mật khẩu *"}
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingStaff}
                    style={inputStyle}
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div style={twoColStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>CMND/CCCD</label>
                  <input
                    name="identityCard"
                    value={formData.identityCard}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Bằng lái xe</label>
                  <input
                    name="driverLicense"
                    value={formData.driverLicense}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Trạm phụ trách</label>
                <select
                  name="stationId"
                  value={formData.stationId}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="">-- Chưa gán trạm --</option>
                  {stations.map(station => (
                    <option key={station.stationId} value={station.stationId}>
                      {station.stationName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button type="button" onClick={closeModal} style={secondaryButtonStyle} disabled={saving}>
                  Hủy
                </button>
                <button type="submit" style={primaryButtonStyle} disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  background: "#fff",
  padding: "24px",
  borderRadius: "8px",
  width: "100%",
  maxWidth: "480px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "#4CAF50",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "#e0e0e0",
  color: "#333",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const formGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "14px",
  color: "#333",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid #dce0e4",
  backgroundColor: "#fff",
  fontSize: "14px",
  transition: "border 0.2s ease",
  boxSizing: "border-box",
};

const twoColStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};