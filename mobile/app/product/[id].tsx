import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useRef } from 'react';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { inStock, minPrice, useCatalog } from '../../lib/catalog';
import { useAuth } from '../../lib/auth';
import { useCart } from '../../lib/cart';
import { C, F, naira } from '../../lib/theme';
import { Button, Chip, Eyebrow } from '../../components/ui';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, loading } = useCatalog();
  const { user } = useAuth();
  const cart = useCart();
  const { width } = useWindowDimensions();
  const p = products.find((x) => x.id === id);

  const avail = p ? p.lengths.filter(inStock) : [];
  const [len, setLen] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0); // 0 = worn by a model, 1 = hair close-up
  const gallery = useRef<ScrollView>(null);
  const showPhoto = (i: number) => {
    setPhoto(i);
    gallery.current?.scrollTo({ x: i * width, animated: true });
  };
  const onSwipe = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / width));
  const [busy, setBusy] = useState(false);

  if (!p) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: F.body, color: C.muted }}>{loading ? 'Loading…' : 'This product is no longer available.'}</Text>
      </View>
    );
  }

  // pre-pick when there is only one option
  const chosenLen = len ?? (avail.length === 1 ? avail[0].len : null);
  const chosenColor = color ?? (p.colors.length === 1 ? p.colors[0] : null);
  const v = p.lengths.find((l) => l.len === chosenLen);
  const inBag = cart.lines.filter((l) => l.productId === p.id && l.length === chosenLen).reduce((s, l) => s + l.qty, 0);
  const left = v && v.stock != null ? Math.max(0, v.stock - inBag) : 10;
  const needColor = p.colors.length > 0 && !chosenColor;
  const ready = !!v && !needColor && left > 0;
  const label = !avail.length ? 'Sold out' : !v ? 'Choose a length' : needColor ? 'Choose a colour' : left <= 0 ? 'No more available' : `Add to bag · ${naira(v.price * qty)}`;

  async function add() {
    if (!user) {
      Alert.alert('Sign in to shop', 'Sign in with the same account you use on the website — your bag is shared between both.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/account') },
      ]);
      return;
    }
    if (!v) return;
    setBusy(true);
    try {
      await cart.add(p!.id, v.len, p!.colors.length ? chosenColor : null, Math.min(qty, left));
      Alert.alert('Added to your bag ✦', `${p!.name} (${[v.len, p!.colors.length ? chosenColor : null].filter(Boolean).join(', ')})`, [
        { text: 'Keep shopping', style: 'cancel' },
        { text: 'View bag', onPress: () => router.push('/bag') },
      ]);
      setQty(1);
    } catch (e: any) {
      Alert.alert("Couldn't add to bag", e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: p.name }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* swipe between the model photo and the hair close-up */}
        <View style={{ width, height: width * 1.15, backgroundColor: C.cream2 }}>
          <ScrollView ref={gallery} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onSwipe} onScrollEndDrag={onSwipe}>
            {[p.model, p.sample].map((src, i) => (
              <Image key={i} source={src} style={{ width, height: width * 1.15 }} contentFit="cover" transition={200} />
            ))}
          </ScrollView>
          <View style={s.photoLabel}>
            <Text style={s.photoLabelText}>{photo === 0 ? 'Worn by a model · swipe for close-up' : 'Hair close-up'}</Text>
          </View>
          <View style={s.thumbs}>
            {[p.model, p.sample].map((src, i) => (
              <Pressable key={i} onPress={() => showPhoto(i)} style={[s.thumb, photo === i && { borderColor: C.cream }]} accessibilityLabel={i === 0 ? 'Model photo' : 'Hair close-up'}>
                <Image source={src} style={{ flex: 1 }} contentFit="cover" />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ padding: 20, gap: 18 }}>
          <View>
            <Eyebrow>{p.tagline}</Eyebrow>
            <Text style={s.h1}>{p.name}</Text>
            <Text style={s.price}>{v ? naira(v.price) : `from ${naira(minPrice(p))}`}</Text>
            {p.desc ? <Text style={s.desc}>{p.desc}</Text> : null}
          </View>

          <View style={s.specs}>
            <View style={s.spec}><Text style={s.specK}>Lace</Text><Text style={s.specV}>{p.lace}</Text></View>
            <View style={s.spec}><Text style={s.specK}>Density</Text><Text style={s.specV}>{p.density}</Text></View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={s.label}>Length <Text style={s.labelVal}>{chosenLen || 'Choose one'}</Text></Text>
            <View style={s.opts}>
              {p.lengths.map((l) => (
                <Chip key={l.len} label={l.len} sub={inStock(l) ? naira(l.price) : 'Sold out'} active={l.len === chosenLen} disabled={!inStock(l)} onPress={() => setLen(l.len)} />
              ))}
            </View>
          </View>

          {p.colors.length ? (
            <View style={{ gap: 10 }}>
              <Text style={s.label}>Colour <Text style={s.labelVal}>{chosenColor || 'Choose one'}</Text></Text>
              <View style={s.opts}>
                {p.colors.map((c) => (
                  <Chip key={c} label={c} active={c === chosenColor} onPress={() => setColor(c)} />
                ))}
              </View>
            </View>
          ) : null}

          <View style={s.qtyRow}>
            <Text style={s.label}>Quantity</Text>
            <View style={s.qty}>
              <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} hitSlop={10} accessibilityLabel="Fewer"><Text style={s.qtyBtn}>−</Text></Pressable>
              <Text style={s.qtyNum}>{qty}</Text>
              <Pressable onPress={() => setQty((q) => Math.min(Math.max(1, left), q + 1))} hitSlop={10} accessibilityLabel="More"><Text style={s.qtyBtn}>+</Text></Pressable>
            </View>
            {v && v.stock != null ? <Text style={s.left}>{left} available</Text> : null}
          </View>

          <Button title={label} onPress={add} disabled={!ready} busy={busy} />
          {!user ? <Text style={s.hint}>Sign in with your website account to add to your bag.</Text> : null}
        </View>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  thumbs: { position: 'absolute', left: 16, bottom: 16, flexDirection: 'row', gap: 8 },
  photoLabel: { position: 'absolute', top: 14, alignSelf: 'center', backgroundColor: 'rgba(23,15,11,0.55)', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  photoLabelText: { fontFamily: F.bodyBold, fontSize: 11, color: C.cream },
  thumb: { width: 56, height: 68, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  h1: { fontFamily: F.display, fontSize: 34, color: C.espresso, marginTop: 6 },
  price: { fontFamily: F.bodyHeavy, fontSize: 20, color: C.espresso, marginTop: 8 },
  desc: { fontFamily: F.body, fontSize: 15, lineHeight: 24, color: C.muted, marginTop: 10 },
  specs: { flexDirection: 'row', gap: 10 },
  spec: { flex: 1, backgroundColor: C.cream2, borderRadius: 14, padding: 12 },
  specK: { fontFamily: F.bodyBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.muted },
  specV: { fontFamily: F.bodyBold, fontSize: 14, color: C.espresso, marginTop: 2 },
  label: { fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: C.espresso },
  labelVal: { fontFamily: F.body, letterSpacing: 0, textTransform: 'none', color: C.muted },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: 'rgba(107,70,54,0.2)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  qtyBtn: { fontFamily: F.bodyHeavy, fontSize: 18, color: C.espresso },
  qtyNum: { fontFamily: F.bodyHeavy, fontSize: 16, color: C.espresso, minWidth: 16, textAlign: 'center' },
  left: { fontFamily: F.body, fontSize: 13, color: C.muted },
  hint: { fontFamily: F.body, fontSize: 13, color: C.muted, textAlign: 'center' },
});
