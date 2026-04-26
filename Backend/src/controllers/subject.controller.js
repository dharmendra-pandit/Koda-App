import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import { errorResponse } from "../utils/response.js";
import { emitEvent } from "../utils/socket.js";

// POST /api/subjects
export const createSubject = async (req, res, next) => {
  try {
    const { title, color, isPublic } = req.body;
    
    // Duplicate check
    const existing = await Subject.findOne({ 
      userId: req.user._id, 
      title: { $regex: new RegExp(`^${title}$`, "i") } 
    });
    if (existing) {
      return errorResponse(res, "A subject with this title already exists.", 400);
    }

    const subject = await Subject.create({ title, color, isPublic, userId: req.user._id });
    emitEvent('subject_created', subject, `user_${req.user._id}`);
    
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// GET /api/subjects
export const getSubjects = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const subjects = await Subject.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: "chapters",
          localField: "_id",
          foreignField: "subjectId",
          as: "chapters",
        },
      },
      {
        $project: {
          title: 1,
          color: 1,
          isPublic: 1,
          createdAt: 1,
          totalChapters: { $size: "$chapters" },
          completedChapters: {
            $size: {
              $filter: {
                input: "$chapters",
                as: "chapter",
                cond: { $eq: ["$$chapter.isCompleted", true] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          progress: {
            $cond: {
              if: { $eq: ["$totalChapters", 0] },
              then: 0,
              else: { $divide: ["$completedChapters", "$totalChapters"] },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.status(200).json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
};

// PUT /api/subjects/:id
export const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!subject) return errorResponse(res, "Subject not found.", 404);
    
    emitEvent('subject_updated', subject, `user_${req.user._id}`);
    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/subjects/:id
export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!subject) return errorResponse(res, "Subject not found.", 404);
    
    emitEvent('subject_deleted', { _id: subject._id }, `user_${req.user._id}`);
    res.status(200).json({ success: true, data: { message: "Subject deleted." } });
  } catch (error) {
    next(error);
  }
};
