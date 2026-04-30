import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { paperTheme } from '@/theme/paperTheme';
import { useAuth } from '@/hooks/useAuth';
import { initRevenueCat, loginRevenueCat } from '@/services/revenuecat';
import { initAnalytics, identify } from '@/services/analytics';

export default function RootLayout() {
  const { isAuthenticated, loading, user, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Init analytics + RevenueCat once
  useEffect(() => {
    initAnalytics();
    initRevenueCat();
  }, []);

  // Identify user with RevenueCat & analytics on login
  useEffect(() => {
    if (user) {
      loginRevenueCat(user.id);
      identify(user.id, {
        username: profile?.username,
        company: profile?.company_name,
        plan: profile?.subscription_plan,
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, loading, segments]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="auto" />
        <Slot />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
