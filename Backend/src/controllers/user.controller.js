import mongoose from 'mongoose'
import User from '../models/User.js'
import Doubt from '../models/Doubt.js'
import Activity from '../models/Activity.js'
import { uploadBuffer } from '../config/cloudinary.js'
import { errorResponse } from '../utils/response.js'
import { ACTION_TYPES, logActivity } from '../utils/activity.js'
import { emitEvent } from '../utils/socket.js'

const SAFE_FIELDS =
  '_id username name avatar bio institution year totalPoints level currentStreak longestStreak followers following isPublic createdAt'

// GET /api/users/me
export const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: req.user })
}

// PUT /api/users/update
export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'bio', 'institution', 'year', 'isPublic']
    const updates = {}
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f]
    })

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select(SAFE_FIELDS)

    res.status(200).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

// POST /api/users/avatar
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded.', 400)
    }

    // Stream buffer to Cloudinary
    const uploadResult = await uploadBuffer(req.file.buffer, {
      folder: 'koda/avatars',
      resource_type: 'image',
      transformation: [{ width: 400, height: 400, crop: 'fill' }],
    })

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: uploadResult.secure_url },
      { new: true },
    ).select(SAFE_FIELDS)

    res.status(200).json({ success: true, data: { avatar: user.avatar, user } })
  } catch (error) {
    next(error)
  }
}

// GET /api/users/search?query=abc
export const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query

    const searchRegex = new RegExp(query, 'i')
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { username: searchRegex },
            { name: searchRegex },
            { institution: searchRegex },
            { year: searchRegex },
          ],
        },
      ],
    })
      .select('_id username name avatar bio institution year')
      .limit(20)

    res.status(200).json({ success: true, users })
  } catch (error) {
    next(error)
  }
}

// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(SAFE_FIELDS)
    if (!user) return errorResponse(res, 'User not found.', 404)

    const isFollowing = user.followers.includes(req.user._id)

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        isFollowing,
        followerCount: user.followers.length,
        followingCount: user.following.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

// POST /api/users/:id/follow
export const followUser = async (req, res, next) => {
  try {
    const targetId = req.params.id
    const myId = req.user._id

    if (targetId === String(myId)) {
      return errorResponse(res, 'You cannot follow yourself.', 400)
    }

    const target = await User.findById(targetId)
    if (!target) return errorResponse(res, 'User not found.', 404)

    const alreadyFollowing = target.followers.includes(myId)
    if (alreadyFollowing) {
      return errorResponse(res, 'Already following this user.', 409)
    }

    await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } })
    await User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } })

    await logActivity({
      userId: myId,
      actionType: ACTION_TYPES.FOLLOW,
      targetId,
      metadata: {
        text: `Started following ${target.username}`,
        targetUsername: target.username,
      },
    })

    // Emit updates to both users
    emitEvent('user_updated', { userId: targetId, action: 'follow_gained' }, `user_${targetId}`)
    emitEvent('user_updated', { userId: myId, action: 'follow_given' }, `user_${myId}`)

    res
      .status(200)
      .json({ success: true, data: { message: 'Followed successfully.' } })
  } catch (error) {
    next(error)
  }
}

// POST /api/users/:id/unfollow
export const unfollowUser = async (req, res, next) => {
  try {
    const targetId = req.params.id
    const myId = req.user._id

    await User.findByIdAndUpdate(targetId, { $pull: { followers: myId } })
    await User.findByIdAndUpdate(myId, { $pull: { following: targetId } })

    // Emit updates to both users
    emitEvent('user_updated', { userId: targetId, action: 'follow_lost' }, `user_${targetId}`)
    emitEvent('user_updated', { userId: myId, action: 'follow_removed' }, `user_${myId}`)

    res
      .status(200)
      .json({ success: true, data: { message: 'Unfollowed successfully.' } })
  } catch (error) {
    next(error)
  }
}

export const getUserDoubts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 10))
    const skip = (page - 1) * limit

    const doubts = await Doubt.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.params.id) } },
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
          userId: { _id: 1, name: 1, username: 1, avatar: 1 },
          subjectId: { _id: 1, title: 1, color: 1 },
          title: 1,
          description: 1,
          isSolved: 1,
          solvedBy: 1,
          upvotes: 1,
          createdAt: 1,
          replyCount: { $size: '$replies' }
        }
      }
    ]);

    const total = await Doubt.countDocuments({ userId: req.params.id })

    res.status(200).json({
      success: true,
      data: doubts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + doubts.length < total,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getFollowers = async (req, res, next) => {
  try {
    const { query } = req.query
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 10))
    const skip = (page - 1) * limit

    const user = await User.findById(req.params.id)
    if (!user) return errorResponse(res, 'User not found.', 404)

    const searchFilter = { _id: { $in: user.followers } }
    if (query) {
      const regex = new RegExp(query, 'i')
      searchFilter.$or = [{ username: regex }, { name: regex }]
    }

    const followers = await User.find(searchFilter)
      .select('_id username name avatar bio')
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments(searchFilter)

    res.status(200).json({
      success: true,
      data: followers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + followers.length < total,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getFollowing = async (req, res, next) => {
  try {
    const { query } = req.query
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 10))
    const skip = (page - 1) * limit

    const user = await User.findById(req.params.id)
    if (!user) return errorResponse(res, 'User not found.', 404)

    const searchFilter = { _id: { $in: user.following } }
    if (query) {
      const regex = new RegExp(query, 'i')
      searchFilter.$or = [{ username: regex }, { name: regex }]
    }

    const following = await User.find(searchFilter)
      .select('_id username name avatar bio')
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments(searchFilter)

    res.status(200).json({
      success: true,
      data: following,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + following.length < total,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getFeed = async (req, res, next) => {
  try {
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 15))
    const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : null

    // fetch current user full details for following list
    const user = await User.findById(req.user._id).select('following')
    const followingIds = user?.following || []

    const filter = {
      $or: [{ userId: { $in: followingIds } }, { userId: req.user._id }],
    }

    if (cursor && !Number.isNaN(cursor.getTime())) {
      filter.createdAt = { $lt: cursor }
    }

    const activities = await Activity.find(filter)
      .populate('userId', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(limit)

    const nextCursor =
      activities.length === limit
        ? activities[activities.length - 1].createdAt.toISOString()
        : null

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        limit,
        nextCursor,
        hasMore: Boolean(nextCursor),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getUserFeed = async (req, res, next) => {
  try {
    const { id } = req.params
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 15))
    const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : null

    const filter = { userId: id }

    if (cursor && !Number.isNaN(cursor.getTime())) {
      filter.createdAt = { $lt: cursor }
    }

    const activities = await Activity.find(filter)
      .populate('userId', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(limit)

    const nextCursor =
      activities.length === limit
        ? activities[activities.length - 1].createdAt.toISOString()
        : null

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        limit,
        nextCursor,
        hasMore: Boolean(nextCursor),
      },
    })
  } catch (error) {
    next(error)
  }
}
