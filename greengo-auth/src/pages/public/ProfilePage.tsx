// File: src/lib/pages/public/ProfilePage.tsx (Bản mới với phân trang và modal chi tiết)

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserRentalHistoryPaged, getRentalById, getFeedbacksByRental, requestEarlyReturn, confirmReturn, type UserRentalListParams, type PagedRentalResult } from "../../services/rental";
import { getRentalImagesForCustomer, type RentalImageItem } from "../../services/upload";
import { type IRentalHistoryItem, type IFeedback } from "../../types";
import "../profile.css";
import "../checkin.css";

// Modal Component
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
          {children}
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn--primary">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<IRentalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal state
  const [selectedRental, setSelectedRental] = useState<IRentalHistoryItem | null>(null);
  const [rentalImages, setRentalImages] = useState<RentalImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: UserRentalListParams = {
        page,
        pageSize,
        search: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      
      const response = await getUserRentalHistoryPaged(params);
      setHistory(response.items);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      console.error("Error loading rental history:", err);
      setError(err.response?.data?.message || "Không thể tải lịch sử thuê xe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page, pageSize, searchQuery, startDate, endDate]);

  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    loadHistory();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const openDetailModal = async (rental: IRentalHistoryItem) => {
    try {
      // Reload rental from API to get latest contract
      const updatedRental = await getRentalById(rental.rentalId);
      setSelectedRental({
        ...updatedRental,
        penalties: updatedRental.penalties || []
      });
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
      setError("Không thể tải thông tin chi tiết đơn thuê.");
      // Fallback to original rental if API fails
      setSelectedRental({
        ...rental,
        penalties: rental.penalties || []
      });
      await loadRentalImages(rental.rentalId);
      // Try load feedbacks even if rental reload fails
      try {
        const fbs = await getFeedbacksByRental(rental.rentalId);
        setFeedbacks(fbs);
      } catch {}
    }
  };

  const closeModal = () => {
    setSelectedRental(null);
    setRentalImages([]);
    setFeedbacks([]);
  };

  const loadRentalImages = async (rentalId: string) => {
    setLoadingImages(true);
    try {
      const images = await getRentalImagesForCustomer(rentalId);
      setRentalImages(images);
    } catch (err: any) {
      console.error("Error loading images:", err);
    } finally {
      setLoadingImages(false);
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

  const getImageTypeLabel = (type: string) => {
    const typeUpper = type?.toUpperCase() || "";
    const typeMap: Record<string, string> = {
      "CHECKIN": "Bàn giao",
      "CHECKOUT": "Nhận xe",
      "CONDITION": "Tình trạng",
      "DOCUMENT": "Giấy tờ",
    };
    return typeMap[typeUpper] || type || "Không xác định";
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Hồ sơ của bạn</h1>
      <h3>Xin chào, {user?.fullName || user?.email}</h3>
      
      <hr style={{ margin: "2rem 0" }} />
      
      <h2>Lịch sử thuê xe</h2>

      {/* Filters */}
      <div className="checkin-filters" style={{ marginBottom: "20px" }}>
        <div className="filter-row">
          <div className="filter-group">
            <label>Tìm kiếm theo tên xe</label>
            <input
              type="text"
              placeholder="Nhập tên xe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={{ width: "90%", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #ccc", height: "24px" }}
            />
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

      {error && (
        <div className="error-message" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Đang tải lịch sử...</p>
      ) : history.length === 0 ? (
        <p>Bạn chưa có chuyến thuê nào đã thanh toán.</p>
      ) : (
        <>
          <div style={{ marginBottom: "20px" }}>
            {history.map((item) => {
            const start = item.startTime ? new Date(item.startTime) : null;
            const end = item.endTime ? new Date(item.endTime) : null;
            const dayRange = `${start ? start.toLocaleDateString("vi-VN") : "—"} - ${end ? end.toLocaleDateString("vi-VN") : "—"}`;
              const amount = item.totalCost && item.totalCost > 0 ? formatPrice(item.totalCost) : "—";
            const status = String(item.status || "").toUpperCase();

            return (
                <div key={item.rentalId} style={{
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                  padding: "16px",
                marginBottom: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                  background: "#fff",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <strong style={{ fontSize: 16, marginBottom: "8px" }}>{item.vehicleName || "Xe không rõ"}</strong>
                    <span style={{ color: "#666", fontSize: "14px", marginBottom: "4px" }}>Thời gian: {dayRange}</span>
                    <span style={{ color: "#666", fontSize: "14px" }}>
                      Trạng thái: <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 600, color: amount !== "N/A" ? "#111" : "#999", fontSize: "16px" }}>
                      {amount !== "N/A" ? amount : "Chưa xác định"}
                    </div>
                    {item.pricePerDaySnapshot && (
                      <div style={{ fontSize: "13px", color: "#6b7280" }}>
                        Giá áp dụng: {formatPrice(item.pricePerDaySnapshot)}
                      </div>
                    )}
                    {status === "IN_PROGRESS" && !item.earlyReturnRequested && (
                      <button
                        onClick={async () => {
                          if (window.confirm("Bạn có chắc chắn muốn yêu cầu trả xe sớm không?")) {
                            try {
                              await requestEarlyReturn(item.rentalId);
                              alert("Yêu cầu trả xe sớm đã được gửi thành công!");
                              await loadHistory();
                            } catch (err: any) {
                              alert(err.response?.data?.message || "Không thể gửi yêu cầu trả xe sớm.");
                            }
                          }
                        }}
                        className="btn btn--sm btn--warning"
                        style={{ padding: "8px 16px" }}
                      >
                        Yêu cầu trả xe sớm
                      </button>
                    )}
                    {status === "IN_PROGRESS" && item.earlyReturnRequested && (
                      <span style={{ 
                        padding: "6px 12px", 
                        background: "#d1fae5", 
                        color: "#065f46", 
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontWeight: "500"
                      }}>
                        ✓ Đã yêu cầu trả xe sớm
                      </span>
                    )}
                    {status === "IN_PROGRESS" && (
                      <button
                        onClick={async () => {
                          if (window.confirm("Bạn có chắc chắn muốn xác nhận trả xe không? Vui lòng đến trạm để hoàn tất thủ tục.")) {
                            try {
                              await confirmReturn(item.rentalId);
                              alert("Xác nhận trả xe thành công! Vui lòng đến trạm để hoàn tất thủ tục.");
                              await loadHistory();
                            } catch (err: any) {
                              alert(err.response?.data?.message || "Không thể xác nhận trả xe.");
                            }
                          }
                        }}
                        className="btn btn--sm btn--success"
                        style={{ padding: "8px 16px" }}
                      >
                        Xác nhận trả xe
                      </button>
                    )}
                    <button
                      onClick={() => openDetailModal(item)}
                      className="btn btn--sm btn--info"
                      style={{ padding: "8px 16px" }}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

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

      {/* Detail Modal */}
      {selectedRental && (
        <Modal title="Chi tiết đơn thuê" onClose={closeModal}>
          <div className="modal-rental-info">
            <div className="info-grid">
              <div className="info-item">
                <strong>Mã đơn:</strong>
                <span>{selectedRental.rentalId}</span>
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
              {selectedRental.pricePerDaySnapshot && (
                <div className="info-item">
                  <strong>Giá áp dụng mỗi ngày:</strong>
                  <span>{formatPrice(selectedRental.pricePerDaySnapshot)}</span>
                </div>
              )}
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

          {selectedRental.deposit && (
            <div className="deposit-card" style={{ marginTop: "20px" }}>
              <h3 style={{ marginTop: 0 }}>Tiền cọc</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Đã nộp:</strong>
                  <span>{formatPrice(selectedRental.deposit.amount)}</span>
                </div>
                <div className="info-item">
                  <strong>Đã sử dụng:</strong>
                  <span>{formatPrice(selectedRental.deposit.usedAmount)}</span>
                </div>
                <div className="info-item">
                  <strong>Còn lại:</strong>
                  <span>{formatPrice(selectedRental.deposit.availableAmount)}</span>
                </div>
                <div className="info-item">
                  <strong>Trạng thái:</strong>
                  <span>{selectedRental.deposit.status}</span>
                </div>
                {selectedRental.deposit.lastUsedAt && (
                  <div className="info-item">
                    <strong>Lần sử dụng gần nhất:</strong>
                    <span>{formatDate(selectedRental.deposit.lastUsedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="modal-penalties-section" style={{ marginTop: "20px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "18px", fontWeight: 600 }}>Khoản phạt</h3>
            {!selectedRental.penalties || selectedRental.penalties.length === 0 ? (
              <div style={{ color: "#666" }}>Không có khoản phạt nào.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped" style={{ width: "100%", fontSize: "14px" }}>
                  <thead>
                    <tr>
                      <th>Mô tả</th>
                      <th>Số tiền</th>
                      <th>Đã trừ cọc</th>
                      <th>Đã thu</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRental.penalties.map((penalty) => (
                      <tr key={penalty.rentalPenaltyId}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{penalty.penalty?.violationType || "Phạt"}</div>
                          <div style={{ color: "#6b7280" }}>{penalty.description}</div>
                        </td>
                        <td>{formatPrice(penalty.amount)}</td>
                        <td>{formatPrice(penalty.depositUsedAmount)}</td>
                        <td>
                          {formatPrice(penalty.paidAmount)}
                          {penalty.paymentMethod && (
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>{penalty.paymentMethod}</div>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(penalty.status)}`}>
                            {penalty.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

          {/* Images Section */}
          <div className="modal-images-section" style={{ marginTop: "20px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "18px", fontWeight: 600 }}>Ảnh bàn giao/nhận xe</h3>
            {loadingImages ? (
              <div className="text-center">Đang tải ảnh...</div>
            ) : rentalImages.length === 0 ? (
              <div className="text-center" style={{ color: "#666" }}>Chưa có ảnh nào.</div>
            ) : (
              <div className="images-grid">
                {rentalImages.map((img) => (
                  <div key={img.imageId} className="image-card">
                    <img src={img.imageUrl} alt={img.type} style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "4px" }} />
                    <div className="image-info" style={{ padding: "8px", fontSize: "12px" }}>
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
