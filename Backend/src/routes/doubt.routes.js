import { Router } from "express";
import {
  createDoubt,
  getDoubts,
  getReplies,
  createReply,
  upvoteReply,
  acceptReply,
  upvoteDoubt,
  getDoubtById,
} from "../controllers/doubt.controller.js";
import authMiddleware from "../middlewares/auth.js";
import validateRequest from "../middlewares/validate.js";
import upload from "../middlewares/upload.js";
import { doubtSchema, replySchema } from "../validators/content.validator.js";

const router = Router();
router.use(authMiddleware);

// Doubts
router.post("/", upload.single("image"), validateRequest(doubtSchema), createDoubt);
router.get("/", getDoubts);
router.get("/:id", getDoubtById);
router.put("/:id/upvote", upvoteDoubt);
router.get("/:doubtId/replies", getReplies);

// Replies
router.post("/replies", validateRequest(replySchema), createReply);
router.put("/replies/:id/upvote", upvoteReply);
router.put("/replies/:id/accept", acceptReply);

export default router;
