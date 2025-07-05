import { GameConfig, TerrainConfig, BossConfig } from "../types/gameTypes";

export const DEFAULT_TERRAIN: TerrainConfig = {
  type: "smooth",
  movementModifier: 1.0,
};

export const DEFAULT_BOSS: BossConfig = {
  speed: 30,
  health: 100,
  damage: 10,
  shield: 0,
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  terrain: DEFAULT_TERRAIN,
  boss: DEFAULT_BOSS,
};

// Terrain configurations
export const TERRAIN_CONFIGS: Record<string, TerrainConfig> = {
  smooth: {
    type: "smooth",
    movementModifier: 1.2, // 20% faster movement
  },
  sticky: {
    type: "sticky",
    movementModifier: 0.8, // 20% slower movement
  },
  rugged: {
    type: "rugged",
    movementModifier: 0.9, // 10% slower movement, more challenging
  },
};

// Validation constraints
export const GAME_CONSTRAINTS = {
  boss: {
    speed: { min: 1, max: 100 },
    health: { min: 50, max: 500 },
    damage: { min: 5, max: 50 },
    shield: { min: 0, max: 100 },
  },
  session: {
    maxInactiveTime: 60 * 60 * 1000, // 1 hour in milliseconds
    maxRounds: 100,
  },
};

// Clamp values to valid ranges
export const clampBossConfig = (config: any): BossConfig => {
  const { boss } = GAME_CONSTRAINTS;

  return {
    speed: Math.max(
      boss.speed.min,
      Math.min(boss.speed.max, config.boss_speed || DEFAULT_BOSS.speed)
    ),
    health: Math.max(
      boss.health.min,
      Math.min(boss.health.max, config.boss_health || DEFAULT_BOSS.health)
    ),
    damage: Math.max(
      boss.damage.min,
      Math.min(boss.damage.max, config.boss_damage || DEFAULT_BOSS.damage)
    ),
    shield: Math.max(
      boss.shield.min,
      Math.min(boss.shield.max, config.boss_shield || DEFAULT_BOSS.shield)
    ),
  };
};
