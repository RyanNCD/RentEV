import { useEffect, useState } from "react";
import { type IRentalHistoryItem, type IStation, type IFeedback } from "../../types";
import { getRentalsPaged, type RentalListParams, checkInRental, checkOutRental, getRentalById, getFeedbacksByRental } from "../../services/rental";
import { uploadRentalImage, getRentalImages, type RentalImageItem } from "../../services/upload";
import { getAllStations } from "../../services/station";
import { useAuth } from "../../context/AuthContext";
import "../checkin.css";

type ModalType = "checkin" | "checkout" | "detail" | null;

export default function CheckinManagement() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<IRentalHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is staff (can perform check-in/check-out)
  // Staff role is "STAFF" (mapped from "StaffStation" in backend)
  const isStaff = user?.role === "STAFF";
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [stationFilter, setStationFilter] = useState<string>("");
  
  // Stations list
  const [stations, setStations] = useState<IStation[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedRental, setSelectedRental] = useState<IRentalHistoryItem | null>(null);
  const [rentalImages, setRentalImages] = useState<RentalImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  
  // Checkin form state
  const [files, setFiles] = useState<File[]>([]);
  const [imageType, setImageType] = useState<string>("Checkin");
  const [description, setDescription] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [deliveryCondition, setDeliveryCondition] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Checkout form state
  const [returnCondition, setReturnCondition] = useState<string>("");
  const [returnFiles, setReturnFiles] = useState<File[]>([]);
  const [returnNote, setReturnNote] = useState<string>("");

  const loadRentals = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: RentalListParams = {
        page,
        pageSize,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        stationId: stationFilter || undefined,
      };
      
      // Always use pagination to get consistent format
      const response = await getRentalsPaged(params);
      setRentals(response.items);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      console.error("Error loading rentals:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách đơn thuê.");
    } finally {
      setLoading(false);
    }
  };

  const loadStations = async () => {
    setLoadingStations(true);
    try {
      const data = await getAllStations();
      setStations(data);
    } catch (err: any) {
      console.error("Error loading stations:", err);
    } finally {
      setLoadingStations(false);
    }
  };

  useEffect(() => {
    loadRentals();
  }, [page, pageSize, statusFilter, searchQuery, startDate, endDate, stationFilter]);

  useEffect(() => {
    loadStations();
  }, []);

  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    loadRentals();
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setStationFilter("");
    setPage(1);
  };

  const openModal = async (type: ModalType, rental: IRentalHistoryItem) => {
    setModalType(type);
    setModalError(null);
    
    // Reset form states
    setFiles([]);
    setDescription("");
    setNote("");
    setDeliveryCondition("");
    setReturnCondition("");
    setReturnFiles([]);
    setReturnNote("");
    setImageType("Checkin");
    
    // For detail modal, reload rental from API to get latest contract
    if (type === "detail") {
      try {
        const updatedRental = await getRentalById(rental.rentalId);
        setSelectedRental(updatedRental);
        await loadRentalImages(rental.rentalId);
        // Load feedbacks
        setLoadingFeedbacks(true);
        try {
          const fbs = await getFeedbacksByRental(rental.rentalId);
          setFeedbacks(fbs);
        } finally {
          setLoadingFeedbacks(false);
        }
      } catch (err: any) {
        console.error("Error loading rental detail:", err);
        setModalError("Không thể tải thông tin chi tiết đơn thuê.");
        // Fallback to original rental if API fails
        setSelectedRental(rental);
        await loadRentalImages(rental.rentalId);
        // Try load feedbacks even if rental reload fails
        try {
          const fbs = await getFeedbacksByRental(rental.rentalId);
          setFeedbacks(fbs);
        } catch {}
      }
    } else {
      // For check-in/check-out, use rental from list (no need to reload)
      setSelectedRental(rental);
      // Load images if viewing details
      if (type === "checkin" || type === "checkout") {
        await loadRentalImages(rental.rentalId);
      }
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRental(null);
    setRentalImages([]);
    setModalError(null);
  };

  const loadRentalImages = async (rentalId: string) => {
    setLoadingImages(true);
    try {
      const images = await getRentalImages(rentalId);
      setRentalImages(images);
    } catch (err: any) {
      console.error("Error loading images:", err);
      setModalError("Không thể tải ảnh bàn giao.");
    } finally {
      setLoadingImages(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isReturn = false) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      if (isReturn) {
        setReturnFiles(fileArray);
      } else {
        setFiles(fileArray);
      }
    }
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRental) return;

    if (files.length === 0) {
      setModalError("Vui lòng chọn ít nhất một ảnh bàn giao.");
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      // Upload images
      const uploadPromises = files.map(file =>
        uploadRentalImage(file, selectedRental.rentalId, imageType, description, note)
      );
      await Promise.all(uploadPromises);

      // Perform checkin
      await checkInRental(selectedRental.rentalId, deliveryCondition || undefined);
      
      // Reload rentals
      await loadRentals();
      closeModal();
    } catch (err: any) {
      console.error("Error during checkin:", err);
      setModalError(err.response?.data?.message || "Bàn giao xe thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRental) return;

    if (returnFiles.length === 0) {
      setModalError("Vui lòng chọn ít nhất một ảnh tình trạng xe khi nhận lại.");
      return;
    }

    if (!returnCondition.trim()) {
      setModalError("Vui lòng nhập tình trạng xe khi nhận lại.");
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      // Upload return images
      const uploadPromises = returnFiles.map(file =>
        uploadRentalImage(file, selectedRental.rentalId, "Checkout", returnCondition, returnNote)
      );
      await Promise.all(uploadPromises);

      // Perform checkout
      await checkOutRental(selectedRental.rentalId);
      
      // Reload rentals
      await loadRentals();
      closeModal();
    } catch (err: any) {
      console.error("Error during checkout:", err);
      setModalError(err.response?.data?.message || "Nhận xe thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price?: number | null) => {
    if (!price) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusBadgeClass = (status: string) => {
    const upperStatus = status.toUpperCase();
    if (upperStatus === "PAID" || upperStatus === "BOOKING") return "status-paid";
    if (upperStatus === "IN_PROGRESS") return "status-in-progress";
    if (upperStatus === "COMPLETED") return "status-completed";
    if (upperStatus === "CANCELLED" || upperStatus === "CANCELED") return "status-cancelled";
    return "status-pending";
  };

  const getStatusLabel = (status: string) => {
    const upperStatus = status.toUpperCase();
    const map: Record<string, string> = {
      BOOKING: "Đã đặt",
      PENDING: "Chờ thanh toán",
      PAID: "Đã thanh toán",
      IN_PROGRESS: "Đang thuê",
      COMPLETED: "Hoàn tất",
      CANCELLED: "Đã hủy",
      CANCELED: "Đã hủy",
    };
    return map[upperStatus] || status;
  };

  const canCheckin = (status: string) => {
    const upperStatus = status.toUpperCase();
    return upperStatus === "PAID" || upperStatus === "BOOKING";
  };

  const canCheckout = (status: string) => {
    return status.toUpperCase() === "IN_PROGRESS";
  };

  const getImageTypeLabel = (type: string) => {
    const typeUpper = type?.toUpperCase() || "";
    const typeMap: Record<string, string> = {
      "CHECKIN": "Bàn giao",
      "CHECKOUT": "Nhận xe",
      "CONDITION": "Tình trạng",
      "DOCUMENT": "Giấy tờ",
      "BÀN GIAO": "Bàn giao",
      "NHẬN XE": "Nhận xe",
      "TÌNH TRẠNG": "Tình trạng",
      "GIẤY TỜ": "Giấy tờ",
    };
    return typeMap[typeUpper] || type || "Không xác định";
  };

  return (
    <div className="checkin-container">
      <div className="checkin-header">
        <h1>Quản lý bàn giao/nhận xe</h1>
        {!isStaff && (
          <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>
            (Chế độ xem: Bạn chỉ có thể xem thông tin, không thể thực hiện bàn giao/nhận xe)
          </p>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="checkin-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Tìm kiếm</label>
            <input style={{width: "90%", padding: "0.5rem", borderRadius: "0.5rem",
             border: "1px solid #ccc", fontSize: "0.875rem", fontWeight: "400", color: "#374151", outline: "none", height: "auto"}}
              type="text"
              placeholder="Tên xe, khách hàng, mã đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="filter-group">
            <label>Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="BOOKING">Đã đặt</option>
              <option value="IN_PROGRESS">Đang thuê</option>
              <option value="COMPLETED">Hoàn tất</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Trạm</label>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              disabled={loadingStations}
            >
              <option value="">Tất cả trạm</option>
              {stations.map((station) => (
                <option key={station.stationId} value={station.stationId}>
                  {station.stationName}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button onClick={handleSearch} className="btn btn--primary">
              Tìm kiếm
            </button>
            <button onClick={handleResetFilters} className="btn btn--secondary">
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="checkin-table-container">
        {loading ? (
          <div className="text-center">Đang tải...</div>
        ) : rentals.length === 0 ? (
          <div className="text-center">Không có đơn thuê nào.</div>
        ) : (
          <>
            <table className="checkin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Xe</th>
                  <th>Trạm lấy</th>
                  <th>Trạm trả</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Thời gian kết thúc</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => (
                  <tr key={rental.rentalId}>
                    <td>
                      <span className="rental-id">
                        {rental.rentalId.substring(0, 8)}...
                      </span>
                    </td>
                    <td>{rental.userName || "N/A"}</td>
                    <td>{rental.vehicleName || "N/A"}</td>
                    <td>{rental.pickupStationName || "N/A"}</td>
                    <td>{rental.returnStationName || "N/A"}</td>
                    <td>{formatDate(rental.startTime)}</td>
                    <td>{formatDate(rental.endTime)}</td>
                    <td>{formatPrice(rental.totalCost)}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(rental.status)}`}>
                        {getStatusLabel(rental.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {/* Chỉ Staff mới được bàn giao/nhận xe, Admin chỉ xem */}
                        {isStaff && canCheckin(rental.status) && (
                          <button
                            onClick={() => openModal("checkin", rental)}
                            className="btn btn--sm btn--success"
                          >
                            Bàn giao
                          </button>
                        )}
                        {isStaff && canCheckout(rental.status) && (
                          <button
                            onClick={() => openModal("checkout", rental)}
                            className="btn btn--sm btn--warning"
                          >
                            Nhận xe
                          </button>
                        )}
                        <button
                          onClick={() => openModal("detail", rental)}
                          className="btn btn--sm btn--info"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} của {totalCount} đơn
              </div>
              <div className="pagination-controls">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn--sm"
                >
                  Trước
                </button>
                <span className="pagination-page">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn btn--sm"
                >
                  Sau
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="page-size-select"
                >
                  <option value="5">5 / trang</option>
                  <option value="10">10 / trang</option>
                  <option value="20">20 / trang</option>
                  <option value="50">50 / trang</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Checkin Modal */}
      {modalType === "checkin" && selectedRental && (
        <Modal
          title="Bàn giao xe"
          onClose={closeModal}
          onSubmit={handleCheckin}
          submitting={submitting}
          error={modalError}
        >
          <div className="modal-rental-info">
            <p><strong>Mã đơn:</strong> {selectedRental.rentalId}</p>
            <p><strong>Xe:</strong> {selectedRental.vehicleName}</p>
            <p><strong>Khách hàng:</strong> {selectedRental.userName}</p>
            <p><strong>Thời gian:</strong> {formatDate(selectedRental.startTime)} - {formatDate(selectedRental.endTime)}</p>
          </div>
          
          <div className="form-group">
            <label>Loại ảnh *</label>
            <select value={imageType} onChange={(e) => setImageType(e.target.value)}>
              <option value="Checkin">Bàn giao</option>
              <option value="Checkout">Nhận xe</option>
              <option value="Condition">Tình trạng</option>
              <option value="Document">Giấy tờ</option>
            </select>
          </div>

          <div className="form-group">
            <label>Mô tả tình trạng</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả tình trạng xe khi giao..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm nếu có..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Tình trạng khi giao *</label>
            <textarea
              value={deliveryCondition}
              onChange={(e) => setDeliveryCondition(e.target.value)}
              placeholder="Ví dụ: Pin 80%, ngoại thất sạch, nội thất sạch..."
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label>Ảnh bàn giao * (ít nhất 1 ảnh)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, false)}
            />
            {files.length > 0 && (
              <div className="image-preview">
                {files.map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="preview-image"
                  />
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Checkout Modal */}
      {modalType === "checkout" && selectedRental && (
        <Modal
          title="Nhận xe"
          onClose={closeModal}
          onSubmit={handleCheckout}
          submitting={submitting}
          error={modalError}
        >
          <div className="modal-rental-info">
            <p><strong>Mã đơn:</strong> {selectedRental.rentalId}</p>
            <p><strong>Xe:</strong> {selectedRental.vehicleName}</p>
            <p><strong>Khách hàng:</strong> {selectedRental.userName}</p>
            <p><strong>Thời gian:</strong> {formatDate(selectedRental.startTime)} - {formatDate(selectedRental.endTime)}</p>
          </div>

          <div className="form-group">
            <label>Tình trạng xe khi nhận lại *</label>
            <textarea
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
              placeholder="Mô tả chi tiết tình trạng xe khi nhận lại (bắt buộc)..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="Ghi chú thêm nếu có..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Ảnh tình trạng xe * (ít nhất 1 ảnh)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, true)}
            />
            {returnFiles.length > 0 && (
              <div className="image-preview">
                {returnFiles.map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="preview-image"
                  />
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {modalType === "detail" && selectedRental && (
        <Modal
          title="Chi tiết đơn thuê"
          onClose={closeModal}
          onSubmit={null}
          submitting={false}
          error={null}
        >
          <div className="modal-rental-info">
            <div className="info-grid">
              <div className="info-item">
                <strong>Mã đơn:</strong>
                <span>{selectedRental.rentalId}</span>
              </div>
              <div className="info-item">
                <strong>Khách hàng:</strong>
                <span>{selectedRental.userName || "N/A"}</span>
              </div>
              <div className="info-item">
                <strong>Xe:</strong>
                <span>{selectedRental.vehicleName || "N/A"}</span>
              </div>
              <div className="info-item">
                <strong>Trạm lấy:</strong>
                <span>{selectedRental.pickupStationName || "N/A"}</span>
              </div>
              <div className="info-item">
                <strong>Trạm trả:</strong>
                <span>{selectedRental.returnStationName || "N/A"}</span>
              </div>
              <div className="info-item">
                <strong>Thời gian bắt đầu:</strong>
                <span>{formatDate(selectedRental.startTime)}</span>
              </div>
              <div className="info-item">
                <strong>Thời gian kết thúc:</strong>
                <span>{formatDate(selectedRental.endTime)}</span>
              </div>
              <div className="info-item">
                <strong>Tổng tiền:</strong>
                <span>{formatPrice(selectedRental.totalCost)}</span>
              </div>
              <div className="info-item">
                <strong>Trạng thái:</strong>
                <span className={`status-badge ${getStatusBadgeClass(selectedRental.status)}`}>
                  {getStatusLabel(selectedRental.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Contract Section */}
          {selectedRental.contract && (
            <div className="modal-contract-section" style={{ marginTop: "20px", padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>Thông tin hợp đồng</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Mã hợp đồng:</strong>
                  <span>{selectedRental.contract.contractId.substring(0, 8)}...</span>
                </div>
                <div className="info-item">
                  <strong>Ngày bắt đầu:</strong>
                  <span>{formatDate(selectedRental.contract.startDate)}</span>
                </div>
                <div className="info-item">
                  <strong>Ngày kết thúc:</strong>
                  <span>{selectedRental.contract.endDate ? formatDate(selectedRental.contract.endDate) : "N/A"}</span>
                </div>
                <div className="info-item">
                  <strong>Tổng tiền:</strong>
                  <span>{formatPrice(selectedRental.contract.totalAmount)}</span>
                </div>
                <div className="info-item">
                  <strong>Trạng thái hợp đồng:</strong>
                  <span className={`status-badge ${(selectedRental.contract.status?.toUpperCase() === "ACTIVE") ? "status-available" : "status-unknown"}`}>
                    {selectedRental.contract.status?.toUpperCase() === "ACTIVE" ? "Đang hiệu lực" : selectedRental.contract.status || "N/A"}
                  </span>
                </div>
                {selectedRental.contract.terms && (
                  <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                    <strong>Điều khoản:</strong>
                    <div style={{ marginTop: "8px", padding: "12px", backgroundColor: "white", borderRadius: "4px", whiteSpace: "pre-wrap" }}>
                      {selectedRental.contract.terms}
                    </div>
                  </div>
                )}
                {selectedRental.contract.createdAt && (
                  <div className="info-item">
                    <strong>Ngày tạo:</strong>
                    <span>{formatDate(selectedRental.contract.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="modal-feedback-section" style={{ marginTop: "20px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "18px", fontWeight: 600 }}>Đánh giá</h3>
            {loadingFeedbacks ? (
              <div className="text-center">Đang tải đánh giá...</div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center" style={{ color: "#666" }}>Chưa có đánh giá.</div>
            ) : (
              <div className="feedback-list" style={{ display: "grid", gap: "10px" }}>
                {feedbacks.map((fb) => (
                  <div key={fb.feedbackId} className="feedback-item" style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <strong>Đánh giá: {fb.rating ?? "-"}/5</strong>
                      {fb.createdAt && <span style={{ color: "#999", fontSize: 12 }}>{formatDate(fb.createdAt)}</span>}
                    </div>
                    {fb.comment && <div style={{ whiteSpace: "pre-wrap" }}>{fb.comment}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-images-section">
            <h3>Ảnh bàn giao/nhận xe</h3>
            {loadingImages ? (
              <div className="text-center">Đang tải ảnh...</div>
            ) : rentalImages.length === 0 ? (
              <div className="text-center">Chưa có ảnh nào.</div>
            ) : (
              <div className="images-grid">
                {rentalImages.map((img) => (
                  <div key={img.imageId} className="image-card">
                    <img src={img.imageUrl} alt={img.type} />
                    <div className="image-info">
                      <div><strong>Loại:</strong> {getImageTypeLabel(img.type)}</div>
                      {img.description && <div><strong>Mô tả:</strong> {img.description}</div>}
                      {img.note && <div><strong>Ghi chú:</strong> {img.note}</div>}
                      {img.createdAt && (
                        <div><strong>Ngày:</strong> {formatDate(img.createdAt)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// Modal Component
interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: ((e: React.FormEvent) => void) | null;
  submitting: boolean;
  error: string | null;
  children: React.ReactNode;
}

function Modal({ title, onClose, onSubmit, submitting, error, children }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={onSubmit || undefined}>
          {children}
          {onSubmit && (
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn--secondary" disabled={submitting}>
                Hủy
              </button>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          )}
          {!onSubmit && (
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn--primary">
                Đóng
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
