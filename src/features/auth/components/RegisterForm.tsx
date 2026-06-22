import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/authSchemas";

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isBusy = loading || isSubmitting;

  const submitRegister = async ({ email, password }: RegisterFormValues) => {
    await onSubmit(email.trim(), password);
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit(submitRegister)}>
      <div className="field">
        <label htmlFor="register-email">Correo</label>
        <input
          id="register-email"
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
        <label htmlFor="register-password">Contrasena</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
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
        {isBusy ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
};
