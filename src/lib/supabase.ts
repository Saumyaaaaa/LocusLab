// Configures the Supabase client with URL sanitization, quote stripping, and friendly diagnostic error messages.
import { createClient } from '@supabase/supabase-js';

function sanitizeEnvValue(val: string | undefined): string {
  if (!val) return '';
  let clean = val.trim();
  // Strip surrounding quotes if present in .env
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  // Remove trailing slashes
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
 * Provides actionable diagnostics for common configuration mistakes (e.g. dashboard URL instead of API URL).
 */
export async function signInAnonymousParticipant() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase environment variables are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
  }

  // Common user mistake: pasting the Supabase Dashboard URL instead of the Project API URL
  if (supabaseUrl.includes('supabase.com/dashboard')) {
    throw new Error(
      'Your VITE_SUPABASE_URL is set to the Supabase Dashboard page URL. Please replace it with your actual Project API URL (formatted like: https://[your-project-id].supabase.co). In Supabase, find this under Project Settings -> API -> Project URL.'
    );
  }

  if (!supabaseUrl.startsWith('https://') && !supabaseUrl.startsWith('http://localhost')) {
    throw new Error(
      `Your VITE_SUPABASE_URL must start with "https://". Current value: "${supabaseUrl}". It should look like: https://[your-project-id].supabase.co`
    );
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    const errorLower = error.message.toLowerCase();
    if (errorLower.includes('anonymous sign-ins are disabled')) {
      throw new Error(
        'Anonymous Sign-Ins are disabled in your Supabase project. In Supabase Dashboard, go to Authentication -> Providers -> Anonymous and toggle "Enable Anonymous Sign-Ins" to ON, then click Save.'
      );
    }
    if (errorLower.includes('invalid path')) {
      throw new Error(
        `Supabase returned "Invalid path specified in request URL". Please check your .env file: VITE_SUPABASE_URL must be strictly the base Project URL without any extra path (e.g. "https://abcdefghijklmnopqrst.supabase.co"). Found: "${supabaseUrl}".`
      );
    }
    throw error;
  }

  return data;
}
