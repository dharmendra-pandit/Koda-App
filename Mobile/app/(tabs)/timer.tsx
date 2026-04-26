import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Play, Pause, StopCircle, ChevronDown, Volume2, VolumeX, History } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAudioPlayer } from 'expo-audio';
import { api } from '../../src/services/api';
import { useAppStore } from '../../src/store/useAppStore';
import { Colors } from '../../src/styles/colors';
import { Spacing, BorderRadius } from '../../src/styles/spacing';
import { FontSize, FontWeight } from '../../src/styles/typography';
import { Shadows } from '../../src/styles/shadows';
import { useAlertStore } from '../../src/store/useAlertStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DURATIONS = [30, 60, 100, 120, 150, 200];
const DEFAULT_MINS = 30;

function pad(n: number) { return String(n).padStart(2, '0'); }

export default function TimerScreen() {
  const router = useRouter();
  const { subjects, fetchSubjects } = useAppStore();
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedMins, setSelectedMins] = useState(DEFAULT_MINS);
  const total = selectedMins * 60;
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useAudioPlayer(require('../../assets/ding.mp3'));
  const startPlayer = useAudioPlayer('https://actions.google.com/sounds/v1/ui/button_click.ogg');
  const pausePlayer = useAudioPlayer('https://actions.google.com/sounds/v1/ui/button_click.ogg');

  const playSound = (type: 'start' | 'pause' | 'complete') => {
    if (!soundEnabled) return;
    try {
      if (type === 'start') startPlayer.play();
      else if (type === 'pause') pausePlayer.play();
      else player.play();
    } catch (e) {
      // ignore
    }
  };

  const strokeDash = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE - (strokeDash.value / 100) * CIRCUMFERENCE,
  }));

  useEffect(() => { fetchSubjects(); }, []);

  const updateRing = useCallback((e: number) => {
    const pct = Math.min((e / total) * 100, 100);
    strokeDash.value = withTiming(pct, { duration: 800, easing: Easing.out(Easing.exp) });
  }, [total]);

  const start = () => {
    setIsRunning(true);
    playSound('start');
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        updateRing(next);
        if (next >= total) { 
          clearInterval(intervalRef.current!); 
          setIsRunning(false); 
          playSound('complete');
        }
        return next;
      });
    }, 1000);
  };

  const pause = () => {
    setIsRunning(false);
    playSound('pause');
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const stop = async () => {
    pause();
    if (elapsed < 60) {
      useAlertStore.getState().showAlert({
        title: 'Too short',
        message: 'Study for at least 1 minute to save a session',
        type: 'warning'
      });
      setElapsed(0);
      strokeDash.value = 0;
      return;
    }
    setSaving(true);
    try {
      const mins = Math.floor(elapsed / 60);
      await api.post('/sessions', { subjectId: selectedSubject?._id, duration: mins, date: new Date().toISOString() });
      useAlertStore.getState().showAlert({
        title: 'Session Saved!',
        message: `${mins} minutes recorded. +${mins >= 60 ? 10 : 5} points earned!`,
        type: 'success',
        actions: [
          { text: 'View Feed', onPress: () => router.push('/(tabs)/community') },
          { text: 'OK', style: 'cancel' }
        ]
      });
    } catch (e) {
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: 'Failed to save session',
        type: 'error'
      });
    } finally {
      setSaving(false);
      setElapsed(0);
      strokeDash.value = withTiming(0, { duration: 500 });
    }
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const remaining = total - elapsed;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={[Colors.background, '#E0F5EB', Colors.background]} style={StyleSheet.absoluteFill} />

      <Text style={styles.title}>Focus Mode</Text>

      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(screens)/timer-history')}>
          <History size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? <Volume2 size={20} color={Colors.textSecondary} /> : <VolumeX size={20} color={Colors.textMuted} />}
        </TouchableOpacity>
      </View>

      {/* Duration Picker */}
      <View style={styles.durationRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationContent}>
          {DURATIONS.map((m) => (
            <TouchableOpacity 
              key={m} 
              onPress={() => { if (!isRunning) { setSelectedMins(m); setElapsed(0); strokeDash.value = 0; } }}
              style={[styles.durationChip, selectedMins === m && styles.durationChipActive]}
              disabled={isRunning}
            >
              <Text style={[styles.durationText, selectedMins === m && styles.durationTextActive]}>{m}m</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Subject picker */}
      <TouchableOpacity style={styles.subjectPicker} onPress={() => setShowSubjectPicker(!showSubjectPicker)}>
        <Text style={styles.subjectPickerText}>{selectedSubject ? selectedSubject.title : 'Select Subject (optional)'}</Text>
        <ChevronDown size={18} color={Colors.textSecondary} />
      </TouchableOpacity>
      {showSubjectPicker && (
        <MotiView from={{ opacity: 0, scaleY: 0.8 }} animate={{ opacity: 1, scaleY: 1 }} style={styles.pickerList}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.pickerItem} onPress={() => { setSelectedSubject(null); setShowSubjectPicker(false); }}>
              <Text style={styles.pickerItemText}>None</Text>
            </TouchableOpacity>
            {subjects.map((s) => (
              <TouchableOpacity key={s._id} style={[styles.pickerItem, selectedSubject?._id === s._id && styles.pickerItemActive]} onPress={() => { setSelectedSubject(s); setShowSubjectPicker(false); }}>
                <View style={[styles.subjectDot, { backgroundColor: s.color }]} />
                <Text style={[styles.pickerItemText, selectedSubject?._id === s._id && { color: Colors.primary }]}>{s.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </MotiView>
      )}

      {/* Circular Timer */}
      <View style={styles.timerContainer}>
        <MotiView animate={isRunning ? { scale: [1, 1.015, 1] } : {}} transition={{ type: 'timing', duration: 1500, loop: true }}>
          <Svg width={280} height={280} viewBox="0 0 280 280">
            <Circle cx="140" cy="140" r={RADIUS} stroke={Colors.border} strokeWidth={12} fill="none" />
            <AnimatedCircle
              cx="140" cy="140" r={RADIUS}
              stroke={Colors.primary}
              strokeWidth={12}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              animatedProps={animatedProps}
              strokeLinecap="round"
              rotation="-90"
              origin="140, 140"
            />
          </Svg>
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerText}>{pad(mins)}:{pad(secs)}</Text>
            <Text style={styles.timerLabel}>{isRunning ? 'Focusing...' : 'Ready'}</Text>
            {selectedSubject && <Text style={[styles.timerSubject, { color: selectedSubject.color }]}>{selectedSubject.title}</Text>}
          </View>
        </MotiView>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!isRunning ? (
          <TouchableOpacity onPress={start} style={styles.mainBtn}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.mainBtnGrad}>
              <Play size={32} color={Colors.white} fill={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={pause} style={styles.mainBtn}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.mainBtnGrad}>
              <Pause size={32} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}
        {elapsed > 0 && (
          <TouchableOpacity onPress={stop} style={styles.stopBtn} disabled={saving}>
            <StopCircle size={28} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.hint}>Press stop to save your session</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center', paddingTop: Spacing.md, marginBottom: Spacing.md },
  headerActions: { position: 'absolute', top: Spacing.md + 40, right: Spacing.screenPadding, zIndex: 10, flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8, backgroundColor: Colors.card, borderRadius: 20, ...Shadows.sm as any },
  durationRow: { marginVertical: Spacing.md },
  durationContent: { paddingHorizontal: Spacing.screenPadding, gap: 10 },
  durationChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.borderLight },
  durationChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  durationText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  durationTextActive: { color: Colors.white },
  subjectPicker: { marginHorizontal: Spacing.screenPadding, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...Shadows.card as any },
  subjectPickerText: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  pickerList: { marginHorizontal: Spacing.screenPadding, marginTop: 4, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, maxHeight: 200, overflow: 'hidden', ...Shadows.md as any, zIndex: 10 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pickerItemActive: { backgroundColor: Colors.glassDark },
  pickerItemText: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  subjectDot: { width: 10, height: 10, borderRadius: 5 },
  timerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timerTextContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 0, left: 0, right: 0, bottom: 0 },
  timerText: { fontSize: FontSize.giant, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: -2 },
  timerLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium, marginTop: 4 },
  timerSubject: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, marginTop: 6 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xl, paddingBottom: Spacing.xl },
  mainBtn: { borderRadius: 40, overflow: 'hidden', ...Shadows.green as any },
  mainBtnGrad: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  stopBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadows.card as any },
  hint: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, paddingBottom: Spacing.xxl },
});
