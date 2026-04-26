import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { ArrowLeft, Clock, BookOpen, Calendar } from 'lucide-react-native';
import { api } from '../../src/services/api';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Colors } from '../../src/styles/colors';
import { Spacing, BorderRadius } from '../../src/styles/spacing';
import { FontSize, FontWeight } from '../../src/styles/typography';
import { Shadows } from '../../src/styles/shadows';

export default function TimerHistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/sessions?limit=50');
        setSessions(data.data || []);
      } catch (err) {
        console.error('Failed to load sessions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  const renderSession = ({ item, index }: { item: any, index: number }) => (
    <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: index * 50, type: 'timing', duration: 300 }}>
      <Card style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, { backgroundColor: item.subjectId?.color ? item.subjectId.color + '20' : Colors.primary + '20' }]}>
            <Clock size={20} color={item.subjectId?.color || Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.subjectId?.title || 'General Focus'}</Text>
            <View style={styles.metaRow}>
              <Calendar size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>{new Date(item.date || item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
        <Badge label={formatDuration(item.duration)} color={Colors.backgroundAlt} textColor={Colors.textPrimary} />
      </Card>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session History</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item, index) => `hist-${item._id}-${index}`}
          renderItem={renderSession}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <BookOpen size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No past sessions found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md, paddingBottom: Spacing.md, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.screenPadding, gap: Spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, ...Shadows.sm as any },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base, color: Colors.textMuted },
});
