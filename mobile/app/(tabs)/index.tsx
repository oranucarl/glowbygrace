// Home — the app version of the website's landing page.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCatalog } from '../../lib/catalog';
import { C, F } from '../../lib/theme';
import { Button, Eyebrow } from '../../components/ui';
import { ProductCard } from '../../components/ProductCard';

const U = (id: string, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

// same photos as the website's home page
const HERO = U('photo-1551524267-c0baf940832c', 1100);
// the website's hero clip (mobile version)
const HERO_VIDEO = 'https://cdn.shopify.com/s/files/1/1819/4549/files/mobile-video.mp4?v=1629207844';
const STYLES = [
  { cat: 'straight', label: 'Bone straight', img: U('photo-1551524267-c0baf940832c', 700) },
  { cat: 'curly', label: 'Curly', img: U('photo-1585890483046-9461ebc1dace', 700) },
  { cat: 'bob', label: 'Bobs', img: U('photo-1648827966041-f773128fc993', 700) },
  { cat: 'braids', label: 'Braids', img: U('photo-1613099084406-4b9140fc780a', 700) },
  { cat: 'wavy', label: 'Waves', img: U('photo-1632984814154-6e07a671ae58', 700) },
];
const MARQUEE = ['100% human hair', 'Bone straight', 'Glueless HD lace', 'Same-day Lagos delivery', 'Pre-plucked hairlines'];
const DIFFERENCE = [
  ['Premium human hair', 'Double drawn, cuticle-aligned hair that stays soft, tangle-free and full from root to tip.'],
  ['Invisible HD lace', 'Pre-plucked hairlines and bleached knots that melt into every skin tone.'],
  ['Glueless & ready to wear', 'Pre-cut lace and adjustable bands — wear it in minutes, no glue, no stress.'],
  ['Real people, real help', 'Not sure what to pick? Chat with us on WhatsApp anytime.'],
];
const LOOKBOOK = [
  'photo-1508002366005-75a695ee2d17',
  'photo-1656473040206-53753fbbc767',
  'photo-1581341038810-5a2fa5b18f6e',
  'photo-1696622049200-3512d97e3258',
  'photo-1762745101365-1dbc90b98007',
  'photo-1656473014073-ae696e9e4349',
].map((id) => U(id, 500));

export default function Home() {
  const { products, loading, refresh } = useCatalog();
  const { width } = useWindowDimensions();
  const featured = (products.filter((p) => p.featured).length ? products.filter((p) => p.featured) : products).slice(0, 4);
  const cardW = (width - 16 * 2 - 12) / 2;
  const goShop = (cat?: string) => router.navigate({ pathname: '/shop', params: cat ? { cat } : {} });
  const heroH = Math.min(width * 1.25, 620);

  // muted looping hero video; the photo shows until the first frame plays
  const player = useVideoPlayer(HERO_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const [heroVisible, setHeroVisible] = useState(true);
  const [focused, setFocused] = useState(true);
  // pause when another tab is open or the hero is scrolled away (saves data and battery)
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const shouldPlay = focused && heroVisible;
  useEffect(() => {
    if (shouldPlay) player.play();
    else player.pause();
  }, [shouldPlay, player]);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setHeroVisible(e.nativeEvent.contentOffset.y < heroH * 0.8);

  return (
    <ScrollView onScroll={onScroll} scrollEventThrottle={64} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh(true)} tintColor={C.espresso} />}>
      {/* hero */}
      <View style={{ height: heroH }}>
        <Image source={HERO} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        <VideoView player={player} style={[StyleSheet.absoluteFill, { opacity: isPlaying ? 1 : 0 }]} contentFit="cover" nativeControls={false} />
        <LinearGradient colors={['rgba(23,15,11,0.05)', 'rgba(23,15,11,0.75)']} style={StyleSheet.absoluteFill} />
        <View style={s.heroBody}>
          <Text style={s.heroTitle}>
            Glow<Text style={s.heroBy}> by </Text>
            <Text style={{ fontFamily: F.displayItalic }}>Grace.</Text>
          </Text>
          <Text style={s.heroText}>Luxury human hair for the woman who walks in and owns the room — hand-picked in Lagos.</Text>
          <Button title="Shop the hair" variant="gold" onPress={() => goShop()} style={{ alignSelf: 'flex-start', paddingHorizontal: 28 }} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.marquee} contentContainerStyle={{ gap: 22, paddingHorizontal: 16 }}>
        {MARQUEE.map((m) => <Text key={m} style={s.marqueeText}>{m} ✦</Text>)}
      </ScrollView>

      {/* shop by style */}
      <View style={s.section}>
        <Eyebrow>Shop by style</Eyebrow>
        <Text style={s.h2}>Pick your <Text style={{ fontFamily: F.displayItalic }}>era.</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }} style={{ marginHorizontal: -16, paddingLeft: 16, marginTop: 14 }}>
          {STYLES.map((t) => (
            <Pressable key={t.cat} onPress={() => goShop(t.cat)} style={s.tile} accessibilityRole="button" accessibilityLabel={`Shop ${t.label}`}>
              <Image source={t.img} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
              <LinearGradient colors={['transparent', 'rgba(23,15,11,0.7)']} style={StyleSheet.absoluteFill} />
              <Text style={s.tileText}>{t.label} ↗</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* bestsellers */}
      <View style={s.section}>
        <Eyebrow>Loved by our queens</Eyebrow>
        <Text style={s.h2}>The <Text style={{ fontFamily: F.displayItalic }}>bestsellers</Text></Text>
        <Text style={s.muted}>Press and hold a photo to see the hair up close.</Text>
        <View style={s.grid}>
          {featured.map((p) => <ProductCard key={p.id} p={p} width={cardW} />)}
        </View>
        <Button title="View all hair" variant="ghost" onPress={() => goShop()} style={{ marginTop: 20 }} />
      </View>

      {/* the Grace difference */}
      <View style={[s.section, { backgroundColor: C.cream2, marginTop: 28, paddingBottom: 28 }]}>
        <Eyebrow>The Grace difference</Eyebrow>
        <Text style={s.h2}>Hair that <Text style={{ fontFamily: F.displayItalic }}>loves</Text> you back.</Text>
        <Text style={s.muted}>Every unit is inspected strand by strand before it reaches you.</Text>
        <View style={{ gap: 16, marginTop: 16 }}>
          {DIFFERENCE.map(([t, d], i) => (
            <View key={t} style={s.diff}>
              <Text style={s.diffNo}>0{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.diffTitle}>{t}</Text>
                <Text style={s.muted}>{d}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* lookbook */}
      <View style={[s.section, { paddingBottom: 32 }]}>
        <Eyebrow>#GlowByGrace</Eyebrow>
        <Text style={s.h2}>Worn by <Text style={{ fontFamily: F.displayItalic }}>queens</Text></Text>
        <View style={[s.grid, { gap: 8 }]}>
          {LOOKBOOK.map((src) => (
            <Pressable key={src} onPress={() => goShop()} style={{ width: (width - 32 - 8) / 2, height: (width - 40) / 2 * 1.2, borderRadius: 16, overflow: 'hidden' }}>
              <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  heroBody: { position: 'absolute', left: 20, right: 20, bottom: 28, gap: 12 },
  heroTitle: { fontFamily: F.display, fontSize: 54, lineHeight: 58, color: C.cream },
  heroBy: { fontFamily: 'Manrope_500Medium', fontSize: 22, color: C.gold2 },
  heroText: { fontFamily: F.body, fontSize: 15, lineHeight: 23, color: 'rgba(247,240,231,0.92)', maxWidth: 340 },
  marquee: { backgroundColor: C.espresso, paddingVertical: 12, flexGrow: 0 },
  marqueeText: { fontFamily: F.bodyBold, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', color: C.cream },
  section: { paddingHorizontal: 16, paddingTop: 28 },
  h2: { fontFamily: F.display, fontSize: 34, color: C.espresso, marginTop: 6 },
  muted: { fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.muted, marginTop: 6 },
  tile: { width: 150, height: 200, borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end', padding: 12 },
  tileText: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.cream },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  diff: { flexDirection: 'row', gap: 14 },
  diffNo: { fontFamily: F.display, fontSize: 22, color: C.gold },
  diffTitle: { fontFamily: F.display, fontSize: 20, color: C.espresso },
});
