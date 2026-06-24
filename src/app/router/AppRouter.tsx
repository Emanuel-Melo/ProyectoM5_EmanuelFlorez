import { Navigate, Routes, Route } from "react-router-dom";

import HomePage from "../../features/home/pages/HomePage";
import LandingPage from "../../features/home/pages/LandingPage";
import LoginPage from "../../features/auth/pages/LoginPage";
import RegisterPage from "../../features/auth/pages/RegisterPage";
import AdminPage from "../../features/admin/pages/AdminPage";
import ProductDetailPage from "../../features/products/pages/ProductDetailPage";
import ProductsPage from "../../features/products/pages/ProductsPage";
import FavoritesPage from "../../features/home/pages/FavoritesPage";
import CartPage from "../../features/home/pages/CartPage";
import ShippingPage from "../../features/home/pages/ShippingPage";
import OrderDetailPage from "../../features/home/pages/OrderDetailPage";
import { AdminRoute } from "../../shared/guards/AdminRoute";
import { ProtectedRoute } from "../../shared/guards/ProtectedRoute";
import MainLayout from "../../shared/layouts/MainLayout";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/envios" element={<ShippingPage />} />
          <Route path="/envios/:orderId" element={<OrderDetailPage />} />
        </Route>
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      {import.meta.env.DEV ? (
        // Development helper: render admin page directly for debugging
        <Route path="/admin-debug" element={<AdminPage />} />
      ) : null}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;

