import '../src/utils/suppressWarnings'; // ← must be first — patches console.warn before any module loads
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CustomAlert } from '../src/components/ui/CustomAlert';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { useAuthStore } from '../src/store/useAuthStore';
import { useAppStore } from '../src/store/useAppStore';
import { Colors } from '../src/styles/colors';

// Moti writes to shared values during its animation setup phase, which triggers
// Reanimated strict-mode warnings. These are false positives — disable strict logging.
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

import { socketService } from '../src/services/socket';
import { registerForPushNotificationsAsync, scheduleDailyLeaderboardNotification, showLocalNotification } from '../src/services/notifications';

function AuthGuard() {
  const { user, isLoading, loadUser } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
      socketService.disconnect();
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
      socketService.connect(user._id);
    } else if (user) {
      socketService.connect(user._id);
    }
  }, [user, isLoading]);

  const { fetchSubjects } = useAppStore();

  useEffect(() => {
    socketService.on('subject_created', fetchSubjects);
    socketService.on('subject_updated', fetchSubjects);
    socketService.on('subject_deleted', fetchSubjects);
    socketService.on('chapter_created', fetchSubjects);
    socketService.on('chapter_updated', fetchSubjects);
    socketService.on('session_created', () => {
      fetchSubjects();
      loadUser();
    });
    
    // Notifications socket listener
    socketService.on('notification', (data) => {
      if (data.type === 'reply') {
        showLocalNotification(
          "New Reply on your Doubt",
          `${data.reply.userId?.name} replied: "${data.reply.text.slice(0, 50)}..."`,
          { doubtId: data.doubtId }
        );
      }
    });

    return () => {
      socketService.off('subject_created');
      socketService.off('subject_updated');
      socketService.off('subject_deleted');
      socketService.off('chapter_created');
      socketService.off('chapter_updated');
      socketService.off('session_created');
      socketService.off('notification');
    };
  }, []);

  useEffect(() => {
    // Setup local notifications and permissions
    registerForPushNotificationsAsync().then(() => {
      scheduleDailyLeaderboardNotification();
    });
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" backgroundColor={Colors.background} />
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: Colors.background } }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(screens)/chapters" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="(screens)/analytics" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="(screens)/search" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="(screens)/leaderboard" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="(screens)/doubt-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="(screens)/edit-profile" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="(screens)/user-profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack>
        <CustomAlert />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
