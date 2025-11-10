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