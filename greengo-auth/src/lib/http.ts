import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API, // https://rentev-b7ee.onrender.com
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("gg_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;
