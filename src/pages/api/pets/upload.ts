import type { APIRoute } from 'astro';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET_NAME = 'pet-photos';

export const POST: APIRoute = async ({ request, locals }) => {
    const { user } = locals;

    if (!user) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new Response(
                JSON.stringify({ error: 'No se proporcionó archivo' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Validar tipo de archivo
        if (!ALLOWED_TYPES.includes(file.type)) {
            return new Response(
                JSON.stringify({
                    error: 'Tipo de archivo no permitido. Use JPEG, PNG o WebP',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Validar tamaño de archivo
        if (file.size > MAX_FILE_SIZE) {
            return new Response(
                JSON.stringify({
                    error: 'Archivo muy grande. Máximo 5MB',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Generar nombre único para el archivo
        const fileExtension = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

        // Convertir File a Buffer
        const buffer = await file.arrayBuffer();

        // Subir a Supabase Storage
        const { data, error } = await locals.supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, new Uint8Array(buffer), {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error('Error al subir imagen:', error);
            return new Response(
                JSON.stringify({ error: 'Error al subir imagen' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Obtener URL pública de la imagen
        const {
            data: { publicUrl },
        } = locals.supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

        return new Response(JSON.stringify({ url: publicUrl, path: data.path }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error en POST /api/pets/upload:', error);
        return new Response(
            JSON.stringify({ error: 'Error del servidor' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
