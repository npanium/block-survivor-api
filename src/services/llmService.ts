import { PlayerMetrics, GameConfig, LLMResponse } from "../types/gameTypes";
import { TERRAIN_CONFIGS, clampBossConfig } from "../config/gameDefaults";
import { brokerService, OFFICIAL_PROVIDERS } from "./brokerService";

class LLMService {
  private readonly LLAMA_PROVIDER =
    OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
  private readonly LLM_TIMEOUT = 15000; // 15 seconds

  /**
   * Generate new game config based on player metrics
   */
  async generateGameConfig(
    currentConfig: GameConfig,
    metrics: PlayerMetrics
  ): Promise<{
    config: GameConfig;
    success: boolean;
    error?: string;
    prompt?: string;
    llmResponse?: string;
  }> {
    try {
      console.log(`\n🤖 Generating config for round ${metrics.round}`);
      console.log(`📊 Player metrics:`, metrics);

      // Create structured prompt
      const prompt = this.createPrompt(currentConfig, metrics);

      console.log(`\n📝 LLM PROMPT:`);
      console.log(`${"─".repeat(60)}`);
      console.log(prompt);
      console.log(`${"─".repeat(60)}\n`);

      console.log(`⏳ Calling LLM...`);

      // Call LLM with timeout
      const llmResponse = await Promise.race([
        this.callLLM(prompt),
        this.timeoutPromise(),
      ]);

      console.log(`\n🤖 LLM RESPONSE:`);
      console.log(`${"─".repeat(60)}`);
      console.log(llmResponse);
      console.log(`${"─".repeat(60)}\n`);

      // Parse and validate response
      const newConfig = this.parseLLMResponse(llmResponse, currentConfig);

      console.log("✅ LLM generated new config:", newConfig);

      return {
        config: newConfig,
        success: true,
        prompt,
        llmResponse,
      };
    } catch (error: any) {
      console.error("❌ LLM_ERROR", {
        metrics,
        currentConfig,
        error: error.message,
        timestamp: Date.now(),
      });

      return {
        config: currentConfig, // Return previous config as fallback
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create structured prompt for the LLM
   */
  private createPrompt(
    currentConfig: GameConfig,
    metrics: PlayerMetrics
  ): string {
    const { apm, dodgeRatio, round } = metrics;
    const { terrain, boss } = currentConfig;

    // Convert dodge ratio to percentage for better LLM understanding
    const dodgePercent = Math.round(dodgeRatio * 100);

    // Determine player skill level
    let skillLevel = "beginner";
    if (apm > 120 && dodgeRatio > 0.7) skillLevel = "expert";
    else if (apm > 80 && dodgeRatio > 0.5) skillLevel = "intermediate";

    return `Player Performance Analysis:
- Actions Per Minute: ${apm} (${
      apm > 100 ? "High" : apm > 60 ? "Medium" : "Low"
    })
- Dodge Success Rate: ${dodgePercent}% (${
      dodgePercent > 70
        ? "Excellent"
        : dodgePercent > 50
        ? "Good"
        : "Needs Improvement"
    })
- Current Round: ${round}
- Skill Level: ${skillLevel}

Current Game Configuration:
- Terrain: ${terrain.type} (movement modifier: ${terrain.movementModifier})
- Boss Speed: ${boss.speed}/100
- Boss Health: ${boss.health} HP
- Boss Damage: ${boss.damage}
- Boss Shield: ${boss.shield}

TERRAIN EFFECTS ON GAMEPLAY:
- "smooth": Player moves faster but has less control (slips around), harder to precisely dodge
- "sticky": Player movement is slowed, harder to escape from attacks, defensive disadvantage  
- "rugged": Normal player control, balanced terrain, no movement penalties or bonuses

BOSS DIFFICULTY SCALING:
- boss_speed: 1-100 (higher = boss attacks faster, more pressure)
- boss_health: 50-500 (higher = longer fights, more endurance needed)
- boss_damage: 5-50 (higher = more punishing when hit)
- boss_shield: 0-100 (higher = boss takes less damage, longer fights)

TASK: Adjust difficulty to maintain engagement and challenge:
- If player performing excellently (high APM + high dodge rate): Increase challenge with harder terrain and stronger boss
- If player struggling (low APM + low dodge rate): Reduce difficulty with easier terrain and weaker boss  
- If player improving: Gradually scale up difficulty
- Consider terrain choice strategically: smooth for speed challenges, sticky for precision challenges, rugged for balanced

CONSTRAINTS:
- terrain: "smooth" | "sticky" | "rugged" 
- boss_speed: 1-100 (current: ${boss.speed})
- boss_health: 50-500 (current: ${boss.health})
- boss_damage: 5-50 (current: ${boss.damage})
- boss_shield: 0-100 (current: ${boss.shield})

Return ONLY valid JSON in this exact format:
{
  "terrain": "smooth",
  "boss_speed": 45,
  "boss_health": 120,
  "boss_damage": 15,
  "boss_shield": 10
}`;
  }

  /**
   * Call the LLM via 0G Network
   */
  private async callLLM(prompt: string): Promise<string> {
    try {
      const result = await brokerService.sendQuery(this.LLAMA_PROVIDER, prompt);

      return result.content || "";
    } catch (error: any) {
      throw new Error(`LLM API call failed: ${error.message}`);
    }
  }

  /**
   * Create timeout promise
   */
  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("LLM request timed out"));
      }, this.LLM_TIMEOUT);
    });
  }

  /**
   * Parse and validate LLM response
   */
  private parseLLMResponse(
    response: string,
    fallbackConfig: GameConfig
  ): GameConfig {
    try {
      // Extract JSON from response (in case LLM adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in LLM response");
      }

      const parsedResponse: LLMResponse = JSON.parse(jsonMatch[0]);

      // Validate terrain
      const terrainType = parsedResponse.terrain;
      if (!["smooth", "sticky", "rugged"].includes(terrainType)) {
        throw new Error(`Invalid terrain type: ${terrainType}`);
      }

      // Get terrain config
      const terrainConfig = TERRAIN_CONFIGS[terrainType];
      if (!terrainConfig) {
        throw new Error(`Terrain config not found for: ${terrainType}`);
      }

      // Clamp boss values to valid ranges
      const bossConfig = clampBossConfig(parsedResponse);

      return {
        terrain: terrainConfig,
        boss: bossConfig,
      };
    } catch (error: any) {
      console.error("Failed to parse LLM response:", error.message);
      console.error("Raw response:", response);

      // Return fallback config
      throw new Error(`LLM response parsing failed: ${error.message}`);
    }
  }

  /**
   * Test LLM connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = 'Return only JSON: {"test": "success"}';
      const response = await this.callLLM(testPrompt);
      return response.includes("success");
    } catch (error) {
      console.error("LLM connection test failed:", error);
      return false;
    }
  }
}

// Singleton instance
export const llmService = new LLMService();
