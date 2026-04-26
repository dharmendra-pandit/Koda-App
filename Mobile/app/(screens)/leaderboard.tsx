import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { ArrowLeft, Trophy, Medal, Crown } from 'lucide-react-native';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { Card } from '../../src/components/ui/Card';
import { TabSwitcher } from '../../src/components/ui/TabSwitcher';
import { Colors } from '../../src/styles/colors';
import { Spacing, BorderRadius } from '../../src/styles/spacing';
import { FontSize, FontWeight } from '../../src/styles/typography';
import { Shadows } from '../../src/styles/shadows';
import { useAlertStore } from '../../src/store/useAlertStore';

const TABS = [{ key: 'all', label: 'All Time' }, { key: 'weekly', label: 'This Week' }];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={20} color={Colors.gold} fill={Colors.gold} />;
  if (rank === 2) return <Medal size={20} color={Colors.silver} fill={Colors.silver} />;
  if (rank === 3) return <Medal size={20} color={Colors.bronze} fill={Colors.bronze} />;
  return <Text style={styles.rankNum}>#{rank}</Text>;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = activeTab === 'weekly' ? '/leaderboard/weekly' : '/leaderboard';
    setLoading(true);
    api.get(endpoint)
      .then(({ data }) => setLeaders(data.data || []))
      .catch(() => useAlertStore.getState().showAlert({
        title: 'Error',
        message: 'Failed to load leaderboard',
        type: 'error'
      }))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isMe = item._id === user?._id;
    const rank = index + 4;
    return (
      <MotiView from={{ opacity: 0, translateX: -16 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 300, delay: index * 50 }}>
        <Card style={isMe ? [styles.listCard, styles.myCard] : styles.listCard}>
          <View style={[styles.rankBox, isMe && styles.myRankBox]}>
            <RankIcon rank={rank} />
          </View>
          <Avatar uri={item.avatar} name={item.name} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.listName, isMe && styles.myName]}>{item.name} {isMe ? '(You)' : ''}</Text>
            <Text style={styles.listInst}>{item.institution}</Text>
          </View>
          <Text style={styles.listPoints}>{item.totalPoints} pts</Text>
        </Card>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
      </View>

      <View style={styles.tabContainer}>
        <TabSwitcher tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={rest}
          renderItem={renderItem}
          keyExtractor={(item, index) => `leader-${item._id}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              {/* Top 3 Podium */}
              {top3.length > 0 && (
                <View style={styles.podium}>
                  {/* 2nd */}
                  {top3[1] && (
                    <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', delay: 200 }} style={styles.podiumItem}>
                      <Avatar uri={top3[1].avatar} name={top3[1].name} size={54} style={styles.podiumAvatar} />
                      <Medal size={20} color={Colors.silver} fill={Colors.silver} />
                      <Text style={styles.podiumName} numberOfLines={1}>{top3[1].name?.split(' ')[0]}</Text>
                      <LinearGradient colors={['#B0BEC5', '#78909C']} style={[styles.podiumBase, { height: 60 }]}>
                        <Text style={styles.podiumPts}>{top3[1].totalPoints}</Text>
                      </LinearGradient>
                    </MotiView>
                  )}
                  {/* 1st */}
                  {top3[0] && (
                    <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', delay: 100 }} style={[styles.podiumItem, styles.podiumFirst]}>
                      <MotiView animate={{ scale: [1, 1.08, 1] }} transition={{ type: 'timing', duration: 2000, loop: true }}>
                        <Avatar uri={top3[0].avatar} name={top3[0].name} size={70} glow />
                      </MotiView>
                      <Crown size={24} color={Colors.gold} fill={Colors.gold} />
                      <Text style={[styles.podiumName, { fontWeight: FontWeight.extrabold }]} numberOfLines={1}>{top3[0].name?.split(' ')[0]}</Text>
                      <LinearGradient colors={[Colors.gold, '#D97706']} style={[styles.podiumBase, { height: 80 }]}>
                        <Text style={styles.podiumPts}>{top3[0].totalPoints}</Text>
                      </LinearGradient>
                    </MotiView>
                  )}
                  {/* 3rd */}
                  {top3[2] && (
                    <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', delay: 300 }} style={styles.podiumItem}>
                      <Avatar uri={top3[2].avatar} name={top3[2].name} size={48} style={styles.podiumAvatar} />
                      <Medal size={20} color={Colors.bronze} fill={Colors.bronze} />
                      <Text style={styles.podiumName} numberOfLines={1}>{top3[2].name?.split(' ')[0]}</Text>
                      <LinearGradient colors={['#D97706', '#B45309']} style={[styles.podiumBase, { height: 44 }]}>
                        <Text style={styles.podiumPts}>{top3[2].totalPoints}</Text>
                      </LinearGradient>
                    </MotiView>
                  )}
                </View>
              )}
              {rest.length > 0 && <Text style={styles.restHeader}>Rankings</Text>}
            </>
          }
          ListEmptyComponent={leaders.length <= 3 ? null : <Text style={styles.emptyText}>No more rankings</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md, paddingBottom: Spacing.md, gap: 12 },
  backBtn: { padding: 6 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  tabContainer: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.lg },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: Spacing.md, paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.xl },
  podiumItem: { alignItems: 'center', flex: 1, gap: 4 },
  podiumFirst: { transform: [{ translateY: -10 }] },
  podiumAvatar: { marginBottom: 2 },
  podiumName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'center' },
  podiumBase: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center' },
  podiumPts: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  restHeader: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm, paddingHorizontal: Spacing.screenPadding },
  list: { paddingBottom: 60 },
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.sm, ...Shadows.card as any },
  myCard: { borderWidth: 1.5, borderColor: Colors.primary },
  rankBox: { width: 32, alignItems: 'center' },
  myRankBox: {},
  rankNum: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  listName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  myName: { color: Colors.primary },
  listInst: { fontSize: FontSize.xs, color: Colors.textMuted },
  listPoints: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 20 },
});
