import { Router } from "express";
import { z } from "zod";
import { runMusicSearch } from "../services/musicSearch/musicSearchService";

const router = Router();

const musicSearchRequestSchema = z.object({
  query: z.string().trim().min(1, "Query is required"),
});

router.post("/", async (req, res) => {
  try {
    const parsed = musicSearchRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid music search request",
        details: parsed.error.flatten(),
      });
    }

    const results = await runMusicSearch(parsed.data.query);

    return res.json(results);
  } catch (error) {
    console.error("music-search failed:", error);
    return res.status(500).json({
      error: "Music search failed",
    });
  }
});

export default router;
