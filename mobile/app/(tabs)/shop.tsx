import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CATEGORIES, useCatalog, type Product } from '../../lib/catalog';
import { bounceX, bounceY, listTuning } from '../../lib/scroll';
import { C, F } from '../../lib/theme';
import { Eyebrow } from '../../components/ui';
import { ProductCard } from '../../components/ProductCard';

export default function Shop() {
  const { products, loading, error, refresh } = useCatalog();
  const params = useLocalSearchParams<{ cat?: string }>();
  const [cat, setCat] = useState(params.cat || 'all');
  // "Shop by style" on Home opens this tab on a category
  useEffect(() => { if (params.cat) setCat(params.cat); }, [params.cat]);
  const { width } = useWindowDimensions();
  const cols = width >= 700 ? 3 : 2;
  const cardW = (width - 16 * 2 - 12 * (cols - 1)) / cols;

  const cats = useMemo(() => CATEGORIES.filter((c) => c.key === 'all' || products.some((p) => p.category === c.key)), [products]);
  const renderItem = useCallback(({ item }: { item: Product }) => <ProductCard p={item} width={cardW} />, [cardW]);
  const list = useMemo(() => products.filter((p) => cat === 'all' || p.category === cat), [products, cat]);

  return (
    <FlatList
      {...bounceY}
      {...listTuning}
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
          <ScrollView horizontal {...bounceX} contentContainerStyle={{ gap: 8 }}>
            {cats.map((c) => (
              <Pressable key={c.key} onPress={() => setCat(c.key)} style={[s.cat, cat === c.key && s.catOn]} accessibilityRole="tab" accessibilityState={{ selected: cat === c.key }}>
                <Text style={[s.catText, cat === c.key && { color: C.cream }]}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {error ? <Text style={s.note}>{error}</Text> : null}
          {!loading && !error ? <Text style={s.note}>{list.length} {list.length === 1 ? 'style' : 'styles'} · press and hold a photo to see the hair up close</Text> : null}
        </View>
      }
      renderItem={renderItem}
    />
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: F.display, fontSize: 40, color: C.espresso, marginTop: 4 },
  cat: { paddingVertical: 9, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(107,70,54,0.22)' },
  catOn: { backgroundColor: C.espresso, borderColor: C.espresso },
  catText: { fontFamily: F.bodyBold, fontSize: 13, color: C.espresso },
  note: { fontFamily: F.body, color: C.muted, fontSize: 13 },
});
