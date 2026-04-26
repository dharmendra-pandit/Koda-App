import React, { useCallback, useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { socketService } from '../../src/services/socket'
import { MotiView } from 'moti'
import {
  Edit2,
  Trophy,
  Flame,
  Zap,
  Star,
  LogOut,
  Eye,
  EyeOff,
  Users,
  Lock,
} from 'lucide-react-native'
import { useAuthStore } from '../../src/store/useAuthStore'
import { api } from '../../src/services/api'
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

export default function ProfileScreen() {
  const router = useRouter()
  const { user, logout, updateUser } = useAuthStore()
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true)
  const [togglingPublic, setTogglingPublic] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleTogglePublic = async (val: boolean) => {
    setIsPublic(val)
    setTogglingPublic(true)
    try {
      await api.put('/users/update', { isPublic: val })
      updateUser({ isPublic: val })
    } catch {
      setIsPublic(!val)
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: 'Failed to update privacy setting',
        type: 'error'
      })
    } finally {
      setTogglingPublic(false)
    }
  }

  const handleLogout = () => {
    useAlertStore.getState().showAlert({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      type: 'confirm',
      actions: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
      ]
    })
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      const { data } = await api.get('/users/me')
      updateUser(data.data)
      setIsPublic(data.data.isPublic ?? true)
    } catch {}
    setRefreshing(false)
  }

  const levelColor = getLevelColor(user?.level ?? 'Beginner')

  useFocusEffect(
    useCallback(() => {
      onRefresh()
    }, [])
  )

  useEffect(() => {
    socketService.on('user_updated', (data) => {
      // If it's about the current user, refresh profile
      if (data.userId === user?._id) {
        onRefresh();
      }
    });

    return () => {
      socketService.off('user_updated');
    };
  }, [user?._id]);

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
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.heroBanner}
        >
          <MotiView
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ type: 'timing', duration: 3000, loop: true }}
            style={styles.glow}
          />
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/(screens)/edit-profile')}
          >
            <Edit2 size={18} color={Colors.white} />
          </TouchableOpacity>
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 100 }}
          >
            <Avatar
              uri={user?.avatar}
              name={user?.name}
              size={88}
              glow
              style={styles.avatar}
            />
          </MotiView>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
          
          <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
            <Star size={14} color={Colors.white} fill={Colors.white} />
            <Text style={styles.levelText}>{(user?.level ?? 'Beginner').toUpperCase()}</Text>
          </View>

          <View style={styles.followRow}>
            <TouchableOpacity
              style={styles.followItem}
              onPress={() =>
                router.push({
                  pathname: '/(screens)/followers' as any,
                  params: { userId: user?._id },
                })
              }
            >
              <Text style={styles.followValue}>
                {user?.followers?.length ?? 0}
              </Text>
              <Text style={styles.followLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.followDivider} />
            <TouchableOpacity
              style={styles.followItem}
              onPress={() =>
                router.push({
                  pathname: '/(screens)/following' as any,
                  params: { userId: user?._id },
                })
              }
            >
              <Text style={styles.followValue}>
                {user?.following?.length ?? 0}
              </Text>
              <Text style={styles.followLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 150 }}
          style={styles.statsRow}
        >
          {[
            {
              icon: Zap,
              label: 'Points',
              value: user?.totalPoints ?? 0,
              color: Colors.primary,
              fill: true,
            },
            {
              icon: Flame,
              label: 'Streak',
              value: user?.currentStreak ?? 0,
              color: Colors.streakOrange,
              fill: true,
            },
            {
              icon: Star,
              label: 'Level',
              value: user?.level ?? 'Beginner',
              color: Colors.gold,
              fill: false,
            },
          ].map(({ icon: Icon, label, value, color, fill }) => (
            <Card key={label} style={styles.statCard}>
              <Icon size={22} color={color} fill={fill ? color : 'none'} />
              <Text
                style={[
                  styles.statValue,
                  typeof value === 'string' ? { fontSize: FontSize.sm } : {},
                ]}
              >
                {value}
              </Text>
              <Text style={styles.statLabel}>{label}</Text>
            </Card>
          ))}
        </MotiView>

        {/* Info Card */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 220 }}
          style={styles.section}
        >
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Institution</Text>
              <Text style={styles.infoValue}>{user?.institution}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Year</Text>
              <Text style={styles.infoValue}>{user?.year}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </Card>
        </MotiView>

        {/* Actions */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 290 }}
          style={styles.section}
        >
          <Card style={styles.actionCard}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => router.push('/(screens)/leaderboard')}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: Colors.gold + '20' },
                ]}
              >
                <Trophy size={20} color={Colors.gold} />
              </View>
              <Text style={styles.actionLabel}>Leaderboard</Text>
              <Badge label="View" color={Colors.glassDark} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.actionRow}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: Colors.info + '20' },
                ]}
              >
                {isPublic ? (
                  <Eye size={20} color={Colors.info} />
                ) : (
                  <Lock size={20} color={Colors.info} />
                )}
              </View>
              <Text style={styles.actionLabel}>Public Profile</Text>
              <Switch
                value={isPublic}
                onValueChange={handleTogglePublic}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
                disabled={togglingPublic}
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => router.push('/(screens)/edit-profile')}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: Colors.primary + '20' },
                ]}
              >
                <Edit2 size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Edit Profile</Text>
              <Badge label="Edit" color={Colors.glassDark} />
            </TouchableOpacity>
          </Card>
        </MotiView>

        {/* Logout */}
        <View style={[styles.section, { paddingBottom: 100 }]}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            fullWidth
            icon={<LogOut size={18} color={Colors.error} />}
            textStyle={{ color: Colors.error }}
            style={{ borderColor: Colors.error + '60' }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  heroBanner: {
    paddingTop: 40,
    paddingBottom: 28,
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primaryLight,
    opacity: 0.15,
  },
  editBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  avatar: { marginBottom: 10 },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  username: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.75)',
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
    gap: 20,
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
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding,
    marginTop: -20,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
    ...(Shadows.card as any),
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
  section: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
  },
  infoCard: { gap: 0, ...(Shadows.card as any) },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  infoLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  infoValue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  actionCard: { gap: 0, ...(Shadows.card as any) },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
})
