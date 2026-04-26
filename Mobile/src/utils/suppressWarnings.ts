/**
 * Patches console.warn and console.error to suppress known third-party
 * deprecation warnings that cannot be fixed at the source level.
 *
 * Import this file as the FIRST import in app/_layout.tsx so the patch
 * is applied before any other module emits warnings.
 */

const SUPPRESSED_PATTERNS = [
  'SafeAreaView has been deprecated',           // legacy RN SafeAreaView from 3rd-party libs
  'expo-notifications functionality is not fully supported',
  'expo-notifications: Android Push notifications',
  'Each child in a list should have a unique', // belt-and-suspenders; root cause fixed in source
];

function shouldSuppress(msg: unknown): boolean {
  if (typeof msg !== 'string') return false;
  return SUPPRESSED_PATTERNS.some((p) => msg.includes(p));
}

const _warn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  if (shouldSuppress(args[0])) return;
  _warn(...args);
};

const _error = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (shouldSuppress(args[0])) return;
  _error(...args);
};
