import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import dedent from 'dedent';
import z from 'zod';


const google = createGoogleGenerativeAI({
  apiKey: import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const estimationSystemPrompt = dedent`
Eres un asistente experto en peluquería canina ("animalets") altamente preciso.
Tu única tarea es estimar el tiempo en minutos para una lista de servicios basándote
en las características del perro, el estado de su pelo.

REGLAS DE ESTIMACIÓN OBLIGATORIAS:
1.  **Tamaño/Raza:** Un perro grande (ej: Mastín) o con mucho pelo (ej: Samoyedo)
    tarda mucho más en lavado y secado que uno pequeño (ej: Chihuahua).

2.  **Estado del Pelo:** Factor crítico.
    - 'buen_estado': Tiempos normales.
    - 'enredado': Aumenta el tiempo de 'peinado' y 'lavado' significativamente (al menos +50%).
    - 'muy_enredado' o 'con_nudos': DUPLICA el tiempo de peinado. Añade una nota sobre esto.

3.  **Servicios (Base para perro Mediano, Pelo Bueno, Sin Muda):**
    - Lavado y Secado: 45 min
    - Peinado/Desenredado (Deslanado ligero): 15 min
    - Corte de Pelo: 60 min
    - Corte de uñas: 20 min

Tu trabajo es ajustar estos tiempos base usando TODOS los datos del perro y devolver
un JSON estructurado usando el esquema Zod proporcionado. NUNCA respondas fuera de ese formato.`;

export const EstimationSchema = z.object({
  estimations: z.array(
    z.object({
      service_id: z.string().describe("El SERVICE_ID único del servicio solicitado"),
      service_name: z.string().describe("El nombre del servicio solicitado, ej: 'Lavado y Secado'"),
      time_minutes: z.number().describe("Tiempo estimado en minutos SOLO para este servicio")
    })
  ).describe("Un array con la estimación individual de CADA servicio solicitado."),
  total_time_minutes: z.number().describe("La SUMA total de minutos de todos los servicios."),
  notes: z.string().optional().describe("Observaciones clave de la IA, ej: 'El pelo muy enredado puede sumar 15 min adicionales al peinado.'")
}).describe("Estimación detallada del tiempo para servicios de peluquería canina.");

export type EstimationResult = z.infer<typeof EstimationSchema>;

export async function estimateGroomingTime(dogProfile: {
  breed: string;
  size: 'pequeño' | 'mediano' | 'grande';
  coat_condition: 'buen_estado' | 'enredado' | 'muy_enredado' | 'con_nudos';
}, requestedServices: { name: string, id: string }[]): Promise<EstimationResult> {
  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: EstimationSchema,
    system: estimationSystemPrompt,
    prompt: dedent`
        Por favor, genera la estimación para el siguiente cliente:
        - Raza: ${dogProfile.breed}
        - Tamaño: ${dogProfile.size} (ej: pequeño, mediano, grande, gigante)
        - Estado del Pelo: ${dogProfile.coat_condition} (ej: buen_estado, enredado, muy_enredado, mudando)
        - Servicios Solicitados: ${requestedServices.map(s => `${s.name} (SERVICE_ID: ${s.id})`).join(', ')}
      `
  });
  return object;
}