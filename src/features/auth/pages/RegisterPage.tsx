import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { BrandMark } from "../../../shared/components/BrandMark";
import { RegisterForm } from "../components/RegisterForm";
import { authService, getAuthErrorMessage } from "../services/authService";
import { userService } from "../services/userService";
import "../auth.css";
// sirve para manejar el registro de un nuevo usuario con correo electrónico y contraseña, crear su perfil en la base de datos y redirigirlo a la página de inicio
function RegisterPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const handleRegister = async (email: string, password: string) => {
    try {
      setErrorMessage("");
      setLoading(true);

      const authResult = await authService.register(email, password);
      const firebaseUser = authResult.user;
// crea un perfil de usuario en la base de datos con el uid, correo electrónico y rol "customer"
      await userService.createUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? email,
        role: "customer",
      });

      navigate("/home", { replace: true });
    } catch (error) {
      console.error(error);
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };
// devuelve el JSX que representa la página de registro, incluyendo el formulario de registro y enlaces para iniciar sesión o volver al inicio
  return (
    <main className="app-shell">
      <section className="auth-card">
        <BrandMark compact />
        <p className="eyebrow">Nueva cuenta</p>
        <h1>Registro</h1>
        <p>Crea un usuario con correo y contrasena para entrar al panel.</p>

        <RegisterForm
          errorMessage={errorMessage}
          loading={loading}
          onSubmit={handleRegister}
        />

        <p>
          Ya tienes cuenta?{" "}
          <Link className="text-link" to="/login">
            Inicia sesion
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

export default RegisterPage;
