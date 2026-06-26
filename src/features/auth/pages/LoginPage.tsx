import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { BrandMark } from "../../../shared/components/BrandMark";
import { LoginForm } from "../components/LoginForm";
import { authService, getAuthErrorMessage } from "../services/authService";
import { userService } from "../services/userService";
import "../auth.css";

function LoginPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
// sirve para manejar el inicio de sesión del usuario con correo electrónico y contraseña, y redirigirlo a la página correspondiente según su rol
  const handleLogin = async (email: string, password: string) => {
    try {
      setErrorMessage("");
      setLoading(true);
// llama al servicio de autenticación para iniciar sesión con correo electrónico y contraseña, obtiene el perfil del usuario y redirige según su rol
      const userCredential = await authService.login(email, password);
      const uid = userCredential.user.uid;
      const profile = await userService.getUserProfile(uid);

      if (profile?.role === "admin") { // si el rol del usuario es "admin", redirige a la página de administración
        navigate("/admin", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };
// sirve para manejar el inicio de sesión del usuario con Google, y redirigirlo a la página correspondiente según su rol
  const handleGoogleLogin = async () => {
    try {
      setErrorMessage("");
      setLoading(true);

      const userCredential = await authService.loginWithGoogle();
      const uid = userCredential.user.uid;
      const profile = await userService.getUserProfile(uid);

      if (profile?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };
//devuelve el JSX que representa la página de inicio de sesión, incluyendo el formulario de inicio de sesión y enlaces para registrarse o volver al inicio
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
