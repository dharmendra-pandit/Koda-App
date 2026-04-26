import { Router } from "express";
import {
  getLeaderboard,
  getWeeklyLeaderboard,
} from "../controllers/leaderboard.controller.js";
import authMiddleware from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/", getLeaderboard);
router.get("/weekly", getWeeklyLeaderboard);

export default router;
