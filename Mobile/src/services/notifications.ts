import { Platform } from 'react-native';
import Constants from 'expo-constants';

// expo-notifications remote push support was removed from Expo Go in SDK 53+.
// We detect Expo Go and completely skip ALL notification calls to prevent:
//   - WARN: expo-notifications not fully supported in Expo Go
//   - ERROR: nullthrows undefined (native module not available)
const isExpoGo = Constants.appOwnership === 'expo';

// Lazily setup the handler only in dev builds / production
if (!isExpoGo) {
  // Dynamic import to avoid ANY native module touching during Expo Go launch
  import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }).catch(() => {});
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo) return null;

  try {
    const Notifications = await import('expo-notifications');

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    // Skip remote push token — only works in dev builds with projectId
    return null;
  } catch (e) {
    return null;
  }
}

export async function scheduleDailyLeaderboardNotification(): Promise<void> {
  if (isExpoGo) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Leaderboard Updated!',
        body: 'Check out the daily leaderboard updates and see where you rank!',
        sound: true,
      },
      trigger: {
        type: 'daily',
        hour: 22,
        minute: 0,
      } as any,
    });
  } catch (e) {}
}

export async function showLocalNotification(title: string, body: string, data: Record<string, any> = {}): Promise<void> {
  if (isExpoGo) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null,
    });
  } catch (e) {}
}
