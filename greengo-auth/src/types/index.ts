// File: src/types/index.ts

// 1. ĐỊNH NGHĨA CHO USER (Dùng cho AuthContext, Navbar...)
// (Dựa trên code AuthContext mình đã làm)
export interface IUser {
  userId: string;
  id?: string; // Alias for userId for backward compatibility
  fullName: string;
  email: string;
  phone?: string;
  role: "RENTER" | "STAFF" | "ADMIN" | "Customer" | "StaffStation";
  roleName?: string;
  roleId: string;
  isBlacklisted: boolean;
  identityCard?: string;
  driverLicense?: string;
  createdAt?: string;
  avatar?: string;
}


// 2. ĐỊNH NGHĨA CHO XE (IVehicle)
// (Dựa trên UI ông gửi: image_27bc80.jpg)
export interface IVehicle {
  // (Dựa 100% theo image_4dfa12.png)
  vehicleId: string; // Sửa 'id' -> 'vehicleId'
  stationId: string;
  vehicleName: string; // Sửa 'name' -> 'vehicleName'
  vehicleType: string;
  batteryCapacity?: number;
  status: string; // "Available"
  pricePerDay?: number; 
  licensePlate: string;
  description?: string; 
  seatingCapacity?: number;
  utilities?: string; // Sửa 'tags: string[]' -> 'utilities: string'
  numberOfRenters?: number;
  imageUrl?: string;
}

// (Ông có thể thêm các interface khác như IStation, IRental... ở đây)
// File: src/types/index.ts

// ... (Interface IUser, IVehicle giữ nguyên) ...

// === BỔ SUNG CODE MỚI ===
export interface IStation {
  stationId: string; // Sửa 'id' -> 'stationId'
  stationName: string; // Sửa 'name' -> 'stationName'
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string; // (API trả về cái này)
}
// File: src/types/index.ts (Bản V8 - Quay về 5 món)

// (IUser, IVehicle, IStation giữ nguyên)
// ...

// === SỬA LẠI HOÀN TOÀN DTOs THANH TOÁN ===

// 1. DTO cho BƯỚC 1 (Gửi lên POST /api/rental - 5 món)
export interface IRentalRequest {
  userId: string;
  vehicleId: string;
  startTime: string; 
  endTime: string;   
  status: string;
  // (KHÔNG CÓ totalCost, status)
  pickupStationId: string;
  returnStationId: string;
}
// 2. DTO "Đơn hàng" (BE trả về sau Bước 1)
export interface IContract {
  id: string; 
  vehicleName: string;
  startDate: string; 
  endDate: string; 
  totalCost: number; // (BE sẽ TỰ TÍNH và trả về cái này)
  status: "PENDING" | "PAID" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

// 3. DTO cho BƯỚC 2 (Gửi lên POST /api/payment/create)
export interface IPaymentRequest {
  userId: string;
  rentalId: string; 
  amount: number; 
  paymentMethod: string; 
  type: string;
  status: string;
}

// 4. DTO BE trả về sau Bước 2 (Link VNPay)
export interface IPaymentResponse {
  paymentUrl?: string;
  checkoutUrl?: string;
  paymentLinkId?: string;
}

// === FEEDBACK ===
export interface IFeedback {
  feedbackId: string;
  userId: string;
  rentalId: string;
  rating?: number | null;
  comment?: string | null;
  createdAt?: string | null;
  userName?: string | null;
}

// === CONTRACT ===
export interface IContract {
  contractId: string;
  userId: string;
  vehicleId: string;
  startDate: string;
  endDate?: string | null;
  terms?: string | null;
  totalAmount?: number | null;
  status?: string | null;
  createdAt?: string | null;
}

// === LỊCH SỬ THUÊ XE (phù hợp với RentalDto từ BE) ===
export interface IRentalHistoryItem {
  rentalId: string;
  contractId?: string | null;
  userId: string;
  vehicleId: string;
  vehicleName?: string | null;
  userName?: string | null;
  pickupStationId: string;
  pickupStationName?: string | null;
  returnStationId?: string | null;
  returnStationName?: string | null;
  staffId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  totalCost?: number | null;
  status: string;
  contract?: IContract | null;
}