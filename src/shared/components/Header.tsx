import { Link, useNavigate, useLocation } from "react-router-dom";

import logo from "../../assets/images/Logo Buy.png";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useCart } from "../../features/cart/context/CartContext";
import { authService } from "../../features/auth/services/authService";
import "../../features/home/pages/HomePage.css";

export function Header() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await authService.logout();
    navigate("/", { replace: true });
  };

  const isActive = (path: string): boolean => {
    if (path === "/products") {
      return location.pathname === "/products";
    }
    return location.pathname === path;
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "U";
  const { count } = useCart();

  return (
    <header className="shop-header">
      <Link className="shop-brand" to="/home" aria-label="Panel Buy">
        <img src={logo} alt="Buy" />
        <span>Panel Buy</span>
      </Link>

      <nav className="shop-nav" aria-label="Navegacion principal">
        <Link className={isActive("/home") ? "active" : ""} to="/home">
          Home
        </Link>
        <Link className={isActive("/products") ? "active" : ""} to="/products">
          Productos
        </Link>
        <Link className={isActive("/favorites") ? "active" : ""} to="/favorites">
          Favoritos
        </Link>
        <Link className={isActive("/cart") ? "active" : ""} to="/cart">
          Carrito
        </Link>
        <Link className={isActive("/envios") ? "active" : ""} to="/envios">
          Envios
        </Link>
        {role === "admin" && (
          <Link className={isActive("/admin") ? "active" : ""} to="/admin">
            Admin
          </Link>
        )}
      </nav>

      <label className="shop-search">
        <span>Buscar</span>
        <input type="search" placeholder="Buscar productos..." />
      </label>

      <div className="shop-user">
        <Link className="cart-indicator" to="/cart" aria-label="Carrito">
          <span>{count}</span>
        </Link>
        <div>
          <strong>{user?.email ?? "Usuario"}</strong>
          <small>{role ?? "cliente"}</small>
        </div>
        <button type="button" onClick={handleLogout} aria-label="Cerrar sesion">
          {userInitial}
        </button>
      </div>
    </header>
  );
}

export default Header;
