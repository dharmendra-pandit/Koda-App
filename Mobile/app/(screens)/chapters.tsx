import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Plus, CheckCircle, Circle, ArrowLeft, BookOpen } from 'lucide-react-native';
import { api } from '../../src/services/api';
import { useAppStore } from '../../src/store/useAppStore';
import { useAlertStore } from '../../src/store/useAlertStore';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Colors } from '../../src/styles/colors';
import { Spacing, BorderRadius } from '../../src/styles/spacing';
import { FontSize, FontWeight } from '../../src/styles/typography';
import { Shadows } from '../../src/styles/shadows';

function ChapterItem({ item, onToggle, index }: { item: any; onToggle: (id: string, completed: boolean) => void; index: number }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleToggle = () => {
    scale.value = withSpring(0.92, { damping: 12 }, () => { scale.value = withSpring(1); });
    onToggle(item._id, !item.isCompleted);
  };

  return (
    <MotiView from={{ opacity: 0, translateX: -16 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 300, delay: index * 60 }}>
      <Card style={styles.chapterCard}>
        <Animated.View style={animStyle}>
          <TouchableOpacity onPress={handleToggle} style={styles.checkbox}>
            {item.isCompleted
              ? <CheckCircle size={24} color={Colors.primary} fill={Colors.primary} />
              : <Circle size={24} color={Colors.border} />
            }
          </TouchableOpacity>
        </Animated.View>
        <Text style={[styles.chapterTitle, item.isCompleted && styles.chapterDone]}>{item.title}</Text>
        {item.isCompleted && <Text style={styles.doneLabel}>+10pts</Text>}
      </Card>
    </MotiView>
  );
}

export default function ChaptersScreen() {
  const { subjectId, title } = useLocalSearchParams<{ subjectId: string; title: string }>();
  const router = useRouter();
  const { fetchSubjects } = useAppStore();
  const [chapters, setChapters] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [titleError, setTitleError] = useState('');

  const fetchChapters = useCallback(async () => {
    try {
      const { data } = await api.get(`/chapters/${subjectId}`);
      setChapters(data.data || []);
    } catch {}
  }, [subjectId]);

  useEffect(() => { fetchChapters(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchChapters(); setRefreshing(false); };

  const handleToggle = async (id: string, isCompleted: boolean) => {
    setChapters((prev) => prev.map((c) => c._id === id ? { ...c, isCompleted } : c));
    try {
      await api.put(`/chapters/${id}`, { isCompleted });
      fetchSubjects();
      if (isCompleted) {
        useAlertStore.getState().showAlert({
          title: 'Chapter Completed!',
          message: 'Great job! See what others are studying in the community.',
          type: 'success',
          actions: [
            { text: 'View Feed', onPress: () => router.push('/(tabs)/community') },
            { text: 'Keep Going', style: 'cancel' }
          ]
        });
      }
    } catch {
      setChapters((prev) => prev.map((c) => c._id === id ? { ...c, isCompleted: !isCompleted } : c));
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) { setTitleError('Chapter name is required'); return; }
    setTitleError('');
    setAdding(true);
    try {
      await api.post('/chapters', { subjectId, title: newTitle.trim() });
      setNewTitle('');
      setShowModal(false);
      await fetchChapters();
      fetchSubjects();
    } catch (e: any) {
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: e?.response?.data?.message || 'Failed to add chapter',
        type: 'error'
      });
    } finally { setAdding(false); }
  };

  const completed = chapters.filter((c) => c.isCompleted).length;
  const progress = chapters.length > 0 ? completed / chapters.length : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.subtitle}>{completed}/{chapters.length} chapters done</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} height={8} />
        <Text style={styles.progressText}>{Math.round(progress * 100)}% complete</Text>
      </View>

      <FlatList
        data={chapters}
        renderItem={({ item, index }) => <ChapterItem item={item} onToggle={handleToggle} index={index} />}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <BookOpen size={44} color={Colors.border} />
            <Text style={styles.emptyText}>No chapters yet. Add your first!</Text>
          </View>
        }
      />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowModal(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Add Chapter</Text>
          <Input label="Chapter Name" placeholder="e.g. Algebra Basics" value={newTitle} onChangeText={setNewTitle} error={titleError} />
          <Button title="Add Chapter" onPress={handleAdd} loading={adding} fullWidth />
          <Button title="Cancel" onPress={() => setShowModal(false)} variant="ghost" fullWidth />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md, paddingBottom: Spacing.md, gap: 12 },
  backBtn: { padding: 6 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  progressContainer: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md, gap: 6 },
  progressText: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right' },
  list: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 40 },
  chapterCard: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: 12, ...Shadows.card as any },
  checkbox: { padding: 2 },
  chapterTitle: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  chapterDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  doneLabel: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: FontSize.base, color: Colors.textSecondary },
  backdrop: { flex: 1, backgroundColor: Colors.overlay },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingBottom: 40, gap: Spacing.md },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});
