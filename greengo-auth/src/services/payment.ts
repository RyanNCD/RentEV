// File: src/services/payment.ts (Bản fix 2 Bước)

import http from "../lib/http";
// (Sửa lại DTO)
import { type IPaymentRequest, type IPaymentResponse } from "../types"; 

// === SỬA LẠI HÀM NÀY (BƯỚC 2) ===
// (Hàm này gọi POST /api/payment/create - theo image_a3afb5.png)
export const createPaymentRequest = async (data: IPaymentRequest): Promise<IPaymentResponse> => {
  const response = await http.post<IPaymentResponse>("/api/payment/create", data);
  return response.data;
};
// === HẾT SỬA ===

// (Hàm Callback giữ nguyên)
export const verifyPaymentCallback = async (queryString: string): Promise<any> => {
  const response = await http.get(`/api/payment/vnpay-return?${queryString}`);
  return response.data;
};

// Confirm payment status after successful PayOS checkout
export const confirmPayment = async (paymentId: string): Promise<any> => {
  const response = await http.post(`/api/payment/${paymentId}/confirm`);
  return response.data;
};

// Station payment functions
export interface CreateStationPayOSPaymentRequest {
  rentalId: string;
}

export interface StationPaymentConfirmRequest {
  rentalId: string;
  paymentMethod: "Cash" | "BankTransfer" | "PayOS";
  paymentProofImageUrl?: string;
}

// Staff tạo payment link PayOS tại trạm
export const createStationPayOSPayment = async (data: CreateStationPayOSPaymentRequest): Promise<{ checkoutUrl: string; rentalId: string }> => {
  const response = await http.post<{ checkoutUrl: string; rentalId: string }>("/api/payment/station/create-payos", data);
  return response.data;
};

// Staff xác nhận thanh toán tại trạm (Cash hoặc BankTransfer)
export const confirmStationPayment = async (data: StationPaymentConfirmRequest): Promise<any> => {
  const response = await http.post("/api/payment/station/confirm", data);
  return response.data;
};

// Get payments by rental ID
export interface IPayment {
  paymentId: string;
  rentalId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  type: string;
  status: string;
  paymentDate?: string | null;
  transactionId?: string | null;
}

export const getPaymentsByRentalId = async (rentalId: string): Promise<IPayment[]> => {
  const response = await http.get<IPayment[]>(`/api/payment/rental/${rentalId}`);
  return response.data;
};