// File: src/components/dashboard/VehicleForm.tsx

import { useState, useEffect } from "react";
import { type IVehicle, type IStation } from "../../types";
import { getAllStations } from "../../services/station";
import { uploadVehicleImage } from "../../services/upload";
import "./VehicleForm.css";

type Props = Readonly<{
  initialData: IVehicle | null; 
  onSave: (vehicleData: any) => void;
  onClose: () => void;
  loading: boolean;
}>;

export default function VehicleForm({ initialData, onSave, onClose, loading }: Props) {
  const [stations, setStations] = useState<IStation[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    stationId: "",
    vehicleName: "",
    vehicleType: "",
    batteryCapacity: "",
    licensePlate: "",
    status: "Available",
    pricePerDay: "",
    description: "",
    seatingCapacity: "",
    utilities: "",
    numberOfRenters: "0",
    imageUrl: "",
  });

  // Load stations
  useEffect(() => {
    const loadStations = async () => {
      try {
        const data = await getAllStations();
        console.log("Loaded stations:", data);
        setStations(data || []);
      } catch (err) {
        console.error("Không thể tải danh sách trạm", err);
        setStations([]);
      }
    };
    loadStations();
  }, []);

  // Load initial data - wait for stations to load first
  useEffect(() => {
    if (stations.length === 0 && !initialData) {
      // Reset form if no stations loaded yet and no initial data
      return;
    }

    if (initialData) {
      // Ensure stationId is converted to string for proper binding
      const stationIdValue = initialData.stationId ? String(initialData.stationId) : "";
      console.log("Setting form data with stationId:", stationIdValue, "Available stations:", stations.map(s => s.stationId));
      
      setFormData({
        stationId: stationIdValue,
        vehicleName: initialData.vehicleName || "",
        vehicleType: initialData.vehicleType || "",
        batteryCapacity: initialData.batteryCapacity?.toString() || "",
        licensePlate: initialData.licensePlate || "",
        status: initialData.status || "Available",
        pricePerDay: initialData.pricePerDay?.toString() || "",
        description: initialData.description || "",
        seatingCapacity: initialData.seatingCapacity?.toString() || "",
        utilities: initialData.utilities || "",
        numberOfRenters: initialData.numberOfRenters?.toString() || "0",
        imageUrl: initialData.imageUrl || "",
      });
    } else {
      setFormData({
        stationId: "",
        vehicleName: "",
        vehicleType: "",
        batteryCapacity: "",
        licensePlate: "",
        status: "Available",
        pricePerDay: "",
        description: "",
        seatingCapacity: "",
        utilities: "",
        numberOfRenters: "0",
        imageUrl: "",
      });
    }
  }, [initialData, stations]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validation function matching backend constraints
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // StationId: Required
    if (!formData.stationId) {
      newErrors.stationId = "Vui lòng chọn trạm";
    }

    // VehicleName: Required, MaxLength(100)
    if (!formData.vehicleName.trim()) {
      newErrors.vehicleName = "Tên xe là bắt buộc";
    } else if (formData.vehicleName.length > 100) {
      newErrors.vehicleName = "Tên xe không được vượt quá 100 ký tự";
    }

    // VehicleType: Required, MaxLength(50)
    if (!formData.vehicleType.trim()) {
      newErrors.vehicleType = "Loại xe là bắt buộc";
    } else if (formData.vehicleType.length > 50) {
      newErrors.vehicleType = "Loại xe không được vượt quá 50 ký tự";
    }

    // LicensePlate: Optional, MaxLength(20)
    if (formData.licensePlate && formData.licensePlate.length > 20) {
      newErrors.licensePlate = "Biển số không được vượt quá 20 ký tự";
    }

    // Status: Optional (default "Available"), MaxLength(50)
    if (formData.status && formData.status.length > 50) {
      newErrors.status = "Trạng thái không được vượt quá 50 ký tự";
    }

    // PricePerDay: Optional, but if provided, must be valid decimal
    if (formData.pricePerDay) {
      const price = parseFloat(formData.pricePerDay);
      if (isNaN(price) || price < 0) {
        newErrors.pricePerDay = "Giá phải là số dương";
      } else {
        // Check decimal precision (max 2 decimal places)
        const decimalPart = formData.pricePerDay.split('.')[1];
        if (decimalPart && decimalPart.length > 2) {
          newErrors.pricePerDay = "Giá chỉ được có tối đa 2 chữ số sau dấu phẩy";
        }
      }
    }

    // BatteryCapacity: Optional, but if provided, must be non-negative integer
    if (formData.batteryCapacity) {
      const capacity = parseInt(formData.batteryCapacity);
      if (isNaN(capacity) || capacity < 0) {
        newErrors.batteryCapacity = "Dung lượng pin phải là số nguyên không âm";
      }
    }

    // SeatingCapacity: Optional, but if provided, must be positive integer
    if (formData.seatingCapacity) {
      const capacity = parseInt(formData.seatingCapacity);
      if (isNaN(capacity) || capacity < 1) {
        newErrors.seatingCapacity = "Số chỗ ngồi phải lớn hơn 0";
      }
    }

    // Description: Optional, MaxLength(500)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Mô tả không được vượt quá 500 ký tự";
    }

    // Utilities: Optional, MaxLength(200)
    if (formData.utilities && formData.utilities.length > 200) {
      newErrors.utilities = "Tiện ích không được vượt quá 200 ký tự";
    }

    // NumberOfRenters is calculated automatically from reservations, no validation needed

    // ImageUrl: Optional, MaxLength(500)
    if (formData.imageUrl && formData.imageUrl.length > 500) {
      newErrors.imageUrl = "URL hình ảnh không được vượt quá 500 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const vehicleId = initialData?.vehicleId;
      const response = await uploadVehicleImage(file, vehicleId);
      setFormData(prev => ({ ...prev, imageUrl: response.url }));
    } catch (err) {
      alert("Upload ảnh thất bại!");
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    // Format pricePerDay to 2 decimal places if provided
    let pricePerDayValue: number | null = null;
    if (formData.pricePerDay) {
      const price = parseFloat(formData.pricePerDay);
      if (!isNaN(price)) {
        // Round to 2 decimal places to match backend decimal(10,2)
        pricePerDayValue = Math.round(price * 100) / 100;
      }
    }

    const dataToSave = {
      stationId: formData.stationId,
      vehicleName: formData.vehicleName.trim(),
      vehicleType: formData.vehicleType.trim(),
      batteryCapacity: formData.batteryCapacity ? parseInt(formData.batteryCapacity) : null,
      licensePlate: formData.licensePlate.trim() || null,
      status: formData.status || "Available",
      pricePerDay: pricePerDayValue,
      description: formData.description.trim() || null,
      seatingCapacity: formData.seatingCapacity ? parseInt(formData.seatingCapacity) : null,
      utilities: formData.utilities.trim() || null,
      // numberOfRenters is calculated automatically from reservations, not sent to backend
      imageUrl: formData.imageUrl.trim() || null,
    };
    onSave(dataToSave);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{initialData ? "Cập nhật Xe" : "Thêm Xe mới"}</h2>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} id="vehicle-form">
            <div className="form-grid">
              {/* Trạm - Full width */}
              <div className="form-group full-width">
                <label>Trạm *</label>
                <select 
                  name="stationId" 
                  value={formData.stationId} 
                  onChange={handleChange} 
                  required
                  className={errors.stationId ? "error" : ""}
                >
                  <option value="">-- Chọn trạm --</option>
                  {stations.length === 0 ? (
                    <option value="" disabled>Đang tải danh sách trạm...</option>
                  ) : (
                    stations.map(station => {
                      const stationIdStr = String(station.stationId || "");
                      return (
                        <option key={stationIdStr} value={stationIdStr}>
                          {station.stationName} - {station.address}
                        </option>
                      );
                    })
                  )}
                </select>
                {stations.length === 0 && (
                  <p style={{ marginTop: "4px", fontSize: "12px", color: "#666" }}>
                    Đang tải danh sách trạm...
                  </p>
                )}
                {formData.stationId && stations.length > 0 && !stations.find(s => String(s.stationId) === formData.stationId) && (
                  <p style={{ marginTop: "4px", fontSize: "12px", color: "#ff9800" }}>
                    ⚠️ Trạm đã chọn không có trong danh sách. Vui lòng chọn lại.
                  </p>
                )}
                {errors.stationId && (
                  <span className="error-message">
                    {errors.stationId}
                  </span>
                )}
              </div>

              {/* Cột 1 */}
              <div className="form-group">
                <label>Tên xe *</label>
                <input 
                  name="vehicleName" 
                  value={formData.vehicleName} 
                  onChange={handleChange} 
                  maxLength={100}
                  required
                  className={errors.vehicleName ? "error" : ""}
                />
                {errors.vehicleName && (
                  <span className="error-message">
                    {errors.vehicleName}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Loại xe *</label>
                <input 
                  name="vehicleType" 
                  value={formData.vehicleType} 
                  onChange={handleChange} 
                  placeholder="Ví dụ: Xe máy điện, Xe đạp điện..."
                  maxLength={50}
                  required
                  className={errors.vehicleType ? "error" : ""}
                />
                {errors.vehicleType && (
                  <span className="error-message">
                    {errors.vehicleType}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Biển số</label>
                <input 
                  name="licensePlate" 
                  value={formData.licensePlate} 
                  onChange={handleChange} 
                  maxLength={20}
                  className={errors.licensePlate ? "error" : ""}
                />
                {errors.licensePlate && (
                  <span className="error-message">
                    {errors.licensePlate}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Dung lượng pin (kWh)</label>
                <input 
                  name="batteryCapacity" 
                  type="number" 
                  value={formData.batteryCapacity} 
                  onChange={handleChange} 
                  min="0"
                  step="1"
                  className={errors.batteryCapacity ? "error" : ""}
                />
                {errors.batteryCapacity && (
                  <span className="error-message">
                    {errors.batteryCapacity}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Số chỗ ngồi</label>
                <input 
                  name="seatingCapacity" 
                  type="number" 
                  value={formData.seatingCapacity} 
                  onChange={handleChange} 
                  min="1"
                  step="1"
                  className={errors.seatingCapacity ? "error" : ""}
                />
                {errors.seatingCapacity && (
                  <span className="error-message">
                    {errors.seatingCapacity}
                  </span>
                )}
              </div>

              {/* Cột 2 */}
              <div className="form-group">
                <label>Trạng thái</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className={errors.status ? "error" : ""}
                  disabled={initialData && initialData.status?.toUpperCase() === "RENTED"}
                >
                  {!initialData ? (
                    // When creating new vehicle, default to Available
                    <>
                      <option value="Available">Có sẵn</option>
                    </>
                  ) : initialData.status?.toUpperCase() === "AVAILABLE" ? (
                    // When updating Available vehicle, only allow Maintenance or Unavailable
                    <>
                      <option value="Available">Có sẵn</option>
                      <option value="Maintenance">Bảo trì</option>
                      <option value="Unavailable">Không khả dụng</option>
                    </>
                  ) : (
                    // For other statuses, show all options
                    <>
                      <option value="Available">Có sẵn</option>
                      <option value="Rented">Đang thuê</option>
                      <option value="Reserved">Đã đặt</option>
                      <option value="Maintenance">Bảo trì</option>
                      <option value="Unavailable">Không khả dụng</option>
                    </>
                  )}
                </select>
                {initialData && initialData.status?.toUpperCase() === "RENTED" && (
                  <p style={{ marginTop: "4px", fontSize: "12px", color: "#ff9800" }}>
                    ⚠️ Không thể thay đổi trạng thái xe đang được thuê
                  </p>
                )}
                {initialData && initialData.status?.toUpperCase() === "AVAILABLE" && (
                  <p style={{ marginTop: "4px", fontSize: "12px", color: "#666" }}>
                    Xe có sẵn chỉ có thể chuyển sang Bảo trì hoặc Không khả dụng
                  </p>
                )}
                {errors.status && (
                  <span className="error-message">
                    {errors.status}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Giá / ngày (VNĐ)</label>
                <input 
                  name="pricePerDay" 
                  type="number" 
                  value={formData.pricePerDay} 
                  onChange={handleChange} 
                  min="0"
                  step="0.01"
                  className={errors.pricePerDay ? "error" : ""}
                />
                {errors.pricePerDay && (
                  <span className="error-message">
                    {errors.pricePerDay}
                  </span>
                )}
              </div>

              {/* NumberOfRenters is calculated automatically from reservations, not editable */}
              {initialData && (
                <div className="form-group">
                  <label>Số người đã thuê</label>
                  <input 
                    type="number" 
                    value={initialData.numberOfRenters || 0} 
                    readOnly
                    disabled
                    style={{ 
                      backgroundColor: "#f5f5f5", 
                      cursor: "not-allowed",
                      color: "#666"
                    }}
                  />
                  <p style={{ marginTop: "4px", fontSize: "12px", color: "#666" }}>
                    (Tự động tính từ số lượng booking)
                  </p>
                </div>
              )}

              {/* Full width fields */}
              <div className="form-group full-width">
                <label>Mô tả</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={3}
                  maxLength={500}
                  className={errors.description ? "error" : ""}
                />
                <div className="char-count">
                  {formData.description.length}/500 ký tự
                </div>
                {errors.description && (
                  <span className="error-message">
                    {errors.description}
                  </span>
                )}
              </div>

              <div className="form-group full-width">
                <label>Tiện ích</label>
                <input 
                  name="utilities" 
                  value={formData.utilities} 
                  onChange={handleChange} 
                  placeholder="Ví dụ: Giao xe tận nơi, Miễn thế chấp..."
                  maxLength={200}
                  className={errors.utilities ? "error" : ""}
                />
                <div className="char-count">
                  {formData.utilities.length}/200 ký tự
                </div>
                {errors.utilities && (
                  <span className="error-message">
                    {errors.utilities}
                  </span>
                )}
              </div>

              <div className="form-group full-width">
                <label>Hình ảnh</label>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <p style={{ marginTop: "8px", color: "#666" }}>Đang upload...</p>}
                {formData.imageUrl && (
                  <div style={{ marginTop: "10px" }}>
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover", borderRadius: "4px" }}
                    />
                    {formData.imageUrl.length > 500 && (
                      <p style={{ fontSize: "12px", color: "#ff9800", marginTop: "4px" }}>
                        ⚠️ URL hình ảnh quá dài
                      </p>
                    )}
                  </div>
                )}
                {errors.imageUrl && (
                  <span className="error-message">
                    {errors.imageUrl}
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading || uploadingImage} 
            className="btn-secondary"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            form="vehicle-form"
            disabled={loading || uploadingImage} 
            className="btn-primary"
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
