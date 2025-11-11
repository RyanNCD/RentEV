// File: src/lib/pages/public/HomePage.tsx (Bản "lách" - Quay lại API cũ)

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// === SỬA LẠI IMPORT - Dùng API available (public, không cần auth) ===
import { getAvailableVehicles, searchVehicles } from "../../services/vehicle"; 
import { type IVehicle } from "../../types"; 

// CarCard component hiển thị thông tin xe
const CarCard = ({ car }: { car: IVehicle }) => {
  const tags = car.utilities ? car.utilities.split(',').map(tag => tag.trim()) : [];
  
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

  return (
    <div style={{ border: "1px solid #eee", padding: "1rem", borderRadius: "8px", 
      background: "#fff", transition: "transform 0.2s", cursor: "pointer", height: "90%" }}
         onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
         onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
      <img 
        src={getVehicleImage(car)}
        alt={car.vehicleName}
        style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px" }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/images/car-vf7.jpg";
        }}
      />
      <h4 style={{ margin: "12px 0 8px", fontSize: "18px", fontWeight: "bold" }}>{car.vehicleName}</h4>
      {car.vehicleType && (
        <p style={{ fontSize: "14px", color: "#666", margin: "4px 0" }}>{car.vehicleType}</p>
      )}
      {car.batteryCapacity && (
        <p style={{ fontSize: "14px", color: "#666", margin: "4px 0" }}>Pin: {car.batteryCapacity} kWh</p>
      )}
      <p style={{ fontSize: "16px", fontWeight: "bold", color: "#166534", margin: "8px 0" }}>
        {formatPrice(car.pricePerDay)}
        {car.pricePerDay && <small style={{ fontSize: "12px" }}>/ngày</small>}
      </p>
      {tags.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          {tags.map(tag => (
            <span key={tag} style={{ 
              background: "#f0f0f0", 
              padding: "4px 8px", 
              fontSize: "12px", 
              marginRight: "4px",
              borderRadius: "4px",
              display: "inline-block",
              marginTop: "4px"
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
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

  // === Dùng API /api/vehicle/available (Public API - không cần auth) ===
  useEffect(() => {
    const fetchInitialVehicles = async () => {
      try {
        setLoading(true);
        // Gọi API available để lấy danh sách xe có sẵn để thuê
        const data = await getAvailableVehicles(); 
        setVehicles(data);
      } catch (err: any) {
        console.error("Error loading vehicles:", err);
        setError("Không thể tải danh sách xe. Vui lòng thử lại sau."); 
      } finally {
        setLoading(false);
      }
    };
    fetchInitialVehicles();
  }, []);


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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", padding: "2rem", alignItems: "stretch" }}>
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