import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Ingresa tu correo.")
    .email("Ingresa un correo valido."),
  password: z.string().min(1, "Ingresa tu contrasena."),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Ingresa tu correo.")
    .email("Ingresa un correo valido."),
  password: z
    .string()
    .min(6, "La contrasena debe tener minimo 6 caracteres."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
