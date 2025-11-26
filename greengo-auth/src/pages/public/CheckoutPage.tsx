// File: src/lib/pages/public/CheckoutPage.tsx (Bản V8 - Full - Đã có "Lính gác")

import { useState, useEffect } from "react"; 
import { useLocation } from "react-router-dom";
import { type IVehicle, type IRentalRequest, type IPaymentRequest, type IStation } from "../../types"; 
import { createRental } from "../../services/rental"; 
import { createPaymentRequest, confirmPayment } from "../../services/payment";
import { getAllStations } from "../../services/station";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getPenalties } from "../../services/penalty";
import { type IPenalty } from "../../types";

export default function CheckoutPage() {
  const formatPrice = (price?: number | null) => {
    if (price == null || Number.isNaN(price)) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const location = useLocation();
  const navigate = useNavigate();
  // (Biến "car" CÓ THỂ BỊ NULL)
  const car = location.state?.car as IVehicle | null;

  // (State (startDate, endDate, stations...) giữ nguyên)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<IStation[]>([]);
  const [pickupStationId, setPickupStationId] = useState<string>("");
  const [returnStationId, setReturnStationId] = useState<string>("");
  const [showPayOSDialog, setShowPayOSDialog] = useState<boolean>(false);
  const [penalties, setPenalties] = useState<IPenalty[]>([]);
  const [showPenaltyRates, setShowPenaltyRates] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"full" | "deposit_only">("full"); // "full" = thanh toán trước, "deposit_only" = thanh toán khi nhận xe
  // Bỏ state currentPaymentId, dùng trực tiếp paymentId từ createPaymentResponse để tránh closure stale
  // Loại bỏ state contract; sẽ dùng biến cục bộ createdRental khi điều hướng

  // (useEffect tải Trạm - giữ nguyên)
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await getAllStations(); 
        setStations(data);
        if (data.length > 0) {
          setPickupStationId(data[0].stationId);
          setReturnStationId(data[0].stationId);
        }
      } catch (err) {
        setError("Không thể tải danh sách trạm. Vui lòng thử lại.");
      }
    };
    fetchStations();
  }, []);

  // Load penalty rates
  useEffect(() => {
    const fetchPenalties = async () => {
      try {
        const data = await getPenalties();
        setPenalties(data);
      } catch (err) {
        console.error("Error loading penalties:", err);
      }
    };
    fetchPenalties();
  }, []); 

  // === Min datetime constraints ===
  const toLocalInputValue = (d: Date) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const getTomorrow = () => {
    const now = new Date();
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, now.getHours(), now.getMinutes());
    return t;
  };

  const minStartDate = toLocalInputValue(getTomorrow());

  const minEndDate = (() => {
    if (startDate) {
      const start = new Date(startDate);
      const minEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      return toLocalInputValue(minEnd);
    }
    const base = getTomorrow();
    const minEnd = new Date(base.getTime() + 24 * 60 * 60 * 1000);
    return toLocalInputValue(minEnd);
  })();

  // Calculate total with validation (minimum 24 hours)
  const calculateTotal = () => {
    if (!startDate || !endDate || !car) return { rentalCost: 0, deposit: 0, days: 0, isValid: false, message: "" };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return { rentalCost: 0, deposit: 0, days: 0, isValid: false, message: "Thời gian kết thúc phải sau thời gian bắt đầu." };
    }

    // Tính số giờ
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Tối thiểu 24 giờ
    if (totalHours < 24) {
      return { 
        rentalCost: 0, 
        deposit: 0, 
        days: 0, 
        isValid: false, 
        message: "Thời gian thuê xe tối thiểu là 24 giờ." 
      };
    }

    // Tính số ngày: nếu > 24h thì tính là ngày thứ 2
    // Giảm nhẹ để tránh lỗi làm tròn floating (24h đôi khi thành 24.0000001)
    const days = Math.ceil(totalHours / 24 - 1e-6);
    const rentalCost = days * (car.pricePerDay ?? 0);
    const deposit = rentalCost * 0.3; // 30% của tổng tiền thuê

    return { rentalCost, deposit, days, isValid: true, message: "" };
  };
  
  const costCalculation = calculateTotal();
  const totalCostForUI = costCalculation.rentalCost;
  const depositAmount = costCalculation.deposit;
  const { user } = useAuth();

  // (Hàm handleSubmit 5 món - giữ nguyên)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation thời gian
    if (!costCalculation.isValid) {
      setError(costCalculation.message || "Thời gian đặt xe không hợp lệ.");
      return;
    }
    
    // (Lính gác #1)
    if (!car || totalCostForUI <= 0 || !pickupStationId || !returnStationId) {
      setError("Vui lòng điền đầy đủ thông tin thuê xe.");
      return;
    }
    // (Lính gác #2 - yêu cầu có userId GUID từ Context)
    if (!user?.id) {
      setError("Thiếu thông tin người dùng. Hãy đăng nhập lại.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. TẠO DATA BƯỚC 1 (5 MÓN)
      const rentalData: IRentalRequest = {
        userId: user.id,
        vehicleId: car.vehicleId, // (Lúc này "car" 100% không null)
        startTime: new Date(startDate).toISOString(),
        endTime: new Date(endDate).toISOString(),
        status:"Booking", // (Tạm, BE sẽ ghi đè)
        pickupStationId: pickupStationId,
        returnStationId: returnStationId
      };
      
      // 2. GỌI API BƯỚC 1 (POST /api/rental)
      const createdRental = await createRental(rentalData);

      // 3. TẠO DATA BƯỚC 2 (Tạo Thanh toán - tùy theo lựa chọn)
      // Nếu chọn "thanh toán trước" thì thanh toán toàn bộ (tiền thuê + cọc)
      // Nếu chọn "thanh toán khi nhận xe" thì chỉ thanh toán cọc
      const totalPaymentAmount = paymentMethod === "full" 
        ? totalCostForUI + depositAmount 
        : depositAmount;
      const paymentData: IPaymentRequest = {
        userId: user.id,
        rentalId: (createdRental as any).rentalId ?? (createdRental as any).id, 
        amount: totalPaymentAmount,
        paymentMethod: "PayOS",
        type: "Rental",
        status: "Pending",
      };

      // 4. GỌI API BƯỚC 2 (POST /api/payment/create)
      const paymentResponse = await createPaymentRequest(paymentData);
      const paymentId = (paymentResponse as any).paymentId;

      // 5. Hiển thị PayOS (QR) trong dialog nhúng
      const checkoutUrl = (paymentResponse as any).checkoutUrl || (paymentResponse as any).paymentUrl;
      if (!checkoutUrl) {
        setError("Không thể lấy đường dẫn thanh toán.");
        return;
      }

      const elementId = "payos-modal-container";
      // Mở dialog để hiển thị QR PayOS
      setShowPayOSDialog(true);
      console.log("[PayOS] Opened dialog", { elementId, checkoutUrl, paymentId });

      // Khởi tạo PayOS Checkout (embedded = true)
      const payOSConfig = {
        RETURN_URL: window.location.origin + "/payment-success",
        ELEMENT_ID: elementId,
        CHECKOUT_URL: checkoutUrl,
        embedded: true,
        onSuccess: async (_event: any) => {
          // Sau thanh toán thành công: gọi API xác nhận payment rồi mới chuyển trang
          try {
            if (!paymentId) {
              setError("Thiếu mã thanh toán (paymentId). Không thể xác nhận.");
              console.error("[PayOS] Missing paymentId on success event", { event: _event, paymentId });
              return;
            }
            console.log("[PayOS] Confirming payment", { paymentId });
            const confirmRes = await confirmPayment(paymentId);
            console.log("[PayOS] Payment confirmed", { paymentId, confirmRes });
            setShowPayOSDialog(false);
            console.log("[PayOS] Closed dialog after success");
            // Chỉ điều hướng sau khi xác nhận thành công
            // Tạo object tóm tắt hợp đồng hiển thị cho trang success
            const paidAmount = Number((confirmRes as any)?.amount ?? (confirmRes as any)?.Amount ?? 0);
            const summary = {
              id: (createdRental as any).rentalId ?? (createdRental as any).id ?? "",
              vehicleName: car?.vehicleName ?? (createdRental as any).vehicleName ?? "",
              startDate: (createdRental as any).startDate ?? (createdRental as any).startTime ?? startDate,
              endDate: (createdRental as any).endDate ?? (createdRental as any).endTime ?? endDate,
              // Ưu tiên số tiền từ confirm để tránh hiển thị 0 VNĐ
              totalCost: paidAmount > 0 ? paidAmount : ((createdRental as any).totalCost ?? totalCostForUI ?? 0),
              amount: paidAmount, // thêm để trang success có thể lấy trực tiếp
              // Hiển thị trạng thái "Đã thanh toán" ở trang success
              status: "PAID",
            };
            navigate("/payment-success", {
              replace: true,
              state: { contract: summary },
            });
            console.log("[PayOS] Navigated to /payment-success", { state: summary });
            return;
          } catch (err: any) {
            const msg = err?.response?.data?.message || "Xác nhận thanh toán thất bại.";
            setError(msg);
            console.error("[PayOS] Confirm payment failed", { error: err, message: msg });
            // Đảm bảo đóng dialog nếu lỗi
            setShowPayOSDialog(false);
            console.log("[PayOS] Closed dialog after error");
          }
        },
        onCancel: (_event: any) => {
          setError("Bạn đã hủy thanh toán.");
          setShowPayOSDialog(false);
          console.warn("[PayOS] User canceled payment", { event: _event });
        },
        onExit: (_event: any) => {
          // Người dùng đóng pop-up / iframe
          setShowPayOSDialog(false);
           console.log("[PayOS] User exited checkout", { event: _event });
        },
      } as any;

      // Nạp SDK PayOS từ gói NPM (module import)
      const payosModule: any = await import("payos-checkout");
      const PayOSCheckout = payosModule.default || payosModule;
      if (!PayOSCheckout || typeof PayOSCheckout.usePayOS !== "function") {
        setError("Dịch vụ thanh toán chưa sẵn sàng.");
        return;
      }

      // Đợi dialog render xong rồi mới mở PayOS
      setTimeout(() => {
        const container = document.getElementById(elementId);
        if (!container) {
          setError("Không tìm thấy container trong dialog.");
          return;
        }
        const { open } = PayOSCheckout.usePayOS(payOSConfig);
        console.log("[PayOS] Initialized checkout, opening modal", { elementId });
        open();
      }, 0);
      
    } catch (err: any) {
      setError(err.response?.data?.message || "Đặt xe thất bại. BE có lỗi.");
    } finally {
      setLoading(false); // (Đã fix Sfalse)
    }
  };


  // === "LÍNH GÁC" MÀ ÔNG BỊ THIẾU NẰM Ở ĐÂY ===
  if (!car) {
    return (
      <div style={{ padding: "2rem" }}>
        Lỗi: Không có thông tin xe. Vui lòng quay lại <a href="/">trang chủ</a>.
      </div>
    );
  }
  // === HẾT "LÍNH GÁC" ===


  // (JSX - Giờ đã an toàn, 100% "car" không null)
  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto" }}>
      <h1>Xác nhận Thuê xe & Thanh toán</h1>
      
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <img 
            src={"/images/car-vf7.jpg"} // (DÙNG TẠM)
            alt={car.vehicleName} // (Hết đỏ)
            style={{ width: "150px", height: "100px", objectFit: "cover" }} />
        <div>
          <h3>{car.vehicleName}</h3> {/* (Hết đỏ) */}
          <p>
            {formatPrice(car.pricePerDay)}
            {car.pricePerDay != null ? " /ngày" : ""}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* (2 Dropdown Trạm - giữ nguyên) */}
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Trạm nhận xe</label>
          <select 
            value={pickupStationId} 
            onChange={e => setPickupStationId(e.target.value)} 
            required 
            style={{ width: "100%", padding: "0.5rem" }}
          >
            <option value="" disabled>-- Chọn trạm nhận --</option>
            {stations.map(station => (
              <option key={station.stationId} value={station.stationId}>
                {station.stationName} ({station.address})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Trạm trả xe</label>
          <select 
            value={returnStationId} 
            onChange={e => setReturnStationId(e.target.value)} 
            required 
            style={{ width: "100%", padding: "0.5rem" }}
          >
            <option value="" disabled>-- Chọn trạm trả --</option>
            {stations.map(station => (
              <option key={station.stationId} value={station.stationId}>
                {station.stationName} ({station.address})
              </option>
            ))}
          </select>
        </div>
      
        {/* (Input Ngày giờ - giữ nguyên) */}
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Nhận xe (Từ ngày)</label>
          <input 
            type="datetime-local" 
            value={startDate} 
            min={minStartDate}
            onChange={e => {
              const value = e.target.value;
              if (value && value < minStartDate) {
                setStartDate(minStartDate);
              } else {
                setStartDate(value);
              }
            }}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Trả xe (Đến ngày)</label>
          <input 
            type="datetime-local" 
            value={endDate} 
            min={minEndDate}
            onChange={e => {
              const value = e.target.value;
              if (value && value < minEndDate) {
                setEndDate(minEndDate);
              } else {
                setEndDate(value);
              }
            }}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        
        {/* Validation message */}
        {!costCalculation.isValid && costCalculation.message && (
          <div style={{
            padding: "12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#991b1b",
            marginTop: "1rem"
          }}>
            ⚠️ {costCalculation.message}
          </div>
        )}

        {/* Payment method selection */}
        {costCalculation.isValid && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Phương thức thanh toán</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ 
                display: "flex", 
                alignItems: "center", 
                cursor: "pointer",
                padding: "12px",
                borderRadius: "8px",
                border: paymentMethod === "full" ? "2px solid #10b981" : "2px solid #e5e7eb",
                background: paymentMethod === "full" ? "#f0fdf4" : "#fff",
                transition: "all 0.2s ease"
              }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="full"
                  checked={paymentMethod === "full"}
                  onChange={(e) => setPaymentMethod(e.target.value as "full" | "deposit_only")}
                  style={{ marginRight: "12px", width: "18px", height: "18px", cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>Thanh toán trước</div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    Thanh toán toàn bộ tiền thuê và cọc ngay bây giờ
                  </div>
                </div>
              </label>
              <label style={{ 
                display: "flex", 
                alignItems: "center", 
                cursor: "pointer",
                padding: "12px",
                borderRadius: "8px",
                border: paymentMethod === "deposit_only" ? "2px solid #10b981" : "2px solid #e5e7eb",
                background: paymentMethod === "deposit_only" ? "#f0fdf4" : "#fff",
                transition: "all 0.2s ease"
              }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="deposit_only"
                  checked={paymentMethod === "deposit_only"}
                  onChange={(e) => setPaymentMethod(e.target.value as "full" | "deposit_only")}
                  style={{ marginRight: "12px", width: "18px", height: "18px", cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>Thanh toán khi nhận xe</div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    Chỉ thanh toán cọc trước, phần còn lại thanh toán khi nhận xe
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Cost breakdown */}
        {costCalculation.isValid && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Chi tiết thanh toán</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span>Thời gian thuê:</span>
              <strong>{costCalculation.days} ngày</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span>Tiền thuê xe ({costCalculation.days} ngày × {formatPrice(car.pricePerDay)}):</span>
              <strong>{formatPrice(costCalculation.rentalCost)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", color: "#059669" }}>
              <span>Tiền cọc (30%):</span>
              <strong>{formatPrice(depositAmount)}</strong>
            </div>
            {paymentMethod === "deposit_only" && (
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                marginBottom: "8px",
                padding: "8px",
                background: "#fef3c7",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#92400e"
              }}>
                <span>Phần còn lại (thanh toán khi nhận xe):</span>
                <strong>{formatPrice(costCalculation.rentalCost)}</strong>
              </div>
            )}
            <hr style={{ margin: "12px 0", borderColor: "#e5e7eb" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "600" }}>
              <span>Tổng thanh toán {paymentMethod === "deposit_only" ? "(cọc)" : ""}:</span>
              <strong style={{ color: "#059669" }}>
                {formatPrice(paymentMethod === "full" 
                  ? costCalculation.rentalCost + depositAmount 
                  : depositAmount)}
              </strong>
            </div>
            <div style={{ marginTop: "12px", fontSize: "13px", color: "#6b7280" }}>
              {paymentMethod === "full" 
                ? "* Tiền cọc sẽ được hoàn lại sau khi trả xe (trừ phí phạt nếu có)"
                : "* Bạn sẽ thanh toán phần còn lại khi nhận xe tại trạm"}
            </div>
          </div>
        )}

        {/* Penalty rates */}
        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            onClick={() => setShowPenaltyRates(!showPenaltyRates)}
            style={{
              background: "transparent",
              border: "1px solid #d1d5db",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              color: "#374151",
              fontSize: "14px"
            }}
          >
            {showPenaltyRates ? "Ẩn" : "Xem"} bảng giá phạt
          </button>
          {showPenaltyRates && (
            <div style={{
              marginTop: "12px",
              padding: "16px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              maxHeight: "300px",
              overflowY: "auto"
            }}>
              <h4 style={{ marginTop: 0, marginBottom: "12px" }}>Bảng giá phạt</h4>
              {penalties.length === 0 ? (
                <p style={{ color: "#6b7280", fontSize: "14px" }}>Chưa có thông tin về mức phạt.</p>
              ) : (
                <table style={{ width: "100%", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ textAlign: "left", padding: "8px" }}>Loại vi phạm</th>
                      <th style={{ textAlign: "left", padding: "8px" }}>Mô tả</th>
                      <th style={{ textAlign: "right", padding: "8px" }}>Mức phạt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penalties.map((penalty) => {
                      const label =
                        (penalty.violationType === "LateReturn" && "Trả xe trễ giờ") ||
                        (penalty.violationType === "DamageExterior" && "Hư hỏng ngoại thất") ||
                        (penalty.violationType === "DamageInterior" && "Hư hỏng nội thất") ||
                        (penalty.violationType === "LostAccessory" && "Mất phụ kiện") ||
                        (penalty.violationType === "CleaningFee" && "Phí vệ sinh") ||
                        penalty.violationType;
                      return (
                        <tr key={penalty.penaltyId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px", fontWeight: "500" }}>{label}</td>
                          <td style={{ padding: "8px", color: "#6b7280" }}>{penalty.description}</td>
                          <td style={{ padding: "8px", textAlign: "right", fontWeight: "600", color: "#dc2626" }}>
                            {formatPrice(penalty.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* (Tổng tiền, Nút Submit giữ nguyên) */}
        <hr style={{ margin: "2rem 0" }} />
        {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{
            padding: "1rem 1.5rem",
            fontSize: "1.125rem",
            width: "100%",
            background: loading ? "#9ca3af" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            boxShadow: loading ? "none" : "0 4px 14px 0 rgba(16, 185, 129, 0.35)",
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 18px 0 rgba(16, 185, 129, 0.45)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px 0 rgba(16, 185, 129, 0.35)";
            }
          }}
        >
          {loading ? "Đang xử lý..." : "Tiến hành Thanh toán"}
        </button>
        {/* Modal Dialog hiển thị QR PayOS */}
        {showPayOSDialog && (
          <div role="dialog" aria-modal="true" style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}>
            <div style={{ background: "#fff", borderRadius: "8px", padding: "16px", width: "min(560px, 95vw)", maxHeight: "85vh", overflow: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>Thanh toán PayOS</h3>
                <button onClick={() => setShowPayOSDialog(false)} className="btn-secondary">Đóng</button>
              </div>
              <div style={{ marginTop: "12px" }}>
                <div id="payos-modal-container" />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}