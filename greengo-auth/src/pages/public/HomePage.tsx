// File: src/lib/pages/public/HomePage.tsx (Bản "lách" - Quay lại API cũ)

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// === SỬA LẠI IMPORT (Bỏ featured, Lấy lại getAll) ===
import { getAllVehicles, searchVehicles } from "../../services/vehicle"; 
import { type IVehicle } from "../../types"; 

// (CarCard component giữ nguyên, đã fix JSON thật)
const CarCard = ({ car }: { car: IVehicle }) => {
  const tags = car.utilities ? car.utilities.split(',').map(tag => tag.trim()) : [];
  return (
    <div style={{ border: "1px solid #eee", padding: "1rem", borderRadius: "8px" }}>
      <img 
        src={"/images/car-vf7.jpg"} // (DÙNG TẠM)
        alt={car.vehicleName}
        style={{ width: "100%", height: "150px", objectFit: "cover" }} 
      />
      <h4>{car.vehicleName}</h4>
      <p>{car.pricePerDay.toLocaleString("vi-VN")} VNĐ/ngày</p>
      <div>
        {tags.map(tag => (
          <span key={tag} style={{ background: "#f0f0f0", padding: "2px 6px", fontSize: "12px", marginRight: "4px" }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};


export default function HomePage() {
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // === SỬA LẠI CHỖ NÀY (Quay về API cũ) ===
  useEffect(() => {
    const fetchInitialVehicles = async () => {
      try {
        setLoading(true);
        // Bỏ: const data = await getFeaturedVehicles();
        // Sửa thành: Gọi API "/api/Vehicle" (API này 100% có)
        const data = await getAllVehicles(); 
        setVehicles(data);
      } catch (err) {
        // (Sửa lại câu báo lỗi)
        setError("Không thể tải danh sách xe."); 
      } finally {
        setLoading(false);
      }
    };
    fetchInitialVehicles();
  }, []); 
  // === HẾT SỬA ===


  // (Hàm handleSearch giữ nguyên, vẫn dùng /api/Vehicle/search)
  const handleSearch = async (e: React.FormEvent) => {
    // ... (code cũ giữ nguyên) ...
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
        const params = {
            location: location || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined
        };
        const data = await searchVehicles(params); 
        setVehicles(data);
        if (data.length === 0) {
          setError("Không tìm thấy xe nào phù hợp với bộ lọc.");
        }
    } catch (err) {
        setError("Tìm kiếm thất bại. Vui lòng thử lại.");
        setVehicles([]);
    } finally {
        setLoading(false);
    }
  };

  // (Hàm renderContent giữ nguyên)
  const renderContent = () => {
    // ... (code cũ giữ nguyên) ...
    if (loading) return <div style={{ padding: "2rem" }}>Đang tải danh sách xe...</div>;
    if (error && vehicles.length === 0) return <div style={{ padding: "2rem", color: "red" }}>Lỗi: {error}</div>;
    if (vehicles.length === 0) return <div style={{ padding: "2rem" }}>Không tìm thấy xe nào.</div>;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", padding: "2rem" }}>
        {vehicles.map((car) => (
          <Link to={`/vehicles/${car.vehicleId}`} key={car.vehicleId} style={{ textDecoration: "none", color: "inherit" }}>
            <CarCard car={car} />
          </Link>
        ))}
      </div>
    );
  };

  // (return của HomePage giữ nguyên)
  return (
    <div className="home-page">
      <form className="filter-bar" onSubmit={handleSearch} style={{ padding: "2rem", background: "#f9f9f9", display: "flex", gap: "1rem" }}>
        {/* ... (code input giữ nguyên) ... */}
        <input placeholder="Địa điểm" value={location} onChange={e => setLocation(e.target.value)} style={{ padding: "0.5rem" }} />
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: "0.5rem" }} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: "0.5rem" }} />
        <button type="submit" disabled={loading} className="btn btn--primary">
          {loading ? "Đang tìm..." : "Tìm xe"}
        </button>
      </form>
      {renderContent()}
    </div>
  );
}