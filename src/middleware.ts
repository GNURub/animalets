import type { MiddlewareHandler } from 'astro';
import { supabase } from './lib/supabase';

export const onRequest: MiddlewareHandler = async (
  { cookies, url, redirect, locals },
  next,
) => {
  // Rutas públicas
  const publicPaths = [
    '/',
    '/servicios',
    '/quienes-somos',
    '/contacto',
    '/signin',
    '/register',
  ];

  const isPublic =
    publicPaths.includes(url.pathname) || url.pathname.startsWith('/api/');

  if (isPublic) {
    return next();
  }

  // Rutas protegidas
  const protectedPaths = ['/app', '/admin'];
  const isProtected = protectedPaths.some((path) =>
    url.pathname.startsWith(path),
  );

  if (!isProtected) {
    return next();
  }

  // Verificar token
  const accessToken = cookies.get('sb-access-token')?.value;

  if (!accessToken) {
    return redirect('/signin');
  }

  // Validar token con Supabase
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    // Token inválido, limpiar cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    return redirect('/signin');
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Guardar usuario y supabase client en locals (disponible en todas las páginas)
  locals.user = {
    id: user.id,
    email: user.email || '',
  };
  locals.profile = profile;
  locals.supabase = supabase;

  // Verificar permisos de admin
  if (url.pathname.startsWith('/admin')) {
    if (profile?.role !== 'admin') {
      return redirect('/app/dashboard');
    }
  }

  return next();
};
