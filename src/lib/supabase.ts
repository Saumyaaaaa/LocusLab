// Configures the Supabase client and provides anonymous authentication helper with detailed configuration error checks.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  !supabaseUrl.includes('example.com')
);

// Fallback to dummy values during initial local development if .env is not yet populated
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Signs in the user anonymously using Supabase auth.
 * Throws a human-readable error if Anonymous Sign-Ins are disabled or project URL is not configured.
 */
export async function signInAnonymousParticipant() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase environment variables are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    if (error.message.toLowerCase().includes('anonymous sign-ins are disabled')) {
      throw new Error(
        'Anonymous Sign-Ins are not enabled in your Supabase project. In Supabase Dashboard, visit Authentication -> Providers -> Email / Anonymous and toggle "Enable Anonymous Sign-Ins" ON.'
      );
    }
    throw error;
  }

  return data;
}
