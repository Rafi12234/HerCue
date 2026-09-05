import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BootErrorScreen } from '../src/components/common/BootErrorScreen';
import { BootSplash } from '../src/components/common/BootSplash';
import { useReducedMotionSync } from '../src/hooks/useReducedMotion';
import { BOOT_STATUS, useAppStore } from '../src/stores/appStore';
import { colors } from '../src/theme/colors';
import { LOG_CATEGORY, logger } from '../src/utils/logger';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Expo Router renders this for any uncaught error inside a route. */
export function ErrorBoundary({ error, retry }) {
  logger.error(LOG_CATEGORY.UI, 'Unhandled render error', error);
  return <BootErrorScreen message="Something unexpected happened on this screen." onRetry={retry} />;
}

export default function RootLayout() {
  const status = useAppStore((state) => state.status);
  const error = useAppStore((state) => state.error);
  const bootstrap = useAppStore((state) => state.bootstrap);
  const retry = useAppStore((state) => state.retry);

  useReducedMotionSync();

  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Fonts failing is a cosmetic problem, not a blocking one: fall through to the
  // platform font rather than trapping the user on a splash screen.
  const fontsSettled = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (fontError) logger.warn(LOG_CATEGORY.UI, 'Nunito failed to load; using system font');
  }, [fontError]);

  const isReady = fontsSettled && status === BOOT_STATUS.READY;
  const hasFailed = status === BOOT_STATUS.FAILED;

  useEffect(() => {
    if (isReady || hasFailed) SplashScreen.hideAsync().catch(() => {});
  }, [isReady, hasFailed]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <StatusBar style="dark" translucent backgroundColor="transparent" />

        {hasFailed ? (
          <BootErrorScreen message={error} onRetry={retry} />
        ) : !isReady ? (
          <BootSplash />
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="medicine/index"
              options={{ animation: 'slide_from_bottom', presentation: 'card' }}
            />
          </Stack>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
