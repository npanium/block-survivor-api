// index.ts
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import dotenv from "dotenv";
import { initializeApplication } from "./startup";

import gameRoutes from "./routes/gameRoutes";

dotenv.config();

// Create Express app
const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Apply basic middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API documentation route
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "0G Compute Network Game API Documentation",
  })
);

// API routes
const apiPrefix = "/api";

// Register game routes
app.use(`${apiPrefix}/game`, gameRoutes);

// Root route with basic info and game endpoints
app.get("/", (req, res) => {
  res.json({
    name: "0G Compute Network Game API",
    version: "1.0.0",
    description:
      "Real-time AI-powered game difficulty adjustment using 0G Network LLM",
    documentation: "/docs",
    endpoints: {
      startGame: `POST ${apiPrefix}/game/start`,
      updateGame: `POST ${apiPrefix}/game/:sessionId/update`,
      getConfig: `GET ${apiPrefix}/game/:sessionId/config`,
      endGame: `POST ${apiPrefix}/game/:sessionId/end`,
      gameStats: `GET ${apiPrefix}/game/:sessionId/stats`,
      health: `GET ${apiPrefix}/game/health`,
    },
    usage: {
      1: "Start a game with POST /api/game/start",
      2: "Send player metrics every 30 seconds to POST /api/game/:sessionId/update",
      3: "Receive AI-adjusted game configuration in response",
      4: "End game with POST /api/game/:sessionId/end",
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Simple error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: err.message,
    });
  }
);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    availableEndpoints: {
      documentation: "/docs",
      gameStart: "/api/game/start",
      health: "/health",
    },
  });
});

// Initialize application and start server
const startServer = async () => {
  try {
    // Run initialization tasks
    await initializeApplication();

    // Start the server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`
🎮 0G Compute Network Game API Server
🚀 Running on: http://localhost:${PORT}
📚 API Docs: http://localhost:${PORT}/docs
🏥 Health: http://localhost:${PORT}/health

🎯 Ready for Unity integration!
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  process.exit(0);
});

// Start the application
startServer();

export default app;
