// File: src/services/rental.ts (Bản V8 - 5 món)

import http from "../lib/http";
import { type IContract, type IRentalRequest, type IRentalHistoryItem } from "../types"; 

// === SỬA LẠI HÀM NÀY (BƯỚC 1) ===
// (Hàm này gọi POST /api/rental)
export const createRental = async (data: IRentalRequest): Promise<IContract> => {
  // (Gửi data "chuẩn" 5 món)
  const response = await http.post<IContract>("/api/rental", data);
  return response.data; 
};
// === HẾT SỬA ===


// (Hàm này cho Renter - ProfilePage, giữ nguyên)
export const getRentalHistory = async (): Promise<IRentalHistoryItem[]> => {
  const response = await http.get<IRentalHistoryItem[]>("/api/rental/my-history");
  return response.data;
};

// Lấy tất cả đơn thuê (dành cho Staff/Admin)
export const getAllRentals = async (): Promise<IRentalHistoryItem[]> => {
  const response = await http.get<IRentalHistoryItem[]>("/api/rental");
  return response.data;
};

// (Các hàm của Staff, giữ nguyên)
export const findBookingByCode = async (code: string): Promise<IContract> => {
  const response = await http.get<IContract>(`/api/rental/find-by-code/${code}`);
  return response.data;
};
export const checkInRental = async (bookingId: string, deliveryCondition?: string): Promise<IContract> => {
  const payload: Record<string, any> = { bookingId };
  if (deliveryCondition && deliveryCondition.trim().length > 0) {
    payload.deliveryCondition = deliveryCondition.trim();
  }
  const response = await http.post<IContract>(`/api/rental/check-in`, payload);
  return response.data; 
};
export const checkOutRental = async (bookingId: string): Promise<IContract> => {
  const response = await http.post<IContract>(`/api/rental/check-out`, { bookingId });
  return response.data;
};
