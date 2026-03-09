import "dotenv/config";
import express from "express";
import cors from "cors";

import { handleDemo } from "./routes/demo";
import authRouter from "./routes/auth";
import piecesRouter from "./routes/pieces";
import practicePlanRouter from "./routes/practice-plan";
import memorizationRouter from "./routes/memorization";
import uploadRouter from "./routes/upload";
import analyticsRouter from "./routes/analytics";
import performanceRouter from "./routes/performance";
import subscriptionRouter from "./routes/subscription";
import audioAnalysisRouter from "./routes/audio-analysis";
import submissionsRouter from "./routes/submissions";
import notificationsRouter from "./routes/notifications";
import discoveryRouter from "./routes/discovery";
import studentInteractionsRouter from "./routes/student-interactions";
import musicSearchRouter from "./routes/musicSearch";

// Log config status
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log("✅ Supabase configured");
} else {
  console.warn("⚠️ Supabase credentials missing. Database operations will fail.");
}

if (process.env.OPENAI_API_KEY) {
  console.log("✅ OpenAI API configured");
} else {
  console.warn("⚠️ OpenAI API key missing. Music search normalization will use fallback heuristics.");
}

if (process.env.STRIPE_SECRET_KEY) {
  console.log("✅ Stripe configured");
} else {
  console.warn("⚠️ Stripe API key not configured. Subscription features will fail.");
}

export function createServer() {
  const app = express();

  // Stripe webhook must receive raw body before JSON parsing
  app.use("/api/subscription/webhook", express.raw({ type: "application/json" }));

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get("/api/demo", handleDemo);

  app.use("/api/auth", authRouter);
  app.use("/api/pieces", piecesRouter);
  app.use("/api/practice-plan", practicePlanRouter);
  app.use("/api/memorization", memorizationRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/performance", performanceRouter);
  app.use("/api/subscription", subscriptionRouter);
  app.use("/api/audio-analysis", audioAnalysisRouter);
  app.use("/api/submissions", submissionsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/discovery", discoveryRouter);
  app.use("/api/interactions", studentInteractionsRouter);

  // Music search
  app.use("/api/music-search", musicSearchRouter);

  return app;
}
