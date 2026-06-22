import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../features/auth/hooks/useAuth";

export function AdminRoute() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <main className="app-shell">
        <p className="auth-loader" role="status">
          Cargando sesion...
        </p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
