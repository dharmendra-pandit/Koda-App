import { Router } from "express";
import {
  createChapter,
  getChaptersBySubject,
  updateChapter,
} from "../controllers/chapter.controller.js";
import authMiddleware from "../middlewares/auth.js";
import validateRequest from "../middlewares/validate.js";
import { chapterSchema } from "../validators/content.validator.js";

const router = Router();
router.use(authMiddleware);

router.post("/", validateRequest(chapterSchema), createChapter);
router.get("/:subjectId", getChaptersBySubject);
router.put("/:id", updateChapter);

export default router;
