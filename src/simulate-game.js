// Simulates a complete game session with realistic player progression

const API_BASE = "http://localhost:4000/api";

// Player profiles for different skill levels
const PLAYER_PROFILES = {
  beginner: {
    name: "Beginner Bob",
    baseAPM: 45,
    baseDodgeRatio: 0.3,
    improvement: 0.02, // Improves slowly
    variance: 0.15,
  },
  intermediate: {
    name: "Intermediate Ian",
    baseAPM: 85,
    baseDodgeRatio: 0.6,
    improvement: 0.015,
    variance: 0.1,
  },
  expert: {
    name: "Expert Emma",
    baseAPM: 140,
    baseDodgeRatio: 0.85,
    improvement: 0.005, // Already skilled
    variance: 0.05,
  },
  inconsistent: {
    name: "Inconsistent Jack",
    baseAPM: 100,
    baseDodgeRatio: 0.5,
    improvement: 0.01,
    variance: 0.25, // High variance
  },
};

class GameSimulator {
  constructor(playerProfile) {
    this.profile = playerProfile;
    this.sessionId = null;
    this.currentRound = 1;
    this.sessionLog = [];
  }

  // Simulate realistic player metrics that evolve over time
  generateMetrics(round) {
    const { baseAPM, baseDodgeRatio, improvement, variance } = this.profile;

    // Player improves over time
    const skillProgress = 1 + improvement * round;

    // Add random variance to make it realistic
    const apmVariance = (Math.random() - 0.5) * variance * baseAPM;
    const dodgeVariance = (Math.random() - 0.5) * variance;

    // Calculate current metrics
    const apm = Math.max(10, Math.round(baseAPM * skillProgress + apmVariance));
    const dodgeRatio = Math.max(
      0.1,
      Math.min(0.95, baseDodgeRatio * skillProgress + dodgeVariance)
    );

    // Generate additional realistic metrics
    const distanceTraveled = Math.round(500 + apm * 8 + Math.random() * 300);
    const reactionTime = Math.max(
      0.1,
      0.5 - dodgeRatio * 0.3 + Math.random() * 0.2
    );
    const damageDealt = Math.round(
      50 + round * 20 + apm * 0.5 + Math.random() * 30
    );

    return {
      apm: Math.round(apm),
      dodgeRatio: Number(dodgeRatio.toFixed(3)),
      round,
      distanceTraveled,
      reactionTime: Number(reactionTime.toFixed(2)),
      damageDealt,
      timeSurvived: 30, // Always 30 seconds per round
    };
  }

  async startGame() {
    console.log(`🎮 Starting game simulation for: ${this.profile.name}`);
    console.log(
      `📊 Base stats: ${this.profile.baseAPM} APM, ${Math.round(
        this.profile.baseDodgeRatio * 100
      )}% dodge rate\n`
    );

    try {
      const response = await fetch(`${API_BASE}/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: `sim-${this.profile.name
            .toLowerCase()
            .replace(" ", "-")}-${Date.now()}`,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error("Failed to start game: " + data.error);
      }

      this.sessionId = data.sessionId;
      console.log(`✅ Game started! Session: ${this.sessionId}`);
      console.log(`⚙️  Initial config:`, data.config);

      this.sessionLog.push({
        round: 0,
        action: "start",
        config: data.config,
        llm_used: false,
      });

      return data;
    } catch (error) {
      console.error("❌ Failed to start game:", error.message);
      throw error;
    }
  }

  async simulateRound() {
    if (!this.sessionId) {
      throw new Error("Game not started");
    }

    console.log(`\n🎯 Round ${this.currentRound} - ${this.profile.name}`);

    // Generate realistic metrics for this round
    const metrics = this.generateMetrics(this.currentRound);

    console.log(`📈 Player performance:`);
    console.log(
      `   APM: ${metrics.apm} (${
        metrics.apm > 100
          ? "🔥 High"
          : metrics.apm > 60
          ? "📊 Medium"
          : "📉 Low"
      })`
    );
    console.log(
      `   Dodge: ${Math.round(metrics.dodgeRatio * 100)}% (${
        metrics.dodgeRatio > 0.7
          ? "🛡️ Excellent"
          : metrics.dodgeRatio > 0.5
          ? "⚔️ Good"
          : "💥 Struggling"
      })`
    );
    console.log(`   Distance: ${metrics.distanceTraveled} units`);
    console.log(`   Reaction: ${metrics.reactionTime}s`);
    console.log(`   Damage: ${metrics.damageDealt}`);

    try {
      // Send metrics to API (this will trigger LLM)
      console.log(`🤖 Calling LLM for difficulty adjustment...`);
      const startTime = Date.now();

      const response = await fetch(
        `${API_BASE}/game/${this.sessionId}/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metrics),
        }
      );

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      if (!data.success) {
        throw new Error("Failed to update game: " + data.error);
      }

