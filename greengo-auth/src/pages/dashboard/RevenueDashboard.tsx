import { useEffect, useState } from "react";
import { getRevenueSummary, getDailyRevenue, getRecentPayments, getRevenueByStation, type IRevenueSummary, type IDailyRevenue, type IRecentPayment, type IRevenueByStation } from "../../services/revenue";

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
      const [summaryData, dailyData, recentData, stationData] = await Promise.all([
        getRevenueSummary(startDate || undefined, endDate || undefined),
        getDailyRevenue(startDate || undefined, endDate || undefined),
        getRecentPayments(10),
        getRevenueByStation(startDate || undefined, endDate || undefined)
      ]);
      setSummary(summaryData);
      setDailyRevenue(dailyData);
      setRecentPayments(recentData);
      setRevenueByStation(stationData);
    } catch (err: any) {
      setError(err.message || "Không thể tải dữ liệu doanh thu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
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

  if (loading) return <div style={{ padding: "24px" }}>Đang tải dữ liệu...</div>;
  if (error) return <div style={{ padding: "24px", color: "red" }}>{error}</div>;
  if (!summary) return null;

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ marginBottom: "24px" }}>Báo cáo Doanh thu</h1>

      {/* Date Filter */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
        <label>
          Từ ngày:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ marginLeft: "8px", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
          />
        </label>
        <label>
          Đến ngày:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ marginLeft: "8px", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
          />
        </label>
        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
          style={{ padding: "8px 16px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Xóa bộ lọc
        </button>
      </div>

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
        <h2 style={{ marginBottom: "16px" }}>Doanh thu theo trạm</h2>
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
        <h2 style={{ marginBottom: "16px" }}>Doanh thu theo phương thức thanh toán</h2>
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
        <h2 style={{ marginBottom: "16px" }}>Giao dịch gần đây</h2>
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
            {recentPayments.map((payment) => (
              <tr key={payment.paymentId} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{formatDate(payment.paymentDate)}</td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{payment.userName}</td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{payment.vehicleName}</td>
                <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "right", fontWeight: "bold" }}>
                  {formatCurrency(payment.amount)}
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>{translatePaymentMethod(payment.paymentMethod)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

