import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../../auth/hooks/useAuth";

function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="app-shell">
        <p className="auth-loader" role="status">
          Cargando sesion...
        </p>
      </main>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <main className="app-shell">
      <section className="auth-layout hero">
        <div className="hero-panel">
          <p className="eyebrow">Proyecto M5</p>
          <h1>Bienvenido a tu ecommerce con Firebase</h1>
          <p className="hero-copy">
            Entra con tu cuenta para continuar al panel principal, o crea un
            usuario nuevo si todavia no tienes acceso.
          </p>

          <div className="hero-actions">
            <Link className="button" to="/login">
              Iniciar sesion
            </Link>
            <Link className="button button-secondary" to="/register">
              Registrarse
            </Link>
          </div>
        </div>

        <aside className="hero-panel guide-panel" aria-label="Guia de acceso">
          <h2>Como empezar</h2>
          <ol className="guide-list">
            <li>
              <span className="guide-step">1</span>
              <div>
                <strong>Inicia sesion</strong>
                <p>Usa tu correo y contrasena o entra con Google.</p>
              </div>
            </li>
            <li>
              <span className="guide-step">2</span>
              <div>
                <strong>Crea una cuenta</strong>
                <p>Registra un usuario nuevo si aun no existe en Firebase.</p>
              </div>
            </li>
            <li>
              <span className="guide-step">3</span>
              <div>
                <strong>Entra al home</strong>
                <p>Despues de autenticarte veras tu sesion activa.</p>
              </div>
            </li>
          </ol>
        </aside>
      </section>
    </main>
  );
}

export default LandingPage;
