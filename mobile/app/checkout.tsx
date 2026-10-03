import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth, displayName } from '../lib/auth';
import { useCart } from '../lib/cart';
import { STATES, inStock, useCatalog, zoneFor } from '../lib/catalog';
import { SITE_URL, callFunction, supabase } from '../lib/supabase';
import { C, F, naira } from '../lib/theme';
import { Button, Card, Field, Notice } from '../components/ui';

export default function Checkout() {
  const { user } = useAuth();
  const cart = useCart();
  const { products, zones } = useCatalog();
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', state: '', notes: '' });
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  // fill in saved details (same profile as the website)
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      setForm((f) => ({
        ...f,
        name: data?.full_name || displayName(user),
        phone: data?.phone || '',
        address: data?.address || '',
        city: data?.city || '',
        state: data?.state || '',
      }));
    });
  }, [user?.id]);

  const rows = cart.lines
    .map((l) => {
      const p = products.find((x) => x.id === l.productId);
      const v = p?.lengths.find((x) => x.len === l.length);
      return p && v ? { l, p, v } : null;
    })
    .filter(Boolean) as any[];
  const subtotal = rows.reduce((s: number, r: any) => s + r.v.price * r.l.qty, 0);
  const zone = zoneFor(zones, form.state);
  const total = subtotal + (zone ? zone.fee : 0);

  async function pay() {
    const missing = (['name', 'phone', 'address', 'city', 'state'] as const).filter((k) => !form[k].trim());
    if (missing.length) return setError('Please fill in your name, phone, address, city and state.');
    if (!/^[+\d][\d\s-]{6,}$/.test(form.phone.trim())) return setError('Please enter a valid phone number.');
    if (!zone) return setError(`Sorry, we don't deliver to ${form.state} yet.`);
    if (rows.some((r: any) => !inStock(r.v) || (r.v.stock != null && r.l.qty > r.v.stock))) return setError('Some items are sold out or low in stock. Please update your bag.');
    setBusy(true);
    setError(null);
    try {
      const res = await callFunction<{ order_id: string; authorization_url: string }>('checkout', {
        items: cart.lines.map((l) => ({ product_id: l.productId, length: l.length, color: l.color, qty: l.qty })),
        customer: { name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(), city: form.city.trim(), state: form.state, notes: form.notes.trim() },
        save_details: true,
        // Paystack returns here after paying; the app checks the payment itself
        return_url: `${SITE_URL}/app-return.html`,
      });
      router.replace({ pathname: '/order/[id]', params: { id: res.order_id, pay: res.authorization_url } });
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (!rows.length && !busy) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }}>
        <Text style={s.h2}>Your bag is empty</Text>
        <Button title="Shop the hair" variant="ghost" onPress={() => router.replace('/')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 10 }}>
          <Text style={s.h3}>Order summary</Text>
          {rows.map((r: any) => (
            <View key={`${r.l.productId}|${r.l.length}|${r.l.color || ''}`} style={s.sumRow}>
              <Text style={s.sumName} numberOfLines={1}>{r.p.name} <Text style={s.muted}>· {[r.l.length, r.l.color].filter(Boolean).join(', ')} × {r.l.qty}</Text></Text>
              <Text style={s.sumVal}>{naira(r.v.price * r.l.qty)}</Text>
            </View>
          ))}
          <View style={s.divider} />
          <View style={s.sumRow}><Text style={s.muted}>Subtotal</Text><Text style={s.sumVal}>{naira(subtotal)}</Text></View>
          <View style={s.sumRow}><Text style={s.muted}>Delivery{zone ? ` · ${zone.name}` : ''}</Text><Text style={s.sumVal}>{zone ? (zone.fee ? naira(zone.fee) : 'Free') : 'Select your state'}</Text></View>
          <View style={s.sumRow}><Text style={s.grand}>Total</Text><Text style={s.grand}>{naira(total)}</Text></View>
        </Card>

        <Card style={{ gap: 14 }}>
          <Text style={s.h3}>Contact & delivery</Text>
          <Field label="Full name" value={form.name} onChangeText={set('name')} autoComplete="name" />
          <Field label="Phone number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" placeholder="0801 234 5678" />
          <Field label="Street address" value={form.address} onChangeText={set('address')} autoComplete="street-address" placeholder="House number, street, landmark" />
          <Field label="City / area" value={form.city} onChangeText={set('city')} placeholder="e.g. Lekki Phase 1" />
          <View style={{ gap: 6 }}>
            <Text style={s.label}>State</Text>
            <Pressable onPress={() => setPicker(true)} style={s.select} accessibilityRole="button">
              <Text style={[s.selectText, !form.state && { color: C.muted }]}>{form.state || 'Select state'}</Text>
              <Text style={s.selectText}>▾</Text>
            </Pressable>
          </View>

          <Text style={s.label}>Delivery</Text>
          {!form.state ? <Text style={s.muted}>Select your state to see your delivery fee.</Text> : null}
          {zones.map((z) => {
            const on = zone?.id === z.id;
            return (
              <View key={z.id} style={[s.zone, on ? s.zoneOn : form.state ? { opacity: 0.55 } : null]}>
                <View style={[s.radio, on && s.radioOn]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.zoneName}>{z.name}</Text>
                  {z.description ? <Text style={s.muted}>{z.description}</Text> : null}
                </View>
                {on ? <Text style={s.applied}>APPLIED</Text> : null}
                <Text style={s.zoneFee}>{z.fee ? naira(z.fee) : 'Free'}</Text>
              </View>
            );
          })}
          <Field label="Order note (optional)" value={form.notes} onChangeText={set('notes')} multiline style={[s.noteInput]} />
        </Card>

        {error ? <Notice>{error}</Notice> : null}
        <Button title={`Pay ${naira(total)} securely`} onPress={pay} busy={busy} />
        <Text style={[s.muted, { textAlign: 'center' }]}>🔒 Paid securely through Paystack (test mode — choose “Success” on the payment page).</Text>
      </ScrollView>

      <Modal visible={picker} animationType="slide" transparent onRequestClose={() => setPicker(false)}>
        <Pressable style={s.backdrop} onPress={() => setPicker(false)} />
        <View style={s.sheet}>
          <Text style={[s.h3, { padding: 16 }]}>Select your state</Text>
          <FlatList
            data={STATES}
            keyExtractor={(x) => x}
            renderItem={({ item }) => (
              <Pressable onPress={() => { set('state')(item); setPicker(false); setError(null); }} style={s.stateRow}>
                <Text style={[s.selectText, item === form.state && { fontFamily: F.bodyHeavy }]}>{item}</Text>
                {item === form.state ? <Text style={s.selectText}>✓</Text> : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  h2: { fontFamily: F.display, fontSize: 28, color: C.espresso },
  h3: { fontFamily: F.display, fontSize: 22, color: C.espresso },
  muted: { fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 19 },
  label: { fontFamily: F.bodyHeavy, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.cocoa },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  sumName: { flex: 1, fontFamily: F.bodyBold, fontSize: 14, color: C.espresso },
  sumVal: { fontFamily: F.bodyBold, fontSize: 14, color: C.espresso },
  grand: { fontFamily: F.bodyHeavy, fontSize: 17, color: C.espresso },
  divider: { height: 1, backgroundColor: 'rgba(107,70,54,0.15)', marginVertical: 2 },
  select: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: C.cream, borderWidth: 1.5, borderColor: 'rgba(107,70,54,0.18)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  selectText: { fontFamily: F.body, fontSize: 16, color: C.espresso },
  zone: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(107,70,54,0.14)' },
  zoneOn: { borderColor: C.espresso, backgroundColor: C.cream },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(107,70,54,0.3)' },
  radioOn: { borderColor: C.espresso, borderWidth: 6 },
  zoneName: { fontFamily: F.bodyBold, fontSize: 15, color: C.espresso },
  zoneFee: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.espresso },
  applied: { fontFamily: F.bodyHeavy, fontSize: 9, letterSpacing: 1, color: C.cream, backgroundColor: C.espresso, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  backdrop: { flex: 1, backgroundColor: 'rgba(23,15,11,0.45)' },
  sheet: { maxHeight: '65%', backgroundColor: C.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24 },
  stateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(107,70,54,0.08)' },
});
