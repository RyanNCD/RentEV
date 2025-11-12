// File: src/pages/dashboard/VehicleManagement.tsx

import { useEffect, useState } from "react";
import { type IVehicle } from "../../types";
import { getVehiclesPaged, createVehicle, updateVehicle, deleteVehicle, type PagedVehicleResult } from "../../services/vehicle";
import { getAllStations, type IStation } from "../../services/station";
import VehicleForm from "./VehicleForm";
import "./VehicleManagement.css";

// Việt hóa trạng thái
const getStatusLabel = (status: string | null | undefined): string => {
  if (!status) return "Không xác định";
  const statusUpper = status.toUpperCase();
  switch (statusUpper) {
    case "AVAILABLE":
      return "Có sẵn";
    case "RENTED":
      return "Đang thuê";
    case "RESERVED":
      return "Đã đặt";
    case "MAINTENANCE":
      return "Bảo trì";
    case "UNAVAILABLE":
      return "Không khả dụng";
    default:
      return status;
  }
};

const getStatusBadgeClass = (status: string | null | undefined): string => {
  if (!status) return "status-unknown";
  const statusUpper = status.toUpperCase();
  switch (statusUpper) {
    case "AVAILABLE":
      return "status-available";
    case "RENTED":
      return "status-rented";
    case "RESERVED":
      return "status-reserved";
    case "MAINTENANCE":
      return "status-maintenance";
    case "UNAVAILABLE":
      return "status-unavailable";
    default:
      return "status-unknown";
  }
};

// Check if vehicle can be edited (not rented)
const canEditVehicle = (status: string | null | undefined): boolean => {
  if (!status) return true;
  const statusUpper = status.toUpperCase();
  return statusUpper !== "RENTED";
};

