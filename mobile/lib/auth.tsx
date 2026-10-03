// Sign-in state for the whole app. Same accounts as the website (Supabase Auth).
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { SITE_URL, supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// Turns the link Google/Supabase sends back into the app into a signed-in session.
export async function sessionFromUrl(url: string) {
  const params: Record<string, string> = {};
  for (const part of [url.split('#')[1], url.split('?')[1]?.split('#')[0]]) {
    if (!part) continue;
    for (const kv of part.split('&')) {
      const [k, v] = kv.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
    }
  }
  if (params.error_description || params.error) throw new Error(params.error_description || params.error);
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return true;
  }
  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token });
    if (error) throw error;
    return true;
  }
  return false;
}

type Auth = {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  sendReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const value: Auth = {
    user: session?.user ?? null,
    ready,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    // Same Google account as the website. Opens Google in an in-app browser, then returns into the app.
    async signInWithGoogle() {
      const redirectTo = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
      if (error) throw error;
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== 'success') return false; // closed by the shopper
      return sessionFromUrl(res.url);
    },
    async signUp(email, password, name) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // the confirmation link opens the website, which signs the account in there; the app then signs in normally
        options: { data: { full_name: name }, emailRedirectTo: `${SITE_URL}/account.html` },
      });
      if (error) throw error;
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw Object.assign(new Error('exists'), { code: 'account_exists' });
      }
      return { needsConfirmation: !data.session };
    },
    async sendReset(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/account.html` });
      if (error) throw error;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export const displayName = (user: User | null) => {
  const m: any = user?.user_metadata || {};
  return m.full_name || m.name || user?.email || '';
};

// Supabase error -> message a shopper understands (same wording as the website)
export function authMessage(err: any) {
  const code = `${err?.code || ''} ${err?.message || ''}`;
  if (/account_exists|user_already_exists|already registered/i.test(code)) return 'An account with this email already exists. Sign in instead — or use “Forgot password?” if you’ve only used Google before.';
  if (/invalid_credentials|Invalid login credentials/i.test(code)) return "That email and password don't match. If you usually sign in with Google on the website, set a password there first (Account → My details) or use “Forgot password?”.";
  if (/email_not_confirmed|Email not confirmed/i.test(code)) return 'Please confirm your email first — check your inbox for the link from Glow by Grace.';
  if (/weak_password|Password should/i.test(code)) return 'Please choose a stronger password — at least 8 characters.';
  if (/rate limit|too many/i.test(code)) return 'Too many attempts just now. Please wait a few minutes and try again.';
  if (/validation_failed|invalid.*email|Unable to validate email/i.test(code)) return 'Please enter a valid email address.';
  return err?.message || 'Something went wrong. Please try again.';
}
