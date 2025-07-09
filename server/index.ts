import express from "express";
import cors from "cors";
import { createServer as HTTPCreateServer } from "http";
import SocketManager from "./socket/socketHandler";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import chatRoutes from "./routes/chats";
import messageRoutes from "./routes/messages";
import callRoutes from "./routes/calls";
import uploadRoutes from "./routes/upload";
import friendRequestRoutes from "./routes/friendRequests";
import { connectDatabase } from "./config/database";
import { authenticate } from "./middleware/auth";
import { config, corsConfig, validateConfig } from "./config/config";

export async function createServer() {
  // Validate configuration first
  validateConfig();

  const app = express();
  const server = HTTPCreateServer(app);

  // Connect to the database
  await connectDatabase();

  // Initialize Socket.IO
  const socketManager = new SocketManager(server);

  // Middleware
  app.use(cors(corsConfig));
  app.use(express.json({ limit: config.maxFileSize }));
  app.use(express.urlencoded({ extended: true, limit: config.maxFileSize }));

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/chats", chatRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/calls", callRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/friend-requests", friendRequestRoutes);

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Secure routes, requires authentication
  app.use("/api/protected", authenticate, (req, res) => {
    res.json({ message: "This is a protected route" });
  });

  // Error handling
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  });

  // Attach the Express app to the server for dev mode access
  (server as any).app = app;

  return server;
}

export async function createExpressApp() {
  // Validate configuration first
  validateConfig();

  const app = express();

  // Connect to the database
  await connectDatabase();

  // Middleware
  app.use(cors(corsConfig));
  app.use(express.json({ limit: config.maxFileSize }));
  app.use(express.urlencoded({ extended: true, limit: config.maxFileSize }));

  // Routes
  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/chats", chatRoutes);
  app.use("/messages", messageRoutes);
  app.use("/calls", callRoutes);
  app.use("/upload", uploadRoutes);
  app.use("/friend-requests", friendRequestRoutes);

  // Health check route
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Secure routes, requires authentication
  app.use("/protected", authenticate, (req, res) => {
    res.json({ message: "This is a protected route" });
  });

  // Error handling
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  });

  return app;
}

// Main execution - start the server
async function startServer() {
  try {
    const server = await createServer();
    // Prefer VITE_PORT, then PORT, then 3000
    const port = process.env.VITE_PORT || process.env.PORT || 3000;
    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      if (process.env.VITE_PORT) {
        console.log(`(Using VITE_PORT env variable)`);
      } else if (process.env.PORT) {
        console.log(`(Using PORT env variable)`);
      } else {
        console.log(`(Using default port 3000)`);
      }
      console.log(
        `📊 Health check available at http://localhost:${port}/health`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
