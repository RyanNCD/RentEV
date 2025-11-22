// File: src/lib/pages/dashboard/StaffManagement.tsx (File mới)

import { useEffect, useState } from "react";
import { getStaffList, revokeStaffRole } from "../../services/admin";
import { type IUser } from "../../types";
import { translateRole } from "../../utils/roleTranslations";
import "./StaffManagement.css";

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

  if (loading) {
    return <div className="staff-management-loading">Đang tải danh sách...</div>;
  }

  if (error) {
    return <div className="staff-management-error">{error}</div>;
  }

  return (
    <div className="staff-management-container">
      <div className="staff-management-header">
        <h1>Quản lý Nhân viên (Staff)</h1>
      </div>
      
      {staffList.length === 0 ? (
        <div className="staff-management-empty">
          Chưa có nhân viên nào.
        </div>
      ) : (
        <div className="staff-management-table-container">
          <table className="staff-management-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Role</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.userId}>
                  <td>{staff.fullName}</td>
                  <td>{staff.email}</td>
                  <td>{translateRole(staff.roleName || staff.role)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleRevokeRole(staff.userId)} 
                        className="btn btn--sm btn--warning"
                      >
                        Thu hồi quyền Staff
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}