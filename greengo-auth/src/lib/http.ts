// File: src/lib/http.ts

import axios, { type InternalAxiosRequestConfig } from "axios";

const http = axios.create({

  baseURL: "https://rentev-b7ee.onrender.com", 
  timeout: 10000, // 10 giây
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Tự động gắn AccessToken vào header
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy token từ localStorage
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// (Optional) Response Interceptor: Xử lý lỗi 401 (Token hết hạn)
// Sau này mình làm thêm, ví dụ tự động gọi API refresh token
// http.interceptors.response.use(...)

export default http;
