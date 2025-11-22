// File: src/services/rental.ts (Bản V8 - 5 món)

import http from "../lib/http";
import { type IContract, type IRentalRequest, type IRentalHistoryItem, type IFeedback } from "../types"; 

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

// Get user rental history with pagination and filtering
export interface UserRentalListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const getUserRentalHistoryPaged = async (params: UserRentalListParams): Promise<PagedRentalResult> => {
  const queryParams: UserRentalListParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    ...params,
  };
  
  const response = await http.get<PagedRentalResult>("/api/rental/my-history-paged", { params: queryParams });
  return response.data;
};

// Lấy tất cả đơn thuê (dành cho Staff/Admin) - với phân trang và lọc
export interface RentalListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  stationId?: string;
}

export interface PagedRentalResult {
  items: IRentalHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const getAllRentals = async (): Promise<IRentalHistoryItem[]> => {
  const response = await http.get<IRentalHistoryItem[]>("/api/rental");
  return response.data;
};

// Lấy đơn thuê với phân trang và lọc
export const getRentalsPaged = async (params: RentalListParams): Promise<PagedRentalResult> => {
  // Always send pagination params to get paged result
  const queryParams: RentalListParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    ...params,
  };
  
  const response = await http.get<PagedRentalResult>("/api/rental", { params: queryParams });
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

// Get rental by ID (for detail view)
export const getRentalById = async (rentalId: string): Promise<IRentalHistoryItem> => {
  const response = await http.get<IRentalHistoryItem>(`/api/rental/${rentalId}`);
  return response.data;
};

// === FEEDBACK APIs ===
export const getFeedbacksByRental = async (rentalId: string): Promise<IFeedback[]> => {
  const response = await http.get<IFeedback[]>(`/api/feedback/rental/${rentalId}`);
  return response.data;
};

// Get feedbacks by vehicle ID (public endpoint)
export const getFeedbacksByVehicle = async (vehicleId: string): Promise<IFeedback[]> => {
  const response = await http.get<IFeedback[]>(`/api/feedback/vehicle/${vehicleId}`);
  return response.data;
};

// Get average rating by vehicle ID (public endpoint)
export const getAverageRatingByVehicle = async (vehicleId: string): Promise<number> => {
  const response = await http.get<{ averageRating: number }>(`/api/feedback/vehicle/${vehicleId}/average`);
  return response.data.averageRating;
};

// Check if user can review a vehicle
export interface FeedbackEligibilityResponse {
  canReview: boolean;
  rentalId?: string;
  message: string;
}

export const checkFeedbackEligibility = async (vehicleId: string): Promise<FeedbackEligibilityResponse> => {
  const response = await http.get<FeedbackEligibilityResponse>(`/api/rental/check-feedback-eligibility/${vehicleId}`);
  return response.data;
};

export const createFeedback = async (payload: { rentalId: string; rating: number; comment?: string }): Promise<IFeedback> => {
  // userId will be extracted from JWT token on the backend, so we don't send it
  const body = {
    rentalId: payload.rentalId,
    rating: payload.rating,
    comment: payload.comment ?? null,
  };
  const response = await http.post<IFeedback>(`/api/feedback`, body);
  return response.data;
};
