// File: src/context/AuthContext.tsx (Bản "Lách" V4 - Fix "Customer")

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
// (loginService giờ trả về { token: "..." })
import { login as loginService, type LoginResponseFromBE } from "../services/auth";
import { type IUser } from "../types";
import {
  decodeToken,
  mapServerRoleToAppRole,
  getRedirectPathForRole,
  isTokenExpired,
  type AppRole,
} from "../services/authRole";

// === 1. ĐỊNH NGHĨA KHUÔN CONTEXT ===
interface IAuthContext {
  user: IUser | null;
  isLoading: boolean;
  login: (email: string, pass: string, redirectTo?: string, deviceId?: string) => Promise<LoginResponseFromBE>;
  completeLoginWithToken: (token: string, redirectTo?: string) => void;
  logout: () => void;
}

// === 2. ĐỊNH NGHĨA KHUÔN PROPS ===
interface AuthProviderProps {
  readonly children: ReactNode;
}

// (Removed unused IDecodedToken interface)

// === 4. HÀM "THÔNG DỊCH" (Fix theo "Customer" - image_8f2aad.png) ===
const appRoleToUserRole = (appRole: AppRole): IUser["role"] => {
  switch (appRole) {
    case "ADMIN":
      return "ADMIN";
    case "STAFF_STATION":
      return "STAFF";
    case "CUSTOMER":
      return "RENTER";
  }
};


// === 5. TẠO CONTEXT ===
const AuthContext = createContext<IAuthContext | null>(null);

// (Provider component)
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const navigate = useNavigate();

  const applyToken = useCallback((token: string, redirectTo?: string) => {
    const decoded = decodeToken(token);
    const appRole = mapServerRoleToAppRole(decoded.role);
    if (!appRole) {
      throw new Error("Missing or invalid role in token");
    }
    const userFromToken: IUser = {
      id: decoded.nameid || "",
      email: decoded.email || "",
      fullName: decoded.email || "",
      role: appRoleToUserRole(appRole),
    };
    setUser(userFromToken);
    localStorage.setItem("accessToken", token);
    if (redirectTo) {
      navigate(redirectTo, { replace: true });
    } else {
      navigate(getRedirectPathForRole(appRole));
    }
  }, [navigate]);

  // (useEffect "Lách" - Dùng khi F5)
  useEffect(() => {
    const checkLoginStatus = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        const decoded = decodeToken(accessToken);
        if (!decoded.role || isTokenExpired(decoded)) {
          localStorage.removeItem("accessToken");
        } else {
          const appRole = mapServerRoleToAppRole(decoded.role);
          if (!appRole) {
            console.error("Invalid role in token:", decoded.role);
            localStorage.removeItem("accessToken");
          } else {
            const userFromToken: IUser = {
              id: decoded.nameid || "",
              email: decoded.email || "",
              fullName: decoded.email || "",
              role: appRoleToUserRole(appRole),
            };
            setUser(userFromToken);
          }
        }
      }
      setIsLoading(false); 
    };
    checkLoginStatus();
  }, []); 

  // (Hàm login "Lách")
  const login = useCallback(
    async (email: string, pass: string, redirectTo?: string, deviceId?: string): Promise<LoginResponseFromBE> => {
      try {
        const response = await loginService({ email, password: pass, deviceId });
        if (response.token) {
          applyToken(response.token, redirectTo);
        }
        return response;
      } catch (error) {
        console.error("Login failed:", error);
        throw error;
      }
    },
    [applyToken]
  );

  // (logout, useMemo, if(isLoading), Provider... giữ nguyên)
  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const contextValue = useMemo(
    () => ({ user, isLoading, login, completeLoginWithToken: applyToken, logout }),
    [user, isLoading, login, applyToken, logout]
  );
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// (useAuth() giữ nguyên)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};