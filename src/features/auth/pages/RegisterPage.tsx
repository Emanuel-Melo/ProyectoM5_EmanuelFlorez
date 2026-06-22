import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { BrandMark } from "../../../shared/components/BrandMark";
import { RegisterForm } from "../components/RegisterForm";
import { authService, getAuthErrorMessage } from "../services/authService";

function RegisterPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (email: string, password: string) => {
    try {
      setErrorMessage("");
      setLoading(true);

      await authService.register(email, password);

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
