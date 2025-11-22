// File: src/components/dashboard/StationForm.tsx (Bản fix)

import { useState, useEffect } from "react";
import { type IStation } from "../../types";
// (Dùng chung CSS với Form Xe cho lẹ)
import "./VehicleForm.css"; 

type Props = Readonly<{
  initialData: IStation | null; 
  onSave: (stationData: any) => void;
  onClose: () => void;
  loading: boolean;
}>;

export default function StationForm({ initialData, onSave, onClose, loading }: Props) {
  // === SỬA LẠI STATE (Thêm lat/long) ===
  const [formData, setFormData] = useState({
    stationName: "", // Sửa 'name' -> 'stationName'
    address: "",
    latitude: 0, // Thêm
    longitude: 0, // Thêm
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        stationName: initialData.stationName,
        address: initialData.address,
        latitude: initialData.latitude,
        longitude: initialData.longitude,
      });
    } else {
      // Reset form
      setFormData({ stationName: "", address: "", latitude: 0, longitude: 0 });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Gửi data đã convert về number
    onSave({
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{initialData ? "Cập nhật Trạm" : "Thêm Trạm mới"}</h2>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} id="station-form">
            {/* === SỬA LẠI INPUT === */}
            <div className="form-group">
              <label>Tên trạm</label>
              <input name="stationName" value={formData.stationName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Địa chỉ chi tiết</label>
              <textarea name="address" value={formData.address} onChange={handleChange} required rows={3} />
            </div>
            
            {/* === THÊM 2 INPUT MỚI === */}
            <div className="form-group">
              <label>Vĩ độ (Latitude)</label>
              <input name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Kinh độ (Longitude)</label>
              <input name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} required />
            </div>
            {/* === HẾT SỬA === */}
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
            Hủy
          </button>
          <button type="submit" form="station-form" disabled={loading} className="btn-primary">
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}