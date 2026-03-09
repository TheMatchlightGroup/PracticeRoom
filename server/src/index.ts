import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import musicSearchRouter from "./routes/musicSearch";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/music-search", musicSearchRouter);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`PracticeRoom server running on port ${PORT}`);
});
