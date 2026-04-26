import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { ArrowLeft, BarChart2, Flame, Zap } from 'lucide-react-native';
import { api } from '../../src/services/api';
import { TabSwitcher } from '../../src/components/ui/TabSwitcher';
import { Card } from '../../src/components/ui/Card';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Colors } from '../../src/styles/colors';
import { Spacing, BorderRadius } from '../../src/styles/spacing';
import { FontSize, FontWeight } from '../../src/styles/typography';
import { Shadows } from '../../src/styles/shadows';

const TABS = [{ key: 'daily', label: 'Daily' }, { key: 'subjects', label: 'Subjects' }];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Analytics {
  totalMinutes: number;
  totalHours: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: string;
  weekly: { _id: string; minutes: number; sessions: number }[];
  bySubject: { _id: string; subjectTitle: string; subjectColor: string; totalMinutes: number; count: number }[];
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('daily');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions/analytics')
      .then(({ data }) => setAnalytics(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function fmt(m: number) {
    if (m <= 0) return '0m';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }

  // Build 7-day chart from weekly aggregated data
  const dailyChart = (() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const found = analytics?.weekly.find((w) => w._id === dateStr);
      return { day: DAYS[d.getDay()], mins: found?.minutes ?? 0 };
    });
  })();

  const maxMins = Math.max(...dailyChart.map((d) => d.mins), 1);
  const totalSubjectMins = analytics?.bySubject.reduce((a, s) => a + s.totalMinutes, 0) || 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} size="large" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            {[
              { label: 'Total Time', value: fmt(analytics?.totalMinutes ?? 0), icon: BarChart2, color: Colors.primary },
              { label: 'Streak', value: `${analytics?.currentStreak ?? 0}d`, icon: Flame, color: Colors.streakOrange },
              { label: 'Points', value: String(analytics?.totalPoints ?? 0), icon: Zap, color: Colors.gold },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} style={styles.summaryCard}>
                <Icon size={20} color={color} />
                <Text style={[styles.summaryValue, { color }]}>{value}</Text>
                <Text style={styles.summaryLabel}>{label}</Text>
              </Card>
            ))}
          </View>

          <View style={styles.tabContainer}>
            <TabSwitcher tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          </View>

          {/* Daily Chart */}
          {activeTab === 'daily' && (
            <>
            <View style={styles.chartContainer}>
              {dailyChart.map((item, i) => {
                const ratio = item.mins / maxMins;
                // Multi-tier color system based on study duration (all days)
                let barColor = Colors.borderLight; // 0 min
                if (item.mins >= 100) {
                  barColor = '#38BDF8'; // 💧 Water blue — Power user 100+ min
                } else if (item.mins >= 60) {
                  barColor = Colors.gold;          // 🏅 Gold — 1 hour+
                } else if (item.mins >= 30) {
                  barColor = Colors.streakOrange;  // 🔥 Orange — 30 min target hit
                } else if (item.mins > 0) {
                  barColor = Colors.primary;       // 🟢 Green — started but below 30 min
                }

                return (
                  <MotiView
                    key={`${item.day}-${i}`}
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 300, delay: i * 50 }}
                    style={styles.barWrapper}
                  >
                    <Text style={styles.barValue}>{item.mins > 0 ? fmt(item.mins) : ''}</Text>
                    <View style={styles.barTrack}>
                      <MotiView
                        from={{ height: 0 }}
                        animate={{ height: `${Math.max(ratio * 100, item.mins > 0 ? 5 : 0)}%` as any }}
                        transition={{ type: 'spring', delay: i * 60 + 80 }}
                        style={[styles.bar, { backgroundColor: barColor }]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{item.day}</Text>
                  </MotiView>
                );
              })}
            </View>

            {/* Color Legend */}
            <View style={styles.legendRow}>
              {[
                { color: Colors.primary,       label: '< 30m' },
                { color: Colors.streakOrange,  label: '30m+' },
                { color: Colors.gold,          label: '1h+' },
                { color: '#38BDF8',            label: '100m+' },
              ].map(({ color, label }) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendLabel}>{label}</Text>
                </View>
              ))}
            </View>
            </>
          )}

          {/* Subject List */}
          {activeTab === 'subjects' && (
            <View style={styles.subjectList}>
              {(analytics?.bySubject.length ?? 0) === 0 ? (
                <Text style={styles.emptyText}>No subject data yet. Start a study session!</Text>
              ) : (
                analytics?.bySubject.map((s, i) => (
                  <MotiView
                    key={s._id}
                    from={{ opacity: 0, translateX: -16 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', duration: 300, delay: i * 70 }}
                  >
                    <Card style={styles.subjectItem}>
                      <View style={[styles.subjectDot, { backgroundColor: s.subjectColor || Colors.primary }]} />
                      <View style={{ flex: 1 }}>
                        <View style={styles.subjectRow}>
                          <Text style={styles.subjectName}>{s.subjectTitle || 'General'}</Text>
                          <Text style={styles.subjectTime}>{fmt(s.totalMinutes)} ({Math.round((s.totalMinutes / totalSubjectMins) * 100)}%)</Text>
                        </View>
                        <ProgressBar
                          progress={s.totalMinutes / totalSubjectMins}
                          color={s.subjectColor || Colors.primary}
                          height={5}
                          style={{ marginTop: 6 }}
                        />
                        <Text style={styles.sessionCount}>{s.count} session{s.count !== 1 ? 's' : ''}</Text>
                      </View>
                    </Card>
                  </MotiView>
                ))
              )}
            </View>
          )}

          {/* Level Info Card */}
          {analytics && (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 300 }}
              style={styles.levelCard}
            >
              <Card style={styles.levelInner}>
                <Text style={styles.levelLabel}>Current Level</Text>
                <Text style={styles.levelValue}>{analytics.level}</Text>
                <Text style={styles.levelSub}>Longest Streak: {analytics.longestStreak} days</Text>
              </Card>
            </MotiView>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md, paddingBottom: Spacing.md, gap: 12,
  },
  backBtn: { padding: 6 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  summaryRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md,
  },
  summaryCard: { flex: 1, alignItems: 'center' as const, gap: 4, paddingVertical: Spacing.md, ...Shadows.card },
  summaryValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  tabContainer: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  chartContainer: {
    flexDirection: 'row', height: 190,
    paddingHorizontal: Spacing.screenPadding,
    alignItems: 'flex-end', gap: 6, marginBottom: Spacing.sm,
  },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: {
    width: '100%', height: 130,
    justifyContent: 'flex-end',
    borderRadius: BorderRadius.sm, overflow: 'hidden',
    backgroundColor: Colors.backgroundAlt,
  },
  bar: { width: '100%', borderTopLeftRadius: BorderRadius.sm, borderTopRightRadius: BorderRadius.sm },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.xl,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  barValue: { fontSize: 9, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  barLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  subjectList: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 20, gap: Spacing.sm },
  subjectItem: { flexDirection: 'row', alignItems: 'center' as const, gap: 12, ...Shadows.card },
  subjectDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  subjectTime: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  sessionCount: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 60, fontSize: FontSize.base },
  levelCard: { paddingHorizontal: Spacing.screenPadding, marginBottom: 60 },
  levelInner: { alignItems: 'center' as const, gap: 6, paddingVertical: Spacing.xl, ...Shadows.card },
  levelLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  levelValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  levelSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
