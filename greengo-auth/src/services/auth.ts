// File: src/services/auth.ts (Bản "Lách" - V10)

import http from "../lib/http";

interface ILoginData { email: string; password: string; deviceId?: string; }

export interface LoginResponseFromBE {
  success: boolean;
  token?: string;
  requiresOtp?: boolean;
  otpRequestId?: string;
  requiresEmailVerification?: boolean;
  message?: string;
  trustedDeviceUsed?: boolean;
}

export const login = async (data: ILoginData): Promise<LoginResponseFromBE> => {
  const response = await http.post<LoginResponseFromBE>("/api/Authen/login", data);
  return response.data;
};

export const register = async (data: any) => {
  const response = await http.post("/api/Authen/register", data);
  return response.data;
};

export interface VerifyOtpPayload {
  otpRequestId: string;
  code: string;
  rememberDevice?: boolean;
  deviceId?: string;
}

export const verifyOtp = async (payload: VerifyOtpPayload): Promise<LoginResponseFromBE> => {
  const response = await http.post<LoginResponseFromBE>("/api/Authen/verify-otp", payload);
  return response.data;
};

export const verifyEmail = async (token: string) => {
  const response = await http.post("/api/Authen/verify-email", { token });
  return response.data;
};

export const resendVerificationEmail = async (email: string) => {
  const response = await http.post("/api/Authen/resend-email-verification", { email });
  return response.data;
};

export const getProfile = async (): Promise<any> => {
  return Promise.reject("Không dùng /profile ở code lách");
};