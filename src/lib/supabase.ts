// Configures the Supabase client with URL sanitization and privacy-preserving error messages.
import { createClient } from '@supabase/supabase-js';

function sanitizeEnvValue(val: string | undefined): string {
  if (!val) return '';
  let clean = val.trim();
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  return clean.replace(/\/+$/, '');
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = sanitizeEnvValue(rawUrl);
const supabaseAnonKey = sanitizeEnvValue(rawAnonKey);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  !supabaseUrl.includes('example.com')
);

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
 * Signs in the user anonymously using Supabase auth or retrieves the existing session.
 * Never outputs sensitive environment strings to error logs or the UI.
 */
export async function signInAnonymousParticipant() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase environment variables are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
  }

  if (supabaseUrl.includes('supabase.com/dashboard')) {
    throw new Error(
      'Your VITE_SUPABASE_URL is set to the Supabase Dashboard page URL. Please replace it with your Project API URL (e.g. https://[project-id].supabase.co).'
    );
  }

  // 1. Check if user already has an active authenticated session
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) {
    return { user: sessionData.session.user, session: sessionData.session };
  }

  // 2. Perform anonymous sign-in
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    const errorLower = error.message.toLowerCase();
    if (errorLower.includes('anonymous sign-ins are disabled')) {
      throw new Error(
        'Anonymous Sign-Ins are disabled in your Supabase project. In Supabase Dashboard, go to Authentication -> Providers -> Anonymous and toggle "Enable Anonymous Sign-Ins" ON.'
      );
    }
    if (errorLower.includes('invalid path')) {
      throw new Error(
        'Invalid Supabase Project URL. Please check your .env file: VITE_SUPABASE_URL must be strictly the base Project URL without any extra subpaths or trailing slashes (e.g. https://abcdefghijklm.supabase.co).'
      );
    }
    throw new Error(`Authentication error: ${error.message}`);
  }

  return data;
}
