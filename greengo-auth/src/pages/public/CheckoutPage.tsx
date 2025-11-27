// File: src/lib/pages/public/CheckoutPage.tsx (Bản V8 - Full - Đã có "Lính gác")

import { useState, useEffect } from "react"; 
import { useLocation, useNavigate, Link } from "react-router-dom";
import { type IVehicle, type IRentalRequest, type IPaymentRequest, type IStation } from "../../types"; 
import { createRental } from "../../services/rental"; 
import { createPaymentRequest, confirmPayment } from "../../services/payment";
import { getAllStations } from "../../services/station";
import { useAuth } from "../../context/AuthContext";

import { getPenalties } from "../../services/penalty";
import { type IPenalty } from "../../types";
import { DatePicker, TimePicker, ConfigProvider } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/locale/vi_VN";

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
  // (Biến "car" ban đầu từ location.state)
  const initialCar = location.state?.car as IVehicle | null;
  
  // 🆕 Dùng state để có thể cập nhật xe khi auto-refresh
  const [car, setCar] = useState<IVehicle | null>(initialCar);

  // Configure dayjs locale
  dayjs.locale("vi");

  // (State (startDate, endDate, stations...) giữ nguyên)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // New states for Ant Design DatePicker and TimePicker
  const [startDateValue, setStartDateValue] = useState<Dayjs | null>(null);
  const [startTimeValue, setStartTimeValue] = useState<Dayjs | null>(null);
  const [endDateValue, setEndDateValue] = useState<Dayjs | null>(null);
  const [endTimeValue, setEndTimeValue] = useState<Dayjs | null>(null);
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

  // Helper: Round time up to nearest 30-minute slot
  const roundUpToNearest30Min = (date: Dayjs): Dayjs => {
    const minutes = date.minute();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    if (roundedMinutes >= 60) {
      return date.add(1, "hour").minute(0);
    }
    return date.minute(roundedMinutes).second(0).millisecond(0);
  };

  // Helper: Get minimum time (8:00) or round up current time if today
  const getMinTime = (date: Dayjs | null, isToday: boolean): Dayjs | null => {
    if (!date) return null;
    const minTime = date.hour(8).minute(0).second(0).millisecond(0);
    if (isToday) {
      const now = dayjs();
      const rounded = roundUpToNearest30Min(now);
      // If rounded time is before 8:00, use 8:00; if after 22:30, return null (should use next day)
      if (rounded.hour() < 8) {
        return minTime;
      }
      if (rounded.hour() > 22 || (rounded.hour() === 22 && rounded.minute() > 30)) {
        return null; // Should use next day
      }
      return rounded;
    }
    return minTime;
  };

  // Helper: Get maximum time (22:30)
  const getMaxTime = (): Dayjs => {
    return dayjs().hour(22).minute(30).second(0).millisecond(0);
  };

  // Initialize with today's date and rounded-up time
  useEffect(() => {
    if (!startDateValue) {
      const today = dayjs();
      const roundedTime = roundUpToNearest30Min(today);
      // If after 22:30, use tomorrow
      if (roundedTime.hour() > 22 || (roundedTime.hour() === 22 && roundedTime.minute() > 30)) {
        const tomorrow = today.add(1, "day").hour(8).minute(0).second(0).millisecond(0);
        setStartDateValue(tomorrow);
        setStartTimeValue(tomorrow);
      } else {
        setStartDateValue(today);
        setStartTimeValue(roundedTime.hour() < 8 ? today.hour(8).minute(0) : roundedTime);
      }
    }
  }, []);

  // Update startDate string when startDateValue or startTimeValue changes
  useEffect(() => {
    if (startDateValue && startTimeValue) {
      const combined = startDateValue
        .hour(startTimeValue.hour())
        .minute(startTimeValue.minute())
        .second(0)
        .millisecond(0);
      setStartDate(combined.toISOString());
      
      // Auto-update end date/time to ensure minimum 24 hours
      const minEnd = combined.add(24, "hour");
      const minEndDate = minEnd.startOf("day");
      const minEndTime = minEnd;
      
      // Check if current end is valid
      if (!endDateValue || !endTimeValue) {
        setEndDateValue(minEndDate);
        setEndTimeValue(minEndTime);
      } else {
        const currentEnd = endDateValue
          .hour(endTimeValue.hour())
          .minute(endTimeValue.minute())
          .second(0)
          .millisecond(0);
        if (currentEnd.isBefore(minEnd)) {
          setEndDateValue(minEndDate);
          setEndTimeValue(minEndTime);
        }
      }
    }
  }, [startDateValue, startTimeValue]);

  // Update endDate string when endDateValue or endTimeValue changes
  useEffect(() => {
    if (endDateValue && endTimeValue) {
      const combined = endDateValue
        .hour(endTimeValue.hour())
        .minute(endTimeValue.minute())
        .second(0)
        .millisecond(0);
      setEndDate(combined.toISOString());
    }
  }, [endDateValue, endTimeValue]);

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

    // Tính số ngày với buffer 2 giờ cho phép trả chậm
    // Logic: Cho phép trả chậm hơn 2 giờ mà vẫn tính là cùng 1 ngày
    // Ví dụ: Thuê 10:00 AM ngày 27/11, trả 12:00 PM ngày 28/11 (26 giờ) -> 1 ngày
    //        Thuê 10:00 AM ngày 27/11, trả 12:01 PM ngày 28/11 (26.01 giờ) -> 2 ngày
    const baseDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    const bufferHours = 2; // Cho phép trả chậm 2 giờ
    
    // Nếu số giờ dư <= 2 giờ thì vẫn tính là số ngày cơ bản, ngược lại cộng thêm 1 ngày
    const days = remainingHours <= bufferHours ? baseDays : baseDays + 1;
    
    const rentalCost = days * (car.pricePerDay ?? 0);
    const deposit = rentalCost * 0.3; // 30% của tổng tiền thuê

    return { rentalCost, deposit, days, isValid: true, message: "" };
  };
  
  const costCalculation = calculateTotal();
  const totalCostForUI = costCalculation.rentalCost;
  const depositAmount = costCalculation.deposit;
  const { user } = useAuth();

  // (Hàm handleSubmit 5 món - Thêm re-fetch vehicle để đảm bảo status mới nhất)
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
    
    // (Lính gác #3 - Kiểm tra xe còn available không)
    if (car.status?.toUpperCase() !== "AVAILABLE") {
      setError(`Xe này hiện không có sẵn để thuê (Trạng thái: ${car.status}). Vui lòng chọn xe khác.`);
      return;
    }
    
    // (Lính gác #4 - Kiểm tra ngày không được trong quá khứ)
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start < now) {
      setError("Ngày nhận xe không được trong quá khứ!");
      return;
    }
    
    if (end <= start) {
      setError("Ngày trả xe phải sau ngày nhận xe!");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // 🔒 LÍNH GÁC #5 - RE-FETCH XE TỪ API ĐỂ KIỂM TRA STATUS MỚI NHẤT
    try {
      console.log(`[Checkout] Re-fetching vehicle ${car.vehicleId} to verify current status...`);
      const { getVehicleById } = await import("../../services/vehicle");
      const freshVehicle = await getVehicleById(car.vehicleId);
      
      console.log(`[Checkout] Fresh vehicle data:`, {
        vehicleId: freshVehicle.vehicleId,
        status: freshVehicle.status,
        pricePerDay: freshVehicle.pricePerDay
      });
      
      // Kiểm tra lại status từ API mới nhất
      if (freshVehicle.status?.toUpperCase() !== "AVAILABLE") {
        setLoading(false);
        setError(`⚠️ Xe này vừa được cập nhật trạng thái thành "${freshVehicle.status}". Không thể tiếp tục thanh toán. Vui lòng chọn xe khác.`);
        console.error(`[Checkout] Vehicle ${car.vehicleId} is no longer available! Status: ${freshVehicle.status}`);
        return;
      }
      
      if (!freshVehicle.pricePerDay || freshVehicle.pricePerDay <= 0) {
        setLoading(false);
        setError("Xe chưa có giá hợp lệ. Vui lòng chọn xe khác.");
        return;
      }
      
      console.log(`[Checkout] ✓ Vehicle ${car.vehicleId} is confirmed available. Proceeding...`);
    } catch (err: any) {
      setLoading(false);
      setError("Không thể xác minh trạng thái xe. Vui lòng thử lại.");
      console.error("[Checkout] Error re-fetching vehicle:", err);
      return;
    }
    
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
    <ConfigProvider locale={locale}>
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto" }}>
      <h1>Xác nhận Thuê xe & Thanh toán</h1>
      
      {/* Warning nếu xe không available */}
      {car.status?.toUpperCase() !== "AVAILABLE" && (
        <div style={{ 
          padding: "1rem", 
          marginBottom: "1rem", 
          background: "#fee", 
          border: "1px solid #fcc", 
          borderRadius: "8px", 
          color: "#c33" 
        }}>
          <strong>⚠️ Cảnh báo:</strong> Xe này hiện không có sẵn để thuê (Trạng thái: {car.status}). 
          Bạn không thể tiếp tục thanh toán. Vui lòng <Link to="/home" style={{ color: "#c33", textDecoration: "underline" }}>chọn xe khác</Link>.
        </div>
      )}
      
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
          {car.status && (
            <p style={{ 
              fontSize: "0.875rem", 
              color: car.status?.toUpperCase() === "AVAILABLE" ? "#16a34a" : "#dc3545",
              fontWeight: "600"
            }}>
              Trạng thái: {car.status?.toUpperCase() === "AVAILABLE" ? "✓ Có sẵn" : `✗ ${car.status}`}
            </p>
          )}
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
      
        {/* (Input Ngày giờ - Đã thêm min để chặn ngày quá khứ) */}
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Nhận xe (Từ ngày)</label>
          <input 
            type="datetime-local" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)} // Chặn ngày quá khứ
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
          <small style={{ color: "#666", fontSize: "0.875rem" }}>
            * Không thể chọn ngày trong quá khứ
          </small>
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Trả xe (Đến ngày)</label>
          <input 
            type="datetime-local" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            min={startDate || new Date().toISOString().slice(0, 16)} // Phải sau ngày nhận
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
          <small style={{ color: "#666", fontSize: "0.875rem" }}>
            * Phải sau ngày nhận xe
          </small>
        {/* Date and Time Selection with Ant Design */}
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Nhận xe (Từ ngày)</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <DatePicker
              value={startDateValue}
              onChange={(date) => {
                if (date) {
                  const isToday = date.isSame(dayjs(), "day");
                  setStartDateValue(date);
                  // If selecting today, round up time; otherwise use 8:00
                  if (isToday) {
                    const rounded = roundUpToNearest30Min(dayjs());
                    if (rounded.hour() < 8) {
                      setStartTimeValue(date.hour(8).minute(0));
                    } else if (rounded.hour() > 22 || (rounded.hour() === 22 && rounded.minute() > 30)) {
                      // After 22:30, move to next day
                      const tomorrow = date.add(1, "day").hour(8).minute(0);
                      setStartDateValue(tomorrow);
                      setStartTimeValue(tomorrow);
                    } else {
                      setStartTimeValue(rounded);
                    }
                  } else {
                    // Future date, default to 8:00
                    if (!startTimeValue) {
                      setStartTimeValue(date.hour(8).minute(0));
                    }
                  }
                } else {
                  setStartDateValue(null);
                  setStartTimeValue(null);
                }
              }}
              disabledDate={(current) => {
                // Can select today and future dates
                return current && current.isBefore(dayjs().startOf("day"));
              }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              style={{ flex: 2 }}
              locale={dayjs.locale("vi")}
            />
            <TimePicker
              value={startTimeValue}
              onChange={(time) => {
                setStartTimeValue(time);
              }}
              minuteStep={30}
              format="HH:mm"
              placeholder="Chọn giờ"
              disabledHours={() => {
                // Disable hours before 8 and after 22
                const hours = [];
                for (let i = 0; i < 8; i++) hours.push(i);
                for (let i = 23; i < 24; i++) hours.push(i);
                return hours;
              }}
              disabledMinutes={(selectedHour) => {
                // Disable minutes after 30 if hour is 22
                if (selectedHour === 22) {
                  return [30, 45];
                }
                return [];
              }}
              style={{ flex: 1 }}
            />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Trả xe (Đến ngày)</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <DatePicker
              value={endDateValue}
              onChange={(date) => {
                if (date) {
                  const isToday = date.isSame(dayjs(), "day");
                  setEndDateValue(date);
                  // If selecting today, round up time; if same day as start, ensure after start time
                  if (isToday) {
                    const rounded = roundUpToNearest30Min(dayjs());
                    if (rounded.hour() < 8) {
                      setEndTimeValue(date.hour(8).minute(0));
                    } else if (rounded.hour() > 22 || (rounded.hour() === 22 && rounded.minute() > 30)) {
                      // After 22:30, move to next day
                      const tomorrow = date.add(1, "day").hour(8).minute(0);
                      setEndDateValue(tomorrow);
                      setEndTimeValue(tomorrow);
                    } else {
                      setEndTimeValue(rounded);
                    }
                  } else if (startDateValue && date.isSame(startDateValue, "day") && startTimeValue) {
                    // Same day as start, ensure end time is after start time
                    const startTime = startTimeValue;
                    const nextSlot = startTime.add(30, "minute");
                    if (nextSlot.hour() > 22 || (nextSlot.hour() === 22 && nextSlot.minute() > 30)) {
                      // Move to next day
                      const tomorrow = date.add(1, "day").hour(8).minute(0);
                      setEndDateValue(tomorrow);
                      setEndTimeValue(tomorrow);
                    } else {
                      setEndTimeValue(nextSlot);
                    }
                  } else {
                    // Future date, default to 8:00
                    if (!endTimeValue) {
                      setEndTimeValue(date.hour(8).minute(0));
                    }
                  }
                } else {
                  setEndDateValue(null);
                  setEndTimeValue(null);
                }
              }}
              disabledDate={(current) => {
                if (!current) return false;
                // Calculate minimum end date (start date + 24 hours)
                if (startDateValue && startTimeValue) {
                  const minEnd = startDateValue
                    .hour(startTimeValue.hour())
                    .minute(startTimeValue.minute())
                    .add(24, "hour")
                    .startOf("day");
                  return current.isBefore(minEnd);
                }
                // Can select today and future dates
                return current.isBefore(dayjs().startOf("day"));
              }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              style={{ flex: 2 }}
              locale={dayjs.locale("vi")}
            />
            <TimePicker
              value={endTimeValue}
              onChange={(time) => {
                setEndTimeValue(time);
              }}
              minuteStep={30}
              format="HH:mm"
              placeholder="Chọn giờ"
              disabledHours={() => {
                // Disable hours before 8 and after 22
                const hours = [];
                for (let i = 0; i < 8; i++) hours.push(i);
                for (let i = 23; i < 24; i++) hours.push(i);
                return hours;
              }}
              disabledMinutes={(selectedHour) => {
                // Disable minutes after 30 if hour is 22
                if (selectedHour === 22) {
                  return [30, 45];
                }
                // If same day as start, disable times before or equal to start time
                if (startDateValue && endDateValue && startDateValue.isSame(endDateValue, "day") && startTimeValue) {
                  const startHour = startTimeValue.hour();
                  const startMin = startTimeValue.minute();
                  if (selectedHour < startHour) {
                    return Array.from({ length: 60 }, (_, i) => i);
                  }
                  if (selectedHour === startHour) {
                    return Array.from({ length: startMin + 1 }, (_, i) => i);
                  }
                }
                return [];
              }}
              style={{ flex: 1 }}
            />
          </div>
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
          disabled={loading || car.status?.toUpperCase() !== "AVAILABLE"}
          className="btn-primary"
          style={{
            padding: "1rem 1.5rem",
            fontSize: "1.125rem",
            width: "100%",
            background: (loading || car.status?.toUpperCase() !== "AVAILABLE") ? "#9ca3af" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: (loading || car.status?.toUpperCase() !== "AVAILABLE") ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            boxShadow: (loading || car.status?.toUpperCase() !== "AVAILABLE") ? "none" : "0 4px 14px 0 rgba(16, 185, 129, 0.35)",
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
          onMouseEnter={(e) => {
            if (!loading && car.status?.toUpperCase() === "AVAILABLE") {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 18px 0 rgba(16, 185, 129, 0.45)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && car.status?.toUpperCase() === "AVAILABLE") {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px 0 rgba(16, 185, 129, 0.35)";
            }
          }}
        >
          {loading ? "Đang xử lý..." : car.status?.toUpperCase() !== "AVAILABLE" ? "Xe không có sẵn" : "Tiến hành Thanh toán"}
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
    </ConfigProvider>
  );
}