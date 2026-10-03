import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, BodoniModa_400Regular, BodoniModa_400Regular_Italic } from '@expo-google-fonts/bodoni-moda';
import { Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from '../lib/auth';
import { CartProvider } from '../lib/cart';
import { C, F } from '../lib/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BodoniModa_400Regular,
    BodoniModa_400Regular_Italic,
    Manrope_500Medium,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream }}>
        <ActivityIndicator color={C.espresso} />
      </View>
    );
  }
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: C.cream },
            headerTintColor: C.espresso,
            headerTitleStyle: { fontFamily: F.display, fontSize: 20 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: C.cream },
            headerBackTitle: 'Back',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ title: '' }} />
          <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
          <Stack.Screen name="order/[id]" options={{ title: 'Your order' }} />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
