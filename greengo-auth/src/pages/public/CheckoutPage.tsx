// File: src/lib/pages/public/CheckoutPage.tsx (Bản V8 - Full - Đã có "Lính gác")

import { useState, useEffect } from "react"; 
import { useLocation } from "react-router-dom";
import { type IVehicle, type IRentalRequest, type IPaymentRequest, type IStation } from "../../types"; 
import { createRental } from "../../services/rental"; 
import { createPaymentRequest, confirmPayment } from "../../services/payment";
import { getAllStations } from "../../services/station";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

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

  // (calculateTotal - giữ nguyên)
  const calculateTotal = () => {
    if (!startDate || !endDate || !car) return 0; // (Đã "phòng thủ" ở đây)
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end <= start) return 0;
    const days = (end - start) / (1000 * 60 * 60 * 24);
    return Math.ceil(days) * (car.pricePerDay ?? 0);
  };
  
  const totalCostForUI = calculateTotal();
  const { user } = useAuth();

  // (Hàm handleSubmit 5 món - giữ nguyên)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      // 3. TẠO DATA BƯỚC 2 (Tạo Thanh toán)
      const paymentData: IPaymentRequest = {
        userId: user.id,
        rentalId: (createdRental as any).rentalId ?? (createdRental as any).id, 
        amount: totalCostForUI,
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
            onChange={e => setStartDate(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Trả xe (Đến ngày)</label>
          <input 
            type="datetime-local" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        
        {/* (Tổng tiền, Nút Submit giữ nguyên) */}
        <hr style={{ margin: "2rem 0" }} />
        <h3>Tổng tiền (Tạm tính): {totalCostForUI.toLocaleString("vi-VN")} VNĐ</h3>
        {error && <p style={{ color: "red" }}>{error}</p>}
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