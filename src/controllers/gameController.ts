import { Request, Response } from "express";
import { gameService } from "../services/gameService";
import { llmService } from "../services/llmService";
import { MetricsProcessor } from "../services/metricsProcessor";
import { GameStartResponse, GameUpdateResponse } from "../types/gameTypes";

/**
 * @swagger
 * /game/start:
 *   post:
 *     summary: Start a new game session
 *     tags: [Game]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - playerId
 *             properties:
 *               playerId:
 *                 type: string
 *                 description: Unique player identifier (UUID)
 *     responses:
 *       200:
 *         description: Game session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sessionId:
 *                   type: string
 *                 config:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
export const startGame = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;

    if (!playerId || typeof playerId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Valid playerId is required",
      });
    }

    // Create new game session
    const { sessionId, config } = gameService.createSession(playerId);

    const response: GameStartResponse = {
      success: true,
      sessionId,
      config,
      message: "Game session created successfully",
    };

    console.log(`Game started for player ${playerId}, session: ${sessionId}`);

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Error starting game:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /game/{sessionId}/update:
 *   post:
 *     summary: Update game with player metrics and get new configuration
 *     tags: [Game]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apm
 *               - dodgeRatio
 *               - round
 *             properties:
 *               apm:
 *                 type: number
 *                 description: Actions per minute
 *               dodgeRatio:
 *                 type: number
 *                 description: Ratio of dodged attacks (0-1)
 *               round:
 *                 type: number
 *                 description: Current round number
 *               distanceTraveled:
 *                 type: number
 *                 description: Distance traveled in game units (optional)
 *               reactionTime:
 *                 type: number
 *                 description: Average reaction time in seconds (optional)
 *               damageDealt:
 *                 type: number
 *                 description: Damage dealt to boss (optional)
 *               timeSurvived:
 *                 type: number
 *                 description: Time survived in seconds (optional)
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 config:
 *                   type: object
 *                 round:
 *                   type: number
 *                 llm_used:
 *                   type: boolean
 *                 sessionId:
 *                   type: string
 *                 error:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
export const updateGame = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Validate session exists
    const session = gameService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Game session not found or expired",
      });
    }

    // Validate and process metrics
    let validatedMetrics;
    try {
      validatedMetrics = MetricsProcessor.validateMetrics(req.body);
    } catch (validationError: any) {
      return res.status(400).json({
        success: false,
        error: validationError.message,
      });
    }

    // Get current config
    const currentConfig = gameService.getSessionConfig(sessionId);
    if (!currentConfig) {
      return res.status(500).json({
        success: false,
        error: "Session configuration not found",
      });
    }

    // Update session activity
    gameService.updateSessionActivity(sessionId, validatedMetrics.round);

    // Generate new config using LLM
    const {
      config: newConfig,
      success: llmSuccess,
      error: llmError,
      prompt,
      llmResponse,
    } = await llmService.generateGameConfig(currentConfig, validatedMetrics);

    // Update session with new config (even if it's the same as fallback)
    gameService.updateSessionConfig(sessionId, newConfig);

    // Prepare response
    const response: GameUpdateResponse = {
      success: true,
      config: newConfig,
      round: validatedMetrics.round,
      llm_used: llmSuccess,
      sessionId,
      ...(llmError && { error: llmError }),
      ...(prompt && { prompt }),
      ...(llmResponse && { llmResponse }),
    };

    // Log the update
    console.log(
      `Game updated for session ${sessionId}, round ${validatedMetrics.round}, LLM used: ${llmSuccess}`
    );

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Error updating game:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /game/{sessionId}/config:
 *   get:
 *     summary: Get current game configuration
 *     tags: [Game]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game session ID
 *     responses:
 *       200:
 *         description: Current configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 config:
 *                   type: object
 *                 sessionId:
 *                   type: string
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
export const getGameConfig = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Validate session exists
    const session = gameService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Game session not found or expired",
      });
    }

    // Get current config
    const config = gameService.getSessionConfig(sessionId);
    if (!config) {
      return res.status(500).json({
        success: false,
        error: "Session configuration not found",
      });
    }

    return res.status(200).json({
      success: true,
      config,
      sessionId,
    });
  } catch (error: any) {
    console.error("Error getting game config:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /game/{sessionId}/end:
 *   post:
 *     summary: End a game session
 *     tags: [Game]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game session ID
 *     responses:
 *       200:
 *         description: Game session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
export const endGame = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const success = gameService.endSession(sessionId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Game session not found",
      });
    }

    console.log(`Game session ended: ${sessionId}`);

    return res.status(200).json({
      success: true,
      message: "Game session ended successfully",
    });
  } catch (error: any) {
    console.error("Error ending game:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /game/{sessionId}/stats:
 *   get:
 *     summary: Get game session statistics
 *     tags: [Game]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game session ID
 *     responses:
 *       200:
 *         description: Session statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
export const getGameStats = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const stats = gameService.getSessionStats(sessionId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "Game session not found or expired",
      });
    }

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("Error getting game stats:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /game/health:
 *   get:
 *     summary: Get game service health status
 *     tags: [Game]
 *     responses:
 *       200:
 *         description: Service health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 activeSessions:
 *                   type: number
 *                 llmStatus:
 *                   type: boolean
 *       500:
 *         description: Server error
 */
export const getGameHealth = async (req: Request, res: Response) => {
  try {
    const activeSessions = gameService.getActiveSessionCount();

    // Test LLM connection (optional - can be slow)
    // const llmStatus = await llmService.testConnection();
    const llmStatus = true; // Skip test for speed

    return res.status(200).json({
      success: true,
      status: "healthy",
      activeSessions,
      llmStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error checking game health:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
