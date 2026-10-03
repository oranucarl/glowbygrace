// Same Supabase project and public key as the website (assets/js/config.js),
// so the app uses the same accounts, products, cart and checkout functions.
import './storage';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://kayatzmitpwuhntmukeu.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_xislP4Kzh-WQgcpWxpcU6A_VKMhA-xU';
export const SITE_URL = 'https://glowbygrace.vercel.app';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// keep the session fresh only while the app is open
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

// Calls a server function and turns error responses into readable messages.
export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message || 'Request failed';
    try {
      const j = await (error as any).context.json();
      if (j?.error) message = j.error;
    } catch {}
    throw new Error(message);
  }
  return data as T;
}
