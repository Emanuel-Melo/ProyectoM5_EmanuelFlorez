import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { LoginForm } from "../components/LoginForm";
import { authService, getAuthErrorMessage } from "../services/authService";

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
    <div>
      <h1>Login</h1>

      <LoginForm
        errorMessage={errorMessage}
        loading={loading}
        onSubmit={handleLogin}
        onGoogleLogin={handleGoogleLogin}
      />

      <p>
        No tienes cuenta? <Link to="/register">Registrate</Link>
      </p>
    </div>
  );
}

export default LoginPage;
