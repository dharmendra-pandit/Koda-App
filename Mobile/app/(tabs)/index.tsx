import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import {
  Flame,
  Zap,
  Clock,
  TrendingUp,
  ChevronRight,
  Trophy,
  Target,
  BookOpen,
} from 'lucide-react-native'
import { useAuthStore } from '../../src/store/useAuthStore'
import { api } from '../../src/services/api'
import { Card } from '../../src/components/ui/Card'
import { Avatar } from '../../src/components/ui/Avatar'
import { Badge } from '../../src/components/ui/Badge'
import { Button } from '../../src/components/ui/Button'
import { Colors } from '../../src/styles/colors'
import { Spacing, BorderRadius } from '../../src/styles/spacing'
import { FontSize, FontWeight } from '../../src/styles/typography'
import { Shadows } from '../../src/styles/shadows'

const { width } = Dimensions.get('window')

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function HomeScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState<any[]>([])
  const [todayMins, setTodayMins] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/sessions')
      const all: any[] = data.data || []
      const today = new Date().toDateString()
      const todaySessions = all.filter(
        (s) => new Date(s.date || s.createdAt).toDateString() === today,
      )
      const totalToday = todaySessions.reduce(
        (acc, s) => acc + (s.duration || 0),
        0,
      )
      setTodayMins(totalToday)
      setSessions(all.slice(0, 5))
    } catch (e) {}
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.header}
        >
          <View>
            <Text style={styles.greetText}>{greeting()},</Text>
            <Text style={styles.greetName}>
              {user?.name?.split(' ')[0] ?? 'Scholar'}
            </Text>
          </View>
          <Avatar uri={user?.avatar} name={user?.name} size={46} glow />
        </MotiView>

        {/* Streak + Points row */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          style={styles.statsRow}
        >
          {/* Streak Card */}
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={[styles.statCard, Shadows.green as any]}
          >
            <MotiView
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ type: 'timing', duration: 1400, loop: true }}
            >
              <Flame size={26} color="#FFD166" fill="#FFD166" />
            </MotiView>
            <Text style={styles.statNumber}>
              {user?.currentStreak ?? 0}
            </Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </LinearGradient>

          {/* Points Card */}
          <View
            style={[styles.statCard, styles.statCardLight, Shadows.card as any]}
          >
            <Zap size={26} color={Colors.primary} fill={Colors.primary} />
            <Text style={[styles.statNumber, { color: Colors.primary }]}>
              {user?.totalPoints ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
              Points
            </Text>
          </View>

          {/* Today */}
          <View
            style={[styles.statCard, styles.statCardLight, Shadows.card as any]}
          >
            <Clock size={26} color={Colors.accent} />
            <Text style={[styles.statNumber, { color: Colors.primary }]}>
              {formatDuration(todayMins)}
            </Text>
            <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
              Today
            </Text>
          </View>
        </MotiView>

        {/* Start Session CTA */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 200 }}
          style={{
            marginHorizontal: Spacing.screenPadding,
            marginBottom: Spacing.lg,
          }}
        >
          <MotiView
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ type: 'timing', duration: 2000, loop: true }}
          >
            <Button
              title="Start Focus Session"
              icon={<Target size={18} color="#fff" />}
              onPress={() => router.push('/(tabs)/timer')}
              size="lg"
              fullWidth
            />
          </MotiView>
        </MotiView>

        {/* Quick actions */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 250 }}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickRow}>
            {[
              {
                label: 'Leaderboard',
                icon: Trophy,
                color: Colors.gold,
                route: '/(screens)/leaderboard',
              },
              {
                label: 'Analytics',
                icon: TrendingUp,
                color: Colors.info,
                route: '/(screens)/analytics',
              },
            ].map(({ label, icon: Icon, color, route }) => (
              <TouchableOpacity
                key={label}
                onPress={() => router.push(route as any)}
                style={[styles.quickCard, Shadows.card as any]}
              >
                <View
                  style={[styles.quickIcon, { backgroundColor: color + '20' }]}
                >
                  <Icon size={22} color={color} />
                </View>
                <Text style={styles.quickLabel}>{label}</Text>
                <ChevronRight size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* Recent Sessions */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 320 }}
          style={[styles.section, { paddingBottom: Spacing.xl }]}
        >
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={44} color={Colors.border} />
              <Text style={styles.emptyText}>
                No sessions yet. Start studying!
              </Text>
            </View>
          ) : (
            sessions.map((s, i) => (
              <MotiView
                key={s._id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 350, delay: i * 60 }}
              >
                <Card style={styles.sessionCard}>
                  <View style={styles.sessionDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionSubject}>
                      {s.subjectId?.title ?? 'Study Session'}
                    </Text>
                    <Text style={styles.sessionMeta}>
                      {formatDuration(s.duration)} •{' '}
                      {new Date(s.date || s.createdAt).toLocaleDateString(
                        'en-IN',
                        { day: 'numeric', month: 'short' },
                      )}
                    </Text>
                  </View>
                  <Badge
                    label={`+${(s.duration || 0) >= 60 ? 10 : 5}pts`}
                    color={Colors.glassDark}
                  />
                </Card>
              </MotiView>
            ))
          )}
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  greetText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  greetName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statCardLight: { backgroundColor: Colors.card },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  quickRow: { flexDirection: 'row', gap: Spacing.md },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 12,
    ...(Shadows.card as any),
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  sessionSubject: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  sessionMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: 8 },
  emptyText: { fontSize: FontSize.base, color: Colors.textSecondary },
})
