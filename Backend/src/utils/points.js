import User from "../models/User.js";
import PointsHistory from "../models/PointsHistory.js";

export const POINTS = {
  study_session: 5,
  chapter_complete: 10,
  reply_posted: 5,
  reply_upvoted: 3,
  reply_accepted: 10,
};

/**
 * Award points to a user and log the action.
 * @param {string} userId
 * @param {string} actionType
 * @param {string|null} refId
 */
export const awardPoints = async (userId, actionType, refId = null, customPoints = null) => {
  const points = customPoints ?? POINTS[actionType];
  if (!points) return;

  const user = await User.findById(userId);
  if (!user) return;

  user.totalPoints += points;
  user.updateLevel();
  await user.save();

  await PointsHistory.create({ userId, actionType, points, refId });
};

/**
 * Update streak after a study session.
 * Increments streak if studied today or yesterday; resets otherwise.
 */
export const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const last = user.lastStudyDate ? new Date(user.lastStudyDate) : null;

  if (last) {
    const lastDay = new Date(last);
    lastDay.setHours(0, 0, 0, 0);

    if (lastDay.getTime() === today.getTime()) {
      // Already studied today — no change
    } else if (lastDay.getTime() === yesterday.getTime()) {
      // Studied yesterday — extend streak
      user.currentStreak += 1;
    } else {
      // Missed a day — reset
      user.currentStreak = 1;
    }
  } else {
    user.currentStreak = 1;
  }

  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }

  user.lastStudyDate = new Date();
  await user.save();
};
