// File: src/lib/pages/dashboard/StaffManagement.tsx (File mới)

import { useEffect, useState } from "react";
import { getStaffList, revokeStaffRole } from "../../services/admin";
import { type IUser } from "../../types";
import { translateRole } from "../../utils/roleTranslations";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await getStaffList(); // Gọi API - đã trả về IUser[] trực tiếp
        setStaffList(data || []);
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách nhân viên");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const handleRevokeRole = async (staffId: string) => {
    if (window.confirm("Bạn chắc chắn muốn thu hồi quyền Staff của nhân viên này? Nhân viên sẽ bị giáng xuống Customer.")) {
      try {
        await revokeStaffRole(staffId);
        // Refresh danh sách sau khi thu hồi quyền
        const updatedList = await getStaffList();
        setStaffList(updatedList || []);
      } catch (err: any) {
        alert(err.message || "Thu hồi quyền thất bại!");
      }
    }
  };

  if (loading) return <div>Đang tải danh sách...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <h1>Quản lý Nhân viên (Staff)</h1>
      {/* (Ông thêm cái nút "Thêm mới" ở đây sau nhé) */}
      
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Họ tên</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Email</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Role</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((staff) => (
            <tr key={staff.userId}>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{staff.fullName}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{staff.email}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{translateRole(staff.roleName || staff.role)}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
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
    </div>
  );
}