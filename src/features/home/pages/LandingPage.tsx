import { Link, Navigate } from "react-router-dom";

import { BrandMark } from "../../../shared/components/BrandMark";
import { LoadingScreen } from "../../../shared/components/LoadingScreen";
import { useAuth } from "../../auth/hooks/useAuth";
import "./LandingPage.css";

function LandingPage() {
  const { user, loading } = useAuth();
//Si la aplicación está cargando, muestra una pantalla de carga. Si el usuario ya ha iniciado sesión, redirige a la página de inicio. De lo contrario, muestra la página de aterrizaje con información sobre la aplicación y opciones para iniciar sesión o registrarse.
  if (loading) {
    return <LoadingScreen />;
  }
// Si el usuario ya ha iniciado sesión, redirige a la página de inicio. De lo contrario, muestra la página de aterrizaje con información sobre la aplicación y opciones para iniciar sesión o registrarse.
  if (user) {
    return <Navigate to="/home" replace />;
  }
// Devuelve la representación visual de la página de aterrizaje, mostrando información sobre la aplicación y opciones para iniciar sesión o registrarse. Incluye un panel de guía con pasos para acceder a la aplicación.
  return (
    <main className="app-shell app-shell-hero">
      <section className="auth-layout hero">
        <div className="hero-panel hero-panel-primary">
          <BrandMark />
          <p className="eyebrow">Proyecto M5 Ecommerce</p>
          <h1>Compra con precision, velocidad y estilo.</h1>
          <p className="hero-copy">
            Una entrada premium para tu tienda: autenticacion con Firebase,
            acceso rapido y una presencia visual guiada por la energia de Buy.
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
          <BrandMark compact />
          <h2>Acceso rapido</h2>
          <ol className="guide-list">
            <li>
              <span className="guide-step">1</span>
              <div>
                <strong>Identificate</strong>
                <p>Usa tu correo y contrasena o entra con Google.</p>
              </div>
            </li>
            <li>
              <span className="guide-step">2</span>
              <div>
                <strong>Activa tu cuenta</strong>
                <p>Registra un usuario nuevo si aun no existe en Firebase.</p>
              </div>
            </li>
            <li>
              <span className="guide-step">3</span>
              <div>
                <strong>Entra al cockpit</strong>
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
