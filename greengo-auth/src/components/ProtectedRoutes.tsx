import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRedirectPathForRole, type AppRole } from "../services/authRole";

type Props = Readonly<{
  // (Vai trò được phép vào)
  allowedRoles: string[]; 
}>;

export default function ProtectedRoutes({ allowedRoles }: Props) {
  const { user } = useAuth(); // Lấy user từ Context
  const location = useLocation(); // Lưu lại vị trí cũ

  if (!user) {
    // === FIX HUNG THỦ #1 (Chưa login) ===
    // "Đuổi" về /login, "nhớ" lại nơi nó muốn vào (state: { from... })
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // (Check "role" của user có nằm trong mảng "allowedRoles" không)
  const isAuthorized = allowedRoles.includes(user.role);

  if (!isAuthorized) {
    // Determine fallback based on user role
    const appRoleMap: Record<IAuthUserRole, AppRole> = {
      ADMIN: "ADMIN",
      STAFF: "STAFF_STATION",
      RENTER: "CUSTOMER",
    };
    type IAuthUserRole = "ADMIN" | "STAFF" | "RENTER";
    const fallbackPath = getRedirectPathForRole(appRoleMap[user.role as IAuthUserRole]);
    return <Navigate to={fallbackPath} replace />;
  }
  
  // === OK QUA ẢI ===
  // (Đúng là RENTER, cho vào Outlet (tức là CheckoutPage))
  return <Outlet />;
}