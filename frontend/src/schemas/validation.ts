import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, { message: 'El usuario es obligatorio.' }),
  password: z.string().min(1, { message: 'La contraseña es obligatoria.' }),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

export const registrationSchema = z.object({
  invitation_token: z.string().min(1),
  workshop_id: z.number({ required_error: 'Debes seleccionar un taller.' }),
  full_name: z.string()
    .min(3, { message: 'El nombre completo debe tener al menos 3 caracteres.' })
    .max(100, { message: 'El nombre completo no puede exceder los 100 caracteres.' }),
  email: z.string()
    .min(1, { message: 'El correo electrónico es obligatorio.' })
    .email({ message: 'Debe ingresar un correo electrónico válido.' }),
  phone: z.string()
    .min(6, { message: 'El número telefónico debe tener al menos 6 caracteres.' })
    .max(50, { message: 'El número telefónico es demasiado largo.' }),
  institution: z.string().max(150, { message: 'El centro educativo o institución no puede exceder los 150 caracteres.' }).optional().or(z.literal('')),
  age: z.coerce.number()
    .int()
    .min(5, { message: 'La edad mínima permitida es de 5 años.' })
    .max(110, { message: 'La edad máxima permitida es de 110 años.' })
    .optional()
    .or(z.literal(0))
    .or(z.literal('')),
  comments: z.string().max(500, { message: 'Los comentarios no pueden exceder los 500 caracteres.' }).optional().or(z.literal('')),
  terms_accepted: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones del evento.',
  }),
  data_treatment_accepted: z.boolean().refine(val => val === true, {
    message: 'Debes autorizar el tratamiento de tus datos personales.',
  }),
});

export type RegistrationSchemaType = z.infer<typeof registrationSchema>;
