import { Link } from "react-router-dom";

import { BrandMark } from "../../../shared/components/BrandMark";
import { useAuth } from "../../auth/hooks/useAuth";

function AdminPage() {
  const { user, role } = useAuth();

  return (
    <main className="app-shell">
      <section className="home-layout home-panel">
        <BrandMark compact />
        <p className="eyebrow">Panel admin</p>
        <h1>Admin</h1>

        <p>Solo los usuarios con rol admin pueden ver esta pagina.</p>

        <div className="session-card">
          <strong>Usuario autorizado</strong>
          <p>{user?.email ?? "Usuario sin correo disponible"}</p>
          <p>Rol: {role}</p>
        </div>

        <div className="home-actions">
          <Link className="button button-secondary" to="/home">
            Volver al home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default AdminPage;
