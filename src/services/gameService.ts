import { v4 as uuidv4 } from "uuid";
import { GameSession, GameConfig } from "../types/gameTypes";
import { DEFAULT_GAME_CONFIG, GAME_CONSTRAINTS } from "../config/gameDefaults";

class GameService {
  private activeSessions = new Map<string, GameSession>();
  private sessionConfigs = new Map<string, GameConfig>();

  /**
   * Create a new game session
   */
  createSession(playerId: string): { sessionId: string; config: GameConfig } {
    const sessionId = uuidv4();
    const now = Date.now();

    const session: GameSession = {
      sessionId,
      playerId,
      startTime: now,
      lastActivity: now,
      currentRound: 1,
      isActive: true,
    };

    // Store session and initial config
    this.activeSessions.set(sessionId, session);
    this.sessionConfigs.set(sessionId, { ...DEFAULT_GAME_CONFIG });

    console.log(`Game session created: ${sessionId} for player: ${playerId}`);

    return {
      sessionId,
      config: { ...DEFAULT_GAME_CONFIG },
    };
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): GameSession | null {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is still active (not expired)
    const now = Date.now();
    const timeSinceLastActivity = now - session.lastActivity;

    if (timeSinceLastActivity > GAME_CONSTRAINTS.session.maxInactiveTime) {
      this.endSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session activity and round
   */
  updateSessionActivity(sessionId: string, newRound?: number): boolean {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return false;
    }

    session.lastActivity = Date.now();

    if (newRound && newRound > session.currentRound) {
      session.currentRound = newRound;
    }

    return true;
  }

  /**
   * Get current config for session
   */
  getSessionConfig(sessionId: string): GameConfig | null {
    return this.sessionConfigs.get(sessionId) || null;
  }

  /**
   * Update session config
   */
  updateSessionConfig(sessionId: string, newConfig: GameConfig): boolean {
    const session = this.getSession(sessionId);

    if (!session) {
      return false;
    }

    this.sessionConfigs.set(sessionId, { ...newConfig });
    this.updateSessionActivity(sessionId);

    console.log(`Config updated for session ${sessionId}:`, newConfig);
    return true;
  }

  /**
   * End a game session
   */
  endSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);

    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      this.sessionConfigs.delete(sessionId);

      console.log(`Game session ended: ${sessionId}`);
      return true;
    }

    return false;
  }

  /**
   * Get active session count (for monitoring)
   */
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Cleanup expired sessions (call periodically)
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const timeSinceLastActivity = now - session.lastActivity;

      if (timeSinceLastActivity > GAME_CONSTRAINTS.session.maxInactiveTime) {
        this.endSession(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): any {
    const session = this.getSession(sessionId);
    const config = this.getSessionConfig(sessionId);

    if (!session) {
      return null;
    }

    const now = Date.now();

    return {
      sessionId,
      playerId: session.playerId,
      currentRound: session.currentRound,
      sessionDuration: now - session.startTime,
      timeSinceLastActivity: now - session.lastActivity,
      currentConfig: config,
      isActive: session.isActive,
    };
  }
}

// Singleton instance
export const gameService = new GameService();

// Auto-cleanup expired sessions every 10 minutes
setInterval(() => {
  gameService.cleanupExpiredSessions();
}, 10 * 60 * 1000);
