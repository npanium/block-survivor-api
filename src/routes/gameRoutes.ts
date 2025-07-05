import express from "express";
import * as gameController from "../controllers/gameController";

const router = express.Router();

// Game management routes
router.post("/start", gameController.startGame);
router.post("/:sessionId/update", gameController.updateGame);
router.get("/:sessionId/config", gameController.getGameConfig);
router.post("/:sessionId/end", gameController.endGame);
router.get("/:sessionId/stats", gameController.getGameStats);

// Service health route
router.get("/health", gameController.getGameHealth);

export default router;
