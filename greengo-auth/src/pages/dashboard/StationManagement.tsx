// File: src/lib/pages/dashboard/StationManagement.tsx (Bản fix)

import { useEffect, useState } from "react";
import { type IStation } from "../../types";
import { getAllStations, createStation, updateStation, deleteStation } from "../../services/station";
import StationForm from "../dashboard/StationForm";

export default function StationManagement() {
  const [stations, setStations] = useState<IStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<IStation | null>(null);
  const [saving, setSaving] = useState(false);

  // (fetchStations, handleCreate, handleEdit - giữ nguyên)
  const fetchStations = async () => {
    try {
      setLoading(true);
      const data = await getAllStations();
      setStations(data);
    } catch (err) {
      setError("Không thể tải danh sách trạm");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchStations(); }, []);
  const handleCreate = () => {
    setSelectedStation(null);
    setIsModalOpen(true);
  };
  const handleEdit = (station: IStation) => {
    setSelectedStation(station);
    setIsModalOpen(true);
  };

  // === SỬA HÀM DELETE (Dùng stationId) ===
  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn chắc chắn muốn XÓA trạm này?")) {
      try {
        await deleteStation(id);
        setStations(prev => prev.filter(s => s.stationId !== id)); // Sửa: id -> stationId
      } catch (err) {
        alert("Xóa thất bại!");
      }
    }
  };

  // === SỬA HÀM SAVE (Dùng stationId) ===
  const handleSave = async (stationData: any) => {
    try {
      setSaving(true);
      if (selectedStation) {
        // --- SỬA ---
        const updated = await updateStation(selectedStation.stationId, stationData); // Sửa: id -> stationId
        setStations(prev => prev.map(s => s.stationId === selectedStation.stationId ? updated : s)); // Sửa: id -> stationId
      } else {
        // --- THÊM MỚI ---
        const created = await createStation(stationData);
        setStations(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert("Lưu thất bại!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Đang tải danh sách trạm...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <h1>Quản lý Trạm (Admin)</h1>
      <button onClick={handleCreate} className="btn-primary" style={{ marginBottom: "1rem" }}>
        + Thêm trạm mới
      </button>

      {/* === SỬA LẠI BẢNG (TABLE) === */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Tên trạm</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Địa chỉ</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Vĩ độ (Lat)</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Kinh độ (Long)</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {stations.map(station => (
            <tr key={station.stationId}>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{station.stationName}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{station.address}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{station.latitude}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{station.longitude}</td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                <button onClick={() => handleEdit(station)} style={{ marginRight: "8px" }}>Sửa</button>
                <button onClick={() => handleDelete(station.stationId)} style={{ color: "red" }}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Form (Giữ nguyên) */}
      {isModalOpen && (
        <StationForm 
          initialData={selectedStation}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
          loading={saving}
        />
      )}
    </div>
  );
}