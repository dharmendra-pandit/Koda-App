import Activity from '../models/Activity.js'
import { emitEvent } from './socket.js'

export const ACTION_TYPES = {
  STUDY_SESSION: 'STUDY_SESSION',
  CHAPTER_COMPLETED: 'CHAPTER_COMPLETED',
  DOUBT_POSTED: 'DOUBT_POSTED',
  REPLY_POSTED: 'REPLY_POSTED',
  FOLLOW: 'FOLLOW',
}

// Best-effort activity logging: feed should not break main user flows.
export const logActivity = async ({
  userId,
  actionType,
  targetId,
  metadata = {},
}) => {
  if (!userId || !actionType || !targetId) return

  try {
    const activity = await Activity.create({ userId, actionType, targetId, metadata })
    const populated = await activity.populate('userId', '_id name username avatar')
    
    // Emit to everyone for the global feed
    emitEvent('activity_created', populated)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('activity_log_failed', {
      userId: String(userId),
      actionType,
      targetId: String(targetId),
      message: error?.message,
    })
  }
}
