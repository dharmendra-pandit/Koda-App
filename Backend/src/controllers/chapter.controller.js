import Chapter from '../models/Chapter.js'
import { errorResponse } from '../utils/response.js'
import { awardPoints } from '../utils/points.js'
import { ACTION_TYPES, logActivity } from '../utils/activity.js'
import { emitEvent } from '../utils/socket.js'

// POST /api/chapters
export const createChapter = async (req, res, next) => {
  try {
    const { subjectId, title } = req.body
    const chapter = await Chapter.create({
      subjectId,
      title,
      userId: req.user._id,
    })
    emitEvent('chapter_created', chapter, `user_${req.user._id}`)
    res.status(201).json({ success: true, data: chapter })
  } catch (error) {
    next(error)
  }
}

// GET /api/chapters/:subjectId
export const getChaptersBySubject = async (req, res, next) => {
  try {
    const chapters = await Chapter.find({
      subjectId: req.params.subjectId,
      userId: req.user._id,
    }).sort({ createdAt: 1 })
    res.status(200).json({ success: true, data: chapters })
  } catch (error) {
    next(error)
  }
}

// PUT /api/chapters/:id
export const updateChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
    if (!chapter) return errorResponse(res, 'Chapter not found.', 404)

    const wasCompleted = chapter.isCompleted
    Object.assign(chapter, req.body)
    await chapter.save()

    // Award points when marking complete for the first time
    if (!wasCompleted && chapter.isCompleted) {
      await awardPoints(req.user._id, 'chapter_complete', chapter._id)

      await logActivity({
        userId: req.user._id,
        actionType: ACTION_TYPES.CHAPTER_COMPLETED,
        targetId: chapter._id,
        metadata: {
          text: `Completed chapter: ${chapter.title}`,
          chapterTitle: chapter.title,
          subjectId: chapter.subjectId,
        },
      })
    }

    emitEvent('chapter_updated', chapter, `user_${req.user._id}`)
    res.status(200).json({ success: true, data: chapter })
  } catch (error) {
    next(error)
  }
}
