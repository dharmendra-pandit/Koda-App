import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, ChevronLeft, UserPlus, UserMinus } from 'lucide-react-native';
import { MotiView } from 'moti';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Colors } from '../../src/styles/colors';
import { Spacing, BorderRadius } from '../../src/styles/spacing';
import { FontSize, FontWeight } from '../../src/styles/typography';
import { Shadows } from '../../src/styles/shadows';

export default function FollowingScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser, updateUser } = useAuthStore();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFollowing = useCallback(async (pageNum: number, searchQuery: string, isRefresh = false) => {
    if (!userId) return;
    try {
      const response = await api.get(`/users/${userId}/following`, {
        params: {
          page: pageNum,
          limit: 15,
          query: searchQuery,
        },
      });
      
      const newUsers = response.data.data;
      if (isRefresh) {
        setUsers(newUsers);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
      }
      setHasMore(response.data.pagination.hasMore);
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFollowing(1, search, true);
  }, [userId, search]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchFollowing(1, search, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFollowing(nextPage, search);
    }
  };

  const toggleFollow = async (targetUser: any) => {
    const isFollowing = currentUser?.following?.includes(targetUser._id);
    try {
      if (isFollowing) {
        await api.post(`/users/${targetUser._id}/unfollow`);
        updateUser({
          ...currentUser,
          following: currentUser?.following?.filter(id => id !== targetUser._id),
        });
        // If we are looking at our own following list, we might want to remove the user from the list
        if (userId === currentUser?._id) {
          // setUsers(prev => prev.filter(u => u._id !== targetUser._id));
        }
      } else {
        await api.post(`/users/${targetUser._id}/follow`);
        updateUser({
          ...currentUser,
          following: [...(currentUser?.following || []), targetUser._id],
        });
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const renderUserItem = ({ item, index }: { item: any; index: number }) => {
    const isFollowing = currentUser?.following?.includes(item._id);
    const isMe = currentUser?._id === item._id;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: index * 50 }}
      >
        <Card style={styles.userCard} onPress={() => router.push({ pathname: '/(screens)/user-profile', params: { userId: item._id } })}>
          <Avatar uri={item.avatar} name={item.name} size={50} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userUsername}>@{item.username}</Text>
            {item.bio ? (
              <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>
            ) : null}
          </View>
          {!isMe && (
            <Button
              title={isFollowing ? 'Unfollow' : 'Follow'}
              onPress={() => toggleFollow(item)}
              variant={isFollowing ? 'outline' : 'primary'}
              size="sm"
              style={styles.followBtn}
              textStyle={styles.followBtnText}
              icon={isFollowing ? <UserMinus size={14} color={Colors.textSecondary} /> : <UserPlus size={14} color={Colors.white} />}
            />
          )}
        </Card>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Following</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            placeholder="Search following..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item, index) => `fwing-${item._id}-${index}`}
          contentContainerStyle={styles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No following found.</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.primary} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  searchContainer: {
    paddingHorizontal: Spacing.screenPadding,
    marginVertical: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  list: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 12,
    ...Shadows.card as any,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  userUsername: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  userBio: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
  },
  followBtnText: {
    fontSize: FontSize.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
});
