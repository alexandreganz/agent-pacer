/**
 * ConfidenceScorer - Scores data quality and confidence for autonomous decisions.
 *
 * Mirrors the Python ConfidenceScorer from lego-genai.
 * Confidence = 30% metadata match + 30% name similarity + 20% data freshness + 20% spend consistency
 */

export class ConfidenceScorer {
  constructor(options = {}) {
    this.metadataWeight = options.metadataWeight || 0.3;
    this.nameSimilarityWeight = options.nameSimilarityWeight || 0.3;
    this.freshnessWeight = options.freshnessWeight || 0.2;
    this.spendConsistencyWeight = options.spendConsistencyWeight || 0.2;
    this.confidenceThreshold = options.confidenceThreshold || 0.7;
    this.requiredFields = options.requiredFields || ['market', 'product', 'startDate', 'endDate'];
  }

  /**
   * Calculate Levenshtein distance between two strings.
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Calculate name similarity score between platform and tracker names.
   * @param {string} platformName - Name from platform API
   * @param {string} trackerName - Name from internal tracker
   * @returns {number} Similarity score (0-1)
   */
  calculateNameSimilarity(platformName, trackerName) {
    if (!platformName || !trackerName) return 0;

    const name1 = platformName.toLowerCase().trim();
    const name2 = trackerName.toLowerCase().trim();

    if (name1 === name2) return 1.0;

    const maxLen = Math.max(name1.length, name2.length);
    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(name1, name2);
    return Math.max(0, 1 - (distance / maxLen));
  }

  /**
   * Calculate metadata match score.
   * @param {Object} platformMetadata - Metadata from platform
   * @param {Object} trackerMetadata - Metadata from tracker
   * @returns {Object} Match score and details
   */
  calculateMetadataMatch(platformMetadata, trackerMetadata) {
    if (!platformMetadata || !trackerMetadata) {
      return { score: 0, matchedFields: [], missingFields: this.requiredFields };
    }

    const matchedFields = [];
    const mismatchedFields = [];
    const missingFields = [];

    for (const field of this.requiredFields) {
      const platformValue = platformMetadata[field];
      const trackerValue = trackerMetadata[field];

      if (platformValue === undefined || trackerValue === undefined) {
        missingFields.push(field);
      } else if (platformValue === trackerValue) {
        matchedFields.push(field);
      } else {
        mismatchedFields.push({ field, platform: platformValue, tracker: trackerValue });
      }
    }

    const totalFields = this.requiredFields.length;
    const score = totalFields > 0 ? matchedFields.length / totalFields : 0;

    return {
      score,
      matchedFields,
      mismatchedFields,
      missingFields,
    };
  }

  /**
   * Calculate data freshness score.
   * @param {Date|string} platformTimestamp - When platform data was fetched
   * @param {Date|string} trackerTimestamp - When tracker data was updated
   * @returns {number} Freshness score (0-1)
   */
  calculateFreshness(platformTimestamp, trackerTimestamp) {
    const now = new Date();
    const platform = new Date(platformTimestamp);
    const tracker = new Date(trackerTimestamp);

    // Hours since data was fetched
    const platformAgeHours = (now - platform) / (1000 * 60 * 60);
    const trackerAgeHours = (now - tracker) / (1000 * 60 * 60);

    // Score based on age (1.0 if <1h, 0.5 if <6h, 0.2 if <24h, 0 if older)
    const scoreAge = (hours) => {
      if (hours < 1) return 1.0;
      if (hours < 6) return 0.8;
      if (hours < 12) return 0.6;
      if (hours < 24) return 0.4;
      return 0.2;
    };

    // Average of both sources
    return (scoreAge(platformAgeHours) + scoreAge(trackerAgeHours)) / 2;
  }

