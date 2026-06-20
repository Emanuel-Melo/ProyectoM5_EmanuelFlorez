import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/hooks/useAuth";
import { authService } from "../../auth/services/authService";

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate("/", { replace: true });
  };

  return (
    <main className="app-shell">
      <section className="home-layout home-panel">
        <p className="eyebrow">Sesion activa</p>
        <h1>Home</h1>

        <p>
          Ya estas autenticado. Desde aqui puedes empezar a construir las vistas
          privadas de tu ecommerce.
        </p>

        <div className="session-card">
          <strong>Usuario conectado</strong>
          <p>{user?.email ?? "Usuario sin correo disponible"}</p>
        </div>

        <div className="home-actions">
          <button className="button button-danger" type="button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
