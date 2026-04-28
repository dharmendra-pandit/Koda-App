import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MotiView } from 'moti'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import {
  ArrowLeft,
  ThumbsUp,
  CheckCircle,
  Send,
  Reply as ReplyIcon,
  X,
  HelpCircle,
} from 'lucide-react-native'
import { api } from '../../src/services/api'
import { socketService } from '../../src/services/socket'
import { useAuthStore } from '../../src/store/useAuthStore'
import { Avatar } from '../../src/components/ui/Avatar'
import { Card } from '../../src/components/ui/Card'
import { Badge } from '../../src/components/ui/Badge'
import { Colors } from '../../src/styles/colors'
import { Spacing, BorderRadius } from '../../src/styles/spacing'
import { FontSize, FontWeight } from '../../src/styles/typography'
import { Shadows } from '../../src/styles/shadows'
import { useAlertStore } from '../../src/store/useAlertStore'

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function ReplyCard({
  reply,
  onUpvote,
  onAccept,
  onReply,
  isOwner,
  isCurrentUser,
  depth = 0,
}: {
  reply: any
  onUpvote: () => void
  onAccept: () => void
  onReply: () => void
  isOwner: boolean
  isCurrentUser: boolean
  depth?: number
}) {
  const scale = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const handleUpvote = () => {
    scale.value = withSpring(1.2, { damping: 10 }, () => {
      scale.value = withSpring(1)
    })
    onUpvote()
  }

  const isUpvoted =
    useAuthStore.getState().user?._id &&
    Array.isArray(reply.upvotes) &&
    reply.upvotes.includes(useAuthStore.getState().user?._id)

  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      style={[
        styles.replyCardContainer,
        { marginLeft: Math.min(depth * 20, 60) },
      ]}
    >
      {depth > 0 && <View style={styles.threadLine} />}
      <Card
        style={
          reply.isAccepted
            ? [styles.replyCard, styles.acceptedCard]
            : styles.replyCard
        }
      >
        {reply.isAccepted && (
          <View style={styles.acceptedBadge}>
            <CheckCircle size={14} color={Colors.success} />
            <Text style={styles.acceptedText}>Accepted Answer</Text>
          </View>
        )}
        <View style={styles.replyHeader}>
          <Avatar
            uri={reply.userId?.avatar}
            name={reply.userId?.name}
            size={32}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.replyUser}>{reply.userId?.name ?? 'User'}</Text>
            <Text style={styles.replyTime}>{timeAgo(reply.createdAt)}</Text>
          </View>
          {isOwner && !reply.isAccepted && depth === 0 && (
            <TouchableOpacity onPress={onAccept} style={styles.acceptBtn}>
              <CheckCircle size={18} color={Colors.success} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.replyText}>{reply.text}</Text>
        <View style={styles.replyActions}>
          <TouchableOpacity onPress={handleUpvote} style={styles.upvoteRow}>
            <Animated.View style={anim}>
              <ThumbsUp
                size={16}
                color={isUpvoted ? Colors.primary : Colors.textMuted}
                fill={isUpvoted ? Colors.primary : 'none'}
              />
            </Animated.View>
            <Text
              style={[
                styles.upvoteCount,
                isUpvoted && { color: Colors.primary },
              ]}
            >
              {reply.upvotes?.length ?? 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onReply} style={styles.replyActionBtn}>
            <ReplyIcon size={14} color={Colors.textMuted} />
            <Text style={styles.replyActionText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </MotiView>
  )
}

