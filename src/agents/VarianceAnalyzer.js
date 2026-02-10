/**
 * VarianceAnalyzer - Calculates pacing variance and classifies severity.
 *
 * Three-tier classification with dynamic critical threshold:
 *   - Healthy: <10%
 *   - Warning: 10% to critical threshold
 *   - Critical: above critical threshold (50% business hours, 30% off-hours)
 *
 * Critical always means the agent should auto-pause. The off-hours protocol
 * lowers the critical threshold so the agent acts sooner when no humans are available.
 */

export class VarianceAnalyzer {
  constructor(options = {}) {
    this.healthyThreshold = options.healthyThreshold || 10.0;
    this.criticalThreshold = options.criticalThreshold || 50.0;
  }

  /**
   * Calculate variance between target and actual spend.
   * @param {number} targetSpend - Expected spend amount
   * @param {number} actualSpend - Actual spend amount
   * @returns {Object} Variance analysis result
   */
  calculateVariance(targetSpend, actualSpend) {
    // Handle edge cases
    if (targetSpend === 0 && actualSpend === 0) {
      return {
        variancePct: 0,
        varianceAmount: 0,
        direction: 'on_target',
        severity: 'healthy',
        isZeroDelivery: false,
      };
    }

    // Zero delivery is always critical
    if (actualSpend === 0 && targetSpend > 0) {
      return {
        variancePct: -100,
        varianceAmount: targetSpend,
        direction: 'underspending',
        severity: 'critical',
        isZeroDelivery: true,
      };
    }

    // Calculate variance percentage (round first, then derive direction)
    const varianceAmount = actualSpend - targetSpend;
    const rawVariancePct = (varianceAmount / targetSpend) * 100;
    const variancePct = Math.round(rawVariancePct * 10) / 10;
    const absVariance = Math.abs(variancePct);

    // Determine direction from rounded value
    let direction = 'on_target';
    if (variancePct > 0) direction = 'overspending';
    else if (variancePct < 0) direction = 'underspending';

    // Classify severity
    let severity = 'healthy';
    if (absVariance > this.criticalThreshold) {
      severity = 'critical';
    } else if (absVariance > this.healthyThreshold) {
      severity = 'warning';
    }

    return {
      variancePct,
      varianceAmount: Math.round(varianceAmount * 100) / 100,
      direction,
      severity,
      isZeroDelivery: false,
    };
  }

  /**
   * Analyze a full campaign and return comprehensive results.
   * @param {Object} campaign - Campaign data with platform and tracker spend
   * @returns {Object} Full analysis result
   */
  analyzeCampaign(campaign) {
    const variance = this.calculateVariance(
      campaign.targetSpend,
      campaign.actualSpend
    );

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      platform: campaign.platform,
      targetSpend: campaign.targetSpend,
      actualSpend: campaign.actualSpend,
      ...variance,
      timestamp: new Date().toISOString(),
    };
  }

}

export default VarianceAnalyzer;
