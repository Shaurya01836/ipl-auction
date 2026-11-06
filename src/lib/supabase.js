import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL);

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  (typeof process !== 'undefined' &&
    (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_PUBLISHABLE_KEY));

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
