import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'creative_os_supabase_url';
const STORAGE_KEY_KEY = 'creative_os_supabase_key';

export function getStoredSupabaseCredentials() {
  const url = localStorage.getItem(STORAGE_URL_KEY) || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem(STORAGE_KEY_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (url) localStorage.setItem(STORAGE_URL_KEY, url);
  else localStorage.removeItem(STORAGE_URL_KEY);
  
  if (key) localStorage.setItem(STORAGE_KEY_KEY, key);
  else localStorage.removeItem(STORAGE_KEY_KEY);
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getStoredSupabaseCredentials();
  if (!url || !key) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

export function resetSupabaseInstance() {
  supabaseInstance = null;
}
