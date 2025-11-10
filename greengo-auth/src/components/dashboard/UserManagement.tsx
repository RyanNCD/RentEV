// File: src/lib/pages/dashboard/UserManagement.tsx
import { useEffect, useState } from "react";
import { getUsers, deleteUser } from "../../services/admin";
import { type IUser } from "../../types";

export default function UserManagement() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers(); // Gọi API
        setUsers(response.users);
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách user");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    if (window.confirm("Bạn chắc chắn muốn xóa user này?")) {
      try {
        await deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
      } catch (err) {
        alert("Xóa thất bại!");
      }
    }
  };

  if (loading) return <div>Đang tải danh sách...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <h1>Quản lý Khách hàng (User)</h1>
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
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{user.fullName}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{user.email}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{user.role}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                <button onClick={() => handleDelete(user.id)} style={{ color: "red" }}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}