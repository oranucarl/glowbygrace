import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { SITE_URL, callFunction, supabase } from '../../lib/supabase';
import { FLOW, STATUS, type Order } from '../../lib/orders';
import { C, F, naira } from '../../lib/theme';
import { Button, Card, Eyebrow, Notice } from '../../components/ui';

const CHANNEL: Record<string, string> = { card: 'Card', bank: 'Bank', bank_transfer: 'Bank transfer', ussd: 'USSD' };

export default function OrderScreen() {
  const { id, pay } = useLocalSearchParams<{ id: string; pay?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opened = useRef(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*, order_items(*), order_events(*)').eq('id', id).maybeSingle();
    if (data) setOrder(data as Order);
    return data as Order | null;
  }, [id]);

  // asks the server to confirm with Paystack; returns true once paid
  const verify = useCallback(async () => {
    try {
      const r = await callFunction<{ paid: boolean }>('verify-payment', { order_id: id });
      if (r.paid) {
        await load();
        if (Platform.OS === 'ios') WebBrowser.dismissBrowser();
        return true;
      }
    } catch (e: any) {
      setError(e.message);
    }
    return false;
  }, [id, load]);

  async function openPayment(url: string) {
    setChecking(true);
    setError(null);
    WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET }).then(() => verify());
  }

  // first visit straight from checkout: open Paystack
  useEffect(() => {
    load().then((o) => {
      if (pay && o && !o.paid_at && !opened.current) {
        opened.current = true;
        openPayment(String(pay));
      }
    });
  }, [id]);

  // while waiting for payment, keep checking (also when coming back to the app)
  useEffect(() => {
    if (!checking) return;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      if (await verify()) return setChecking(false);
      setTimeout(tick, 3000);
    };
    const t = setTimeout(tick, 4000);
    const sub = AppState.addEventListener('change', (st) => st === 'active' && verify().then((ok) => ok && setChecking(false)));
    const giveUp = setTimeout(() => setChecking(false), 10 * 60 * 1000);
    return () => { stop = true; clearTimeout(t); clearTimeout(giveUp); sub.remove(); };
  }, [checking, verify]);

  async function retry() {
    try {
      const r = await callFunction<{ authorization_url: string }>('checkout', { order_id: id, return_url: `${SITE_URL}/app-return.html` });
      openPayment(r.authorization_url);
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function cancel() {
    const { error: e } = await supabase.rpc('cancel_my_order', { p_order_id: id });
    if (e) setError(e.message);
    load();
  }

  if (!order) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.espresso} /></View>;

  const paid = !!order.paid_at;
  const st = STATUS[order.status] || { label: order.status, bg: C.cream2, fg: C.muted };
  const at = FLOW.indexOf(order.status);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      {paid ? (
        <View style={s.hero}>
          <View style={s.check}><Text style={s.checkText}>✓</Text></View>
          <Eyebrow>Order confirmed</Eyebrow>
          <Text style={s.h1}>Thank you, <Text style={{ fontFamily: F.displayItalic }}>{order.customer_name.split(' ')[0]}!</Text></Text>
          <Text style={s.muted}>We've received your payment. A confirmation email is on its way.</Text>
        </View>
      ) : order.status === 'cancelled' ? (
        <View style={s.hero}><Eyebrow>Order cancelled</Eyebrow><Text style={s.h1}>This order was cancelled</Text></View>
      ) : (
        <View style={s.hero}>
          <Eyebrow>{checking ? 'Waiting for payment' : 'Payment not completed'}</Eyebrow>
          <Text style={s.h1}>{checking ? 'Complete payment in Paystack…' : 'Almost there…'}</Text>
          {checking ? (
            <>
              <ActivityIndicator color={C.espresso} style={{ marginTop: 8 }} />
              <Text style={s.muted}>{Platform.OS === 'android' ? 'After paying, close the payment page to come back here.' : 'This screen updates by itself once Paystack confirms.'}</Text>
            </>
          ) : (
            <View style={{ gap: 10, alignSelf: 'stretch', marginTop: 8 }}>
              <Button title={`Pay ${naira(order.total)} now`} onPress={retry} />
              <Button title="Cancel order" variant="ghost" onPress={cancel} />
            </View>
          )}
        </View>
      )}
      {error ? <Notice>{error}</Notice> : null}

      <Card style={{ gap: 12 }}>
        <View style={s.row}>
          <View><Text style={s.k}>Order</Text><Text style={s.v}>{order.order_number}</Text></View>
          <View style={[s.pill, { backgroundColor: st.bg }]}><Text style={[s.pillText, { color: st.fg }]}>{st.label}</Text></View>
        </View>
        {paid && order.status !== 'cancelled' ? (
          <View style={s.flow}>
            {FLOW.map((f, i) => (
              <View key={f} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <View style={[s.step, i <= at && { backgroundColor: C.gold, borderColor: C.gold }]} />
                <Text style={[s.stepText, i <= at && { color: C.espresso }]}>{STATUS[f].label}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {order.order_items.map((i) => (
          <View key={i.id} style={s.item}>
            {i.image_url ? <Image source={i.image_url} style={s.img} contentFit="cover" /> : <View style={s.img} />}
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{i.product_name}</Text>
              <Text style={s.muted}>{[i.length, i.color].filter(Boolean).join(' · ')} · Qty {i.quantity}</Text>
            </View>
            <Text style={s.v}>{naira(i.line_total)}</Text>
          </View>
        ))}
        <View style={s.row}><Text style={s.muted}>Subtotal</Text><Text style={s.v}>{naira(order.subtotal)}</Text></View>
        <View style={s.row}><Text style={s.muted}>Delivery · {order.delivery_zone_name}</Text><Text style={s.v}>{order.delivery_fee ? naira(order.delivery_fee) : 'Free'}</Text></View>
        <View style={s.row}><Text style={s.grand}>{paid ? 'Total paid' : 'Total'}</Text><Text style={s.grand}>{naira(order.total)}</Text></View>
      </Card>

      <Card style={{ gap: 6 }}>
        <Text style={s.k}>Delivering to</Text>
        <Text style={s.body}>{order.customer_name}{'\n'}{order.address}{'\n'}{order.city}, {order.state}{'\n'}{order.phone}</Text>
        {paid ? (
          <>
            <Text style={[s.k, { marginTop: 10 }]}>Payment</Text>
            <Text style={s.body}>{CHANNEL[order.payment_channel || ''] || order.payment_channel || 'Paystack'} via Paystack · Ref {order.payment_reference}</Text>
          </>
        ) : null}
      </Card>
      <Button title="Back to shop" variant="ghost" onPress={() => router.navigate('/shop')} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  check: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  checkText: { fontSize: 28, color: C.ink, fontFamily: F.bodyHeavy },
  h1: { fontFamily: F.display, fontSize: 32, color: C.espresso, textAlign: 'center' },
  muted: { fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 19, textAlign: 'left' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  k: { fontFamily: F.bodyBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.muted },
  v: { fontFamily: F.bodyHeavy, fontSize: 15, color: C.espresso },
  grand: { fontFamily: F.bodyHeavy, fontSize: 17, color: C.espresso },
  body: { fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.espresso },
  pill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontFamily: F.bodyHeavy, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  flow: { flexDirection: 'row', marginVertical: 6 },
  step: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.cream2, backgroundColor: C.cream2 },
  stepText: { fontFamily: F.bodyBold, fontSize: 10, color: C.muted, textAlign: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  img: { width: 50, height: 62, borderRadius: 10, backgroundColor: C.cream2 },
  name: { fontFamily: F.display, fontSize: 17, color: C.espresso },
});
