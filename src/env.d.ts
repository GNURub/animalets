/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly PUBLIC_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user: {
      id: string;
      email: string;
    } | null;
    profile: {
      id: string;
      email: string;
      full_name: string | null;
      phone: string | null;
      role: 'client' | 'admin';
      avatar_url: string | null;
    } | null;
    supabase: typeof import('./lib/supabase').supabase;
  }
}
