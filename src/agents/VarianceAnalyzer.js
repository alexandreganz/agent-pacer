/**
 * VarianceAnalyzer - Calculates pacing variance and classifies severity.
 *
 * Mirrors the Python PacingAnalyzer from lego-genai.
 * Three-tier classification: healthy (<10%), warning (10-25%), critical (>25%)
 */

export class VarianceAnalyzer {
  constructor(options = {}) {
    this.healthyThreshold = options.healthyThreshold || 10.0;
    this.warningThreshold = options.warningThreshold || 25.0;
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

    // Calculate variance percentage
    const varianceAmount = actualSpend - targetSpend;
    const variancePct = (varianceAmount / targetSpend) * 100;
    const absVariance = Math.abs(variancePct);

    // Determine direction
    let direction = 'on_target';
    if (variancePct > 0) direction = 'overspending';
    else if (variancePct < 0) direction = 'underspending';

    // Classify severity
    let severity = 'healthy';
    if (absVariance > this.warningThreshold) {
      severity = 'critical';
    } else if (absVariance > this.healthyThreshold) {
      severity = 'warning';
    }

    return {
      variancePct: Math.round(variancePct * 10) / 10,
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

  /**
   * Analyze multiple campaigns and aggregate results.
   * @param {Array} campaigns - Array of campaign objects
   * @returns {Object} Aggregated analysis with individual results
   */
  analyzePortfolio(campaigns) {
    const results = campaigns.map(c => this.analyzeCampaign(c));

    const severityCounts = {
      healthy: 0,
      warning: 0,
      critical: 0,
    };

    results.forEach(r => {
      severityCounts[r.severity]++;
    });

    // Determine overall status (worst severity wins)
    let overallStatus = 'healthy';
    if (severityCounts.critical > 0) {
      overallStatus = 'critical';
    } else if (severityCounts.warning > 0) {
      overallStatus = 'warning';
    }

    const totalTarget = campaigns.reduce((sum, c) => sum + c.targetSpend, 0);
    const totalActual = campaigns.reduce((sum, c) => sum + c.actualSpend, 0);
    const overallVariance = this.calculateVariance(totalTarget, totalActual);

    return {
      campaigns: results,
      overallStatus,
      overallVariance,
      severityCounts,
      totalTarget,
      totalActual,
      campaignCount: campaigns.length,
    };
  }
}

export default VarianceAnalyzer;
