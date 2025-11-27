// File: src/lib/pages/public/HomePage.tsx (Bản "lách" - Quay lại API cũ)

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
// === SỬA LẠI IMPORT - Dùng API available (public, không cần auth) ===
import { getAvailableVehicles, searchVehicles } from "../../services/vehicle"; 
import { getAllStations } from "../../services/station";
import { type IVehicle, type IStation } from "../../types"; 

// Extended vehicle type with station info
interface IVehicleWithStation extends IVehicle {
  stationName?: string;
  stationAddress?: string;
}

// CarCard component hiển thị thông tin xe
const CarCard = ({ car }: { car: IVehicleWithStation }) => {
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
      {/* Hiển thị thông tin trạm sạc */}
      {car.stationName && (
        <div style={{ marginTop: "8px", padding: "8px", background: "#f0fdf4", borderRadius: "4px", border: "1px solid #dcfce7" }}>
          <p style={{ fontSize: "13px", fontWeight: "600", color: "#166534", margin: "0 0 4px 0" }}>
            📍 {car.stationName}
          </p>
          {car.stationAddress && (
            <p style={{ fontSize: "12px", color: "#6b7280", margin: "0" }}>
              {car.stationAddress}
            </p>
          )}
        </div>
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
  const [vehicles, setVehicles] = useState<IVehicleWithStation[]>([]);
  const [allVehicles, setAllVehicles] = useState<IVehicleWithStation[]>([]);
  const [stations, setStations] = useState<IStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000000 });
  const [sortBy, setSortBy] = useState<string>("");

  // Fetch stations on mount
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await getAllStations();
        setStations(data);
      } catch (err: any) {
        console.error("Error loading stations:", err);
        // If stations fail to load, continue without station info
      }
    };
    fetchStations();
  }, []);

  // === Dùng API /api/vehicle/available (Public API - không cần auth) ===
  useEffect(() => {
    const fetchInitialVehicles = async () => {
      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        console.log(`[HomePage] Fetching available vehicles at ${timestamp}...`);
        
        // Gọi API available để lấy danh sách xe có sẵn để thuê
        const data = await getAvailableVehicles(); 
        
        console.log(`[HomePage] Loaded ${data.length} available vehicles:`, 
          data.map(v => ({ id: v.vehicleId, name: v.vehicleName, status: v.status }))
        );
        
        // Map station info to vehicles
        const vehiclesWithStation: IVehicleWithStation[] = data.map(vehicle => {
          const station = stations.find(s => s.stationId === vehicle.stationId);
          return {
            ...vehicle,
            stationName: station?.stationName,
            stationAddress: station?.address
          };
        });
        
        setAllVehicles(vehiclesWithStation);
        setVehicles(vehiclesWithStation);
        
        // Tính toán khoảng giá từ dữ liệu
        const prices = vehiclesWithStation
          .map(v => v.pricePerDay)
          .filter((p): p is number => p !== undefined && p > 0);
        
        if (prices.length > 0) {
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          // Làm tròn để đẹp hơn
          const roundedMin = Math.floor(min / 100000) * 100000;
          const roundedMax = Math.ceil(max / 100000) * 100000;
          setPriceRange({ min: roundedMin, max: roundedMax });
          setMinPrice(roundedMin);
          setMaxPrice(roundedMax);
        }
      } catch (err: any) {
        console.error("[HomePage] Error loading vehicles:", err);
        setError("Không thể tải danh sách xe. Vui lòng thử lại sau."); 
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialVehicles();
    
    // BONUS: Auto refresh mỗi 60 giây để đồng bộ với admin updates
    const refreshInterval = setInterval(() => {
      console.log("[HomePage] Auto-refreshing vehicle list...");
      fetchInitialVehicles();
    }, 60000); // 60 giây
    
    return () => clearInterval(refreshInterval);
  }, [stations]); // Re-run when stations are loaded

  // Hàm handleSearch - lọc xe theo địa điểm và khoảng giá
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  // Hàm áp dụng filter và sort
  const applyFilters = useCallback(() => {
    if (allVehicles.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
        // Filter by station if selected
        let filteredVehicles = [...allVehicles];
        
        if (selectedStationId) {
          filteredVehicles = filteredVehicles.filter(v => v.stationId === selectedStationId);
        }

        // Filter by price range
        const currentMinPrice = Number(minPrice) || priceRange.min;
        const currentMaxPrice = Number(maxPrice) || priceRange.max;
        
        filteredVehicles = filteredVehicles.filter(v => {
          if (v.pricePerDay === undefined) return false;
          return v.pricePerDay >= currentMinPrice && v.pricePerDay <= currentMaxPrice;
        });

        // Apply sorting
        filteredVehicles = applySorting(filteredVehicles, sortBy);
        
        setVehicles(filteredVehicles);
        if (filteredVehicles.length === 0) {
          setError("Không tìm thấy xe nào phù hợp với bộ lọc.");
        } else {
          setError(null);
        }
    } catch (err) {
        setError("Tìm kiếm thất bại. Vui lòng thử lại.");
        setVehicles([]);
    } finally {
        setLoading(false);
    }
  }, [allVehicles, selectedStationId, minPrice, maxPrice, priceRange, sortBy]);

  // Hàm áp dụng sắp xếp
  const applySorting = (vehiclesToSort: IVehicleWithStation[], sortOption: string): IVehicleWithStation[] => {
    const sorted = [...vehiclesToSort];
    
    switch (sortOption) {
      case "price-asc":
        return sorted.sort((a, b) => {
          const priceA = a.pricePerDay ?? 0;
          const priceB = b.pricePerDay ?? 0;
          return priceA - priceB;
        });
      case "price-desc":
        return sorted.sort((a, b) => {
          const priceA = a.pricePerDay ?? 0;
          const priceB = b.pricePerDay ?? 0;
          return priceB - priceA;
        });
      case "battery-asc":
        // Sort by battery capacity ascending
        return sorted.sort((a, b) => {
          const batteryA = a.batteryCapacity ?? 0;
          const batteryB = b.batteryCapacity ?? 0;
          return batteryA - batteryB;
        });
      case "battery-desc":
        // Sort by battery capacity descending
        return sorted.sort((a, b) => {
          const batteryA = a.batteryCapacity ?? 0;
          const batteryB = b.batteryCapacity ?? 0;
          return batteryB - batteryA;
        });
      case "renters-asc":
        // Sort by number of renters ascending
        return sorted.sort((a, b) => {
          const rentersA = a.numberOfRenters ?? 0;
          const rentersB = b.numberOfRenters ?? 0;
          return rentersA - rentersB;
        });
      case "renters-desc":
        // Sort by number of renters descending
        return sorted.sort((a, b) => {
          const rentersA = a.numberOfRenters ?? 0;
          const rentersB = b.numberOfRenters ?? 0;
          return rentersB - rentersA;
        });
      default:
        return sorted;
    }
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    
    // Apply sorting immediately to current vehicles
    const sorted = applySorting(vehicles, newSortBy);
    setVehicles(sorted);
  };

  // Auto apply filters when price range or station changes
  useEffect(() => {
    if (allVehicles.length > 0 && priceRange.max > priceRange.min) {
      applyFilters();
    }
  }, [minPrice, maxPrice, selectedStationId, applyFilters]);

  const handleResetFilter = () => {
    setSelectedStationId("");
    setMinPrice(priceRange.min);
    setMaxPrice(priceRange.max);
    setSortBy("");
    setVehicles(allVehicles);
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // (Hàm renderContent giữ nguyên)
  const renderContent = () => {
    if (loading) return (
      <div style={{ 
        padding: "4rem 2rem", 
        textAlign: "center",
        color: "#6b7280",
        fontSize: "16px"
      }}>
        Đang tải danh sách xe...
      </div>
    );
    if (error && vehicles.length === 0) return (
      <div style={{ 
        padding: "4rem 2rem", 
        textAlign: "center",
        color: "#dc2626",
        fontSize: "16px",
        background: "#fef2f2",
        borderRadius: "12px",
        margin: "24px 0"
      }}>
        Lỗi: {error}
      </div>
    );
    if (vehicles.length === 0) return (
      <div style={{ 
        padding: "4rem 2rem", 
        textAlign: "center",
        color: "#6b7280",
        fontSize: "16px",
        background: "#f9fafb",
        borderRadius: "12px",
        margin: "24px 0"
      }}>
        Không tìm thấy xe nào phù hợp với bộ lọc.
      </div>
    );
    return (
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
        gap: "24px", 
        padding: "24px 0",
        alignItems: "stretch" 
      }}>
        {vehicles.map((car) => (
          <Link 
            to={`/vehicles/${car.vehicleId}`} 
            key={car.vehicleId} 
            style={{ 
              textDecoration: "none", 
              color: "inherit",
              display: "block"
            }}
          >
            <CarCard car={car} />
          </Link>
        ))}
      </div>
    );
  };

  // (return của HomePage giữ nguyên)
  return (
    <div className="home-page" style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
      <form 
        className="filter-bar" 
        onSubmit={handleSearch} 
        style={{ 
          background: "white", 
          borderRadius: "16px", 
          padding: "24px", 
          margin: "24px 0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e5e7eb"
        }}
      >
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: "20px", 
          alignItems: "stretch",
          marginBottom: "20px"
        }}
        className="filter-grid"
        >
          {/* Dropdown lọc theo địa điểm (trạm sạc) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%" }}>
            <label style={{ 
              fontSize: "13px", 
              fontWeight: "600", 
              color: "#374151",
              letterSpacing: "0.025em"
            }}>
              Địa điểm
            </label>
            <select 
              value={selectedStationId} 
              onChange={e => setSelectedStationId(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "12px 16px", 
                borderRadius: "12px", 
                border: "1px solid #e5e7eb", 
                fontSize: "14px", 
                background: "white",
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: "500"
              }}
              onFocus={(e) => e.target.style.borderColor = "#16a34a"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            >
              <option value="">Tất cả địa điểm</option>
              {stations.map(station => (
                <option key={station.stationId} value={station.stationId}>
                  {station.stationName} - {station.address}
                </option>
              ))}
            </select>
          </div>
          
          {/* Range Slider cho khoảng giá */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "8px", 
            gridColumn: "span 2",
            height: "100%",
            minHeight: "100px"
          }} className="price-range-container">
            <label style={{ 
              fontSize: "13px", 
              fontWeight: "600", 
              color: "#374151",
              letterSpacing: "0.025em"
            }}>
              Khoảng giá
            </label>
            <div style={{ 
              background: "#f9fafb", 
              padding: "20px", 
              borderRadius: "12px", 
              border: "1px solid #e5e7eb",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}>
              <div style={{ position: "relative", }}>
                {/* Background track */}
                <div style={{ 
                  position: "absolute", 
                  top: "100%", 
                  left: 0, 
                  right: 0, 
                  height: "8px", 
                  background: "#e5e7eb", 
                  borderRadius: "4px", 
                  transform: "translateY(-50%)" 
                }} />
                
                {/* Active range */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: `${((Number(minPrice) || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%`,
                    width: `${((Number(maxPrice) || priceRange.max) - (Number(minPrice) || priceRange.min)) / (priceRange.max - priceRange.min) * 100}%`,
                    height: "8px",
                    background: "linear-gradient(90deg, #16a34a, #22c55e)",
                    borderRadius: "4px",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                    boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)"
                  }}
                />
                
                {/* Min price slider */}
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={minPrice || priceRange.min}
                  onChange={(e) => {
                    const newMin = Number(e.target.value);
                    const currentMax = Number(maxPrice) || priceRange.max;
                    if (newMin <= currentMax) {
                      setMinPrice(newMin);
                    } else {
                      setMinPrice(currentMax);
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    width: "100%",
                    height: "8px",
                    background: "transparent",
                    outline: "none",
                    zIndex: 3,
                    WebkitAppearance: "none",
                    appearance: "none",
                    margin: 0,
                    transform: "translateY(-50%)",
                    cursor: "pointer"
                  }}
                />
                
                {/* Max price slider */}
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={maxPrice || priceRange.max}
                  onChange={(e) => {
                    const newMax = Number(e.target.value);
                    const currentMin = Number(minPrice) || priceRange.min;
                    if (newMax >= currentMin) {
                      setMaxPrice(newMax);
                    } else {
                      setMaxPrice(currentMin);
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    width: "100%",
                    height: "8px",
                    background: "transparent",
                    outline: "none",
                    zIndex: 2,
                    WebkitAppearance: "none",
                    appearance: "none",
                    margin: 0,
                    transform: "translateY(-50%)",
                    cursor: "pointer"
                  }}
                />
              </div>
              
              {/* Giá trị hiển thị dưới slider */}
              <div style={{ 
                position: "relative", 
                width: "100%", 
                height: "24px",
                marginTop: "24px"
              }}>
                <div style={{ 
                  position: "absolute",
                  left: `${((Number(minPrice) || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%`,
                  transform: "translateX(-50%)",
                  background: "white", 
                  padding: "6px 10px", 
                  borderRadius: "6px", 
                  border: "1.5px solid #16a34a",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#166534",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  zIndex: 10
                }}>
                  {formatPrice(Number(minPrice) || priceRange.min)}
                </div>
                <div style={{ 
                  position: "absolute",
                  left: `${((Number(maxPrice) || priceRange.max) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%`,
                  transform: "translateX(-50%)",
                  background: "white", 
                  padding: "6px 10px", 
                  borderRadius: "6px", 
                  border: "1.5px solid #16a34a",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#166534",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  zIndex: 10
                }}>
                  {formatPrice(Number(maxPrice) || priceRange.max)}
                </div>
              </div>
              
              <style>{`
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 22px;
                  height: 22px;
                  background: white;
                  border: 3px solid #16a34a;
                  cursor: pointer;
                  border-radius: 50%;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.15), 0 0 0 4px rgba(22, 163, 74, 0.1);
                  transition: all 0.2s;
                }
                input[type="range"]::-webkit-slider-thumb:hover {
                  transform: scale(1.1);
                  box-shadow: 0 3px 8px rgba(0,0,0,0.2), 0 0 0 5px rgba(22, 163, 74, 0.15);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 22px;
                  height: 22px;
                  background: white;
                  border: 3px solid #16a34a;
                  cursor: pointer;
                  border-radius: 50%;
                  border: none;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                  transition: all 0.2s;
                }
                input[type="range"]::-moz-range-thumb:hover {
                  transform: scale(1.1);
                  box-shadow: 0 3px 8px rgba(0,0,0,0.2);
                }
                input[type="range"]::-webkit-slider-runnable-track {
                  height: 8px;
                  background: transparent;
                }
                input[type="range"]::-moz-range-track {
                  height: 8px;
                  background: transparent;
                }
                input[type="range"]:focus {
                  outline: none;
                }
                input[type="range"]:focus::-webkit-slider-thumb {
                  box-shadow: 0 0 0 5px rgba(22, 163, 74, 0.2), 0 2px 6px rgba(0,0,0,0.15);
                }
              `}</style>
            </div>
          </div>
          
          {/* Sắp xếp */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%" }}>
            <label style={{ 
              fontSize: "13px", 
              fontWeight: "600", 
              color: "#374151",
              letterSpacing: "0.025em"
            }}>
              Sắp xếp theo
            </label>
            <select 
              value={sortBy} 
              onChange={handleSortChange}
              style={{ 
                width: "100%", 
                padding: "12px 16px", 
                borderRadius: "12px", 
                border: "1px solid #e5e7eb", 
                fontSize: "14px", 
                background: "white",
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: "500"
              }}
              onFocus={(e) => e.target.style.borderColor = "#16a34a"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            >
              <option value="">Mặc định</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="battery-asc">Dung lượng pin tăng dần</option>
              <option value="battery-desc">Dung lượng pin giảm dần</option>
              <option value="renters-asc">Số người thuê tăng dần</option>
              <option value="renters-desc">Số người thuê giảm dần</option>
            </select>
          </div>
        </div>
        
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          justifyContent: "flex-end",
          paddingTop: "12px",
          borderTop: "1px solid #f3f4f6"
        }}>
          {(selectedStationId || (minPrice !== "" && minPrice !== priceRange.min) || (maxPrice !== "" && maxPrice !== priceRange.max) || sortBy) && (
            <button 
              type="button" 
              onClick={handleResetFilter}
              style={{ 
                padding: "12px 24px", 
                background: "white", 
                color: "#6b7280", 
                borderRadius: "12px", 
                border: "1px solid #e5e7eb", 
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              Đặt lại
            </button>
          )}
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              padding: "12px 32px", 
              borderRadius: "12px", 
              border: "none", 
              cursor: loading ? "not-allowed" : "pointer", 
              opacity: loading ? 0.7 : 1,
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "white",
              fontWeight: "700",
              fontSize: "15px",
              boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.3), 0 2px 4px -1px rgba(22, 163, 74, 0.2)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 8px -1px rgba(22, 163, 74, 0.4), 0 4px 6px -1px rgba(22, 163, 74, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(22, 163, 74, 0.3), 0 2px 4px -1px rgba(22, 163, 74, 0.2)";
              }
            }}
          >
            {loading ? "Đang tìm..." : "Tìm xe"}
          </button>
        </div>
      </form>
      {renderContent()}
      <style>{`
        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: 1fr !important;
          }
          .price-range-container {
            grid-column: span 1 !important;
          }
          .home-page {
            padding: 0 0.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .filter-grid {
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}