// Check if vehicle can be deleted (not rented)
const canDeleteVehicle = (status: string | null | undefined): boolean => {
  if (!status) return true;
  const statusUpper = status.toUpperCase();
  return statusUpper !== "RENTED";
};

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  
  // Filters
  const [stationFilter, setStationFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  
  // Stations for filter dropdown
  const [stations, setStations] = useState<IStation[]>([]);
  
  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<IVehicle | null>(null);
  const [saving, setSaving] = useState(false);

  // Load stations
  useEffect(() => {
    const loadStations = async () => {
      try {
        const data = await getAllStations();
        setStations(data || []);
      } catch (err) {
        console.error("Không thể tải danh sách trạm", err);
      }
    };
    loadStations();
  }, []);

  // Hàm tải dữ liệu
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        stationId: stationFilter || undefined,
        status: statusFilter || undefined,
        search: searchFilter || undefined,
      };
      const result: PagedVehicleResult = await getVehiclesPaged(params);
      setVehicles(result.items);
      setPagination({
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        hasPreviousPage: result.hasPreviousPage,
        hasNextPage: result.hasNextPage,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách xe");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu khi filters hoặc pagination thay đổi
  useEffect(() => {
    fetchVehicles();
  }, [pagination.page, pagination.pageSize, stationFilter, statusFilter, searchFilter]);

  // Reset filters
  const handleResetFilters = () => {
    setStationFilter("");
    setStatusFilter("");
    setSearchFilter("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Mở modal (Thêm mới)
  const handleCreate = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  // Mở modal (Sửa)
  const handleEdit = (vehicle: IVehicle) => {
    if (!canEditVehicle(vehicle.status)) {
      alert("Không thể cập nhật xe đang được thuê.");
      return;
    }
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  // Hàm Xóa
  const handleDelete = async (id: string, status: string | null | undefined) => {
    if (!canDeleteVehicle(status)) {
      alert("Không thể xóa xe đang được thuê.");
      return;
    }
    
    if (window.confirm("Bạn chắc chắn muốn XÓA xe này?")) {
      try {
        await deleteVehicle(id);
        fetchVehicles(); // Reload data
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || "Xóa thất bại!";
        alert(errorMessage);
        console.error(err);
      }
    }
  };

  // Hàm Lưu (từ Modal)
  const handleSave = async (vehicleData: any) => {
    try {
      setSaving(true);
      setError(null);
      if (selectedVehicle) {
        // --- SỬA ---
        await updateVehicle(selectedVehicle.vehicleId, vehicleData);
      } else {
        // --- THÊM MỚI ---
        await createVehicle(vehicleData);
      }
      setIsModalOpen(false);
      fetchVehicles(); // Reload data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Lưu thất bại!";
      setError(errorMessage);
      alert(errorMessage);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Change page
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Change page size
  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, page: 1, pageSize: newPageSize }));
  };

  if (loading && vehicles.length === 0) {
    return <div className="vehicle-management-loading">Đang tải danh sách xe...</div>;
  }

  return (
    <div className="vehicle-management-container">
      <div className="vehicle-management-header">
        <h1>Quản lý Xe</h1>
        <button onClick={handleCreate} className="btn btn--primary">
          + Thêm xe mới
        </button>
      </div>

      {error && <div className="vehicle-management-error">{error}</div>}

      {/* Filters */}
      <div className="vehicle-management-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tên xe, loại, biển số..."
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            />
          </div>

          <div className="filter-group">
            <label>Trạm</label>
            <select
              value={stationFilter}
              onChange={(e) => {
                setStationFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">Tất cả</option>
              {stations.map(station => (
                <option key={station.stationId} value={station.stationId}>
                  {station.stationName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Tình trạng</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">Tất cả</option>
              <option value="Available">Có sẵn</option>
              <option value="Rented">Đang thuê</option>
              <option value="Reserved">Đã đặt</option>
              <option value="Maintenance">Bảo trì</option>
              <option value="Unavailable">Không khả dụng</option>
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={handleResetFilters} className="btn btn--secondary">
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {vehicles.length === 0 ? (
        <div className="vehicle-management-empty">
          Không tìm thấy xe nào.
        </div>
      ) : (
        <>
          <div className="vehicle-management-table-container">
            <table className="vehicle-management-table">
              <thead>
                <tr>
                  <th>Tên xe</th>
                  <th>Loại</th>
                  <th>Biển số</th>
                  <th>Trạm</th>
                  <th>Giá/ngày</th>
                  <th>Số người đã thuê</th>
                  <th>Tình trạng</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(vehicle => {
                  const station = stations.find(s => s.stationId === vehicle.stationId);
                  const canEdit = canEditVehicle(vehicle.status);
                  const canDelete = canDeleteVehicle(vehicle.status);
                  
                  return (
                    <tr key={vehicle.vehicleId}>
                      <td>{vehicle.vehicleName}</td>
                      <td>{vehicle.vehicleType}</td>
                      <td>{vehicle.licensePlate || "-"}</td>
                      <td>{station?.stationName || "-"}</td>
                      <td>{vehicle.pricePerDay?.toLocaleString('vi-VN')} VNĐ</td>
                      <td>{vehicle.numberOfRenters || 0}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(vehicle.status)}`}>
                          {getStatusLabel(vehicle.status)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(vehicle)}
                            disabled={!canEdit}
                            className={`btn btn--sm btn--primary ${!canEdit ? "btn--disabled" : ""}`}
                            title={!canEdit ? "Không thể cập nhật xe đang được thuê" : ""}
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.vehicleId, vehicle.status)}
                            disabled={!canDelete}
                            className={`btn btn--sm btn--danger ${!canDelete ? "btn--disabled" : ""}`}
                            title={!canDelete ? "Không thể xóa xe đang được thuê" : ""}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="vehicle-management-pagination">
            <div className="pagination-info">
              Hiển thị {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} xe
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage}
                className="btn btn--sm btn--secondary"
              >
                Trước
              </button>
              <span className="pagination-page">
                Trang {pagination.page} / {pagination.totalPages || 1}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="btn btn--sm btn--secondary"
              >
                Sau
              </button>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="page-size-select"
              >
                <option value="10">10 / trang</option>
                <option value="20">20 / trang</option>
                <option value="50">50 / trang</option>
                <option value="100">100 / trang</option>
              </select>
            </div>
          </div>
        </>
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
