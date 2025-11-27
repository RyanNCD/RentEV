import { useEffect, useState } from "react";
import { getRevenueSummary, getDailyRevenue, getRecentPayments, getRevenueByStation, type IRevenueSummary, type IDailyRevenue, type IRecentPayment, type IRevenueByStation } from "../../services/revenue";
import { formatVietnamDateOnly } from "../../utils/dateTime";

export default function RevenueDashboard() {
  const [summary, setSummary] = useState<IRevenueSummary | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<IDailyRevenue[]>([]);
  const [recentPayments, setRecentPayments] = useState<IRecentPayment[]>([]);
  const [revenueByStation, setRevenueByStation] = useState<IRevenueByStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("[Revenue] Fetching data with filters:", { startDate, endDate });
      
      // Validate dates
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        setError("Ngày bắt đầu phải trước ngày kết thúc!");
        setLoading(false);
        return;
      }
      
      const [summaryData, dailyData, recentData, stationData] = await Promise.all([
        getRevenueSummary(startDate || undefined, endDate || undefined),
        getDailyRevenue(startDate || undefined, endDate || undefined),
        getRecentPayments(10, startDate || undefined, endDate || undefined), // Thêm filter cho recent payments
        getRevenueByStation(startDate || undefined, endDate || undefined)
      ]);
      
      console.log("[Revenue] Data loaded:", {
        totalRevenue: summaryData.totalRevenue,
        totalPayments: summaryData.totalPayments,
        stationsCount: stationData.length,
        recentPaymentsCount: recentData.length
      });
      
      setSummary(summaryData);
      setDailyRevenue(dailyData);
      setRecentPayments(recentData);
      setRevenueByStation(stationData);
    } catch (err: any) {
      console.error("[Revenue] Error loading data:", err);
      const errorMsg = err.response?.data?.message || err.message || "Không thể tải dữ liệu doanh thu";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("[Revenue] Filters changed, reloading data...");
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return formatVietnamDateOnly(dateString);
  };

  const translatePaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      "Cash": "Tiền mặt",
      "BankTransfer": "Chuyển khoản",
      "PayOS": "PayOS (QR Code)",
      "Unknown": "Không xác định"
    };
    return methodMap[method] || method;
  };

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "16px", color: "#666" }}>⏳ Đang tải dữ liệu doanh thu...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <h1 style={{ marginBottom: "24px" }}>Báo cáo Doanh thu</h1>
        <div style={{ 
          padding: "20px", 
          backgroundColor: "#f8d7da", 
          color: "#721c24",
          border: "1px solid #f5c6cb",
          borderRadius: "8px",
          marginBottom: "16px"
        }}>
          <strong>❌ Lỗi:</strong> {error}
        </div>
        <button
          onClick={fetchData}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          🔄 Thử lại
        </button>
      </div>
    );
  }
  
  if (!summary) return null;

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ marginBottom: "24px" }}>Báo cáo Doanh thu</h1>

      {/* Date Filter */}
      <div style={{ 
        marginBottom: "24px", 
        padding: "20px", 
        backgroundColor: "#f8f9fa", 
        borderRadius: "8px",
        border: "1px solid #dee2e6"
      }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontWeight: "600", fontSize: "14px" }}>Từ ngày:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                console.log("[Revenue] Start date changed:", e.target.value);
              }}
              style={{ 
                padding: "8px 12px", 
                border: "1px solid #ced4da", 
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontWeight: "600", fontSize: "14px" }}>Đến ngày:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                console.log("[Revenue] End date changed:", e.target.value);
              }}
              style={{ 
                padding: "8px 12px", 
                border: "1px solid #ced4da", 
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <button
              onClick={() => {
                console.log("[Revenue] Clearing filters...");
                setStartDate("");
                setEndDate("");
              }}
              style={{ 
                padding: "8px 16px", 
                backgroundColor: "#6c757d", 
                color: "white", 
                border: "none", 
                borderRadius: "4px", 
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a6268"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#6c757d"}
            >
              Xóa bộ lọc
            </button>
            {(startDate || endDate) && (
              <span style={{ 
                padding: "8px 12px", 
                backgroundColor: "#d4edda", 
                color: "#155724",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: "500"
              }}>
                ✓ Đang lọc {startDate && endDate ? `từ ${startDate} đến ${endDate}` : startDate ? `từ ${startDate}` : `đến ${endDate}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Warning if no data in selected range */}
      {summary.totalPayments === 0 && (startDate || endDate) && (
        <div style={{ 
          padding: "16px", 
          backgroundColor: "#fff3cd", 
          color: "#856404",
          border: "1px solid #ffeaa7",
          borderRadius: "8px",
          marginBottom: "24px"
        }}>
          ⚠️ Không có giao dịch nào trong khoảng thời gian đã chọn. Hãy thử điều chỉnh bộ lọc hoặc xóa bộ lọc để xem tất cả dữ liệu.
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ padding: "20px", backgroundColor: "#4CAF50", color: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", opacity: 0.9 }}>Tổng doanh thu</h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{formatCurrency(summary.totalRevenue)}</p>
        </div>
        <div style={{ padding: "20px", backgroundColor: "#2196F3", color: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", opacity: 0.9 }}>Tổng số giao dịch</h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{summary.totalPayments}</p>
        </div>
        <div style={{ padding: "20px", backgroundColor: "#FF9800", color: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", opacity: 0.9 }}>Trung bình mỗi giao dịch</h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{formatCurrency(summary.averagePayment)}</p>
        </div>
      </div>

      {/* Revenue by Station */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0 }}>Doanh thu theo trạm</h2>
          {(startDate || endDate) && (
            <span style={{ 
              fontSize: "14px", 
              color: "#666",
              fontStyle: "italic"
            }}>
              {startDate && endDate 
                ? `Từ ${startDate} đến ${endDate}` 
                : startDate 
                  ? `Từ ${startDate}` 
                  : `Đến ${endDate}`}
            </span>
          )}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Tên trạm</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Địa chỉ</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "right" }}>Doanh thu</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>Số giao dịch</th>
            </tr>
          </thead>
          <tbody>
            {revenueByStation.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center", color: "#666" }}>
                  Chưa có dữ liệu doanh thu theo trạm
                </td>
              </tr>
            ) : (
              revenueByStation.map((station) => (
                <tr key={station.stationId} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px", border: "1px solid #ddd", fontWeight: "500" }}>{station.stationName}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd", color: "#666" }}>{station.stationAddress}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "right", fontWeight: "bold", color: "#4CAF50" }}>
                    {formatCurrency(station.revenue)}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>{station.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Revenue by Method */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0 }}>Doanh thu theo phương thức thanh toán</h2>
          {(startDate || endDate) && (
            <span style={{ 
              fontSize: "14px", 
              color: "#666",
              fontStyle: "italic"
            }}>
              {startDate && endDate 
                ? `Từ ${startDate} đến ${endDate}` 
                : startDate 
                  ? `Từ ${startDate}` 
                  : `Đến ${endDate}`}
            </span>
          )}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Phương thức</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "right" }}>Doanh thu</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>Số giao dịch</th>
            </tr>
          </thead>
          <tbody>
            {summary.revenueByMethod.map((item, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{translatePaymentMethod(item.method)}</td>
                <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "right", fontWeight: "bold" }}>
                  {formatCurrency(item.revenue)}
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Payments */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0 }}>Giao dịch gần đây</h2>
          {(startDate || endDate) && (
            <span style={{ 
              fontSize: "14px", 
              color: "#666",
              fontStyle: "italic"
            }}>
              {startDate && endDate 
                ? `Từ ${startDate} đến ${endDate}` 
                : startDate 
                  ? `Từ ${startDate}` 
                  : `Đến ${endDate}`}
            </span>
          )}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Ngày</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Khách hàng</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Xe</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "right" }}>Số tiền</th>
              <th style={{ padding: "12px", border: "1px solid #ddd", textAlign: "left" }}>Phương thức</th>
            </tr>
          </thead>
          <tbody>
            {recentPayments.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "32px", border: "1px solid #ddd", textAlign: "center", color: "#666" }}>
                  Chưa có giao dịch nào
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{translatePaymentMethod(payment.paymentMethod)}</td>
              </tr>
            ) : (
              recentPayments.map((payment) => (
                <tr key={payment.paymentId} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{formatDate(payment.paymentDate)}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{payment.userName}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{payment.vehicleName}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "right", fontWeight: "bold" }}>
                    {formatCurrency(payment.amount)}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{payment.paymentMethod}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

