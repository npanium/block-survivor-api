export interface GameSession {
  sessionId: string;
  playerId: string;
  startTime: number;
  lastActivity: number;
  currentRound: number;
  isActive: boolean;
}

export interface TerrainConfig {
  type: "smooth" | "sticky" | "rugged";
  movementModifier: number; // 0.5 to 1.5
}

export interface BossConfig {
  speed: number; // 1-100
  health: number; // 50-500
  damage: number; // 5-50
  shield: number; // 0-100
}

export interface GameConfig {
  terrain: TerrainConfig;
  boss: BossConfig;
}

export interface PlayerMetrics {
  apm: number; // Actions per minute
  dodgeRatio: number; // 0-1 (percentage of dodged attacks)
  round: number; // Current round number
  distanceTraveled?: number; // Optional: distance moved in units
  reactionTime?: number; // Optional: average reaction time in seconds
  damageDealt?: number; // Optional: damage dealt to boss
  timeSurvived?: number; // Optional: time survived in seconds
}

export interface LLMResponse {
  terrain: "smooth" | "sticky" | "rugged";
  boss_speed: number;
  boss_health: number;
  boss_damage: number;
  boss_shield?: number;
}

export interface GameUpdateResponse {
  success: boolean;
  config: GameConfig;
  round: number;
  llm_used: boolean;
  error?: string;
  sessionId: string;
  prompt?: string; // LLM prompt for debugging
  llmResponse?: string; // Raw LLM response for debugging
}

export interface GameStartResponse {
  success: boolean;
  sessionId: string;
  config: GameConfig;
  message: string;
}
