import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import chapterRoutes from "./routes/chapter.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import doubtRoutes from "./routes/doubt.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// ── Security Headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet());

// ── CORS — allow any origin (mobile apps don't send Origin header) ────────────
app.use(
  cors({
    origin: true,           // reflect request origin (works with mobile clients)
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());   // pre-flight for all routes

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // max 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                   // stricter limit on auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts. Please try again later." },
});

app.use(globalLimiter);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Logger (dev only) ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({
    success: true,
    data: {
      status: "OK",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || "development",
    },
  })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",        authLimiter, authRoutes);
app.use("/api/users",       userRoutes);
app.use("/api/subjects",    subjectRoutes);
app.use("/api/chapters",    chapterRoutes);
app.use("/api/sessions",    sessionRoutes);
app.use("/api/doubts",      doubtRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` })
);

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
