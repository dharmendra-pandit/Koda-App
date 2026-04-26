import mongoose from 'mongoose'
import Doubt from '../models/Doubt.js'
import Reply from '../models/Reply.js'
import { uploadBuffer } from '../config/cloudinary.js'
import { errorResponse } from '../utils/response.js'
import { awardPoints } from '../utils/points.js'
import { ACTION_TYPES, logActivity } from '../utils/activity.js'
import { emitEvent } from '../utils/socket.js'

const SAFE_USER = '_id username name avatar'

// POST /api/doubts
export const createDoubt = async (req, res, next) => {
  try {
    const { subjectId, chapterId, title, description } = req.body

    let imageUrl = ''
    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, {
        folder: 'koda/doubts',
        resource_type: 'image',
      })
      imageUrl = result.secure_url
    }

    const doubt = await Doubt.create({
      userId: req.user._id,
      subjectId,
      chapterId: chapterId || null,
      title,
      description,
      image: imageUrl,
    })

    const populated = await doubt.populate([
      { path: 'userId', select: SAFE_USER },
      { path: 'subjectId', select: 'title color' },
    ])

    await logActivity({
      userId: req.user._id,
      actionType: ACTION_TYPES.DOUBT_POSTED,
      targetId: doubt._id,
      metadata: {
        text: `Asked a doubt: ${title}`,
        title,
        subjectId,
        chapterId: chapterId || null,
      },
    })
    
    emitEvent('doubt_created', populated)
    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    next(error)
  }
}

// GET /api/doubts?page=1&limit=15&subjectId=xxx&isSolved=false
export const getDoubts = async (req, res, next) => {
  try {
    const { subjectId, isSolved, following } = req.query
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(30, parseInt(req.query.limit) || 15)
    const skip = (page - 1) * limit

    const filter = {}
    if (subjectId) filter.subjectId = new mongoose.Types.ObjectId(subjectId)
    if (isSolved !== undefined) filter.isSolved = isSolved === 'true'

    if (following === 'true') {
      const { default: User } = await import('../models/User.js')
      const user = await User.findById(req.user._id).select('following')
      const followingIds = (user?.following || []).map(id => new mongoose.Types.ObjectId(id))
      filter.userId = { $in: [...followingIds, new mongoose.Types.ObjectId(req.user._id)] }
    }

    const doubts = await Doubt.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      { $unwind: '$userId' },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjectId',
          foreignField: '_id',
          as: 'subjectId'
        }
      },
      { $unwind: { path: '$subjectId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'replies',
          localField: '_id',
          foreignField: 'doubtId',
          as: 'replies'
        }
      },
      {
        $project: {
          userId: { _id: 1, username: 1, name: 1, avatar: 1 },
          subjectId: { _id: 1, title: 1, color: 1 },
          title: 1,
          description: 1,
          image: 1,
          isSolved: 1,
          solvedBy: 1,
          upvotes: 1,
          createdAt: 1,
          updatedAt: 1,
          replyCount: { $size: '$replies' }
        }
      }
    ]);

    const total = await Doubt.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: doubts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/doubts/:id
export const getDoubtById = async (req, res, next) => {
  try {
    const doubt = await Doubt.findById(req.params.id)
      .populate('userId', SAFE_USER)
      .populate('subjectId', 'title color')
    if (!doubt) return errorResponse(res, 'Doubt not found.', 404)

    res.status(200).json({ success: true, data: doubt })
  } catch (error) {
    next(error)
  }
}

// GET /api/doubts/:doubtId/replies   ← mobile needs this for doubt detail screen
export const getReplies = async (req, res, next) => {
  try {
    const replies = await Reply.find({ doubtId: req.params.doubtId })
      .populate('userId', SAFE_USER)
      .sort({ isAccepted: -1, createdAt: 1 }) // accepted reply first

    res.status(200).json({ success: true, data: replies })
  } catch (error) {
    next(error)
  }
}