      console.log(
        `⚡ API response time: ${responseTime}ms (Expected: ~15s for LLM)`
      );
      console.log(
        `🤖 LLM used: ${data.llm_used ? "✅ Yes" : "❌ No (fallback)"}`
      );

      if (data.error) {
        console.log(`⚠️  Warning: ${data.error}`);
      }

      // Show LLM interaction details if available
      if (data.llm_used && data.prompt) {
        console.log(`\n📝 LLM PROMPT (key sections):`);
        console.log(`${"-".repeat(40)}`);
        // Show relevant prompt sections
        const promptLines = data.prompt.split("\n");
        const keyLines = promptLines.filter(
          (line) =>
            line.includes("Actions Per Minute:") ||
            line.includes("Dodge Success Rate:") ||
            line.includes("Skill Level:") ||
            line.includes("- Terrain:") ||
            line.includes("TASK:")
        );
        console.log(keyLines.slice(0, 8).join("\n"));
        console.log(`${"-".repeat(40)}`);
      }

      if (data.llm_used && data.llmResponse) {
        console.log(`\n🤖 LLM RESPONSE:`);
        console.log(`${"-".repeat(40)}`);
        console.log(data.llmResponse);
        console.log(`${"-".repeat(40)}`);
      }

      // Helper function for terrain descriptions
      const getTerrainDescription = (terrain) => {
        const descriptions = {
          smooth: "fast movement, less control (slips)",
          sticky: "slow movement, hard to escape",
          rugged: "normal control, balanced",
        };
        return descriptions[terrain] || "unknown";
      };

      console.log(`\n⚙️  New config:`);
      console.log(
        `   Terrain: ${data.config.terrain.type} (${getTerrainDescription(
          data.config.terrain.type
        )})`
      );
      console.log(`   Boss Speed: ${data.config.boss.speed}/100`);
      console.log(`   Boss Health: ${data.config.boss.health} HP`);
      console.log(`   Boss Damage: ${data.config.boss.damage}`);
      console.log(`   Boss Shield: ${data.config.boss.shield}`);

      // Log this round
      this.sessionLog.push({
        round: this.currentRound,
        action: "update",
        metrics,
        config: data.config,
        llm_used: data.llm_used,
        response_time: responseTime,
        error: data.error,
      });

