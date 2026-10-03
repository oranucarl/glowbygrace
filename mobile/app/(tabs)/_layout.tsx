import { Tabs } from 'expo-router';
import { Text, View, type ColorValue } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { displayName, useAuth } from '../../lib/auth';
import { useCart } from '../../lib/cart';
import { C, F } from '../../lib/theme';

// Signed in: your profile photo (or initial) as the Account tab icon, like the website header.
function AccountIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
  const { user } = useAuth();
  if (!user) return <Ionicons name="person-circle-outline" color={color} size={size} />;
  const m: any = user.user_metadata || {};
  const pic = m.avatar_url || m.picture;
  const ring = { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2, borderWidth: 2, borderColor: focused ? C.espresso : C.gold, overflow: 'hidden' as const, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={ring}>
      {pic ? (
        <Image source={pic} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.espresso, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.cream, fontFamily: F.display, fontSize: size * 0.55 }}>{displayName(user).charAt(0).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { count } = useCart();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.cream },
        headerTitleStyle: { fontFamily: F.display, fontSize: 22, color: C.espresso },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: C.cream },
        tabBarActiveTintColor: C.espresso,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.white, borderTopColor: 'rgba(107,70,54,0.12)' },
        tabBarLabelStyle: { fontFamily: F.bodyBold, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="shop"
        options={{ title: 'Shop', headerTitle: 'Glow by Grace', tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="bag"
        options={{
          title: 'Bag',
          headerTitle: 'Your bag',
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: C.gold, color: C.ink, fontFamily: F.bodyHeavy },
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-handle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Account', headerTitle: 'Your account', tabBarIcon: (props) => <AccountIcon {...props} /> }}
      />
    </Tabs>
  );
}
