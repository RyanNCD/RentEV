import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCheckinRentals, checkinRental, type Rental, type VehicleConditionCheck } from "../services/rental";
import { formatVietnamDate } from "../utils/dateTime";
import "./checkin.css";

export default function CheckinPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
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
      const data = await getCheckinRentals();
      setRentals(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách thuê xe");
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
      // Convert to base64 or upload to server
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

  const handleCheckin = async () => {
    if (!selectedRental) return;
    
    if (conditionCheck.imageUrls.length === 0) {
      alert("Vui lòng upload ít nhất một ảnh tình trạng xe");
      return;
    }

    try {
      await checkinRental(selectedRental.rentalId, conditionCheck);
      alert("Checkin thành công!");
      setShowCheckinForm(false);
      setSelectedRental(null);
      setConditionCheck({ imageUrls: [], note: "", description: "" });
      loadRentals();
    } catch (err: any) {
      alert(err.response?.data?.message || "Checkin thất bại");
    }
  };

  const formatDate = (dateString?: string) => {
    return formatVietnamDate(dateString);
  };

  if (loading) {
    return <div className="checkin-container">Đang tải...</div>;
  }

  return (
    <div className="checkin-container">
      <div className="checkin-header">
        <h1>Quản lý giao xe</h1>
        <Link to="/dashboard" className="btn btn--secondary" style={{ textDecoration: "none" }}>
          ← Quay lại
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="checkin-table-container">
        <table className="checkin-table">
          <thead>
            <tr>
              <th>Mã thuê</th>
              <th>Khách hàng</th>
              <th>Xe</th>
              <th>Trạm giao</th>
              <th>Thời gian bắt đầu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rentals.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  Không có đơn thuê nào cần giao xe
                </td>
              </tr>
            ) : (
              rentals.map((rental) => (
                <tr key={rental.rentalId}>
                  <td>{rental.rentalId.substring(0, 8)}...</td>
                  <td>{rental.userId.substring(0, 8)}...</td>
                  <td>{rental.vehicleId.substring(0, 8)}...</td>
                  <td>{rental.pickupStationId.substring(0, 8)}...</td>
                  <td>{formatDate(rental.startTime)}</td>
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
                        setShowCheckinForm(true);
                      }}
                    >
                      Giao xe
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCheckinForm && selectedRental && (
        <div className="modal-overlay" onClick={() => setShowCheckinForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Giao xe - Kiểm tra tình trạng</h2>
            <div className="form-group">
              <label>Upload ảnh tình trạng xe:</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={uploading}
              />
              {conditionCheck.imageUrls.length > 0 && (
                <div className="image-preview">
                  {conditionCheck.imageUrls.map((url, index) => (
                    <img key={index} src={url} alt={`Preview ${index + 1}`} className="preview-image" />
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Ghi chú:</label>
              <textarea
                value={conditionCheck.note}
                onChange={(e) => setConditionCheck({ ...conditionCheck, note: e.target.value })}
                rows={3}
                placeholder="Ghi chú về tình trạng xe..."
              />
            </div>
            <div className="form-group">
              <label>Mô tả:</label>
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
                  setShowCheckinForm(false);
                  setSelectedRental(null);
                  setConditionCheck({ imageUrls: [], note: "", description: "" });
                }}
              >
                Hủy
              </button>
              <button
                className="btn btn--primary"
                onClick={handleCheckin}
                disabled={uploading || conditionCheck.imageUrls.length === 0}
              >
                {uploading ? "Đang upload..." : "Xác nhận giao xe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
