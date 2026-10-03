import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCart } from '../../lib/cart';
import { C, F } from '../../lib/theme';

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
        options={{ title: 'Account', headerTitle: 'Your account', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
