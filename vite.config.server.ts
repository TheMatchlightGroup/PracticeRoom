import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Server build configuration - compiles TypeScript to JavaScript for production
export default defineConfig({
  build: {
    ssr: path.resolve(__dirname, "server/node-build.ts"),
    outDir: "dist",
    rollupOptions: {
      output: {
        dir: "dist/server",
        entryFileNames: "node-build.mjs",
        format: "es",
      },
      external: [
        "express",
        "dotenv",
        "@supabase/supabase-js",
        "openai",
        "stripe",
        "multer",
        "zod",
        "serverless-http",
        "cors",
        "node-fetch",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
