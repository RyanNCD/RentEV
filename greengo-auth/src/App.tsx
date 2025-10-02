import { Routes, Route, Navigate } from "react-router-dom";
import AuthHero from "./components/AuthHero";   // ⟵ dùng làm trang login
import HomePage from "./pages/Homepage";
import SearchResults from "./pages/SearchResults";
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

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
