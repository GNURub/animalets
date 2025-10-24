import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get('code');

  if (!authCode) {
    return redirect(
      `/signin?error=${encodeURIComponent(
        'No se proporcionó ningún código de autenticación',
      )}`,
    );
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    return redirect(
      `/signin?error=${encodeURIComponent(
        'Error al iniciar sesión con el proveedor externo',
      )}`,
    );
  }

  const { access_token, refresh_token } = data.session;

  cookies.set('sb-access-token', access_token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  cookies.set('sb-refresh-token', refresh_token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

  return redirect('/app/dashboard');
};
