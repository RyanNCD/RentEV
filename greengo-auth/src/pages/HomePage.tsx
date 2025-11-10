import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAvailableVehicles, type Vehicle } from "../services/vehicle";
import "../components/carcard.css";
import "./home.css";

export default function HomePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await getAvailableVehicles();
      setVehicles(data);
    } catch (err: any) {
      console.error("Error loading vehicles:", err);
      setError("Không thể tải danh sách xe. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getVehicleImage = (vehicleName: string) => {
    // Map vehicle name to image file
    const name = vehicleName.toLowerCase();
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

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 24, textAlign: "center" }}>
        <p>Đang tải danh sách xe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 24 }}>
        <div style={{ 
          background: "#fee", 
          color: "#c33", 
          padding: "12px", 
          borderRadius: "4px",
          marginBottom: "16px"
        }}>
          {error}
        </div>
        <button onClick={loadVehicles} className="btn btn--primary">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="home-hero">
          <h1 style={{ 
            fontSize: "48px", 
            fontWeight: 900, 
            color: "#166534",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            Thuê Xe Điện Xanh
          </h1>
          <p style={{ 
            fontSize: "20px", 
            color: "#6b7280",
            textAlign: "center",
            maxWidth: "600px",
            margin: "0 auto 32px"
          }}>
            Trải nghiệm dịch vụ thuê xe điện hiện đại, tiện lợi và thân thiện với môi trường
          </p>
        </div>

        <div className="section">
          <h2 className="section-title">Xe có sẵn để thuê</h2>
          <p className="section-sub">Chọn xe phù hợp với nhu cầu của bạn</p>

          {vehicles.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "48px",
              color: "#6b7280"
            }}>
              <p>Hiện tại không có xe nào có sẵn để thuê.</p>
              <p>Vui lòng quay lại sau.</p>
            </div>
          ) : (
            <div className="grid-cars">
              {vehicles.map((vehicle) => (
                <Link
                  key={vehicle.vehicleId}
                  to={`/vehicle/${vehicle.vehicleId}`}
                  className="car-card"
                >
                  <div className="car-card__media">
                    <img
                      src={getVehicleImage(vehicle.vehicleName)}
                      alt={vehicle.vehicleName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/car-vf7.jpg";
                      }}
                    />
                  </div>
                  <div className="car-card__badges">
                    <span className="badge success">Có sẵn</span>
                    {vehicle.seatingCapacity && (
                      <span className="badge info">{vehicle.seatingCapacity} chỗ</span>
                    )}
                  </div>
                  <div className="car-card__body">
                    <h3 className="car-card__title">{vehicle.vehicleName}</h3>
                    {vehicle.vehicleType && (
                      <p style={{ 
                        fontSize: "14px", 
                        color: "#6b7280",
                        margin: "4px 0"
                      }}>
                        {vehicle.vehicleType}
                      </p>
                    )}
                    {vehicle.batteryCapacity && (
                      <p style={{ 
                        fontSize: "14px", 
                        color: "#6b7280",
                        margin: "4px 0"
                      }}>
                        Pin: {vehicle.batteryCapacity} kWh
                      </p>
                    )}
                    <div style={{ 
                      marginTop: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span style={{ 
                        fontSize: "20px", 
                        fontWeight: 800,
                        color: "#166534"
                      }}>
                        {formatPrice(vehicle.pricePerDay)}
                        {vehicle.pricePerDay && <small style={{ fontSize: "14px" }}>/ngày</small>}
                      </span>
                    </div>
                    {vehicle.description && (
                      <p style={{ 
                        fontSize: "13px", 
                        color: "#9ca3af",
                        marginTop: "8px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {vehicle.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
