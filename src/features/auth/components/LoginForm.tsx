import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  loginSchema,
  type LoginFormValues,
} from "../schemas/authSchemas";

interface LoginFormProps {
  errorMessage: string;
  loading: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
}


//sirve para renderizar el formulario de login, con validaciones y manejo de errores
export const LoginForm = ({
  errorMessage,
  loading,
  onSubmit,
  onGoogleLogin,
}: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isBusy = loading || isSubmitting;

  const submitLogin = async ({ email, password }: LoginFormValues) => {
    await onSubmit(email.trim(), password);
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit(submitLogin)}>
      <div className="field">
        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email?.message && (
          <p className="field-error">{errors.email.message}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="password">Contrasena</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password?.message && (
          <p className="field-error">{errors.password.message}</p>
        )}
      </div>

      {errorMessage && (
        <p className="error-message" role="alert">
          {errorMessage}
        </p>
      )}

      <button className="button" type="submit" disabled={isBusy}>
        {isBusy ? "Ingresando..." : "Ingresar"}
      </button>

      <button
        className="button button-secondary"
        type="button"
        onClick={onGoogleLogin}
        disabled={isBusy}
      >
        Entrar con Google
      </button>
    </form>
  );
};
