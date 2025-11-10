import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getReturnRentals, returnRental, type Rental, type VehicleConditionCheck } from "../services/rental";
import "./return.css";

export default function ReturnPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [conditionCheck, setConditionCheck] = useState<VehicleConditionCheck>({
    imageUrls: [],
    note: "",
    description: ""
  });
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const data = await getReturnRentals();
      setRentals(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách trả xe");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    
    setUploading(true);
    const imageUrls: string[] = [];
    
    // TODO: Upload images to server and get URLs
    // For now, we'll use a placeholder - you'll need to implement image upload
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        imageUrls.push(result);
        if (imageUrls.length === files.length) {
          setConditionCheck({ ...conditionCheck, imageUrls });
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReturn = async () => {
    if (!selectedRental) return;
    
    // Bắt buộc phải có ảnh khi trả xe
    if (conditionCheck.imageUrls.length === 0) {
      alert("Vui lòng upload ít nhất một ảnh tình trạng xe trước khi nhận lại xe");
      return;
    }

    if (!conditionCheck.note || conditionCheck.note.trim() === "") {
      alert("Vui lòng nhập ghi chú về tình trạng xe");
      return;
    }

    try {
      await returnRental(selectedRental.rentalId, conditionCheck);
      alert("Nhận xe thành công!");
      setShowReturnForm(false);
      setSelectedRental(null);
      setConditionCheck({ imageUrls: [], note: "", description: "" });
      loadRentals();
    } catch (err: any) {
      alert(err.response?.data?.message || "Nhận xe thất bại");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  if (loading) {
    return <div className="return-container">Đang tải...</div>;
  }

  return (
    <div className="return-container">
      <div className="return-header">
        <h1>Quản lý trả xe</h1>
        <Link to="/dashboard" className="btn btn--secondary" style={{ textDecoration: "none" }}>
          ← Quay lại
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="return-table-container">
        <table className="return-table">
          <thead>
            <tr>
              <th>Mã thuê</th>
              <th>Khách hàng</th>
              <th>Xe</th>
              <th>Trạm trả</th>
              <th>Thời gian bắt đầu</th>
              <th>Thời gian kết thúc</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rentals.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center">
                  Không có đơn thuê nào cần trả xe
                </td>
              </tr>
            ) : (
              rentals.map((rental) => (
                <tr key={rental.rentalId}>
                  <td>{rental.rentalId.substring(0, 8)}...</td>
                  <td>{rental.userId.substring(0, 8)}...</td>
                  <td>{rental.vehicleId.substring(0, 8)}...</td>
                  <td>{rental.returnStationId?.substring(0, 8) || "N/A"}...</td>
                  <td>{formatDate(rental.startTime)}</td>
                  <td>{formatDate(rental.endTime)}</td>
                  <td>
                    <span className={`status-badge status-${rental.status.toLowerCase()}`}>
                      {rental.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={() => {
                        setSelectedRental(rental);
                        setShowReturnForm(true);
                      }}
                    >
                      Nhận xe
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showReturnForm && selectedRental && (
        <div className="modal-overlay" onClick={() => setShowReturnForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Nhận xe - Kiểm tra tình trạng (Bắt buộc)</h2>
            <div className="warning-box">
              <strong>⚠️ Lưu ý:</strong> Bắt buộc phải kiểm tra và ghi nhận tình trạng xe trước khi nhận lại xe từ khách hàng.
            </div>
            <div className="form-group">
              <label>
                Upload ảnh tình trạng xe: <span className="required">*</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={uploading}
                required
              />
              {conditionCheck.imageUrls.length > 0 && (
                <div className="image-preview">
                  {conditionCheck.imageUrls.map((url, index) => (
                    <img key={index} src={url} alt={`Preview ${index + 1}`} className="preview-image" />
                  ))}
                </div>
              )}
              {conditionCheck.imageUrls.length === 0 && (
                <p className="error-text">Vui lòng upload ít nhất một ảnh</p>
              )}
            </div>
            <div className="form-group">
              <label>
                Ghi chú về tình trạng xe: <span className="required">*</span>
              </label>
              <textarea
                value={conditionCheck.note}
                onChange={(e) => setConditionCheck({ ...conditionCheck, note: e.target.value })}
                rows={3}
                placeholder="Ghi chú về tình trạng xe (bắt buộc)..."
                required
              />
              {(!conditionCheck.note || conditionCheck.note.trim() === "") && (
                <p className="error-text">Vui lòng nhập ghi chú</p>
              )}
            </div>
            <div className="form-group">
              <label>Mô tả chi tiết:</label>
              <textarea
                value={conditionCheck.description}
                onChange={(e) => setConditionCheck({ ...conditionCheck, description: e.target.value })}
                rows={3}
                placeholder="Mô tả chi tiết tình trạng xe..."
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn btn--secondary"
                onClick={() => {
                  setShowReturnForm(false);
                  setSelectedRental(null);
                  setConditionCheck({ imageUrls: [], note: "", description: "" });
                }}
              >
                Hủy
              </button>
              <button
                className="btn btn--primary"
                onClick={handleReturn}
                disabled={
                  uploading ||
                  conditionCheck.imageUrls.length === 0 ||
                  !conditionCheck.note ||
                  conditionCheck.note.trim() === ""
                }
              >
                {uploading ? "Đang upload..." : "Xác nhận nhận xe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
