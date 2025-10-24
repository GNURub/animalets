import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Manejamos sesiones con cookies
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Tipos para TypeScript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: 'client' | 'admin';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['profiles']['Row'],
          'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      pets: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          breed: string | null;
          size: 'pequeño' | 'mediano' | 'grande';
          weight_kg: number | null;
          birth_date: string | null;
          gender: 'macho' | 'hembra' | null;
          notes: string | null;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['pets']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['pets']['Insert']>;
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['services']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          pet_id: string;
          service_id: string;
          date: string;
          start_time: string;
          end_time: string;
          status:
            | 'pending'
            | 'in_bath'
            | 'drying'
            | 'grooming'
            | 'completed'
            | 'cancelled'
            | 'no_show';
          final_photo_url: string | null;
          notes: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['appointments']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };
    };
  };
};
