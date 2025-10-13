import { Routes, Route, Navigate } from "react-router-dom";
import AuthHero from "./components/AuthHero";
import HomePage from "./pages/HomePage";
import SearchResults from "./pages/SearchResults";
import AdminPage from "./pages/AdminPage";
import StaffPage from "./pages/StaffPage";
import "./App.css";

export type Mode = "login" | "register";

export default function App() {
  return (
    <Routes>
      {/* Mặc định vào / sẽ tới trang login (AuthHero) */}
      <Route path="/" element={<AuthHero />} />
      <Route path="/login" element={<AuthHero />} />

      {/* Trang sau đăng nhập */}
      <Route path="/home" element={<HomePage />} />
      <Route path="/search" element={<SearchResults />} />
      
      {/* Trang quản trị */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/staff" element={<StaffPage />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
