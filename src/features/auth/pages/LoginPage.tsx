import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { BrandMark } from "../../../shared/components/BrandMark";
import { LoginForm } from "../components/LoginForm";
import { authService, getAuthErrorMessage } from "../services/authService";
import "../auth.css";

function LoginPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    try {
      setErrorMessage("");
      setLoading(true);

      await authService.login(email, password);

      navigate("/home", { replace: true });
    } catch (error) {
      console.error(error);
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMessage("");
      setLoading(true);

      await authService.loginWithGoogle();

      navigate("/home", { replace: true });
    } catch (error) {
      console.error(error);
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="auth-card">
        <BrandMark compact />
        <p className="eyebrow">Acceso</p>
        <h1>Iniciar sesion</h1>
        <p>Entra con tu usuario de Firebase y continua al panel privado.</p>

        <LoginForm
          errorMessage={errorMessage}
          loading={loading}
          onSubmit={handleLogin}
          onGoogleLogin={handleGoogleLogin}
        />

        <p>
          No tienes cuenta?{" "}
          <Link className="text-link" to="/register">
            Registrate
          </Link>
        </p>
        <p>
          <Link className="text-link" to="/">
            Volver al inicio
          </Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
