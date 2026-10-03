import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { authMessage, displayName, useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { C, F, naira } from '../../lib/theme';
import { STATUS, type Order } from '../../lib/orders';
import { Button, Card, Eyebrow, Field, Notice } from '../../components/ui';

export default function Account() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? <SignedIn /> : <SignInForm />;
}

function SignInForm() {
  const { signIn, signUp, sendReset } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: 'err' | 'ok'; text: string } | null>(null);

  async function submit() {
    const e = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(e)) return setNote({ tone: 'err', text: 'Please enter a valid email address.' });
    if (mode === 'signup' && !name.trim()) return setNote({ tone: 'err', text: 'Please enter your name.' });
    if (mode !== 'forgot' && password.length < 8) return setNote({ tone: 'err', text: 'Your password needs at least 8 characters.' });
    setBusy(true);
    setNote(null);
    try {
      if (mode === 'signin') await signIn(e, password);
      else if (mode === 'signup') {
        const { needsConfirmation } = await signUp(e, password, name.trim());
        if (needsConfirmation) {
          setMode('signin');
          setNote({ tone: 'ok', text: `We've sent a confirmation link to ${e}. Open it, then come back and sign in here.` });
        }
      } else {
        await sendReset(e);
        setMode('signin');
        setNote({ tone: 'ok', text: `If ${e} has an account, a link to set your password is on its way.` });
      }
    } catch (err) {
      setNote({ tone: 'err', text: authMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View>
          <Eyebrow>Your account</Eyebrow>
          <Text style={s.h1}>
            Welcome <Text style={{ fontFamily: F.displayItalic }}>back</Text>
          </Text>
          <Text style={s.muted}>Use the same account as the website — your bag and orders are shared.</Text>
        </View>
        <Card style={{ gap: 14 }}>
          {mode !== 'forgot' ? (
            <View style={s.tabs}>
              {(['signin', 'signup'] as const).map((m) => (
                <Pressable key={m} onPress={() => { setMode(m); setNote(null); }} style={[s.tab, mode === m && s.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: mode === m }}>
                  <Text style={[s.tabText, mode === m && { color: C.espresso }]}>{m === 'signin' ? 'Sign in' : 'Create account'}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={s.muted}>Enter your email and we'll send a link to set a new password. This also works if you've only signed in with Google on the website.</Text>
          )}
          {note ? <Notice tone={note.tone}>{note.text}</Notice> : null}
          {mode === 'signup' ? <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" /> : null}
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
          {mode !== 'forgot' ? (
            <View>
              <Field
                label={mode === 'signup' ? 'Create a password' : 'Password'}
                hint={mode === 'signup' ? 'At least 8 characters' : undefined}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!show}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              />
              <Pressable onPress={() => setShow((v) => !v)} style={s.show} hitSlop={8}>
                <Text style={s.link}>{show ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
          ) : null}
          {mode === 'signin' ? (
            <Pressable onPress={() => { setMode('forgot'); setNote(null); }} style={{ alignSelf: 'flex-end' }}>
              <Text style={s.link}>Forgot password?</Text>
            </Pressable>
          ) : null}
          <Button title={mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'} onPress={submit} busy={busy} />
          {mode === 'forgot' ? (
            <Pressable onPress={() => { setMode('signin'); setNote(null); }} style={{ alignSelf: 'center' }}>
              <Text style={s.link}>Back to sign in</Text>
            </Pressable>
          ) : null}
        </Card>
        <Text style={[s.muted, { textAlign: 'center' }]}>
          Usually sign in with Google on the website? Add a password there under Account → My details, then sign in here with your email.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SignedIn() {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    setOrders((data as Order[]) || []);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pic = (user?.user_metadata as any)?.avatar_url || (user?.user_metadata as any)?.picture;
  const name = displayName(user);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={C.espresso} />}
    >
      <View style={s.head}>
        {pic ? <Image source={pic} style={s.avatar} /> : <View style={[s.avatar, s.initial]}><Text style={s.initialText}>{name.charAt(0).toUpperCase()}</Text></View>}
        <View style={{ flex: 1 }}>
          <Eyebrow>Your account</Eyebrow>
          <Text style={s.h2}>Hello, <Text style={{ fontFamily: F.displayItalic }}>{name.split(' ')[0]}</Text></Text>
          <Text style={s.muted}>{user?.email}</Text>
        </View>
      </View>

      <Text style={s.section}>My orders</Text>
      {orders === null ? <Text style={s.muted}>Loading…</Text> : null}
      {orders && !orders.length ? <Text style={s.muted}>No orders yet — when you check out on the website or in the app, they'll appear here.</Text> : null}
      {orders?.map((o) => (
        <Link key={o.id} href={{ pathname: '/order/[id]', params: { id: o.id } }} asChild>
          <Pressable>
            <Card style={s.order}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={s.orderNo}>{o.order_number}</Text>
                <Text style={s.muted}>
                  {new Date(o.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })} · {o.order_items.reduce((n, i) => n + i.quantity, 0)} item(s)
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={s.orderTotal}>{naira(o.total)}</Text>
                <View style={[s.pill, { backgroundColor: STATUS[o.status]?.bg || C.cream2 }]}>
                  <Text style={[s.pillText, { color: STATUS[o.status]?.fg || C.muted }]}>{STATUS[o.status]?.label || o.status}</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        </Link>
      ))}

      <Button title="Sign out" variant="ghost" onPress={signOut} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: F.display, fontSize: 40, color: C.espresso, marginTop: 4 },
  h2: { fontFamily: F.display, fontSize: 30, color: C.espresso, marginTop: 2 },
  muted: { fontFamily: F.body, fontSize: 14, color: C.muted, lineHeight: 21, marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: C.cream, borderRadius: 999, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  tabOn: { backgroundColor: C.white },
  tabText: { fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: C.muted },
  link: { fontFamily: F.bodyBold, fontSize: 13, color: C.muted, textDecorationLine: 'underline' },
  show: { position: 'absolute', right: 14, top: 38 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  initial: { backgroundColor: C.espresso, alignItems: 'center', justifyContent: 'center' },
  initialText: { fontFamily: F.display, fontSize: 28, color: C.cream },
  section: { fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: C.espresso, marginTop: 8 },
  order: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  orderNo: { fontFamily: F.bodyHeavy, fontSize: 16, color: C.espresso },
  orderTotal: { fontFamily: F.bodyHeavy, fontSize: 15, color: C.espresso },
  pill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontFamily: F.bodyHeavy, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
});
