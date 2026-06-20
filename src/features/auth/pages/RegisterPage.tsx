import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
    <div>
      <h1>Registro</h1>

      <RegisterForm
        errorMessage={errorMessage}
        loading={loading}
        onSubmit={handleRegister}
      />

      <p>
        Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
