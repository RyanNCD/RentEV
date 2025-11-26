import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DashboardLanding() {
  const { user } = useAuth();

  const target =
    user?.role === "ADMIN"
      ? "/dashboard/overview"
      : "/dashboard/checkin";

  return <Navigate to={target} replace />;
}


