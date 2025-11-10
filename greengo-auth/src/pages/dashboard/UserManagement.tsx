import { useEffect, useState } from "react";
import { getCustomerUsers, createUser, updateUser, banUser, updateUserRole, getRoles, type IRole } from "../../services/admin";
import { type IUser } from "../../types";
import UserForm from "./UserForm";
import { translateRole } from "../../utils/roleTranslations";

export default function UserManagement() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<{ userId: string; roleId: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersData, rolesData] = await Promise.all([
          getCustomerUsers(), // Chỉ lấy danh sách khách hàng
          getRoles()
        ]);
        setUsers(usersData);
        setRoles(rolesData);
      } catch (err: any) {
        setError(err.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: IUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSave = async (userData: any) => {
    try {
      setSaving(true);
      if (selectedUser) {
        // Sửa
        const updated = await updateUser(selectedUser.userId, userData);
        setUsers(users.map(u => u.userId === selectedUser.userId ? updated : u));
      } else {
        // Thêm mới
        const created = await createUser(userData);
        setUsers([created, ...users]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Lưu thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = window.prompt("Nhập lý do cấm user này:");
    if (!reason || reason.trim() === "") {
      return;
    }

    if (window.confirm("Bạn chắc chắn muốn cấm user này? User sẽ bị giáng xuống Customer và thêm vào blacklist.")) {
      try {
        const updated = await banUser(userId, reason);
        setUsers(users.map(u => u.userId === userId ? updated : u));
      } catch (err) {
        alert("Cấm user thất bại!");
      }
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      const updated = await updateUserRole(userId, roleId);
      setUsers(users.map(u => u.userId === userId ? updated : u));
      setEditingRole(null);
    } catch (err) {
      alert("Cập nhật quyền thất bại!");
    }
  };

  if (loading) return <div style={{ padding: "24px" }}>Đang tải danh sách...</div>;
  if (error) return <div style={{ padding: "24px", color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1>Quản lý Người dùng</h1>
        <button 
          onClick={handleCreate} 
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#4CAF50", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          + Thêm người dùng mới
        </button>
      </div>
      
      {users.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Chưa có người dùng nào.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Họ tên</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Email</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Số điện thoại</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Quyền</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>Blacklist</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userId} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{user.fullName}</td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{user.email}</td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{user.phone || "-"}</td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  {editingRole?.userId === user.userId ? (
                    <select
                      value={editingRole.roleId}
                      onChange={(e) => setEditingRole({ userId: user.userId, roleId: e.target.value })}
                      onBlur={() => handleRoleChange(user.userId, editingRole.roleId)}
                      style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ddd" }}
                      autoFocus
                    >
                      {roles.map(role => (
                        <option key={role.roleId} value={role.roleId}>
                          {translateRole(role.roleName)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span 
                      onClick={() => setEditingRole({ userId: user.userId, roleId: user.roleId })}
                      style={{ cursor: "pointer", padding: "4px 8px", borderRadius: "4px", backgroundColor: "#e9ecef" }}
                    >
                      {translateRole(user.roleName || user.role)}
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>
                  {user.isBlacklisted ? (
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      backgroundColor: "#dc3545", 
                      color: "white",
                      fontSize: "12px"
                    }}>
                      Đã cấm
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBanUser(user.userId)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "4px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: "#dc3545",
                        color: "white",
                        fontSize: "12px"
                      }}
                    >
                      Cấm
                    </button>
                  )}
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>
                  <button
                    onClick={() => handleEdit(user)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      marginRight: "8px"
                    }}
                  >
                    Sửa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <UserForm 
          initialData={selectedUser}
          roles={roles}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
          loading={saving}
        />
      )}
    </div>
  );
}
