// File: src/App.tsx (Bản full)

import { Routes, Route } from "react-router-dom";

// Layouts
import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import ProtectedRoutes from "./components/ProtectedRoutes";

// Pages (Auth)
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";

// Pages (Public/Renter)
// (Sửa lại import cho đúng)
import HomePage from "./pages/public/HomePage";
import AboutPage from "./pages/public/AboutPage";
import PricingPage from "./pages/public/PricingPage";
import VehicleManagement from "./pages/dashboard/VehicleManagement";
import CarDetailPage from "./pages/public/CarDetailPage"; // <-- IMPORT MỚI

// Pages (Private Renter)
import ProfilePage from "./pages/public/ProfilePage"; 
import CheckoutPage from "./pages/public/CheckoutPage"; 
import PaymentCallbackPage from "./pages/public/PaymentCallbackPage";
import PaymentSuccessPage from "./pages/public/PaymentSuccessPage";
// Pages (Dashboard Admin/Staff)

import UserManagement from "./pages/dashboard/UserManagement";
import StaffManagement from "./pages/dashboard/StaffManagement";
import StationManagement from "./pages/dashboard/StationManagement"
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import CheckinManagement from "./pages/dashboard/CheckinManagement";
import RevenueDashboard from "./pages/dashboard/RevenueDashboard";
import PenaltyManagement from "./pages/dashboard/PenaltyManagement";
import DashboardLanding from "./pages/dashboard/DashboardLanding";
export default function App() {
  return (
    <Routes>
      {/* 1. Layout cho Renter (Public/User) */}
      <Route path="/" element={<UserLayout />}>
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        
        <Route path="about" element={<AboutPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        
        {/* === THÊM ROUTE NÀY VÀO === */}
        <Route path="vehicles/:id" element={<CarDetailPage />} />
        <Route path="payment-callback" element={<PaymentCallbackPage />} />
        <Route path="payment-success" element={<PaymentSuccessPage />} />

        {/* --- Trang Profile/Thanh toán (Cần login RENTER) --- */}
        <Route element={<ProtectedRoutes allowedRoles={["RENTER"]} />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="checkout" element={<CheckoutPage />} /> 
        </Route>
      </Route>

      {/* 2. Layout cho Auth (Login/Register) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 4. Layout cho Dashboard (Admin/Staff) */}
      <Route element={<ProtectedRoutes allowedRoles={["ADMIN", "STAFF"]} />}>
        <Route path="/dashboard" element={<AdminLayout />}>
          <Route index element={<DashboardLanding />} />

          <Route element={<ProtectedRoutes allowedRoles={["STAFF"]} />}>
            <Route path="checkin" element={<CheckinManagement />} />
            <Route path="vehicles" element={<VehicleManagement />} />
            <Route path="stations" element={<StationManagement />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          <Route element={<ProtectedRoutes allowedRoles={["ADMIN"]} />}>
            <Route path="overview" element={<AdminDashboard />} />
            <Route path="staffs" element={<StaffManagement />} />
            <Route path="revenue" element={<RevenueDashboard />} />
            <Route path="penalties" element={<PenaltyManagement />} />
          </Route>
        </Route>
      </Route>
      
      {/* 5. Trang 404 */}
      
    </Routes>
  );
}