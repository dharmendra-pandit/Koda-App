import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import validateRequest from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);

export default router;
