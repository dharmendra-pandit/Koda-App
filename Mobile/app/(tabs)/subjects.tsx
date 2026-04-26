import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Plus, BookOpen, Trash2, ChevronRight } from 'lucide-react-native';
import { api } from '../../src/services/api';
import { useAppStore } from '../../src/store/useAppStore';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Badge } from '../../src/components/ui/Badge';
import { Colors } from '../../src/styles/colors';
import { Spacing, BorderRadius } from '../../src/styles/spacing';
import { FontSize, FontWeight } from '../../src/styles/typography';
import { Shadows } from '../../src/styles/shadows';
import { useAlertStore } from '../../src/store/useAlertStore';

const COLORS = Colors.subjectColors;

export default function SubjectsScreen() {
  const router = useRouter();
  const { subjects, fetchSubjects, isLoadingSubjects } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [titleError, setTitleError] = useState('');

  useEffect(() => { fetchSubjects(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchSubjects(); setRefreshing(false); };

  const handleAdd = async () => {
    if (!newTitle.trim()) { setTitleError('Subject name is required'); return; }
    setTitleError('');
    setAdding(true);
    try {
      await api.post('/subjects', { title: newTitle.trim(), color: selectedColor, isPublic: true });
      setNewTitle('');
      setSelectedColor(COLORS[0]);
      setShowModal(false);
      await fetchSubjects();
    } catch (err: any) {
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: err?.response?.data?.message || 'Failed to add subject',
        type: 'error'
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    useAlertStore.getState().showAlert({
      title: 'Delete Subject',
      message: 'Are you sure you want to delete this subject and all its chapters?',
      type: 'confirm',
      actions: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.delete(`/subjects/${id}`);
              await fetchSubjects();
            } catch { 
              useAlertStore.getState().showAlert({
                title: 'Error',
                message: 'Failed to delete subject',
                type: 'error'
              });
            }
          } 
        }
      ]
    });
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MotiView from={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 350, delay: index * 70 }}>
      <Card style={styles.subjectCard} onPress={() => router.push({ pathname: '/(screens)/chapters', params: { subjectId: item._id, title: item.title } })}>
        <View style={styles.cardLeft}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.subjectName} numberOfLines={1}>{item.title}</Text>
            <ProgressBar progress={item.progress || 0} color={item.color} style={{ marginTop: 8 }} />
            <Text style={styles.subjectMeta}>Progress: {Math.round((item.progress || 0) * 100)}%</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
            <Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
          <ChevronRight size={18} color={Colors.textMuted} />
        </View>
      </Card>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Subjects</Text>
          <Text style={styles.subtitle}>{subjects.length} subjects</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.headerAddBtn}>
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoadingSubjects ? (
        <View style={styles.loader}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={subjects}
          renderItem={renderItem}
          keyExtractor={(item, index) => `subj-${item._id}-${index}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BookOpen size={52} color={Colors.border} />
              <Text style={styles.emptyTitle}>No subjects yet</Text>
              <Text style={styles.emptyText}>Add your first subject to get started!</Text>
            </View>
          }
        />
      )}



      {/* Add Subject Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowModal(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>New Subject</Text>
          <Input label="Subject Name" placeholder="e.g. Mathematics" value={newTitle} onChangeText={setNewTitle} error={titleError} />

          <Text style={styles.colorLabel}>Pick a Color</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity key={c} onPress={() => setSelectedColor(c)} style={[styles.colorOption, { backgroundColor: c }, selectedColor === c && styles.colorSelected]} />
            ))}
          </View>

          <Button title="Add Subject" onPress={handleAdd} loading={adding} fullWidth style={{ marginTop: Spacing.lg }} />
          <Button title="Cancel" onPress={() => setShowModal(false)} variant="ghost" fullWidth style={{ marginTop: Spacing.sm }} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  headerAddBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadows.sm as any, borderWidth: 1, borderColor: Colors.borderLight },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 120 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subjectCard: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, ...Shadows.card as any },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  subjectName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  subjectMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  deleteBtn: { padding: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: FontSize.base, color: Colors.textMuted, textAlign: 'center' },
  fab: { position: 'absolute', right: Spacing.lg, bottom: 100 },
  fabBtn: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.green as any },
  backdrop: { flex: 1, backgroundColor: Colors.overlay },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingBottom: 40, gap: Spacing.md },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  colorLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorOption: { width: 32, height: 32, borderRadius: 16, borderWidth: 2.5, borderColor: Colors.transparent },
  colorSelected: { borderColor: Colors.textPrimary, transform: [{ scale: 1.2 }] },
});
