import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useCart, type CartLine } from '../../lib/cart';
import { inStock, useCatalog } from '../../lib/catalog';
import { C, F, naira } from '../../lib/theme';
import { Button, Card } from '../../components/ui';

export default function Bag() {
  const { user } = useAuth();
  const cart = useCart();
  const { products, zones } = useCatalog();

  if (!user) {
    return (
      <View style={s.empty}>
        <Text style={s.h2}>Your bag</Text>
        <Text style={s.muted}>Sign in to see your bag.</Text>
        <Button title="Sign in" onPress={() => router.push('/account')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const rows = cart.lines
    .map((l) => {
      const p = products.find((x) => x.id === l.productId);
      const v = p?.lengths.find((x) => x.len === l.length);
      return p && v ? { l, p, v } : null;
    })
    .filter(Boolean) as { l: CartLine; p: (typeof products)[number]; v: (typeof products)[number]['lengths'][number] }[];
  const subtotal = rows.reduce((s, r) => s + r.v.price * r.l.qty, 0);
  const problems = rows.some((r) => !inStock(r.v) || (r.v.stock != null && r.l.qty > r.v.stock));

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => `${r.l.productId}|${r.l.length}|${r.l.color || ''}`}
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={cart.refresh} tintColor={C.espresso} />}
      ListEmptyComponent={
        <View style={[s.empty, { flex: 0, paddingTop: 40 }]}>
          <Text style={s.h2}>Your bag is empty</Text>
          <Text style={s.muted}>Find a unit you love and add it to your bag.</Text>
          <Button title="Shop the hair" onPress={() => router.navigate('/shop')} variant="ghost" style={{ alignSelf: 'stretch' }} />
        </View>
      }
      renderItem={({ item: { l, p, v } }) => (
        <Card style={s.line}>
          <Image source={p.model} style={s.img} contentFit="cover" />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.name} numberOfLines={2}>{p.name}</Text>
            <Text style={s.muted}>{[l.length, l.color].filter(Boolean).join(' · ')} · {naira(v.price)}</Text>
            {!inStock(v) ? <Text style={s.err}>Sold out — please remove it</Text> : v.stock != null && l.qty > v.stock ? <Text style={s.err}>Only {v.stock} left</Text> : null}
            <View style={s.row}>
              <View style={s.qty}>
                <Pressable onPress={() => cart.setQty(l, l.qty - 1)} hitSlop={10} accessibilityLabel="Fewer"><Text style={s.qtyBtn}>−</Text></Pressable>
                <Text style={s.qtyNum}>{l.qty}</Text>
                <Pressable onPress={() => (v.stock != null && l.qty >= v.stock ? null : cart.setQty(l, l.qty + 1))} hitSlop={10} accessibilityLabel="More"><Text style={s.qtyBtn}>+</Text></Pressable>
              </View>
              <Pressable onPress={() => cart.remove(l)} hitSlop={8}><Text style={s.remove}>Remove</Text></Pressable>
            </View>
          </View>
          <Text style={s.total}>{naira(v.price * l.qty)}</Text>
        </Card>
      )}
      ListFooterComponent={
        rows.length ? (
          <View style={{ gap: 12, marginTop: 8 }}>
            <View style={s.sum}>
              <Text style={s.sumK}>Subtotal</Text>
              <Text style={s.sumV}>{naira(subtotal)}</Text>
            </View>
            <Text style={s.muted}>Delivery — {zones.map((z) => `${z.name}: ${z.fee ? naira(z.fee) : 'free'}`).join(' · ')}. Applied from your state at checkout.</Text>
            <Button title="Checkout" onPress={() => router.push('/checkout')} disabled={problems} />
          </View>
        ) : null
      }
    />
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  h2: { fontFamily: F.display, fontSize: 28, color: C.espresso, textAlign: 'center' },
  muted: { fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 19, textAlign: 'left' },
  err: { fontFamily: F.bodyBold, fontSize: 12, color: C.error },
  line: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 12 },
  img: { width: 70, height: 88, borderRadius: 12, backgroundColor: C.cream2 },
  name: { fontFamily: F.display, fontSize: 18, color: C.espresso },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: 'rgba(107,70,54,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 3 },
  qtyBtn: { fontFamily: F.bodyHeavy, fontSize: 17, color: C.espresso },
  qtyNum: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.espresso },
  remove: { fontFamily: F.bodyBold, fontSize: 12, color: C.muted, textDecorationLine: 'underline' },
  total: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.espresso },
  sum: { flexDirection: 'row', justifyContent: 'space-between' },
  sumK: { fontFamily: F.bodyHeavy, fontSize: 17, color: C.espresso },
  sumV: { fontFamily: F.bodyHeavy, fontSize: 17, color: C.espresso },
});
