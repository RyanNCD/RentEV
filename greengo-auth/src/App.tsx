import { Routes, Route, Navigate, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import AuthForm from "./components/AuthForm";
import SearchResults from "./pages/SearchResults";
import CheckinPage from "./pages/CheckinPage";
import ReturnPage from "./pages/ReturnPage";
import HomePage from "./pages/HomePage";
import { useAuth } from "./context/AuthContext";

function AboutPage() {
  return <div className="container" style={{ paddingTop: 24 }}><h1>Giới thiệu</h1></div>;
}

function PricingPage() {
  return <div className="container" style={{ paddingTop: 24 }}><h1>Bảng giá</h1></div>;
}

function ProfilePage() {
  return <div className="container" style={{ paddingTop: 24 }}><h1>Hồ sơ</h1></div>;
}

function DashboardPage() {
  const { user } = useAuth();
  
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return <Navigate to="/home" />;
  }

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1>Dashboard - Quản lý</h1>
      <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
        <Link to="/checkin" className="btn btn--primary" style={{ padding: "16px 24px", textDecoration: "none", display: "inline-block" }}>
          Quản lý giao xe
        </Link>
        <Link to="/return" className="btn btn--primary" style={{ padding: "16px 24px", textDecoration: "none", display: "inline-block" }}>
          Quản lý trả xe
        </Link>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Đang tải...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Đang tải...</div>;
  }
  
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return <Navigate to="/home" />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/login" element={<AuthForm mode="login" />} />
        <Route path="/register" element={<AuthForm mode="register" />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <StaffRoute>
              <CheckinPage />
            </StaffRoute>
          }
        />
        <Route
          path="/return"
          element={
            <StaffRoute>
              <ReturnPage />
            </StaffRoute>
          }
        />
        <Route path="/" element={<Navigate to="/home" />} />
      </Routes>
    </div>
  );
}
