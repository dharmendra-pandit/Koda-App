import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, username, email, password, institution, year } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Username";
      return res.status(409).json({ success: false, message: `${field} already in use.` });
    }

    const user = await User.create({ name, username, email, password, institution, year });
    const token = signToken(user._id);

    const safeUser = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      institution: user.institution,
      year: user.year,
      avatar: user.avatar,
      bio: user.bio,
      totalPoints: user.totalPoints,
      level: user.level,
      currentStreak: user.currentStreak,
    };

    res.status(201).json({ success: true, data: { token, user: safeUser } });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = signToken(user._id);

    const safeUser = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      institution: user.institution,
      year: user.year,
      avatar: user.avatar,
      bio: user.bio,
      totalPoints: user.totalPoints,
      level: user.level,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    };

    res.status(200).json({ success: true, data: { token, user: safeUser } });
  } catch (error) {
    next(error);
  }
};
