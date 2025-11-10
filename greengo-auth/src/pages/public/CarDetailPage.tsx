// File: src/lib/pages/public/CarDetailPage.tsx (Bản fix theo JSON thật)

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import { getVehicleById } from "../../services/vehicle";
import { type IVehicle } from "../../types";

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate(); 
  
  const [vehicle, setVehicle] = useState<IVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) {
      setError("ID xe không hợp lệ");
      setLoading(false);
      return;
    }
    
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        // (getVehicleById đã được sửa service trỏ đúng /api/Vehicle/{id})
        const data = await getVehicleById(id); 
        setVehicle(data);
      } catch (err) {
        setError("Không tìm thấy xe hoặc có lỗi xảy ra.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicle();
  }, [id]);

  const handleBookNow = () => {
    // (navigate to checkout, object "vehicle" giờ đã khớp 100% với BE)
    navigate("/checkout", { state: { car: vehicle } });
  };

  if (loading) return <div style={{ padding: "2rem" }}>Đang tải chi tiết xe...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;
  if (!vehicle) return <div style={{ padding: "2rem" }}>Không tìm thấy xe</div>;

  return (
    <div style={{ padding: "2rem" }}>
      {/* CẢNH BÁO: API (image_4dfa12.png) không trả về 'imageUrl'.
        Dùng tạm ảnh.
      */}
      <img 
        src={"/images/car-vf7.jpg"} // (DÙNG TẠM)
        alt={vehicle.vehicleName} // Sửa: name -> vehicleName
        style={{ width: "100%", maxWidth: "600px" }} 
      />
      <h1>{vehicle.vehicleName}</h1> {/* Sửa: name -> vehicleName */}
      <p>{vehicle.description}</p>
      <h3>Giá: {vehicle.pricePerDay.toLocaleString("vi-VN")} VNĐ / ngày</h3>
      
      <button onClick={handleBookNow} className="btn btn--primary" style={{ padding: "1rem", fontSize: "18px" }}>
        Thuê ngay
      </button>
    </div>
  );
}