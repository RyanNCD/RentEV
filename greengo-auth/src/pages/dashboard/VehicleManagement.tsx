// File: src/lib/pages/dashboard/VehicleManagement.tsx

import { useEffect, useState } from "react";
import { type IVehicle } from "../../types";
import { getAllVehicles, createVehicle, updateVehicle, deleteVehicle } from "../../services/vehicle";
import VehicleForm from "./VehicleForm";

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<IVehicle | null>(null);
  const [saving, setSaving] = useState(false);

  // Hàm tải dữ liệu
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await getAllVehicles();
      setVehicles(data);
    } catch (err) {
      setError("Không thể tải danh sách xe");
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu khi component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Mở modal (Thêm mới)
  const handleCreate = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  // Mở modal (Sửa)
  const handleEdit = (vehicle: IVehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  // Hàm Xóa
  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn chắc chắn muốn XÓA xe này?")) {
      try {
        await deleteVehicle(id);
        setVehicles(prev => prev.filter(v => v.vehicleId !== id)); // Xóa khỏi UI
      } catch (err) {
        alert("Xóa thất bại!");
      }
    }
  };

  // Hàm Lưu (từ Modal)
  const handleSave = async (vehicleData: any) => {
    try {
      setSaving(true);
      if (selectedVehicle) {
        // --- SỬA ---
        const updated = await updateVehicle(selectedVehicle.vehicleId, vehicleData);
        setVehicles(prev => prev.map(v => v.vehicleId === selectedVehicle.vehicleId ? updated : v));
      } else {
        // --- THÊM MỚI ---
        const created = await createVehicle(vehicleData);
        setVehicles(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert("Lưu thất bại!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Đang tải danh sách xe...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1>Quản lý Xe</h1>
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
          + Thêm xe mới
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Chưa có xe nào. Hãy thêm xe mới!
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Tên xe</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Loại</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Biển số</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Giá/ngày</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Trạng thái</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr key={vehicle.vehicleId} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{vehicle.vehicleName}</td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{vehicle.vehicleType}</td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{vehicle.licensePlate}</td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{vehicle.pricePerDay?.toLocaleString('vi-VN')} VNĐ</td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  <span style={{ 
                    padding: "4px 8px", 
                    borderRadius: "4px", 
                    backgroundColor: vehicle.status === "Available" ? "#d4edda" : "#f8d7da",
                    color: vehicle.status === "Available" ? "#155724" : "#721c24"
                  }}>
                    {vehicle.status}
                  </span>
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>
                  <button 
                    onClick={() => handleEdit(vehicle)} 
                    style={{ 
                      marginRight: "8px", 
                      padding: "6px 12px", 
                      backgroundColor: "#007bff", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px", 
                      cursor: "pointer"
                    }}
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(vehicle.vehicleId)} 
                    style={{ 
                      padding: "6px 12px", 
                      backgroundColor: "#dc3545", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px", 
                      cursor: "pointer"
                    }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <VehicleForm 
          initialData={selectedVehicle}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
          loading={saving}
        />
      )}
    </div>
  );
}