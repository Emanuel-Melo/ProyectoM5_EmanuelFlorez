import { z } from "zod";
// Define los esquemas de validación para los formularios de inicio de sesión y registro utilizando la biblioteca Zod. Estos esquemas se utilizan para validar los datos ingresados por el usuario antes de enviarlos al servidor.
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
// Exporta los tipos de datos inferidos a partir de los esquemas de validación para que puedan ser utilizados en otras partes del proyecto, como en los formularios de inicio de sesión y registro.
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
