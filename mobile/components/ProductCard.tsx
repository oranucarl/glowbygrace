// Product card used on Home and Shop. Like the website's hover effect:
// press and hold the photo (or tap ⇄) to see the hair close-up.
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { minPrice, sized, soldOut, type Product } from '../lib/catalog';
import { C, F, naira } from '../lib/theme';

export const ProductCard = memo(function ProductCard({ p, width }: { p: Product; width: number }) {
  const [holding, setHolding] = useState(false);
  const [pinned, setPinned] = useState(false);
  const closeUp = holding || pinned;
  const out = soldOut(p);
  const tag = out ? 'Sold out' : p.badge;
  const open = () => router.push({ pathname: '/product/[id]', params: { id: p.id } });

  return (
    <View style={{ width }}>
      <Pressable
        onPress={open}
        onLongPress={() => setHolding(true)}
        onPressOut={() => setHolding(false)}
        delayLongPress={180}
        accessibilityRole="button"
        accessibilityLabel={`${p.name}, from ${naira(minPrice(p))}. Press and hold to see the hair close-up.`}
        style={[s.media, { height: width * 1.3 }]}
      >
        {/* both photos stay loaded so the swap is instant */}
        <Image source={sized(p.model, 600)} recyclingKey={`${p.id}-m`} cachePolicy="memory-disk" style={[StyleSheet.absoluteFill, out && { opacity: 0.6 }]} contentFit="cover" transition={100} />
        <Image source={sized(p.sample, 600)} recyclingKey={`${p.id}-s`} cachePolicy="memory-disk" style={[StyleSheet.absoluteFill, { opacity: closeUp ? 1 : 0 }]} contentFit="cover" transition={100} />
        <View style={s.top}>
          {tag ? (
            <View style={s.tag}>
              <Text style={s.tagText} numberOfLines={1}>{tag}</Text>
            </View>
          ) : <View />}
          <Pressable
            onPress={() => setPinned((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={closeUp ? 'Show model photo' : 'Show hair close-up'}
            style={[s.swap, closeUp && { backgroundColor: C.cream }]}
          >
            <Ionicons name="swap-horizontal" size={15} color={closeUp ? C.espresso : C.cream} />
          </Pressable>
        </View>
        {closeUp ? (
          <View style={s.hint}><Text style={s.hintText}>Hair close-up</Text></View>
        ) : null}
      </Pressable>
      <Pressable onPress={open}>
        <Text style={s.meta} numberOfLines={1}>{p.tagline}</Text>
        <Text style={s.name} numberOfLines={2}>{p.name}</Text>
        <Text style={s.price}>
          <Text style={{ color: C.muted, fontFamily: F.body }}>from </Text>
          {naira(minPrice(p))}
        </Text>
        <View style={s.lengths}>
          {p.lengths.map((l) => (
            <Text key={l.len} style={[s.len, l.stock === 0 && s.lenOut]}>{l.len}</Text>
          ))}
        </View>
      </Pressable>
    </View>
  );
});

const s = StyleSheet.create({
  media: { borderRadius: 20, overflow: 'hidden', backgroundColor: C.cream2 },
  top: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  tag: { flexShrink: 1, backgroundColor: C.cream, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  tagText: { fontFamily: F.bodyHeavy, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.espresso },
  swap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(23,15,11,0.55)' },
  hint: { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(23,15,11,0.6)', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  hintText: { fontFamily: F.bodyBold, fontSize: 11, color: C.cream, letterSpacing: 0.6 },
  meta: { fontFamily: F.bodyBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.muted, marginTop: 10 },
  name: { fontFamily: F.display, fontSize: 19, color: C.espresso, marginTop: 3 },
  price: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.espresso, marginTop: 3 },
  lengths: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  len: { fontFamily: F.bodyBold, fontSize: 10, color: C.cocoa, backgroundColor: C.cream2, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, overflow: 'hidden' },
  lenOut: { textDecorationLine: 'line-through', opacity: 0.55 },
});
