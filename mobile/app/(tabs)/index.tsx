import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { CATEGORIES, minPrice, soldOut, useCatalog, type Product } from '../../lib/catalog';
import { C, F, naira } from '../../lib/theme';
import { Eyebrow } from '../../components/ui';

export default function Shop() {
  const { products, loading, error, refresh } = useCatalog();
  const [cat, setCat] = useState('all');
  const { width } = useWindowDimensions();
  const cols = width >= 700 ? 3 : 2;
  const cardW = (width - 16 * 2 - 12 * (cols - 1)) / cols;

  const cats = useMemo(() => CATEGORIES.filter((c) => c.key === 'all' || products.some((p) => p.category === c.key)), [products]);
  const list = useMemo(() => products.filter((p) => cat === 'all' || p.category === cat), [products, cat]);

  return (
    <FlatList
      key={cols}
      data={list}
      numColumns={cols}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: 16, gap: 18 }}
      columnWrapperStyle={{ gap: 12 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh(true)} tintColor={C.espresso} />}
      ListHeaderComponent={
        <View style={{ gap: 14 }}>
          <View>
            <Eyebrow>The collection</Eyebrow>
            <Text style={s.h1}>
              Shop the <Text style={{ fontFamily: F.displayItalic }}>glow</Text>
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {cats.map((c) => (
              <Pressable key={c.key} onPress={() => setCat(c.key)} style={[s.cat, cat === c.key && s.catOn]} accessibilityRole="tab" accessibilityState={{ selected: cat === c.key }}>
                <Text style={[s.catText, cat === c.key && { color: C.cream }]}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {error ? <Text style={s.note}>{error}</Text> : null}
          {!loading && !error ? <Text style={s.note}>{list.length} {list.length === 1 ? 'style' : 'styles'}</Text> : null}
        </View>
      }
      renderItem={({ item }) => <ProductCard p={item} width={cardW} />}
    />
  );
}

function ProductCard({ p, width }: { p: Product; width: number }) {
  const out = soldOut(p);
  const tag = out ? 'Sold out' : p.badge;
  return (
    <Link href={{ pathname: '/product/[id]', params: { id: p.id } }} asChild>
      <Pressable style={{ width }} accessibilityLabel={`${p.name}, from ${naira(minPrice(p))}`}>
        <View style={[s.media, { height: width * 1.3 }]}>
          <Image source={p.model} style={[StyleSheet.absoluteFill, out && { opacity: 0.6 }]} contentFit="cover" transition={200} />
          {tag ? (
            <View style={s.tag}>
              <Text style={s.tagText} numberOfLines={1}>{tag}</Text>
            </View>
          ) : null}
        </View>
        <Text style={s.meta} numberOfLines={1}>{p.tagline}</Text>
        <Text style={s.name} numberOfLines={2}>{p.name}</Text>
        <Text style={s.price}>
          <Text style={{ color: C.muted, fontFamily: F.body }}>from </Text>
          {naira(minPrice(p))}
        </Text>
      </Pressable>
    </Link>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: F.display, fontSize: 40, color: C.espresso, marginTop: 4 },
  cat: { paddingVertical: 9, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(107,70,54,0.22)' },
  catOn: { backgroundColor: C.espresso, borderColor: C.espresso },
  catText: { fontFamily: F.bodyBold, fontSize: 13, color: C.espresso },
  note: { fontFamily: F.body, color: C.muted, fontSize: 13 },
  media: { borderRadius: 20, overflow: 'hidden', backgroundColor: C.cream2 },
  tag: { position: 'absolute', top: 10, left: 10, maxWidth: '85%', backgroundColor: C.cream, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  tagText: { fontFamily: F.bodyHeavy, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.espresso },
  meta: { fontFamily: F.bodyBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.muted, marginTop: 10 },
  name: { fontFamily: F.display, fontSize: 19, color: C.espresso, marginTop: 3 },
  price: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.espresso, marginTop: 3 },
});
