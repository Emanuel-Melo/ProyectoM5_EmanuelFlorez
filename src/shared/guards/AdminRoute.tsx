import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../features/auth/hooks/useAuth";
import { LoadingScreen } from "../components/LoadingScreen";

export function AdminRoute() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
