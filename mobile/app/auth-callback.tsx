// Google sign-in returns here. Usually the in-app browser hands the link over directly;
// if the phone opens it as a screen instead, finish signing in and go to the account tab.
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { sessionFromUrl } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { C, F } from '../lib/theme';

export default function AuthCallback() {
  const url = Linking.useURL();
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session && url) await sessionFromUrl(url);
      } catch {}
      router.replace('/account');
    })();
  }, [url]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.cream }}>
      <ActivityIndicator color={C.espresso} />
      <Text style={{ fontFamily: F.body, color: C.muted }}>Signing you in…</Text>
    </View>
  );
}
