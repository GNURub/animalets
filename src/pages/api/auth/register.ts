import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const fullName = formData.get('full_name')?.toString();
  const phone = formData.get('phone')?.toString();

  if (!email || !password) {
    return redirect(
      '/register?error=' +
        encodeURIComponent('Email y contraseña son requeridos')
    );
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return redirect('/register?error=' + encodeURIComponent('Email inválido'));
  }

  // Validar longitud de contraseña
  if (password.length < 8) {
    return redirect(
      '/register?error=' +
        encodeURIComponent('La contraseña debe tener al menos 8 caracteres')
    );
  }

  // Registrar usuario
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (error) {
    return redirect('/register?error=' + encodeURIComponent(error.message));
  }

  // Si hay verificación de email, data.session será null
  if (!data.session) {
    return redirect(
      '/signin?message=' +
        encodeURIComponent(
          'Por favor, verifica tu email para activar tu cuenta'
        )
    );
  }

  // Guardar tokens
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
