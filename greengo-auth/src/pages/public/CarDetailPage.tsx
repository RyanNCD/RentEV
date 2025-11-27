import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getVehicleById } from "../../services/vehicle";
import { type IVehicle, type IFeedback } from "../../types";
import { formatVietnamDateOnly } from "../../utils/dateTime";
import { 
  getFeedbacksByVehicle, 
  getAverageRatingByVehicle, 
  checkFeedbackEligibility, 
  createFeedback 
} from "../../services/rental";
import { useAuth } from "../../context/AuthContext";
import "./car-detail.css";

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vehicle, setVehicle] = useState<IVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Feedback state
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [eligibleRentalId, setEligibleRentalId] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID xe không hợp lệ");
      setLoading(false);
      return;
    }

    const fetchVehicle = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getVehicleById(id);
        setVehicle(data);
      } catch (err: any) {
        console.error("Error loading vehicle:", err);
        setError("Không tìm thấy xe hoặc có lỗi xảy ra.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  // Load feedbacks and check eligibility
  useEffect(() => {
    if (!id) return;

    const loadFeedbacks = async () => {
      try {
        setLoadingFeedbacks(true);
        const [feedbacksData, avgRating] = await Promise.all([
          getFeedbacksByVehicle(id),
          getAverageRatingByVehicle(id)
        ]);
        setFeedbacks(feedbacksData);
        setAverageRating(avgRating);

        // Check if current user can review (if logged in as Customer)
        if (user && user.role === "RENTER") {
          try {
            const eligibility = await checkFeedbackEligibility(id);
            setCanReview(eligibility.canReview);
            if (eligibility.canReview && eligibility.rentalId) {
              setEligibleRentalId(eligibility.rentalId);
              // Check if user already reviewed this vehicle
              const userId = user.id || user.userId;
              const userFeedback = feedbacksData.find(f => f.userId === userId);
              setHasReviewed(!!userFeedback);
            } else {
              setCanReview(false);
              setHasReviewed(false);
            }
          } catch (err: any) {
            console.error("Error checking eligibility:", err);
            // User might not be authorized or not logged in, ignore error
            setCanReview(false);
          }
        } else {
          // Not logged in or not a customer
          setCanReview(false);
          setHasReviewed(false);
        }
      } catch (err: any) {
        console.error("Error loading feedbacks:", err);
      } finally {
        setLoadingFeedbacks(false);
      }
    };

    loadFeedbacks();
  }, [id, user]);

  // Map vehicle name to image (fallback if imageUrl is not provided)
  const getVehicleImage = (vehicle: IVehicle) => {
    // Nếu có imageUrl từ API (đã được map với domain API), dùng luôn
    if (vehicle.imageUrl) {
      return vehicle.imageUrl;
    }

    // Fallback: map theo tên xe nếu không có imageUrl
    const name = vehicle.vehicleName.toLowerCase();
    if (name.includes("vf7")) return "/images/car-vf7.jpg";
    if (name.includes("vf3")) return "/images/car-vf3.jpg";
    if (name.includes("vf6")) return "/images/car-vf6.jpg";
    if (name.includes("vf e34") || name.includes("vf34")) return "/images/car-vf34.jpg";
    if (name.includes("ioniq")) return "/images/car-ioniq5.jpg";
    if (name.includes("ev6")) return "/images/car-ev6.jpg";
    if (name.includes("vf5")) return "/images/car-vf5.jpg";
    if (name.includes("vf9")) return "/images/car-vf9.jpg";
    if (name.includes("vf8")) return "/images/car-vf8.jpg";
    return "/images/car-vf7.jpg"; // Default image
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleBookNow = () => {
    if (vehicle) {
      navigate("/checkout", { state: { car: vehicle } });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !eligibleRentalId || !id) return;

    if (rating < 1 || rating > 5) {
      setReviewError("Vui lòng chọn điểm đánh giá từ 1 đến 5.");
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      await createFeedback({
        rentalId: eligibleRentalId,
        rating,
        comment: comment.trim() || undefined
      });

      // Reload feedbacks
      const [feedbacksData, avgRating] = await Promise.all([
        getFeedbacksByVehicle(id),
        getAverageRatingByVehicle(id)
      ]);
      setFeedbacks(feedbacksData);
      setAverageRating(avgRating);
      setHasReviewed(true);
      setShowReviewForm(false);
      setRating(5);
      setComment("");
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setReviewError(err.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  const formatDate = (dateString?: string | null) => {
    return formatVietnamDateOnly(dateString);
  };

  if (loading) {
    return (
      <div className="car-detail-container">
        <div className="car-detail-loading">
          <p>Đang tải chi tiết xe...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="car-detail-container">
        <div className="car-detail-error">
          <h2>Không tìm thấy xe</h2>
          <p>{error || "Xe không tồn tại hoặc đã bị xóa."}</p>
          <Link to="/home" className="btn btn--primary">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const utilities = vehicle.utilities
    ? vehicle.utilities.split(",").map((u) => u.trim()).filter((u) => u)
    : [];

  return (
    <div className="car-detail-container">
      <div className="car-detail-content">
        {/* Back button */}
        <Link to="/home" className="car-detail-back">
          ← Quay lại
        </Link>

        {/* Main content */}
        <div className="car-detail-main">
          {/* Image section */}
          <div className="car-detail-image-section">
            <div className="car-detail-image-wrapper">
              <img
                src={getVehicleImage(vehicle)}
                alt={vehicle.vehicleName}
                className="car-detail-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/car-vf7.jpg";
                }}
              />
              {vehicle.status && (
                <div className={`car-detail-status-badge status-${vehicle.status.toLowerCase()}`}>
                  {vehicle.status === "Available" ? "Có sẵn" : vehicle.status}
                </div>
              )}
            </div>
          </div>

          {/* Info section */}
          <div className="car-detail-info-section">
            {/* Title and type */}
            <div className="car-detail-header">
              <h1 className="car-detail-title">{vehicle.vehicleName}</h1>
              {vehicle.vehicleType && (
                <p className="car-detail-type">{vehicle.vehicleType}</p>
              )}
            </div>

            {/* Price */}
            <div className="car-detail-price-section">
              <div className="car-detail-price">
                {formatPrice(vehicle.pricePerDay)}
                {vehicle.pricePerDay && <span className="car-detail-price-unit">/ngày</span>}
              </div>
              {vehicle.numberOfRenters !== undefined && vehicle.numberOfRenters > 0 && (
                <p className="car-detail-renters">
                  Đã có {vehicle.numberOfRenters} người thuê
                </p>
              )}
              {averageRating > 0 && (
                <div className="car-detail-rating" style={{ marginTop: "8px" }}>
                  <span style={{ fontWeight: "600" }}>Đánh giá: </span>
                  <span>{renderStars(Math.round(averageRating))}</span>
                  <span style={{ marginLeft: "8px", color: "#666" }}>
                    ({averageRating.toFixed(1)}/5.0 - {feedbacks.length} đánh giá)
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {vehicle.description && (
              <div className="car-detail-description">
                <h3>Mô tả</h3>
                <p>{vehicle.description}</p>
              </div>
            )}

            {/* Specifications */}
            <div className="car-detail-specs">
              <h3>Thông số kỹ thuật</h3>
              <div className="car-detail-specs-grid">
                {vehicle.batteryCapacity && (
                  <div className="car-detail-spec-item">
                    <div className="car-detail-spec-icon">🔋</div>
                    <div className="car-detail-spec-content">
                      <div className="car-detail-spec-label">Dung lượng pin</div>
                      <div className="car-detail-spec-value">{vehicle.batteryCapacity} kWh</div>
                    </div>
                  </div>
                )}
                {vehicle.seatingCapacity && (
                  <div className="car-detail-spec-item">
                    <div className="car-detail-spec-icon">👥</div>
                    <div className="car-detail-spec-content">
                      <div className="car-detail-spec-label">Số chỗ ngồi</div>
                      <div className="car-detail-spec-value">{vehicle.seatingCapacity} chỗ</div>
                    </div>
                  </div>
                )}
                {vehicle.licensePlate && (
                  <div className="car-detail-spec-item">
                    <div className="car-detail-spec-icon">🚗</div>
                    <div className="car-detail-spec-content">
                      <div className="car-detail-spec-label">Biển số</div>
                      <div className="car-detail-spec-value">{vehicle.licensePlate}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Utilities */}
            {utilities.length > 0 && (
              <div className="car-detail-utilities">
                <h3>Tiện ích</h3>
                <div className="car-detail-utilities-list">
                  {utilities.map((utility, index) => (
                    <span key={index} className="car-detail-utility-badge">
                      {utility}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="car-detail-actions">
              {vehicle.status === "Available" && vehicle.pricePerDay && vehicle.pricePerDay > 0 ? (
                <button
                  onClick={handleBookNow}
                  className="btn btn--primary car-detail-book-btn"
                >
                  Thuê ngay
                </button>
              ) : vehicle.status === "Available" && (!vehicle.pricePerDay || vehicle.pricePerDay <= 0) ? (
                <p className="car-detail-unavailable-message">
                  Xe chưa có giá. Vui lòng liên hệ để biết thêm thông tin.
                </p>
              ) : (
                <>
                  <button
                    onClick={handleBookNow}
                    className="btn btn--primary car-detail-book-btn"
                    disabled
                  >
                    Không có sẵn
                  </button>
                  <p className="car-detail-unavailable-message">
                    Xe hiện không có sẵn để thuê
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="car-detail-reviews" style={{ marginTop: "40px", padding: "24px", backgroundColor: "#f9f9f9", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600" }}>Đánh giá và nhận xét</h2>
            {averageRating > 0 && (
              <div style={{ fontSize: "18px", fontWeight: "600" }}>
                {renderStars(Math.round(averageRating))} {averageRating.toFixed(1)}/5.0
              </div>
            )}
          </div>

          {/* Review Form (for eligible users) */}
          {canReview && !hasReviewed && user && (
            <div className="review-form-section" style={{ marginBottom: "32px", padding: "20px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="btn btn--primary"
                  style={{ width: "100%" }}
                >
                  Viết đánh giá
                </button>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Đánh giá của bạn</h3>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                      Điểm đánh giá *
                    </label>
                    <div style={{ display: "flex", gap: "8px", fontSize: "24px" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "24px",
                            padding: "4px",
                          }}
                        >
                          {star <= rating ? "⭐" : "☆"}
                        </button>
                      ))}
                    </div>
                    <span style={{ marginLeft: "8px", color: "#666" }}>{rating}/5</span>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                      Nhận xét
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn về xe này..."
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {reviewError && (
                    <div style={{ color: "red", marginBottom: "16px", fontSize: "14px" }}>
                      {reviewError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={submittingReview}
                    >
                      {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewError(null);
                      }}
                      className="btn"
                      disabled={submittingReview}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {hasReviewed && (
            <div style={{ padding: "12px", backgroundColor: "#e8f5e9", borderRadius: "4px", marginBottom: "24px", color: "#2e7d32" }}>
              ✓ Bạn đã đánh giá xe này
            </div>
          )}

          {/* Feedbacks List */}
          {loadingFeedbacks ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Đang tải đánh giá...</div>
          ) : feedbacks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá xe này!
            </div>
          ) : (
            <div className="feedbacks-list">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.feedbackId}
                  style={{
                    padding: "20px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                        {feedback.userName || "Khách hàng"}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        {formatDate(feedback.createdAt)}
                      </div>
                    </div>
                    {feedback.rating && (
                      <div style={{ fontSize: "20px" }}>
                        {renderStars(feedback.rating)}
                      </div>
                    )}
                  </div>
                  {feedback.comment && (
                    <div style={{ marginTop: "12px", lineHeight: "1.6", color: "#333" }}>
                      {feedback.comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
