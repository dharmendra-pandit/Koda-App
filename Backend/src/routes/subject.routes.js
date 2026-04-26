import { Router } from "express";
import {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
} from "../controllers/subject.controller.js";
import authMiddleware from "../middlewares/auth.js";
import validateRequest from "../middlewares/validate.js";
import { subjectSchema } from "../validators/content.validator.js";

const router = Router();
router.use(authMiddleware);

router.post("/", validateRequest(subjectSchema), createSubject);
router.get("/", getSubjects);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
