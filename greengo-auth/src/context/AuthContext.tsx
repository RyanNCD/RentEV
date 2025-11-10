import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginApi } from "../services/auth";
import { getMe, type User } from "../services/user";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  user: User & { role?: string } | null;
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User & { role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem("accessToken");
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getMe();
      // Decode token to get role
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          // Map backend role names to frontend role names
          const backendRole = decoded.role || decoded.Role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "Customer";
          // Normalize role names: Admin -> ADMIN, StaffStation -> STAFF, Customer -> CUSTOMER
          userData.role = backendRole.toUpperCase() === "ADMIN" ? "ADMIN" : 
                         backendRole.toUpperCase().includes("STAFF") ? "STAFF" : 
                         "CUSTOMER";
        } catch (e) {
          console.error("Error decoding token:", e);
          userData.role = "CUSTOMER";
        }
      }
      setUser(userData as User & { role?: string });
    } catch (error) {
      console.error("Error loading user:", error);
      localStorage.removeItem("accessToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, redirectTo?: string) => {
    const response = await loginApi({ email, password });
    localStorage.setItem("accessToken", response.token);
    await loadUser();
    navigate(redirectTo || "/home");
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    navigate("/home");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
