// Quick test to verify LLM integration is working

const API_BASE = "http://localhost:4000/api";

async function quickLLMTest() {
  console.log("🧪 Quick LLM Integration Test\n");

  try {
    // 1. Start a game
    console.log("1️⃣  Starting game...");
    const startResponse = await fetch(`${API_BASE}/game/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: "llm-test-player",
      }),
    });

    const gameData = await startResponse.json();
    if (!gameData.success) {
      throw new Error("Failed to start game");
    }

    console.log("✅ Game started");
    console.log("Initial config:", gameData.config);

    const sessionId = gameData.sessionId;

    // 2. Test with different skill scenarios
    const testScenarios = [
      {
        name: "High Skill Player",
        metrics: {
          apm: 150,
          dodgeRatio: 0.9,
          round: 1,
          distanceTraveled: 1500,
          reactionTime: 0.15,
          damageDealt: 200,
        },
      },
      {
        name: "Low Skill Player",
        metrics: {
          apm: 40,
          dodgeRatio: 0.25,
          round: 2,
          distanceTraveled: 400,
          reactionTime: 0.6,
          damageDealt: 50,
        },
      },
      {
        name: "Medium Skill Player",
        metrics: {
          apm: 85,
          dodgeRatio: 0.65,
          round: 3,
          distanceTraveled: 900,
          reactionTime: 0.3,
          damageDealt: 120,
        },
      },
    ];

    for (const scenario of testScenarios) {
      console.log(`\n2️⃣  Testing: ${scenario.name}`);
      console.log(
        `   📊 APM: ${scenario.metrics.apm}, Dodge: ${Math.round(
          scenario.metrics.dodgeRatio * 100
        )}%`
      );

      const startTime = Date.now();

      const updateResponse = await fetch(
        `${API_BASE}/game/${sessionId}/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scenario.metrics),
        }
      );

      const updateData = await updateResponse.json();
      const responseTime = Date.now() - startTime;

      if (!updateData.success) {
        console.error(`   ❌ Failed: ${updateData.error}`);
        continue;
      }

      console.log(`   ⚡ Response time: ${responseTime}ms`);
      console.log(
        `   🤖 LLM used: ${updateData.llm_used ? "✅ YES" : "❌ NO"}`
      );

      if (updateData.error) {
        console.log(`   ⚠️  Warning: ${updateData.error}`);
      }

      // Show LLM interaction details
      if (updateData.llm_used && updateData.prompt) {
        console.log(`\n   📝 LLM PROMPT SENT:`);
        console.log(`   ${"-".repeat(50)}`);
        console.log(`   ${updateData.prompt.split("\n").join("\n   ")}`);
        console.log(`   ${"-".repeat(50)}`);
      }

      if (updateData.llm_used && updateData.llmResponse) {
        console.log(`\n   🤖 LLM RESPONSE RECEIVED:`);
        console.log(`   ${"-".repeat(50)}`);
        console.log(`   ${updateData.llmResponse.split("\n").join("\n   ")}`);
        console.log(`   ${"-".repeat(50)}`);
      }

      const config = updateData.config;
      console.log(`\n   ⚙️  FINAL CONFIG APPLIED:`);
      console.log(
        `      Terrain: ${config.terrain.type} (modifier: ${config.terrain.movementModifier})`
      );
      console.log(`      Boss Speed: ${config.boss.speed}/100`);
      console.log(`      Boss Health: ${config.boss.health} HP`);
      console.log(`      Boss Damage: ${config.boss.damage}`);
      console.log(`      Boss Shield: ${config.boss.shield}`);

      // Brief pause between tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 3. End game
    console.log("\n3️⃣  Ending game...");
    await fetch(`${API_BASE}/game/${sessionId}/end`, { method: "POST" });
    console.log("✅ Game ended");

    console.log("\n🎉 LLM integration test completed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

quickLLMTest();
