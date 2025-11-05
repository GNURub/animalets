import { createClient } from '@supabase/supabase-js';
import type { MiddlewareHandler } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const onRequest: MiddlewareHandler = async (
  { cookies, url, redirect, locals },
  next,
) => {
  // Rutas públicas (páginas que no requieren autenticación)
  const publicPaths = [
    '/',
    '/servicios',
    '/quienes-somos',
    '/contacto',
    '/signin',
    '/register',
  ];

  // APIs públicas que no requieren autenticación
  const publicApiPaths = [
    '/api/auth/signin',
    '/api/auth/register',
    '/api/auth/callback',
    '/api/auth/signout',
  ];

  const isPublicPage = publicPaths.includes(url.pathname);
  const isPublicApi = publicApiPaths.some((path) =>
    url.pathname.startsWith(path),
  );

  // Intentar obtener el token para todas las rutas (API y páginas)
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  // Crear cliente Supabase autenticado con el token del usuario
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

  if (accessToken && refreshToken) {
    // Establecer la sesión del usuario en el cliente
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Validar token con Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (!error && user) {
      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Guardar usuario y supabase client en locals (disponible en todas las páginas y APIs)
      locals.user = {
        id: user.id,
        email: user.email || '',
      };
      locals.profile = profile;
      locals.supabase = supabase;
    } else if (!isPublicPage && !isPublicApi) {
      // Token inválido en ruta protegida, limpiar cookies y redirigir
      cookies.delete('sb-access-token', { path: '/' });
      cookies.delete('sb-refresh-token', { path: '/' });
      return redirect('/signin');
    }
  }

  // Permitir acceso a rutas públicas sin autenticación
  if (isPublicPage || isPublicApi) {
    return next();
  }

  // Para rutas protegidas, verificar que el usuario esté autenticado
  if (!locals.user) {
    return redirect('/signin');
  }

  // Verificar permisos de admin
  if (url.pathname.startsWith('/admin')) {
    if (locals.profile?.role !== 'admin') {
      return redirect('/app/dashboard');
    }
  }

  return next();
};
