import { useState } from "react";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setErrorMessage("");

      await authService.login(
        "test@test.com",
        "123456"
      );

      navigate("/home", { replace: true });
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesion"
      );
    }
  };

  return (
    <div>
      <h1>Login</h1>

      <button onClick={handleLogin}>
        Login Test
      </button>

      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
}

export default LoginPage;
