import { z } from 'zod';
import razas from '../../../../utils/razas.json';

/**
 * Esquema de validación para crear una mascota
 */
export const createPetSchema = z.object({
    name: z
        .string()
        .min(1, 'El nombre es requerido')
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .trim(),

    species: z
        .enum(['dog'])
        .refine(
            (val) => ['dog'].includes(val),
            'La especie debe ser "dog"'
        ),

    breed: z
        .string()
        .max(100, 'La raza no puede exceder 100 caracteres')
        .trim()
        .refine(
            (val) => razas.some((r) => r.value === val),
            'Raza no válida'
        )
        .optional()
        .nullable(),

    birth_date: z.iso.date('Fecha inválida')
        .optional()
        .nullable(),

    weight: z
        .number()
        .positive('El peso debe ser un número positivo')
        .optional()
        .nullable(),

    size: z
        .enum(['pequeño', 'mediano', 'grande'])
        .refine(
            (val) => ['pequeño', 'mediano', 'grande'].includes(val),
            'El tamaño debe ser "pequeño", "mediano" o "grande"'
        ),

    gender: z
        .enum(['macho', 'hembra'])
        .refine(
            (val) => ['macho', 'hembra'].includes(val),
            'El género debe ser "macho" o "hembra"'
        )
        .optional()
        .nullable(),

    notes: z
        .string()
        .max(500, 'Las notas no pueden exceder 500 caracteres')
        .trim()
        .optional()
        .nullable(),

    owner_id: z
        .uuid('El ID del propietario debe ser un UUID válido'),

    photo_url: z
        .url('URL de foto inválida')
        .optional()
        .nullable(),
});

/**
 * Tipo de TypeScript derivado del esquema de validación
 */
export type CreatePetInput = z.infer<typeof createPetSchema>;

/**
 * Esquema de validación para actualizar una mascota (todos los campos opcionales)
 */
export const updatePetSchema = createPetSchema.partial().omit({ owner_id: true });

export type UpdatePetInput = z.infer<typeof updatePetSchema>;

/**
 * Validar datos de creación de mascota
 */
export function validateCreatePet(data: unknown) {
    return createPetSchema.safeParse(data);
}

/**
 * Validar datos de actualización de mascota
 */
export function validateUpdatePet(data: unknown) {
    return updatePetSchema.safeParse(data);
}
