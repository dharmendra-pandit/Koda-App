import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { Spacing, BorderRadius } from './spacing';

export const GlobalStyles = StyleSheet.create({
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexRowCenter: { flexDirection: 'row', alignItems: 'center' },
  flexRowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', justifyContent: 'center' },
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPadding,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  between: {
    justifyContent: 'space-between',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glassDark,
  },
  greenGradientPlaceholder: {
    backgroundColor: Colors.primary,
  },
});
