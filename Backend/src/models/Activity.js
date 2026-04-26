import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: [
        'STUDY_SESSION',
        'CHAPTER_COMPLETED',
        'DOUBT_POSTED',
        'REPLY_POSTED',
        'FOLLOW',
      ],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId, // Doubt ID, User ID, Chapter ID, Session ID, etc.
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // flexible info if needed
      default: {},
    },
  },
  { timestamps: true },
)

// Optimize query for fetching feed for followed users
activitySchema.index({ userId: 1, createdAt: -1 })
activitySchema.index({ createdAt: -1 })
activitySchema.index({ actionType: 1, createdAt: -1 })

export default mongoose.model('Activity', activitySchema)
