import { Router } from "express";
import {
  createSession,
  getSessions,
  getAnalytics,
  getFeed,
} from "../controllers/session.controller.js";
import authMiddleware from "../middlewares/auth.js";
import validateRequest from "../middlewares/validate.js";
import { sessionSchema } from "../validators/content.validator.js";

const router = Router();
router.use(authMiddleware);

router.post("/", validateRequest(sessionSchema), createSession);
router.get("/", getSessions);
router.get("/feed", getFeed);
router.get("/analytics", getAnalytics);

export default router;
