import User from "../models/User.js";
import PointsHistory from "../models/PointsHistory.js";

// GET /api/leaderboard?page=1&limit=20
export const getLeaderboard = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select("_id username name avatar totalPoints level institution currentStreak")
        .sort({ totalPoints: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);

    // Attach rank
    const ranked = users.map((u, i) => ({ ...u.toObject(), rank: skip + i + 1 }));

    res.status(200).json({
      success: true,
      data: ranked,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/leaderboard/weekly?page=1&limit=20
export const getWeeklyLeaderboard = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekly = await PointsHistory.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: "$userId", weeklyPoints: { $sum: "$points" } } },
      { $sort: { weeklyPoints: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$user._id",
          username: "$user.username",
          name: "$user.name",
          avatar: "$user.avatar",
          level: "$user.level",
          institution: "$user.institution",
          currentStreak: "$user.currentStreak",
          weeklyPoints: 1,
        },
      },
    ]);

    // Attach rank
    const ranked = weekly.map((u, i) => ({ ...u, rank: skip + i + 1 }));

    res.status(200).json({ success: true, data: ranked });
  } catch (error) {
    next(error);
  }
};
