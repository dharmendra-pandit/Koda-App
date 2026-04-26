import { Platform, ViewStyle } from 'react-native';
import { Colors } from './colors';

const shadow = (obj: ViewStyle): ViewStyle => obj;

export const Shadows = {
  none: {} as ViewStyle,
  sm: (Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: {},
  }) ?? {}) as ViewStyle,
  md: (Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: { elevation: 5 },
    default: {},
  }) ?? {}) as ViewStyle,
  lg: (Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
    },
    android: { elevation: 10 },
    default: {},
  }) ?? {}) as ViewStyle,
  card: (Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
    },
    android: { elevation: 3 },
    default: {},
  }) ?? {}) as ViewStyle,
  green: (Platform.select({
    ios: {
      shadowColor: '#2FA36B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    android: { elevation: 8 },
    default: {},
  }) ?? {}) as ViewStyle,
};
