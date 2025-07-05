const API_BASE = "http://localhost:4000/api";

async function testAPI() {
  console.log("🧪 Testing 0G Game API...\n");

  try {
    // Test 1: Health check
    console.log("1️⃣  Testing health endpoint...");
    const healthResponse = await fetch(`${API_BASE}/game/health`);
    const health = await healthResponse.json();
    console.log("✅ Health:", health.status);
    console.log("📊 Active sessions:", health.activeSessions);

    // Test 2: Start game
    console.log("\n2️⃣  Starting new game...");
    const startResponse = await fetch(`${API_BASE}/game/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: "test-player-123",
      }),
    });

    const gameStart = await startResponse.json();
    if (!gameStart.success) {
      throw new Error("Failed to start game: " + gameStart.error);
    }

    console.log("✅ Game started!");
    console.log("🎮 Session ID:", gameStart.sessionId);
    console.log("⚙️  Initial config:", gameStart.config);

    const sessionId = gameStart.sessionId;

    // Test 3: Get config
    console.log("\n3️⃣  Getting current config...");
    const configResponse = await fetch(`${API_BASE}/game/${sessionId}/config`);
    const configData = await configResponse.json();
    console.log("✅ Config retrieved:", configData.config);

    // Test 4: Update with metrics (this will call LLM)
    console.log("\n4️⃣  Sending player metrics (this will test LLM)...");
    const updateResponse = await fetch(`${API_BASE}/game/${sessionId}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apm: 85, // Medium actions per minute
        dodgeRatio: 0.6, // 60% dodge success
        round: 2, // Round 2
        distanceTraveled: 800,
        reactionTime: 0.3,
        damageDealt: 150,
      }),
    });

    const updateData = await updateResponse.json();
    if (!updateData.success) {
      throw new Error("Failed to update game: " + updateData.error);
    }

    console.log("✅ Game updated!");
    console.log("🤖 LLM used:", updateData.llm_used);
    console.log("⚙️  New config:", updateData.config);
    if (updateData.error) {
      console.log("⚠️  Warning:", updateData.error);
    }

    // Test 5: Get stats
    console.log("\n5️⃣  Getting session stats...");
    const statsResponse = await fetch(`${API_BASE}/game/${sessionId}/stats`);
    const stats = await statsResponse.json();
    console.log("✅ Session stats:", stats.stats);

    // Test 6: End game
    console.log("\n6️⃣  Ending game session...");
    const endResponse = await fetch(`${API_BASE}/game/${sessionId}/end`, {
      method: "POST",
    });
    const endData = await endResponse.json();
    console.log("✅ Game ended:", endData.message);

    console.log("\n🎉 All tests passed! Your API is working correctly.");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run tests
testAPI();
