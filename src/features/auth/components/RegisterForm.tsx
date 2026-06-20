import { useState } from "react";
import type { FormEvent } from "react";

interface RegisterFormProps {
  errorMessage: string;
  loading: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export const RegisterForm = ({
  errorMessage,
  loading,
  onSubmit,
}: RegisterFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(email.trim(), password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="register-email">Correo</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="register-password">Contrasena</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      {errorMessage && <p role="alert">{errorMessage}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
};