// POST /api/doubts/replies
export const createReply = async (req, res, next) => {
  try {
    const { doubtId, text, parentId } = req.body

    const doubt = await Doubt.findById(doubtId)
    if (!doubt) return errorResponse(res, 'Doubt not found.', 404)

    const reply = await Reply.create({
      doubtId,
      userId: req.user._id,
      text,
      parentId: parentId || null,
    })
    await awardPoints(req.user._id, 'reply_posted', reply._id)

    await logActivity({
      userId: req.user._id,
      actionType: ACTION_TYPES.REPLY_POSTED,
      targetId: reply._id,
      metadata: {
        text: 'Posted a reply',
        doubtId,
        snippet: text.slice(0, 100),
      },
    })

    const populated = await reply.populate('userId', SAFE_USER)
    emitEvent('reply_created', populated, `doubt_${doubtId}`)
    
    // Notify the doubt owner if someone else replies
    if (String(doubt.userId) !== String(req.user._id)) {
      emitEvent('notification', { type: 'reply', doubtId, doubtTitle: doubt.title, reply: populated }, `user_${doubt.userId}`)
    }

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    next(error)
  }
}

// PUT /api/doubts/:id/upvote (toggle)
export const upvoteDoubt = async (req, res, next) => {
  try {
    const doubt = await Doubt.findById(req.params.id)
    if (!doubt) return errorResponse(res, 'Doubt not found.', 404)

    if (!Array.isArray(doubt.upvotes)) doubt.upvotes = []

    const alreadyUpvoted = doubt.upvotes.includes(req.user._id)
    if (alreadyUpvoted) {
      doubt.upvotes.pull(req.user._id)
    } else {
      doubt.upvotes.push(req.user._id)
      if (String(doubt.userId) !== String(req.user._id)) {
        await awardPoints(doubt.userId, 'doubt_upvoted', doubt._id)
      }
    }

    await doubt.save()
    emitEvent('doubt_updated', { _id: doubt._id, upvotes: doubt.upvotes.length, upvoted: !alreadyUpvoted }, `doubt_${doubt._id}`)
    res.status(200).json({
      success: true,
      data: { upvotes: doubt.upvotes.length, upvoted: !alreadyUpvoted },
    })
  } catch (error) {
    next(error)
  }
}

// PUT /api/doubts/replies/:id/upvote  (toggle)
export const upvoteReply = async (req, res, next) => {
  try {
    const reply = await Reply.findById(req.params.id)
    if (!reply) return errorResponse(res, 'Reply not found.', 404)

    if (!Array.isArray(reply.upvotes)) reply.upvotes = []

    const alreadyUpvoted = reply.upvotes.includes(req.user._id)
    if (alreadyUpvoted) {
      reply.upvotes.pull(req.user._id)
    } else {
      reply.upvotes.push(req.user._id)
      if (String(reply.userId) !== String(req.user._id)) {
        await awardPoints(reply.userId, 'reply_upvoted', reply._id)
      }
    }

    await reply.save()
    emitEvent('reply_updated', { _id: reply._id, upvotes: reply.upvotes.length, upvoted: !alreadyUpvoted }, `doubt_${reply.doubtId}`)
    res.status(200).json({
      success: true,
      data: { upvotes: reply.upvotes.length, upvoted: !alreadyUpvoted },
    })
  } catch (error) {
    next(error)
  }
}

// PUT /api/doubts/replies/:id/accept
export const acceptReply = async (req, res, next) => {
  try {
    const reply = await Reply.findById(req.params.id).populate('doubtId')
    if (!reply) return errorResponse(res, 'Reply not found.', 404)

    if (String(reply.doubtId.userId) !== String(req.user._id)) {
      return errorResponse(
        res,
        'Only the doubt author can accept a reply.',
        403,
      )
    }

    await Reply.updateMany(
      { doubtId: reply.doubtId._id },
      { isAccepted: false },
    )
    reply.isAccepted = true
    await reply.save()

    await Doubt.findByIdAndUpdate(reply.doubtId._id, {
      isSolved: true,
      solvedBy: reply.userId,
    })

    await awardPoints(reply.userId, 'reply_accepted', reply._id)

    emitEvent('doubt_solved', { _id: reply.doubtId._id, solvedBy: reply.userId }, `doubt_${reply.doubtId._id}`)

    res
      .status(200)
      .json({ success: true, data: { message: 'Reply accepted.' } })
  } catch (error) {
    next(error)
  }
}
