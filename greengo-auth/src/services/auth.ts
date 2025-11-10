// File: src/services/auth.ts (Bản "Lách" - V10)

import http from "../lib/http";
// Removed unused IUser import

// (Interface ILoginData giữ nguyên)
interface ILoginData { email: string; password: string; }

// === "GÓI HÀNG" (BE "Lười" trả về) ===
interface ILoginResponseFromBE {
  token: string; // (Chỉ cần token)
}

// === HÀM LOGIN (Code Lách) ===
export const login = async (data: ILoginData): Promise<ILoginResponseFromBE> => {
  const response = await http.post<ILoginResponseFromBE>("/api/Authen/login", data);
  return response.data; // (Trả về { token: "..." })
};

// (Hàm Register giữ nguyên)
export const register = async (data: any /* IRegisterData */) => {
  const response = await http.post("/api/Authen/register", data);
  return response.data;
};

// === HÀM PROFILE (Code Lách - Vô hiệu hóa) ===
// (Hàm này SẼ 401, nên mình không gọi nó)
export const getProfile = async (): Promise<any> => {
  return Promise.reject("Không dùng /profile ở code lách");
};