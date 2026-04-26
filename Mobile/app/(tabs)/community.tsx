import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Alert, RefreshControl, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { MessageCircle, HelpCircle, Plus, ChevronRight, CheckCircle, Search, Trophy, BookOpen, UserPlus } from 'lucide-react-native';
import { socketService } from '../../src/services/socket';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { TabSwitcher } from '../../src/components/ui/TabSwitcher';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import { Colors } from '../../src/styles/colors';
import { Spacing, BorderRadius } from '../../src/styles/spacing';
import { FontSize, FontWeight } from '../../src/styles/typography';
import { Shadows } from '../../src/styles/shadows';
import { useAlertStore } from '../../src/store/useAlertStore';

const TABS = [{ key: 'feed', label: 'Feed' }, { key: 'doubts', label: 'Doubts' }];

function timeAgo(date: string) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommunityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('feed');
  
  // Feed state
  const [feed, setFeed] = useState<any[]>([]);
  const [feedCursor, setFeedCursor] = useState<string | null>(null);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);

  // Doubts state
  const [doubts, setDoubts] = useState<any[]>([]);
  const [doubtsPage, setDoubtsPage] = useState(1);
  const [doubtsHasMore, setDoubtsHasMore] = useState(true);
  const [doubtsLoading, setDoubtsLoading] = useState(true);
  const [doubtsLoadingMore, setDoubtsLoadingMore] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [showDoubtModal, setShowDoubtModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [adding, setAdding] = useState(false);

  const fetchFeed = useCallback(async (cursor: string | null = null, isRefresh = false) => {
    try {
      const response = await api.get('/users/feed', { params: { cursor, limit: 15 } });
      const { data, pagination } = response.data;
      if (isRefresh) {
        setFeed(Array.from(new Map(data.map((i: any) => [i._id, i])).values()));
      } else {
        setFeed(prev => {
          const merged = [...prev, ...data];
          return Array.from(new Map(merged.map((i: any) => [i._id, i])).values());
        });
      }
      setFeedCursor(pagination.nextCursor);
      setFeedHasMore(pagination.hasMore);
    } catch (e) {
      console.error('Failed to fetch feed:', e);
    } finally {
      setFeedLoading(false);
      setFeedLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  const fetchDoubts = useCallback(async (page: number, isRefresh = false) => {
    try {
      const response = await api.get('/doubts', { params: { page, limit: 10, following: 'false' } });
      const { data, pagination } = response.data;
      if (isRefresh) {
        setDoubts(data);
      } else {
        setDoubts(prev => {
          const newItems = data.filter((item: any) => !prev.some(p => p._id === item._id));
          const merged = [...prev, ...newItems];
          return Array.from(new Map(merged.map(i => [i._id, i])).values());
        });
      }
      setDoubtsHasMore(pagination.page < pagination.pages);
    } catch (e) {
      console.error('Failed to fetch doubts:', e);
    } finally {
      setDoubtsLoading(false);
      setDoubtsLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'feed' && feed.length === 0) fetchFeed(null, true);
    if (activeTab === 'doubts' && doubts.length === 0) fetchDoubts(1, true);
  }, [activeTab]);

  useEffect(() => {
    socketService.on('activity_created', (newActivity) => {
      setFeed((prev: any[]) => {
        if (prev.some(item => item._id === newActivity._id)) return prev;
        return [newActivity, ...prev];
      });
    });

    socketService.on('doubt_created', (newDoubt) => {
      setDoubts((prev: any[]) => {
        if (prev.some(item => item._id === newDoubt._id)) return prev;
        return [newDoubt, ...prev];
      });
    });

    return () => {
      socketService.off('activity_created');
      socketService.off('doubt_created');
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'feed') {
      await fetchFeed(null, true);
    } else {
      setDoubtsPage(1);
      await fetchDoubts(1, true);
    }
  };

  const handleLoadMore = () => {
    if (activeTab === 'feed') {
      if (feedHasMore && !feedLoadingMore) {
        setFeedLoadingMore(true);
        fetchFeed(feedCursor);
      }
    } else {
      if (doubtsHasMore && !doubtsLoadingMore) {
        setDoubtsLoadingMore(true);
        const nextPage = doubtsPage + 1;
        setDoubtsPage(nextPage);
        fetchDoubts(nextPage);
      }
    }
  };

  const handleAddDoubt = async () => {
    if (!form.title.trim()) {
      useAlertStore.getState().showAlert({
        title: 'Validation',
        message: 'Title is required',
        type: 'warning'
      });
      return;
    }
    setAdding(true);
    try {
      await api.post('/doubts', { title: form.title.trim(), description: form.description.trim() });
      setForm({ title: '', description: '' });
      setShowDoubtModal(false);
      setDoubtsPage(1);
      await fetchDoubts(1, true);
    } catch (e: any) {
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: e?.response?.data?.message || 'Failed to post doubt',
        type: 'error'
      });
    } finally { setAdding(false); }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'STUDY_SESSION': return <BookOpen size={16} color={Colors.primary} />;
      case 'CHAPTER_COMPLETED': return <Trophy size={16} color={Colors.gold} />;
      case 'FOLLOW': return <UserPlus size={16} color={Colors.info} />;
      case 'DOUBT_POSTED': return <HelpCircle size={16} color={Colors.warning} />;
      default: return <BookOpen size={16} color={Colors.primary} />;
    }
  };

  const renderFeedItem = ({ item, index }: { item: any; index: number }) => (
    <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300, delay: Math.min(index, 10) * 40 }}>
      <Card style={styles.feedCard}>
        <View style={styles.feedHeader}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(screens)/user-profile', params: { id: item.userId?._id } })}>
            <Avatar uri={item.userId?.avatar} name={item.userId?.name} size={40} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={styles.userRow}>
              <Text style={styles.feedUser}>{item.userId?.name ?? 'User'}</Text>
              <View style={styles.activityBadge}>
                {getActivityIcon(item.actionType)}
              </View>
            </View>
            <Text style={styles.feedTime}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>
        <Text style={styles.feedText}>{item.metadata?.text || 'Performed an action'}</Text>
        {item.metadata?.title && (
          <View style={styles.contentPreview}>
            <Text style={styles.previewTitle} numberOfLines={1}>{item.metadata.title}</Text>
          </View>
        )}
      </Card>
    </MotiView>
  );

  const renderDoubtItem = ({ item, index }: { item: any; index: number }) => (
    <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300, delay: Math.min(index, 10) * 40 }}>
      <Card style={styles.doubtCard} onPress={() => router.push({ pathname: '/(screens)/doubt-detail', params: { id: item._id } })}>
        <View style={styles.doubtHeader}>
          <View style={styles.doubtTitleRow}>
            {item.isSolved && <CheckCircle size={16} color={Colors.success} style={{ marginRight: 4 }} />}
            <Text style={styles.doubtTitle} numberOfLines={2}>{item.title}</Text>
          </View>
          {item.subjectId && (
            <Badge label={item.subjectId.title} color={item.subjectId.color + '20'} textColor={item.subjectId.color} />
          )}
        </View>
        {item.description ? <Text style={styles.doubtDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={styles.doubtFooter}>
          <View style={styles.doubtMetaLeft}>
            <Avatar uri={item.userId?.avatar} name={item.userId?.name} size={24} />
            <Text style={styles.doubtMetaText}>{item.userId?.name ?? 'User'} • {timeAgo(item.createdAt)}</Text>
          </View>
          <View style={styles.doubtMetaRight}>
            <View style={styles.statItem}>
              <MessageCircle size={14} color={Colors.textMuted} />
              <Text style={styles.statText}>{item.replyCount || 0}</Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </View>
        </View>
      </Card>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/(screens)/search')} style={styles.iconBtn}>
            <Search size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDoubtModal(true)} style={styles.addBtn}>
            <Plus size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TabSwitcher tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      {activeTab === 'feed' ? (
        feedLoading && !refreshing ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
        ) : (
          <FlatList
            data={feed}
            renderItem={renderFeedItem}
            keyExtractor={(item, index) => `feed-${item._id}-${index}`}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No activity yet. Follow some users to see their progress!</Text></View>}
            ListFooterComponent={feedLoadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.primary} /> : null}
          />
        )
      ) : (
        doubtsLoading && !refreshing ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
        ) : (
          <FlatList
            data={doubts}
            renderItem={renderDoubtItem}
            keyExtractor={(item, index) => `doubt-${item._id}-${index}`}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={<View style={styles.empty}><HelpCircle size={48} color={Colors.border} /><Text style={styles.emptyText}>No doubts yet. Be the first to ask!</Text></View>}
            ListFooterComponent={doubtsLoadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.primary} /> : null}
          />
        )
      )}

      {/* Add Doubt Modal */}
      <Modal visible={showDoubtModal} transparent animationType="slide" onRequestClose={() => setShowDoubtModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowDoubtModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Post a Doubt</Text>
            <Input label="Title" placeholder="What's your doubt?" value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
            <Input label="Description (optional)" placeholder="Describe in detail..." value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline numberOfLines={4} inputStyle={{ height: 90, textAlignVertical: 'top' }} />
            <Button title="Post Doubt" onPress={handleAddDoubt} loading={adding} fullWidth />
            <Button title="Cancel" onPress={() => setShowDoubtModal(false)} variant="ghost" fullWidth />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 6, backgroundColor: Colors.backgroundAlt, borderRadius: 20 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  tabContainer: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md },
  list: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 120 },
  feedCard: { marginBottom: Spacing.md, padding: Spacing.md, gap: 12, ...Shadows.card as any },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedUser: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  activityBadge: { padding: 4, backgroundColor: Colors.backgroundAlt, borderRadius: 8 },
  feedTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  feedText: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  contentPreview: { padding: Spacing.sm, backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.md, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  previewTitle: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  doubtCard: { marginBottom: Spacing.md, padding: Spacing.md, gap: 10, ...Shadows.card as any },
  doubtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  doubtTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  doubtTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 22 },
  doubtDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  doubtFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  doubtMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doubtMetaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  doubtMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12, paddingHorizontal: 40 },
  emptyText: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  backdrop: { flex: 1, backgroundColor: Colors.overlay },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingBottom: 40, gap: Spacing.md },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});
