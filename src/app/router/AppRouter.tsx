import { Navigate, Routes, Route } from "react-router-dom";

import HomePage from "../../features/home/pages/HomePage";
import LandingPage from "../../features/home/pages/LandingPage";
import LoginPage from "../../features/auth/pages/LoginPage";
import RegisterPage from "../../features/auth/pages/RegisterPage";
import { ProtectedRoute } from "../../shared/guards/ProtectedRoute";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;

