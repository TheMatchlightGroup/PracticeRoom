import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [
    react(),
    // Only add express plugin during development
    ...(command === "serve" ? [expressPlugin()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    async configureServer(server) {
      // Lazy load server using dynamic import
      try {
        const serverModule = await import("./server/index.ts");
        const app = serverModule.createServer();

        // Add Express app as middleware to Vite dev server
        server.middlewares.use(app);
      } catch (err) {
        // Fail silently
      }
    },
  };
}
