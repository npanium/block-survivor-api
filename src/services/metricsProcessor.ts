import { PlayerMetrics } from "../types/gameTypes";

export class MetricsProcessor {
  /**
   * Validate and normalize player metrics
   */
  static validateMetrics(rawMetrics: any): PlayerMetrics {
    const errors: string[] = [];

    // Validate required fields
    if (typeof rawMetrics.apm !== "number" || rawMetrics.apm < 0) {
      errors.push("APM must be a positive number");
    }

    if (
      typeof rawMetrics.dodgeRatio !== "number" ||
      rawMetrics.dodgeRatio < 0 ||
      rawMetrics.dodgeRatio > 1
    ) {
      errors.push("Dodge ratio must be between 0 and 1");
    }

    if (typeof rawMetrics.round !== "number" || rawMetrics.round < 1) {
      errors.push("Round must be a positive integer");
    }

    if (errors.length > 0) {
      throw new Error(`Invalid metrics: ${errors.join(", ")}`);
    }

    // Create validated metrics object
    const metrics: PlayerMetrics = {
      apm: Math.round(rawMetrics.apm),
      dodgeRatio: Number(rawMetrics.dodgeRatio.toFixed(3)), // Limit to 3 decimal places
      round: Math.round(rawMetrics.round),
    };

    // Add optional fields if present and valid
    if (
      typeof rawMetrics.distanceTraveled === "number" &&
      rawMetrics.distanceTraveled >= 0
    ) {
      metrics.distanceTraveled = Math.round(rawMetrics.distanceTraveled);
    }

    if (
      typeof rawMetrics.reactionTime === "number" &&
      rawMetrics.reactionTime >= 0
    ) {
      metrics.reactionTime = Number(rawMetrics.reactionTime.toFixed(3));
    }

    if (
      typeof rawMetrics.damageDealt === "number" &&
      rawMetrics.damageDealt >= 0
    ) {
      metrics.damageDealt = Math.round(rawMetrics.damageDealt);
    }

    if (
      typeof rawMetrics.timeSurvived === "number" &&
      rawMetrics.timeSurvived >= 0
    ) {
      metrics.timeSurvived = Number(rawMetrics.timeSurvived.toFixed(2));
    }

    return metrics;
  }

  /**
   * Calculate derived metrics for better LLM analysis
   */
  static calculateDerivedMetrics(metrics: PlayerMetrics): any {
    const derived: any = {
      ...metrics,
    };

    // Performance score (0-100)
    derived.performanceScore = this.calculatePerformanceScore(metrics);

    // Difficulty suggestion
    derived.suggestedDifficulty = this.suggestDifficulty(metrics);

    // Player type classification
    derived.playerType = this.classifyPlayer(metrics);

    return derived;
  }

  /**
   * Calculate overall performance score
   */
  private static calculatePerformanceScore(metrics: PlayerMetrics): number {
    const { apm, dodgeRatio, round } = metrics;

    // Normalize APM (assume 150 APM is excellent)
    const normalizedAPM = Math.min(apm / 150, 1);

    // Dodge ratio is already normalized (0-1)
    const normalizedDodge = dodgeRatio;

    // Round progression bonus (slight bonus for surviving longer)
    const roundBonus = Math.min(round / 20, 0.2); // Max 20% bonus at round 20+

    // Weighted score
    const score =
      (normalizedAPM * 0.4 + normalizedDodge * 0.5 + roundBonus * 0.1) * 100;

    return Math.round(score);
  }

  /**
   * Suggest difficulty adjustment
   */
  private static suggestDifficulty(
    metrics: PlayerMetrics
  ): "increase" | "maintain" | "decrease" {
    const score = this.calculatePerformanceScore(metrics);

    if (score > 75) return "increase";
    if (score < 40) return "decrease";
    return "maintain";
  }

  /**
   * Classify player type for personalized adjustments
   */
  private static classifyPlayer(metrics: PlayerMetrics): string {
    const { apm, dodgeRatio } = metrics;

    if (apm > 120 && dodgeRatio > 0.8) return "expert_aggressive";
    if (apm < 60 && dodgeRatio > 0.8) return "expert_defensive";
    if (apm > 120 && dodgeRatio < 0.5) return "aggressive_risky";
    if (apm < 60 && dodgeRatio < 0.5) return "beginner";

    return "intermediate";
  }

  /**
   * Sanitize metrics for logging (remove sensitive data if any)
   */
  static sanitizeForLogging(metrics: PlayerMetrics): any {
    return {
      ...metrics,
      // Add any sanitization logic here if needed
      timestamp: Date.now(),
    };
  }
}
