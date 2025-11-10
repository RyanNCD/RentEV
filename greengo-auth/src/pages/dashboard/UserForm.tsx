import { useState, useEffect } from "react";
import { type IUser, type IRole } from "../../types";
import "./VehicleForm.css"; // Reuse CSS
import { translateRole } from "../../utils/roleTranslations";

type Props = Readonly<{
  initialData: IUser | null;
  roles: IRole[];
  onSave: (userData: any) => void;
  onClose: () => void;
  loading: boolean;
}>;

export default function UserForm({ initialData, roles, onSave, onClose, loading }: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    identityCard: "",
    driverLicense: "",
    roleId: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        password: "", // Không hiển thị password khi sửa
        identityCard: initialData.identityCard || "",
        driverLicense: initialData.driverLicense || "",
        roleId: initialData.roleId || "",
      });
    } else {
      // Set default role to Customer
      const customerRole = roles.find(r => r.roleName?.toLowerCase() === "customer");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        identityCard: "",
        driverLicense: "",
        roleId: customerRole?.roleId || "",
      });
    }
  }, [initialData, roles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave: any = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      identityCard: formData.identityCard,
      driverLicense: formData.driverLicense,
      roleId: formData.roleId,
    };

    // Chỉ gửi password nếu là thêm mới hoặc có nhập password mới
    if (!initialData || formData.password) {
      dataToSave.passwordHash = formData.password;
    }

    onSave(dataToSave);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>{initialData ? "Cập nhật Người dùng" : "Thêm Người dùng mới"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Họ tên *</label>
            <input 
              name="fullName" 
              value={formData.fullName} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              disabled={!!initialData} // Không cho sửa email
            />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input 
              name="phone" 
              type="tel" 
              value={formData.phone} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label>{initialData ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu *"}</label>
            <input 
              name="password" 
              type="password" 
              value={formData.password} 
              onChange={handleChange} 
              required={!initialData}
            />
          </div>
          <div className="form-group">
            <label>CMND/CCCD</label>
            <input 
              name="identityCard" 
              value={formData.identityCard} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label>Bằng lái xe</label>
            <input 
              name="driverLicense" 
              value={formData.driverLicense} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label>Quyền *</label>
            <select 
              name="roleId" 
              value={formData.roleId} 
              onChange={handleChange} 
              required
            >
              {roles.map(role => (
                <option key={role.roleId} value={role.roleId}>
                  {translateRole(role.roleName)}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

