// File: src/services/vehicle.ts (Bản full cuối cùng)

import http from "../lib/http";
// (Import "khuôn" IVehicle đã được fix theo JSON thật - image_4dfa12.png)
import { type IVehicle } from "../types"; 

// --- DTOs (Khuôn mẫu) cho các hàm ---

// (DTO cho Create - Bỏ 'vehicleId' vì BE tự tạo)
type VehicleCreateDto = Omit<IVehicle, "vehicleId">; 
// (DTO cho Update - Partial cho phép sửa 1 phần)
type VehicleUpdateDto = Partial<IVehicle>;

// (DTO cho Search Bar - Dùng ở HomePage)
interface ISearchParams {
  location?: string;
  startDate?: string;
  endDate?: string;
}

// (DTO cho Bộ lọc chi tiết - API /filter)
interface IFilterParams {
  vehicleType?: string;
  seatingCapacity?: number;
  // (Thêm các trường khác BE hỗ trợ)
}

// (DTO cho Sắp xếp - API /sort)
interface ISortParams {
  sortBy: "price" | "name"; // (Hỏi BE cho chuẩn)
  order: "asc" | "desc";
}


// === CÁC HÀM CHO RENTER (KHÁCH THUÊ) ===

// 1. Lấy TẤT CẢ xe (Giờ ít dùng, vì nặng)
export const getAllVehicles = async (): Promise<IVehicle[]> => {
  const response = await http.get<IVehicle[]>("/api/vehicle"); 
  return response.data;
};

// 2. Lấy xe NỔI BẬT (Dùng cho HomePage load lần đầu)
export const getFeaturedVehicles = async (): Promise<IVehicle[]> => {
  const response = await http.get<IVehicle[]>("/api/vehicle/featured");
  return response.data;
};

// 3. Lấy 1 xe (Dùng cho CarDetailPage)
export const getVehicleById = async (id: string): Promise<IVehicle> => {
  const response = await http.get<IVehicle>(`/api/vehicle/${id}`);
  return response.data;
};

// 4. TÌM KIẾM (Hàm ông bị thiếu - Dùng cho Search Bar)
export const searchVehicles = async (params: ISearchParams): Promise<IVehicle[]> => {
    const response = await http.get<IVehicle[]>("/api/vehicle/search", { params });
    return response.data;
};

// 5. LỌC (API mới)
export const filterVehicles = async (params: IFilterParams): Promise<IVehicle[]> => {
  const response = await http.get<IVehicle[]>("/api/vehicle/filter", { params });
  return response.data;
};

// 6. SẮP XẾP (API mới)
export const sortVehicles = async (params: ISortParams): Promise<IVehicle[]> => {
  const response = await http.get<IVehicle[]>("/api/vehicle/sort", { params });
  return response.data;
};


// === CÁC HÀM CHO ADMIN (CRUD) ===

// 7. TẠO MỚI (Admin)
export const createVehicle = async (data: VehicleCreateDto): Promise<IVehicle> => {
  const response = await http.post<IVehicle>("/api/vehicle", data);
  return response.data;
};

// 8. CẬP NHẬT (Admin)
export const updateVehicle = async (id: string, data: VehicleUpdateDto): Promise<IVehicle> => {
  const response = await http.put<IVehicle>(`/api/vehicle/${id}`, data);
  return response.data;
};

// 9. XÓA (Admin)
export const deleteVehicle = async (id: string): Promise<void> => {
  await http.delete(`/api/vehicle/${id}`);
};