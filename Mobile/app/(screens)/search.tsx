import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { ArrowLeft, Search as SearchIcon, MapPin, GraduationCap } from 'lucide-react-native';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/styles/colors';
import { Spacing, BorderRadius } from '../../src/styles/spacing';
import { FontSize, FontWeight } from '../../src/styles/typography';
import { Shadows } from '../../src/styles/shadows';

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // initialize following map from current user
    if (user?.following) {
      const map: Record<string, boolean> = {};
      (user.following as any[]).forEach(id => map[id] = true);
      setFollowingMap(map);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        searchUsers(query.trim());
      } else {
        setUsers([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const searchUsers = async (q: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/search?query=${encodeURIComponent(q)}`);
      setUsers(data.users || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (targetId: string, isFollowing: boolean) => {
    // optimistic update
    setFollowingMap(prev => ({ ...prev, [targetId]: !isFollowing }));
    try {
      if (isFollowing) {
        await api.post(`/users/${targetId}/unfollow`);
      } else {
        await api.post(`/users/${targetId}/follow`);
      }
    } catch {
      // revert on failure
      setFollowingMap(prev => ({ ...prev, [targetId]: isFollowing }));
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isFollowing = followingMap[item._id] || false;
    return (
      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300, delay: index * 40 }}>
        <Card style={styles.userCard}>
          <TouchableOpacity 
            style={styles.clickableArea} 
            onPress={() => router.push({ pathname: '/(screens)/user-profile', params: { userId: item._id } })}
          >
            <Avatar uri={item.avatar} name={item.name} size={50} />
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.userUsername}>@{item.username}</Text>
              {(item.institution || item.year) && (
                <View style={styles.metaRow}>
                  {item.institution && (
                    <View style={styles.metaItem}>
                      <MapPin size={10} color={Colors.textMuted} />
                      <Text style={styles.metaText} numberOfLines={1}>{item.institution}</Text>
                    </View>
                  )}
                  {item.year && (
                    <View style={styles.metaItem}>
                      <GraduationCap size={10} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{item.year}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Button 
            title={isFollowing ? 'Following' : 'Follow'} 
            variant={isFollowing ? 'outline' : 'primary'} 
            onPress={() => toggleFollow(item._id, isFollowing)}
            size="sm"
            style={styles.followBtn}
          />
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
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, username, college, year..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item, index) => `srch-${item._id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            query.length > 0 ? (
              <Text style={styles.emptyText}>No users found for "{query}"</Text>
            ) : (
              <View style={styles.emptyState}>
                <SearchIcon size={48} color={Colors.border} />
                <Text style={styles.emptyText}>Discover peers to study with.</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: Spacing.screenPadding, 
    paddingTop: Spacing.sm, paddingBottom: Spacing.md, gap: 12 
  },
  backBtn: { padding: 6, marginLeft: -6 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, height: '100%' },
  list: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 40, paddingTop: Spacing.sm, gap: Spacing.sm },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingRight: 12, ...Shadows.card as any },
  clickableArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  userUsername: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  followBtn: { minWidth: 80, paddingHorizontal: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 16 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, fontSize: FontSize.base },
});
