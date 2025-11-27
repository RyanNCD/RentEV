import { useEffect, useState } from "react";
import { getCustomerUsers, createUser, updateUser, banUser, updateUserRole, getRoles, type IRole } from "../../services/admin";
import { type IUser } from "../../types";
import UserForm from "./UserForm";
import { translateRole } from "../../utils/roleTranslations";
import "./UserManagement.css";

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

  if (loading) {
    return <div className="user-management-loading">Đang tải danh sách...</div>;
  }

  if (error) {
    return <div className="user-management-error">{error}</div>;
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1>Quản lý Người dùng</h1>
        <button onClick={handleCreate} className="btn btn--primary">
          + Thêm người dùng mới
        </button>
      </div>
      
      {users.length === 0 ? (
        <div className="user-management-empty">
          Chưa có người dùng nào.
        </div>
      ) : (
        <div className="user-management-table-container">
          <table className="user-management-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Quyền</th>
                <th style={{ textAlign: "center" }}>Blacklist</th>
                <th style={{ textAlign: "center" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || "-"}</td>
                  <td>
                    {editingRole?.userId === user.userId ? (
                      <select
                        value={editingRole.roleId}
                        onChange={(e) => setEditingRole({ userId: user.userId, roleId: e.target.value })}
                        onBlur={() => handleRoleChange(user.userId, editingRole.roleId)}
                        className="role-select"
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
                        className="role-badge"
                      >
                        {translateRole(user.roleName || user.role)}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {user.isBlacklisted ? (
                      <span className="blacklist-badge">
                        Đã cấm
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBanUser(user.userId)}
                        className="btn btn--sm btn--danger"
                      >
                        Cấm
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(user)}
                        className="btn btn--sm btn--primary"
                      >
                        Sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