  /**
   * Calculate spend consistency score between platform and tracker.
   * Large discrepancies severely penalize confidence.
   * @param {number} platformSpend - Spend reported by platform API
   * @param {number} trackerSpend - Spend recorded in internal tracker
   * @returns {Object} Consistency score and details
   */
  calculateSpendConsistency(platformSpend, trackerSpend) {
    if (platformSpend == null || trackerSpend == null) {
      return { score: 1.0, discrepancyPct: 0, hasDiscrepancy: false };
    }

    const maxSpend = Math.max(platformSpend, trackerSpend);
    if (maxSpend === 0) {
      return { score: 1.0, discrepancyPct: 0, hasDiscrepancy: false };
    }

    const difference = Math.abs(platformSpend - trackerSpend);
    const discrepancyPct = (difference / maxSpend) * 100;

    // Score: 1.0 if <5% discrepancy, drops steeply after that
    let score;
    if (discrepancyPct < 5) {
      score = 1.0;
    } else if (discrepancyPct < 10) {
      score = 0.6;
    } else if (discrepancyPct < 20) {
      score = 0.3;
    } else {
      score = 0.1; // Severe discrepancy
    }

    return {
      score,
      discrepancyPct: Math.round(discrepancyPct * 10) / 10,
      hasDiscrepancy: discrepancyPct >= 10,
      platformSpend,
      trackerSpend,
      difference,
    };
  }

  /**
   * Calculate overall confidence score for a campaign.
   * @param {Object} params - Scoring parameters
   * @returns {Object} Confidence score with breakdown
   */
  scoreConfidence(params) {
    const {
      platformName,
      trackerName,
      platformMetadata,
      trackerMetadata,
      platformTimestamp,
      trackerTimestamp,
      platformSpend,
      trackerSpend,
    } = params;

    // Calculate component scores
    const nameSimilarity = this.calculateNameSimilarity(platformName, trackerName);
    const metadataMatch = this.calculateMetadataMatch(platformMetadata, trackerMetadata);
    const freshness = this.calculateFreshness(platformTimestamp, trackerTimestamp);
    const spendConsistency = this.calculateSpendConsistency(platformSpend, trackerSpend);

    // Weighted average
    const rawScore =
      (metadataMatch.score * this.metadataWeight) +
      (nameSimilarity * this.nameSimilarityWeight) +
      (freshness * this.freshnessWeight) +
      (spendConsistency.score * this.spendConsistencyWeight);

    // Circuit breaker: if ANY dimension is critically low, cap confidence
    // This prevents a single bad signal from being diluted by good ones
    const hasCriticalIssue =
      metadataMatch.score < 0.7 ||
      nameSimilarity < 0.7 ||
      freshness < 0.4 ||
      spendConsistency.score < 0.5;

    const overallScore = hasCriticalIssue ? Math.min(rawScore, 0.6) : rawScore;

    // Determine if confidence is sufficient for autonomous action
    const isHighConfidence = overallScore >= this.confidenceThreshold;

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      isHighConfidence,
      threshold: this.confidenceThreshold,
      hasSpendDiscrepancy: spendConsistency.hasDiscrepancy,
      breakdown: {
        metadataMatch: {
          score: Math.round(metadataMatch.score * 100) / 100,
          weight: this.metadataWeight,
          weighted: Math.round(metadataMatch.score * this.metadataWeight * 100) / 100,
          details: metadataMatch,
        },
        nameSimilarity: {
          score: Math.round(nameSimilarity * 100) / 100,
          weight: this.nameSimilarityWeight,
          weighted: Math.round(nameSimilarity * this.nameSimilarityWeight * 100) / 100,
          platformName,
          trackerName,
        },
        freshness: {
          score: Math.round(freshness * 100) / 100,
          weight: this.freshnessWeight,
          weighted: Math.round(freshness * this.freshnessWeight * 100) / 100,
          platformAgeHours: Math.round(((new Date()) - new Date(platformTimestamp)) / (1000 * 60 * 60) * 10) / 10,
          trackerAgeHours: Math.round(((new Date()) - new Date(trackerTimestamp)) / (1000 * 60 * 60) * 10) / 10,
        },
        spendConsistency: {
          score: Math.round(spendConsistency.score * 100) / 100,
          weight: this.spendConsistencyWeight,
          weighted: Math.round(spendConsistency.score * this.spendConsistencyWeight * 100) / 100,
          details: spendConsistency,
        },
      },
    };
  }
}

export default ConfidenceScorer;
