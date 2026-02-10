/**
 * PerformanceModifier - Adjusts agent decisions based on campaign performance metrics.
 *
 * Campaign metrics (ROAS, CTR, conversions) modify the severity classification
 * from VarianceAnalyzer. A profitable overspend is less urgent than a money-burning one.
 *
 * Three methods:
 *   assessPerformance()    — rates campaign as strong | normal | poor | fraud_signal
 *   modifySeverity()       — upgrades or downgrades variance severity based on rating
 *   calculateBidAdjustment() — performance-aware bid change percentages
 */

// Platform-specific CTR floors (below these = underperforming)
const PLATFORM_CTR_FLOORS = {
  google: 1.0,
  meta: 0.5,
  tiktok: 0.3,
  dv360: 0.05,
};

export class PerformanceModifier {
  /**
   * Assess campaign performance from its metrics.
   * @param {Object|null} metrics - Campaign metrics (impressions, clicks, ctr, conversions, roas, etc.)
   * @param {string} platform - Platform identifier (google, meta, tiktok, dv360)
   * @returns {Object} { rating, roas, signals, score }
   */
  assessPerformance(metrics, platform) {
    if (!metrics) {
      return { rating: 'normal', roas: null, signals: ['No metrics available'], score: 0.5 };
    }

    const { impressions = 0, conversions = 0, ctr = 0, roas = 0 } = metrics;
    const signals = [];

    // Fraud signal: massive impressions with near-zero conversions and tiny CTR
    if (impressions > 100000 && conversions <= 2 && ctr < 0.1) {
      signals.push(`Fraud pattern: ${impressions.toLocaleString()} impressions but only ${conversions} conversions (CTR ${ctr}%)`);
      return { rating: 'fraud_signal', roas, signals, score: 0 };
    }

    const ctrFloor = PLATFORM_CTR_FLOORS[platform] || 0.5;

    // Poor: losing money or underperforming
    if (roas < 1.0) {
      signals.push(`Negative ROAS: ${roas}x (spending more than earning)`);
      return { rating: 'poor', roas, signals, score: 0.2 };
    }
    if (ctr < ctrFloor && conversions < 5) {
      signals.push(`CTR ${ctr}% below ${platform} floor of ${ctrFloor}% with only ${conversions} conversions`);
      return { rating: 'poor', roas, signals, score: 0.25 };
    }

    // Strong: clearly profitable
    if (roas >= 3.0 && conversions >= 10) {
      signals.push(`Strong performer: ${roas}x ROAS with ${conversions} conversions`);
      return { rating: 'strong', roas, signals, score: 1.0 };
    }

    // Normal: everything else
    signals.push(`Normal performance: ${roas}x ROAS, ${conversions} conversions`);
    return { rating: 'normal', roas, signals, score: 0.5 };
  }

  /**
   * Modify variance severity based on performance rating.
   * @param {string} severity - Original severity from VarianceAnalyzer (healthy, warning, critical)
   * @param {string} direction - Spend direction (overspending, underspending, on_target)
   * @param {string} rating - Performance rating from assessPerformance
   * @returns {Object} { originalSeverity, adjustedSeverity, wasModified, reason }
   */
  modifySeverity(severity, direction, rating) {
    const result = {
      originalSeverity: severity,
      adjustedSeverity: severity,
      wasModified: false,
      reason: '',
    };

    // No modification for healthy pacing or normal performance
    if (severity === 'healthy' || rating === 'normal') {
      return result;
    }

    // Overspending modifications
    if (direction === 'overspending') {
      if (rating === 'fraud_signal') {
        result.adjustedSeverity = 'critical';
        result.wasModified = severity !== 'critical';
        result.reason = 'Fraud signal detected on overspending campaign — emergency auto-pause';
      } else if (severity === 'warning' && rating === 'poor') {
        result.adjustedSeverity = 'critical';
        result.wasModified = true;
        result.reason = 'Poor ROAS on overspending campaign — burning money on non-converting traffic';
      } else if (severity === 'warning' && rating === 'strong') {
        result.adjustedSeverity = 'healthy';
        result.wasModified = true;
        result.reason = 'Strong ROAS on overspending campaign — profitable spend, no throttling needed';
      } else if (severity === 'critical' && rating === 'strong') {
        result.adjustedSeverity = 'warning';
        result.wasModified = true;
        result.reason = 'Strong ROAS on critical overspend — pausing would destroy profitable revenue';
      }
    }

    // Underspending modifications
    if (direction === 'underspending') {
      if (rating === 'fraud_signal') {
        result.adjustedSeverity = 'critical';
        result.wasModified = severity !== 'critical';
        result.reason = 'Fraud signal on underspending campaign — invalid traffic consuming budget';
      } else if (severity === 'warning' && rating === 'strong') {
        result.adjustedSeverity = 'critical';
        result.wasModified = true;
        result.reason = 'Strong ROAS but underspending — missing profitable scale opportunity';
      } else if (severity === 'warning' && rating === 'poor') {
        result.adjustedSeverity = 'healthy';
        result.wasModified = true;
        result.reason = 'Poor ROAS and underspending — low spend on low-performing campaign is acceptable';
      } else if (severity === 'critical' && rating === 'poor') {
        result.adjustedSeverity = 'warning';
        result.wasModified = true;
        result.reason = 'Poor performance softens urgency of critical underspend';
      }
    }

    return result;
  }

  /**
   * Calculate performance-aware bid adjustment percentage.
   * @param {number} basePercent - Base bid change from agent (e.g. -10, 12, 15)
   * @param {string} rating - Performance rating
   * @param {string} direction - Spend direction
   * @returns {number} Adjusted bid change percentage
   */
  calculateBidAdjustment(basePercent, rating, direction) {
    if (rating === 'normal') return basePercent;

    // Fraud: zero out the bid — don't spend more on fraudulent traffic
    if (rating === 'fraud_signal') return 0;

    const multipliers = {
      overspending: { strong: 0.5, poor: 1.5 },
      underspending: { strong: 1.5, poor: 0.5 },
    };

    const mult = multipliers[direction]?.[rating] ?? 1.0;
    return Math.round(basePercent * mult);
  }
}

export default PerformanceModifier;