export default function DoubtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const [doubt, setDoubt] = useState<any>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<any>(null)

  /** Deduplicate an array of replies by _id, preserving order */
  const dedupeReplies = (arr: any[]): any[] => {
    const seen = new Set<string>()
    return arr.filter((r) => {
      if (seen.has(r._id)) return false
      seen.add(r._id)
      return true
    })
  }

  const fetchDoubt = useCallback(async () => {
    try {
      const [doubtRes, repliesRes] = await Promise.all([
        api.get(`/doubts/${id}`),
        api.get(`/doubts/${id}/replies`),
      ])
      setDoubt(doubtRes.data.data)
      setReplies(dedupeReplies(repliesRes.data.data || []))
    } catch (e) {
      // Fallback if GET /doubts/:id fails
      try {
        const doubtsRes = await api.get('/doubts')
        const found = doubtsRes.data.data?.find((d: any) => d._id === id)
        setDoubt(found)
        const repliesRes = await api.get(`/doubts/${id}/replies`)
        setReplies(dedupeReplies(repliesRes.data.data || []))
      } catch (err) {}
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDoubt()
  }, [])

  useEffect(() => {
    if (!id) return

    socketService.joinRoom(`doubt_${id}`)

    socketService.on('reply_created', (newReply) => {
      setReplies((prev: any[]) => {
        if (prev.some((r) => r._id === newReply._id)) return prev
        return dedupeReplies([...prev, newReply])
      })
    })

    socketService.on('reply_updated', (updatedData) => {
      setReplies((prev: any[]) =>
        prev.map((r) =>
          r._id === updatedData._id
            ? { ...r, upvotes: Array(updatedData.upvotes).fill(0) } // Simplified array for UI
            : r,
        ),
      )
    })

    socketService.on('doubt_updated', (updatedData) => {
      if (updatedData._id === id) {
        setDoubt((prev: any) =>
          prev
            ? { ...prev, upvotes: Array(updatedData.upvotes).fill(0) }
            : prev,
        )
      }
    })

    socketService.on('doubt_solved', (data) => {
      if (data._id === id) {
        setDoubt((prev: any) => (prev ? { ...prev, isSolved: true } : prev))
        setReplies((prev: any[]) =>
          prev.map((r) => ({
            ...r,
            isAccepted: r.userId?._id === data.solvedBy?._id,
          })),
        )
      }
    })

    return () => {
      socketService.off('reply_created')
      socketService.off('reply_updated')
      socketService.off('doubt_updated')
      socketService.off('doubt_solved')
    }
  }, [id])

  const handleSend = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const { data } = await api.post('/doubts/replies', {
        doubtId: id,
        text: replyText.trim(),
        parentId: replyTo?._id || null,
      })
      // Don't optimistically append — the socket 'reply_created' event will add it
      // to avoid a duplicate when both fire at the same time. Just clear input.
      // But if socket is unreliable, add it with dedup guard:
      setReplies((prev) => {
        if (data.data && !prev.some((r) => r._id === data.data._id)) {
          return dedupeReplies([...prev, data.data])
        }
        return prev
      })
      setReplyText('')
      setReplyTo(null)
    } catch (e: any) {
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: e?.response?.data?.message || 'Failed to send reply',
        type: 'error',
      })
    } finally {
      setSending(false)
    }
  }

  const handleUpvoteDoubt = async () => {
    if (!doubt) return
    try {
      const { data } = await api.put(`/doubts/${doubt._id}/upvote`)
      setDoubt({
        ...doubt,
        upvotes: data.data.upvoted
          ? [...(Array.isArray(doubt.upvotes) ? doubt.upvotes : []), user?._id]
          : (Array.isArray(doubt.upvotes) ? doubt.upvotes : []).filter(
              (id: string) => id !== user?._id,
            ),
      })
      // Optionally refresh to sync with server
      // fetchDoubt();
    } catch {}
  }

  const handleUpvoteReply = async (replyId: string) => {
    try {
      const { data } = await api.put(`/doubts/replies/${replyId}/upvote`)
      setReplies((prev) =>
        prev.map((r) =>
          r._id === replyId
            ? {
                ...r,
                upvotes: data.data.upvoted
                  ? [...(Array.isArray(r.upvotes) ? r.upvotes : []), user?._id]
                  : (Array.isArray(r.upvotes) ? r.upvotes : []).filter(
                      (id: string) => id !== user?._id,
                    ),
              }
            : r,
        ),
      )
    } catch {}
  }

  const handleAccept = async (replyId: string) => {
    try {
      await api.put(`/doubts/replies/${replyId}/accept`)
      setReplies((prev) =>
        prev.map((r) => ({ ...r, isAccepted: r._id === replyId })),
      )
      setDoubt({ ...doubt, isSolved: true })
    } catch {}
  }

  // Organize replies into a tree for rendering if needed,
  // or just flat list with indentation.
  // For simplicity, I'll use a flat list but order them:
  // Parent 1
  //   Child 1 of Parent 1
  // Parent 2
  const organizedReplies = useMemo(() => {
    // Build a node map — deduplicate by _id first
    const unique = dedupeReplies(replies)
    const map = new Map<string, any>()
    const roots: any[] = []

    unique.forEach((r) => {
      map.set(r._id, { ...r, children: [] })
    })

    unique.forEach((r) => {
      if (r.parentId && map.has(r.parentId)) {
        map.get(r.parentId).children.push(map.get(r._id))
      } else {
        roots.push(map.get(r._id))
      }
    })

    // Flatten with depth, tracking visited nodes to prevent cycles
    const flattened: any[] = []
    const visited = new Set<string>()
    const traverse = (node: any, depth: number) => {
      if (visited.has(node._id)) return
      visited.add(node._id)
      flattened.push({ ...node, depth })
      node.children.forEach((child: any) => traverse(child, depth + 1))
    }

    roots.forEach((root) => traverse(root, 0))
    return flattened
  }, [replies])

  const isDoubtUpvoted =
    Array.isArray(doubt?.upvotes) && doubt.upvotes.includes(user?._id)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doubt Details</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={organizedReplies}
            renderItem={({ item, index }) => (
              <ReplyCard
                reply={item}
                depth={item.depth}
                onUpvote={() => handleUpvoteReply(item._id)}
                onAccept={() => handleAccept(item._id)}
                onReply={() => setReplyTo(item)}
                isOwner={doubt?.userId?._id === user?._id}
                isCurrentUser={item.userId?._id === user?._id}
              />
            )}
            keyExtractor={(item, index) => `reply-${item._id}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              doubt ? (
                <MotiView
                  from={{ opacity: 0, translateY: -10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 400 }}
                >
                  <Card style={styles.doubtCard}>
                    <View style={styles.doubtHeaderRow}>
                      <Badge
                        label={doubt.subjectId?.title || 'General'}
                        color={
                          doubt.subjectId?.color + '20' || Colors.primary + '20'
                        }
                        textColor={doubt.subjectId?.color || Colors.primary}
                      />
                      {doubt.isSolved && (
                        <View style={styles.solvedBadge}>
                          <CheckCircle size={14} color={Colors.success} />
                          <Text style={styles.solvedText}>Solved</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.doubtTitle}>{doubt.title}</Text>
                    {doubt.description ? (
                      <Text style={styles.doubtDesc}>{doubt.description}</Text>
                    ) : null}

                    <View style={styles.doubtFooter}>
                      <View style={styles.doubtMeta}>
                        <Avatar
                          uri={doubt.userId?.avatar}
                          name={doubt.userId?.name}
                          size={28}
                        />
                        <View>
                          <Text style={styles.doubtUser}>
                            {doubt.userId?.name}
                          </Text>
                          <Text style={styles.doubtTime}>
                            {timeAgo(doubt.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={handleUpvoteDoubt}
                        style={[
                          styles.doubtUpvote,
                          isDoubtUpvoted && styles.doubtUpvoted,
                        ]}
                      >
                        <ThumbsUp
                          size={18}
                          color={isDoubtUpvoted ? Colors.white : Colors.primary}
                          fill={isDoubtUpvoted ? Colors.white : 'none'}
                        />
                        <Text
                          style={[
                            styles.doubtUpvoteText,
                            isDoubtUpvoted && { color: Colors.white },
                          ]}
                        >
                          {doubt.upvotes?.length || 0}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                  <Text style={styles.repliesHeader}>
                    {replies.length} Replies
                  </Text>
                </MotiView>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <HelpCircle size={48} color={Colors.border} />
                <Text style={styles.emptyText}>
                  No replies yet. Be the first to help!
                </Text>
              </View>
            }
          />
        )}

        {/* Reply input */}
        <View
          style={[
            styles.inputSection,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          {replyTo && (
            <View style={styles.replyingToBar}>
              <Text style={styles.replyingToText} numberOfLines={1}>
                Replying to{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {replyTo.userId?.name}
                </Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <X size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={replyTo ? 'Write a reply...' : 'Write an answer...'}
              placeholderTextColor={Colors.textMuted}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!replyText.trim() || sending}
              style={[
                styles.sendBtn,
                (!replyText.trim() || sending) && styles.sendDisabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Send size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 40 },
  doubtCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    gap: 12,
    ...(Shadows.card as any),
  },
  doubtHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  solvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  solvedText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
  doubtTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  doubtDesc: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  doubtFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  doubtMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doubtUser: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  doubtTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  doubtUpvote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doubtUpvoted: { backgroundColor: Colors.primary },
  doubtUpvoteText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  repliesHeader: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  replyCardContainer: { marginBottom: Spacing.sm, position: 'relative' },
  threadLine: {
    position: 'absolute',
    left: -10,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  replyCard: { padding: Spacing.md, gap: 10, ...(Shadows.card as any) },
  acceptedCard: {
    borderWidth: 2,
    borderColor: Colors.success,
    backgroundColor: Colors.success + '05',
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  acceptedText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  replyUser: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  replyTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  acceptBtn: {
    padding: 4,
    backgroundColor: Colors.success + '15',
    borderRadius: 8,
  },
  replyText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 4,
  },
  upvoteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  upvoteCount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
  },
  replyActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyActionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
  },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.base,
    textAlign: 'center',
  },
  inputSection: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyingToBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundAlt,
  },
  replyingToText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    maxHeight: 120,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Shadows.md as any),
  },
  sendDisabled: { opacity: 0.5, backgroundColor: Colors.textMuted },
})