      this.currentRound++;
      return data;
    } catch (error) {
      console.error(`❌ Round ${this.currentRound} failed:`, error.message);
      throw error;
    }
  }

  async endGame() {
    if (!this.sessionId) return;

    console.log(`\n🏁 Ending game session...`);

    try {
      const response = await fetch(`${API_BASE}/game/${this.sessionId}/end`, {
        method: "POST",
      });

      const data = await response.json();
      console.log(`✅ ${data.message}`);

      // Print session summary
      this.printSessionSummary();
    } catch (error) {
      console.error("❌ Failed to end game:", error.message);
    }
  }

  printSessionSummary() {
    console.log(`\n📊 SESSION SUMMARY - ${this.profile.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎮 Total rounds: ${this.currentRound - 1}`);

    const llmCalls = this.sessionLog.filter(
      (log) => log.llm_used === true
    ).length;
    const fallbacks = this.sessionLog.filter(
      (log) => log.llm_used === false && log.action === "update"
    ).length;

    console.log(`🤖 LLM calls successful: ${llmCalls}`);
    console.log(`🔄 Fallback configs: ${fallbacks}`);

    if (llmCalls > 0) {
      const avgResponseTime =
        this.sessionLog
          .filter((log) => log.response_time)
          .reduce((sum, log) => sum + log.response_time, 0) / llmCalls;
      console.log(
        `⚡ Average LLM response time: ${Math.round(avgResponseTime)}ms`
      );
    }

    // Show progression
    const updateLogs = this.sessionLog.filter((log) => log.action === "update");
    if (updateLogs.length > 1) {
      const firstRound = updateLogs[0];
      const lastRound = updateLogs[updateLogs.length - 1];

      console.log(`\n📈 Player progression:`);
      console.log(
        `   APM: ${firstRound.metrics.apm} → ${lastRound.metrics.apm} (${
          lastRound.metrics.apm > firstRound.metrics.apm ? "📈" : "📉"
        })`
      );
      console.log(
        `   Dodge: ${Math.round(
          firstRound.metrics.dodgeRatio * 100
        )}% → ${Math.round(lastRound.metrics.dodgeRatio * 100)}% (${
          lastRound.metrics.dodgeRatio > firstRound.metrics.dodgeRatio
            ? "📈"
            : "📉"
        })`
      );

      console.log(`\n⚙️  Difficulty progression:`);
      console.log(
        `   Boss Speed: ${firstRound.config.boss.speed} → ${lastRound.config.boss.speed}`
      );
      console.log(
        `   Boss Health: ${firstRound.config.boss.health} → ${lastRound.config.boss.health}`
      );
      console.log(
        `   Terrain: ${firstRound.config.terrain.type} → ${lastRound.config.terrain.type}`
      );
    }
  }
}

// Simulation scenarios
async function runSinglePlayerSimulation(profileName, rounds = 5) {
  const profile = PLAYER_PROFILES[profileName];
  if (!profile) {
    console.error(`❌ Profile '${profileName}' not found`);
    return;
  }

  const simulator = new GameSimulator(profile);

  try {
    await simulator.startGame();

    // Simulate multiple rounds
    for (let i = 0; i < rounds; i++) {
      await simulator.simulateRound();

      // Wait a bit between rounds (optional)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await simulator.endGame();
  } catch (error) {
    console.error("❌ Simulation failed:", error.message);
  }
}

async function runComparisonSimulation() {
  console.log(
    "🏆 Running comparison simulation with different player types...\n"
  );

  const profiles = ["beginner", "intermediate", "expert", "inconsistent"];

  for (const profileName of profiles) {
    console.log(`\n${"=".repeat(60)}`);
    await runSinglePlayerSimulation(profileName, 3);
    console.log(`${"=".repeat(60)}\n`);

    // Pause between players
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// Main execution
async function main() {
  console.log("🎮 0G Game API Simulator\n");

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage:");
    console.log("  node simulate-game.js <profile> [rounds]");
    console.log("  node simulate-game.js comparison");
    console.log("");
    console.log("Available profiles:", Object.keys(PLAYER_PROFILES).join(", "));
    console.log("");
    console.log("Examples:");
    console.log("  node simulate-game.js beginner 3");
    console.log("  node simulate-game.js expert 5");
    console.log("  node simulate-game.js comparison");
    return;
  }

  if (args[0] === "comparison") {
    await runComparisonSimulation();
  } else {
    const profile = args[0];
    const rounds = parseInt(args[1]) || 5;
    await runSinglePlayerSimulation(profile, rounds);
  }
}

main().catch(console.error);
