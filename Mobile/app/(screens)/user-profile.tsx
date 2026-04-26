import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import {
  ArrowLeft,
  Zap,
  Flame,
  MapPin,
  GraduationCap,
  MessageCircle,
  HelpCircle,
  Star,
} from 'lucide-react-native'
import { api } from '../../src/services/api'
import { useAuthStore } from '../../src/store/useAuthStore'
import { Avatar } from '../../src/components/ui/Avatar'
import { Card } from '../../src/components/ui/Card'
import { Badge } from '../../src/components/ui/Badge'
import { Button } from '../../src/components/ui/Button'
import { Colors } from '../../src/styles/colors'
import { Spacing, BorderRadius } from '../../src/styles/spacing'
import { FontSize, FontWeight } from '../../src/styles/typography'
import { Shadows } from '../../src/styles/shadows'
import { useAlertStore } from '../../src/store/useAlertStore'

function getLevelColor(level: string) {
  const map: Record<string, string> = {
    Beginner: Colors.info,
    Intermediate: Colors.accent,
    Advanced: Colors.warning,
    Expert: Colors.gold,
    Master: '#E879F9',
  }
  return map[level] || Colors.primary
}

export default function UserProfileScreen() {
  // Handle both 'userId' and 'id' as param names for maximum compatibility
  const params = useLocalSearchParams<{ userId?: string; id?: string }>()
  const userId = params.userId || params.id
  
  const router = useRouter()
  const { user: currentUser } = useAuthStore()

  const [targetUser, setTargetUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [togglingFollow, setTogglingFollow] = useState(false)

  const [doubts, setDoubts] = useState<any[]>([])
  const [feed, setFeed] = useState<any[]>([])
  const [doubtsPage, setDoubtsPage] = useState(1)
  const [doubtsHasMore, setDoubtsHasMore] = useState(true)
  const [feedCursor, setFeedCursor] = useState<string | null>(null)
  const [feedHasMore, setFeedHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'doubts' | 'feed'>('about')

  const fetchUserProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    
    try {
      const [{ data: userRes }, { data: doubtsRes }, { data: feedRes }] =
        await Promise.all([
          api.get(`/users/${userId}`),
          api.get(`/users/${userId}/doubts?page=1&limit=10`),
          api.get(`/users/${userId}/feed?limit=10`),
        ])

      setTargetUser(userRes.data)
      setDoubts(doubtsRes.data || [])
      setDoubtsPage(1)
      setDoubtsHasMore(Boolean(doubtsRes.pagination?.hasMore))

      setFeed(feedRes.data || [])
      setFeedCursor(feedRes.pagination?.nextCursor || null)
      setFeedHasMore(Boolean(feedRes.pagination?.hasMore))
    } catch (err: any) {
      console.error('Failed to load profile:', err)
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: 'Failed to load user profile',
        type: 'error'
      })
      router.back()
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchUserProfile()
    setRefreshing(false)
  }

  const loadMoreDoubts = async () => {
    if (!doubtsHasMore || loadingMore || !userId) return
    setLoadingMore(true)
    try {
      const nextPage = doubtsPage + 1
      const { data } = await api.get(`/users/${userId}/doubts?page=${nextPage}&limit=10`)
      setDoubts((prev) => {
        const newItems = (data.data || []).filter((item: any) => !prev.some(p => p._id === item._id));
        return [...prev, ...newItems];
      })
      setDoubtsPage(nextPage)
      setDoubtsHasMore(Boolean(data.pagination?.hasMore))
    } catch {
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: 'Failed to load more doubts',
        type: 'error'
      })
    } finally {
      setLoadingMore(false)
    }
  }

  const loadMoreFeed = async () => {
    if (!feedHasMore || !feedCursor || loadingMore || !userId) return
    setLoadingMore(true)
    try {
      const { data } = await api.get(
        `/users/${userId}/feed?limit=10&cursor=${encodeURIComponent(feedCursor)}`,
      )
      setFeed((prev) => {
        const newItems = (data.data || []).filter((item: any) => !prev.some(p => p._id === item._id));
        return [...prev, ...newItems];
      })
      setFeedCursor(data.pagination?.nextCursor || null)
      setFeedHasMore(Boolean(data.pagination?.hasMore))
    } catch {
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: 'Failed to load more feed items',
        type: 'error'
      })
    } finally {
      setLoadingMore(false)
    }
  }

  const toggleFollow = async () => {
    if (!targetUser || !userId) return
    setTogglingFollow(true)
    const isFollowing = targetUser.isFollowing

    // Optimistic UI update
    setTargetUser((prev: any) => ({
      ...prev,
      isFollowing: !isFollowing,
      followerCount: prev.followerCount + (isFollowing ? -1 : 1),
    }))

    try {
      if (isFollowing) {
        await api.post(`/users/${userId}/unfollow`)
      } else {
        await api.post(`/users/${userId}/follow`)
      }
    } catch {
      // Revert on error
      setTargetUser((prev: any) => ({
        ...prev,
        isFollowing: isFollowing,
        followerCount: prev.followerCount + (isFollowing ? 1 : -1),
      }))
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: 'Action failed',
        type: 'error'
      })
    } finally {
      setTogglingFollow(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    )
  }

  if (!targetUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>User not found</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        bounces={false}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={[styles.heroBanner, { paddingTop: 16 }]}
        >
          <TouchableOpacity
            style={[styles.backBtn, { top: 8 }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={Colors.white} />
          </TouchableOpacity>

          <Avatar
            uri={targetUser.avatar}
            name={targetUser.name}
            size={90}
            glow
            style={styles.avatar}
          />
          <Text style={styles.name}>{targetUser.name}</Text>
          <Text style={styles.username}>@{targetUser.username}</Text>
          
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(targetUser.level || 'Beginner') }]}>
            <Star size={14} color={Colors.white} fill={Colors.white} />
            <Text style={styles.levelText}>{(targetUser.level || 'Beginner').toUpperCase()}</Text>
          </View>

          <View style={styles.followRow}>
            <View style={styles.followItem}>
              <Text style={styles.followValue}>
                {targetUser.followerCount || 0}
              </Text>
              <Text style={styles.followLabel}>Followers</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followItem}>
              <Text style={styles.followValue}>
                {targetUser.followingCount || 0}
              </Text>
              <Text style={styles.followLabel}>Following</Text>
            </View>
          </View>

          {currentUser?._id !== userId && (
            <Button
              title={targetUser.isFollowing ? 'Unfollow' : 'Follow'}
              onPress={toggleFollow}
              loading={togglingFollow}
              variant={targetUser.isFollowing ? 'outline' : 'secondary'}
              style={[
                styles.heroFollowBtn,
                targetUser.isFollowing
                  ? { backgroundColor: 'transparent', borderColor: Colors.white }
                  : { backgroundColor: Colors.white },
              ]}
              textStyle={
                targetUser.isFollowing
                  ? { color: Colors.white }
                  : { color: Colors.primary }
              }
            />
          )}
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.tabsWrapper}>
            {(['about', 'doubts', 'feed'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'about' && (
            <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
              <View style={styles.statsRow}>
                {[
                  {
                    icon: Zap,
                    label: 'Points',
                    value: targetUser.totalPoints ?? 0,
                    color: Colors.primary,
                    fill: true,
                  },
                  {
                    icon: Flame,
                    label: 'Streak',
                    value: targetUser.currentStreak ?? 0,
                    color: Colors.streakOrange,
                    fill: true,
                  },
                ].map(({ icon: Icon, label, value, color, fill }) => (
                  <Card key={label} style={styles.statCard}>
                    <Icon size={22} color={color} fill={fill ? color : 'none'} />
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </Card>
                ))}
              </View>

              <Card style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <MapPin size={18} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>
                    {targetUser.institution || 'No institution listed'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <GraduationCap size={18} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>
                    {targetUser.year || 'No year listed'}
                  </Text>
                </View>
              </Card>

              {targetUser.bio ? (
                <Card style={styles.bioCard}>
                  <Text style={styles.bioTitle}>About</Text>
                  <Text style={styles.bioText}>{targetUser.bio}</Text>
                </Card>
              ) : null}
            </MotiView>
          )}

          {activeTab === 'doubts' && (
            <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
              {doubts.length > 0 ? (
                doubts
                  .filter((d, idx, arr) => arr.findIndex(x => x._id === d._id) === idx)
                  .map((doubt, idx) => (
                  <Card 
                    key={`doubt-${doubt._id}-${idx}`} 
                    style={styles.doubtCard}
                    onPress={() => router.push({ pathname: '/(screens)/doubt-detail', params: { id: doubt._id } })}
                  >
                    <View style={styles.doubtHeaderRow}>
                      <Badge label={doubt.subjectId?.title || 'General'} color={doubt.subjectId?.color + '15'} textColor={doubt.subjectId?.color} />
                      <Text style={styles.doubtTime}>{new Date(doubt.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.doubtTitle}>{doubt.title}</Text>
                    <Text style={styles.doubtDesc} numberOfLines={2}>
                      {doubt.description}
                    </Text>
                    <View style={styles.doubtFooter}>
                      <View style={styles.statItem}>
                        <MessageCircle size={14} color={Colors.textMuted} />
                        <Text style={styles.statText}>{doubt.replyCount || 0}</Text>
                      </View>
                    </View>
                  </Card>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <HelpCircle size={48} color={Colors.border} />
                  <Text style={styles.emptyText}>No doubts posted yet.</Text>
                </View>
              )}

              {doubtsHasMore ? (
                <Button
                  title={loadingMore ? 'Loading...' : 'Load More Doubts'}
                  onPress={loadMoreDoubts}
                  disabled={loadingMore}
                  variant="outline"
                  style={styles.loadMoreBtn}
                />
              ) : null}
            </MotiView>
          )}

          {activeTab === 'feed' && (
            <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
              {feed.length > 0 ? (
                feed
                  .filter((item, idx, arr) => arr.findIndex(x => x._id === item._id) === idx)
                  .map((item, idx) => (
                  <Card key={`feed-${item._id}-${idx}`} style={styles.feedCard}>
                    <View style={styles.feedHeader}>
                      <Avatar uri={item.userId?.avatar} name={item.userId?.name} size={24} />
                      <Text style={styles.feedTime}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.feedAction}>
                      <Text style={{ fontWeight: 'bold' }}>{item.userId?.name}</Text>
                      {' '}{item.metadata?.text || item.actionType}
                    </Text>
                  </Card>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MessageCircle size={48} color={Colors.border} />
                  <Text style={styles.emptyText}>No activity feed available.</Text>
                </View>
              )}

              {feedHasMore ? (
                <Button
                  title={loadingMore ? 'Loading...' : 'Load More Feed'}
                  onPress={loadMoreFeed}
                  disabled={loadingMore}
                  variant="outline"
                  style={styles.loadMoreBtn}
                />
              ) : null}
            </MotiView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  heroBanner: { paddingBottom: 30, alignItems: 'center', position: 'relative' },
  backBtn: {
    position: 'absolute',
    left: 20,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    zIndex: 10,
  },
  avatar: { marginBottom: 12 },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  username: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  levelText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 24,
  },
  followItem: { alignItems: 'center' },
  followValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  followLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  followDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroFollowBtn: {
    marginTop: 20,
    minWidth: 140,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  content: { paddingHorizontal: Spacing.screenPadding, gap: Spacing.md },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginVertical: 16,
    ...Shadows.sm as any,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.md },
  activeTab: { backgroundColor: Colors.primary + '15' },
  tabText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  activeTabText: { color: Colors.primary, fontWeight: FontWeight.bold },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
    ...Shadows.card as any,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  infoCard: {
    padding: Spacing.md,
    gap: 12,
    ...Shadows.card as any,
    marginBottom: Spacing.md,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: FontSize.base, color: Colors.textPrimary },
  bioCard: { padding: Spacing.md, gap: 8, ...Shadows.card as any },
  bioTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  bioText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  doubtCard: {
    padding: Spacing.md,
    marginBottom: 12,
    gap: 8,
    ...Shadows.card as any,
  },
  doubtHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doubtTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  doubtTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  doubtDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  doubtFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  feedCard: { padding: Spacing.md, marginBottom: 12, gap: 8, ...Shadows.card as any },
  feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feedTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  feedAction: { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22 },
  loadMoreBtn: {
    marginVertical: Spacing.md,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSize.base,
  },
})
