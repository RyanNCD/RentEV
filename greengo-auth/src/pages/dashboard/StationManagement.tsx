// File: src/lib/pages/dashboard/StationManagement.tsx (Bản fix)

import { useEffect, useState } from "react";
import { type IStation } from "../../types";
import { getAllStations, createStation, updateStation, deleteStation } from "../../services/station";
import StationForm from "../dashboard/StationForm";
import "./StationManagement.css";

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

  if (loading) {
    return <div className="station-management-loading">Đang tải danh sách trạm...</div>;
  }

  if (error) {
    return <div className="station-management-error">{error}</div>;
  }

  return (
    <div className="station-management-container">
      <div className="station-management-header">
        <h1>Quản lý Trạm (Admin)</h1>
        <button onClick={handleCreate} className="btn btn--primary">
          + Thêm trạm mới
        </button>
      </div>

      {stations.length === 0 ? (
        <div className="station-management-empty">
          Chưa có trạm nào.
        </div>
      ) : (
        <div className="station-management-table-container">
          <table className="station-management-table">
            <thead>
              <tr>
                <th>Tên trạm</th>
                <th>Địa chỉ</th>
                <th>Vĩ độ (Lat)</th>
                <th>Kinh độ (Long)</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {stations.map(station => (
                <tr key={station.stationId}>
                  <td>{station.stationName}</td>
                  <td>{station.address}</td>
                  <td>{station.latitude}</td>
                  <td>{station.longitude}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleEdit(station)} 
                        className="btn btn--sm btn--primary"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(station.stationId)} 
                        className="btn btn--sm btn--danger"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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