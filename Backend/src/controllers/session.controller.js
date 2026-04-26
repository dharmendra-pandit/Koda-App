import mongoose from 'mongoose'
import Session from '../models/Session.js'
import { awardPoints, updateStreak } from '../utils/points.js'
import { ACTION_TYPES, logActivity } from '../utils/activity.js'
import { emitEvent } from '../utils/socket.js'

// POST /api/sessions
export const createSession = async (req, res, next) => {
  try {
    const { subjectId, chapterId, duration, date } = req.body

    const session = await Session.create({
      userId: req.user._id,
      subjectId,
      chapterId: chapterId || null,
      duration,
      date: date ? new Date(date) : new Date(),
    })

    // Award points (1pt per 10 mins, min 1pt) & update streak
    const sessionPoints = Math.max(1, Math.floor(duration / 10))
    await awardPoints(req.user._id, 'study_session', session._id, sessionPoints)
    await updateStreak(req.user._id)

    await logActivity({
      userId: req.user._id,
      actionType: ACTION_TYPES.STUDY_SESSION,
      targetId: session._id,
      metadata: {
        text: `Completed a ${duration}-minute study session`,
        duration,
      },
    })

    // Fetch updated user stats
    const { default: User } = await import('../models/User.js')
    const user = await User.findById(req.user._id).select(
      'totalPoints level currentStreak longestStreak',
    )

    emitEvent('session_created', session, `user_${req.user._id}`)

    res.status(201).json({
      success: true,
      data: session,
      user,
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/sessions?page=1&limit=20
export const getSessions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const skip = (page - 1) * limit

    const [sessions, total] = await Promise.all([
      Session.find({ userId: req.user._id })
        .populate('subjectId', 'title color')
        .populate('chapterId', 'title')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Session.countDocuments({ userId: req.user._id }),
    ])

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/sessions/analytics
export const getAnalytics = async (req, res, next) => {
  try {
    // Convert to ObjectId for aggregation pipeline
    const userId = new mongoose.Types.ObjectId(req.user._id)

    // Total study time
    const totalAgg = await Session.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalMinutes: { $sum: '$duration' } } },
    ])
    const totalMinutes = totalAgg[0]?.totalMinutes || 0

    // Last 7 days per-day breakdown
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const weekly = await Session.aggregate([
      { $match: { userId, date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          minutes: { $sum: '$duration' },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Per-subject breakdown
    const bySubject = await Session.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$subjectId',
          totalMinutes: { $sum: '$duration' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject',
        },
      },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          subjectTitle: '$subject.title',
          subjectColor: '$subject.color',
          totalMinutes: 1,
          count: 1,
        },
      },
      { $sort: { totalMinutes: -1 } },
    ])

    // Fetch fresh user for accurate streak
    const { default: User } = await import('../models/User.js')
    const user = await User.findById(req.user._id).select(
      'currentStreak longestStreak level totalPoints',
    )

    res.status(200).json({
      success: true,
      data: {
        totalMinutes,
        totalHours: +(totalMinutes / 60).toFixed(2),
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalPoints: user.totalPoints,
        level: user.level,
        weekly,
        bySubject,
      },
    })
  } catch (error) {
    next(error)
  }
}
// GET /api/sessions/feed
export const getFeed = async (req, res, next) => {
  try {
    const { default: User } = await import('../models/User.js')
    const user = await User.findById(req.user._id).select('following')

    // Feed includes followed users + the user themselves
    const followingIds = [...(user?.following || []), req.user._id]

    const sessions = await Session.find({ userId: { $in: followingIds } })
      .populate('userId', 'name avatar')
      .populate('subjectId', 'title color')
      .sort({ createdAt: -1 })
      .limit(30)

    res.status(200).json({ success: true, data: sessions })
  } catch (error) {
    next(error)
  }
}
