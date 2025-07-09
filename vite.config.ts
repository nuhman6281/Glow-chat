import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [
    react(),
    // Only include express plugin during development and when not disabled
    ...(command === "serve" && !process.env.DISABLE_EXPRESS_PLUGIN
      ? [expressPlugin()]
      : []),
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
      try {
        // Dynamic import to avoid issues during build
        const { createExpressApp } = await import("./server/index.js");
        const app = await createExpressApp();

        // Add Express app as middleware to Vite dev server
        server.middlewares.use("/api", app);
      } catch (error) {
        console.warn("Express plugin could not be configured:", error.message);
      }
    },
  };
}
