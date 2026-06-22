import { Link, useNavigate } from "react-router-dom";

import { BrandMark } from "../../../shared/components/BrandMark";
import { useAuth } from "../../auth/hooks/useAuth";
import { authService } from "../../auth/services/authService";

function HomePage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate("/", { replace: true });
  };

  return (
    <main className="app-shell">
      <section className="home-layout home-panel">
        <BrandMark compact />
        <p className="eyebrow">Sesion activa</p>
        <h1>Panel Buy</h1>

        <p>
          Ya estas autenticado. Desde aqui puedes empezar a construir las vistas
          privadas de tu ecommerce con una base visual mas premium.
        </p>

        <div className="session-card">
          <strong>Usuario conectado</strong>
          <p>{user?.email ?? "Usuario sin correo disponible"}</p>
          <p>Rol: {role ?? "Sin rol asignado"}</p>
        </div>

        <div className="home-actions">
          {role === "admin" && (
            <Link className="button button-secondary" to="/admin">
              Ir al admin
            </Link>
          )}
          <button className="button button-danger" type="button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
