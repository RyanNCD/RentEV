import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import SearchResults from "./pages/SearchResults";
import AboutPage from "./pages/AboutPage";
import Navbar from "./components/Navbar";
import ProfilePage from "./pages/ProfilePage";
import CarsPage from "./pages/CarsPage";
import PricingPage from "./pages/PricingPage";

export default function App() {
  return (
    <>
      {/* Navbar hiển thị trên mọi trang */}
      <Navbar logoSrc="/public/logo.png" brandText="GreenGo" />

      {/* Định tuyến */}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/cars" element={<CarsPage />} />   {/* Trang danh sách xe */}
        {/* Trang mặc định trỏ về /home để tiện quay lại từ About */}
        <Route path="*" element={<Navigate to="/home" replace />} />
        
      </Routes>
      
    </>
  );
}
