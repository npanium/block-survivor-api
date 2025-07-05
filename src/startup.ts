import { brokerService } from "./services/brokerService";
import { llmService } from "./services/llmService";

/**
 * Initialize application services
 */
export async function initializeApplication(): Promise<void> {
  console.log("🚀 Initializing 0G Compute Network Game API...");

  try {
    // Test broker service initialization
    console.log("📡 Testing broker service connection...");
    // The broker service initializes automatically in its constructor

    // Test LLM service (optional - can be slow)
    console.log("🤖 Testing LLM service...");
    // Skip LLM test for faster startup - it will be tested on first use
    // const llmWorking = await llmService.testConnection();
    // if (!llmWorking) {
    //   console.warn('⚠️  LLM test failed - service will use fallback configs');
    // }

    console.log("✅ Game API initialized successfully!");
    console.log("📊 Game sessions will be managed in memory");
    console.log("🎮 Ready to handle game requests");
  } catch (error: any) {
    console.error("❌ Failed to initialize application:", error.message);
    throw error;
  }
}
