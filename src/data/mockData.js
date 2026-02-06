/**
 * Dynamic Mock Data Generators for AI Pacing Agent scenarios.
 *
 * Each scenario has multiple variations that are randomly selected,
 * providing different experiences while staying within the scenario's theme.
 */

/**
 * Campaign templates with LEGO brand context
 */
const campaignTemplates = [
  { name: 'LEGO Star Wars - Search', platform: 'google', baseBudget: 10000 },
  { name: 'LEGO City - Display', platform: 'google', baseBudget: 5000 },
  { name: 'LEGO Icons - Instagram', platform: 'meta', baseBudget: 7500 },
  { name: 'LEGO Technic - Facebook', platform: 'meta', baseBudget: 5000 },
  { name: 'LEGO Friends - TikTok', platform: 'tiktok', baseBudget: 3000 },
  { name: 'LEGO Ninjago - TikTok', platform: 'tiktok', baseBudget: 2000 },
  { name: 'LEGO Brand - Programmatic', platform: 'dv360', baseBudget: 15000 },
  { name: 'LEGO Duplo - YouTube', platform: 'google', baseBudget: 8000 },
  { name: 'LEGO Creator - Reels', platform: 'meta', baseBudget: 4000 },
  { name: 'LEGO Speed Champions - Display', platform: 'dv360', baseBudget: 6000 },
];

/**
 * Random utilities
 */
const random = {
  between: (min, max) => min + Math.random() * (max - min),
  int: (min, max) => Math.floor(min + Math.random() * (max - min + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  pickN: (arr, n) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  },
  chance: (pct) => Math.random() < pct,
};

/**
 * Generate metadata for a campaign
 */
function generateMetadata(campaignName, corrupt = false) {
  const markets = ['US', 'UK', 'DE', 'FR', 'DK', 'JP', 'AU'];
  const products = ['Search', 'Display', 'Social', 'Video', 'Programmatic'];

  let product = 'Display';
  if (campaignName.includes('Search')) product = 'Search';
  else if (campaignName.includes('Instagram') || campaignName.includes('Facebook') || campaignName.includes('Reels')) product = 'Social';
  else if (campaignName.includes('TikTok') || campaignName.includes('YouTube')) product = 'Video';
  else if (campaignName.includes('Programmatic')) product = 'Programmatic';

  const metadata = {
    market: random.pick(markets),
    product,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  };

  if (corrupt) {
    // Corrupt at least 2 fields to guarantee metadataMatch.score < 0.7 (< 3/4 = 0.75)
    const corruptionType = random.pick(['market+product', 'market+dates', 'product+dates', 'all']);
    if (corruptionType.includes('market') || corruptionType === 'all') {
      metadata.market = random.pick(['UNKNOWN', 'N/A', '', 'XX']);
    }
    if (corruptionType.includes('product') || corruptionType === 'all') {
      metadata.product = random.pick(['UNKNOWN', 'Other', '']);
    }
    if (corruptionType.includes('dates') || corruptionType === 'all') {
      metadata.startDate = '';
      metadata.endDate = '';
    }
  }

  return metadata;
}

/**
 * Generate realistic media buying metrics for a campaign.
 * @param {Object} campaign - Campaign object with platform and spend
 * @param {boolean} isProblematic - If true, generates anomalous metrics (fraud signal)
 */
function generateMetrics(campaign, isProblematic = false) {
  const platform = campaign.platform;
  const spend = campaign.spend || campaign.baseBudget;

  // Platform-specific baseline ranges
  const platformRanges = {
    google: { ctrMin: 2.0, ctrMax: 6.0, cpmMin: 3, cpmMax: 12 },    // Search has higher CTR
    meta: { ctrMin: 0.8, ctrMax: 2.5, cpmMin: 5, cpmMax: 15 },
    tiktok: { ctrMin: 0.5, ctrMax: 2.0, cpmMin: 4, cpmMax: 10 },
    dv360: { ctrMin: 0.1, ctrMax: 0.8, cpmMin: 2, cpmMax: 8 },       // Programmatic lower CTR
  };

  const ranges = platformRanges[platform] || platformRanges.google;

  if (isProblematic) {
    // Anomalous metrics: very high impressions, near-zero conversions, terrible ROAS
    const impressions = random.int(500000, 2000000);
    const clicks = random.int(50, 300); // Very low for the impression volume
    const ctr = parseFloat(((clicks / impressions) * 100).toFixed(3));
    const cpc = parseFloat((spend / Math.max(clicks, 1)).toFixed(2));
    const cpm = parseFloat(((spend / impressions) * 1000).toFixed(2));
    const conversions = random.int(0, 2);
    const revenue = conversions * random.between(5, 20);
    const roas = parseFloat((revenue / Math.max(spend, 1)).toFixed(2));

    return { impressions, clicks, ctr, cpc, cpm, conversions, revenue: Math.round(revenue), roas };
  }

  // Normal metrics
  const cpm = random.between(ranges.cpmMin, ranges.cpmMax);
  const impressions = Math.round((spend / cpm) * 1000);
  const ctr = random.between(ranges.ctrMin, ranges.ctrMax);
  const clicks = Math.round(impressions * (ctr / 100));
  const cpc = parseFloat((spend / Math.max(clicks, 1)).toFixed(2));
  const conversionRate = random.between(1.5, 5.0); // 1.5-5% conversion rate
  const conversions = Math.round(clicks * (conversionRate / 100));
  const avgOrderValue = random.between(25, 80);
  const revenue = Math.round(conversions * avgOrderValue);
  const roas = parseFloat((revenue / Math.max(spend, 1)).toFixed(2));

  return {
    impressions,
    clicks,
    ctr: parseFloat(ctr.toFixed(2)),
    cpc,
    cpm: parseFloat(cpm.toFixed(2)),
    conversions,
    revenue,
    roas,
  };
}

/**
 * Generate a corrupted campaign name variant
 */
function corruptName(name) {
  const corruptions = [
    () => name.split(' - ')[0] + '_OLD',  // Truncated + suffix
    () => name.replace(/[aeiou]/gi, '').slice(0, 10),  // Missing vowels + truncated
    () => `Campaign_${random.int(1000, 9999)}`,  // Generic ID
    () => name.split('').reverse().join('').slice(0, 15),  // Garbled
    () => `${name.split(' ')[0]}_${random.int(100, 999)}`,  // Partial + ID
    () => name.replace(/LEGO \w+/, 'TEST_BRAND'),  // Brand replaced
  ];
  return random.pick(corruptions)();
}

/**
 * Build campaign data from templates
 */
function buildCampaigns(templates, now) {
  return templates.map((template, index) => ({
    id: `${template.platform}_${String(index + 1).padStart(3, '0')}`,
    name: template.name,
    platform: template.platform,
    baseBudget: template.baseBudget,
    spend: template.baseBudget,
    metrics: null,
    metadata: generateMetadata(template.name),
    timestamp: now,
  }));
}

// ============================================================================
// SCENARIO A: HEALTHY - Multiple Variations
// ============================================================================

const scenarioAVariations = [
  // Variation 1: All campaigns perfectly on target
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(5, 7));
    const campaigns = buildCampaigns(templates, now);

    campaigns.forEach(c => {
      const variance = random.between(-3, 3);
      c.spend = Math.round(c.baseBudget * (1 + variance / 100));
      c.metrics = generateMetrics(c);
    });

    return {
      variation: 'Perfect Pacing',
      description: 'All campaigns within ±3% variance',
      campaigns,
    };
  },

  // Variation 2: Mixed but all healthy
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(6, 8));
    const campaigns = buildCampaigns(templates, now);

    campaigns.forEach(c => {
      // Some slightly over, some slightly under
      const variance = random.between(-8, 8);
      c.spend = Math.round(c.baseBudget * (1 + variance / 100));
      c.metrics = generateMetrics(c);
    });

    return {
      variation: 'Balanced Portfolio',
      description: 'Mix of slight over/under pacing, all within thresholds',
      campaigns,
    };
  },

  // Variation 3: High performers
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(4, 6));
    const campaigns = buildCampaigns(templates, now);

    campaigns.forEach(c => {
      // Slightly overspending but still healthy
      const variance = random.between(2, 9);
      c.spend = Math.round(c.baseBudget * (1 + variance / 100));
      c.metrics = generateMetrics(c);
    });

    return {
      variation: 'Strong Delivery',
      description: 'All campaigns delivering slightly above target',
      campaigns,
    };
  },
];

// ============================================================================
// SCENARIO B: DATA MISMATCH / LOW CONFIDENCE - Multiple Variations
// ============================================================================

const scenarioBVariations = [
  // Variation 1: Spend discrepancy
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(5, 6));
    const campaigns = buildCampaigns(templates, now);

    // Pick 1-2 campaigns to have spend discrepancy
    const problemCount = random.int(1, 2);
    const problemIndices = random.pickN([...Array(campaigns.length).keys()], problemCount);

    problemIndices.forEach(idx => {
      campaigns[idx].discrepancy = {
        type: 'spend',
        apiSpend: campaigns[idx].baseBudget + random.int(2000, 5000),
        trackerSpend: campaigns[idx].baseBudget - random.int(500, 1500),
      };
      campaigns[idx].spend = campaigns[idx].discrepancy.apiSpend;
    });

    // Make other campaigns healthy
    campaigns.forEach((c, idx) => {
      if (!problemIndices.includes(idx)) {
        c.spend = Math.round(c.baseBudget * (1 + random.between(-5, 5) / 100));
      }
      c.metrics = generateMetrics(c);
    });

    return {
      variation: 'Spend Discrepancy',
      description: `$${problemIndices.map(i => campaigns[i].discrepancy.apiSpend - campaigns[i].discrepancy.trackerSpend).reduce((a,b) => a+b, 0).toLocaleString()} mismatch between API and tracker`,
      campaigns,
      problemIndices,
    };
  },

  // Variation 2: Name mismatch
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(5, 7));
    const campaigns = buildCampaigns(templates, now);

    // Pick 2-3 campaigns to have name issues
    const problemCount = random.int(2, 3);
    const problemIndices = random.pickN([...Array(campaigns.length).keys()], problemCount);

    problemIndices.forEach(idx => {
      campaigns[idx].nameMismatch = {
        apiName: campaigns[idx].name,
        trackerName: corruptName(campaigns[idx].name),
      };
    });

    // All campaigns have healthy spend
    campaigns.forEach(c => {
      c.spend = Math.round(c.baseBudget * (1 + random.between(-5, 5) / 100));
      c.metrics = generateMetrics(c);
    });

    return {
      variation: 'Campaign Name Mismatch',
      description: `${problemCount} campaigns have mismatched names between systems`,
      campaigns,
      problemIndices,
    };
  },

  // Variation 3: Metadata corruption
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(5, 6));
    const campaigns = buildCampaigns(templates, now);

    // Pick 2-4 campaigns to have metadata issues
    const problemCount = random.int(2, 4);
    const problemIndices = random.pickN([...Array(campaigns.length).keys()], problemCount);

    problemIndices.forEach(idx => {
      campaigns[idx].corruptMetadata = generateMetadata(campaigns[idx].name, true);
      campaigns[idx].metadataIssue = true;
    });

    campaigns.forEach(c => {
      c.spend = Math.round(c.baseBudget * (1 + random.between(-5, 5) / 100));
      c.metrics = generateMetrics(c);
    });

    return {
      variation: 'Metadata Corruption',
      description: `${problemCount} campaigns have missing or invalid metadata fields`,
      campaigns,
      problemIndices,
    };
  },

  // Variation 4: Stale data
  () => {
    const now = new Date();
    const staleTime = new Date(now.getTime() - random.int(24, 72) * 60 * 60 * 1000);
    const templates = random.pickN(campaignTemplates, random.int(5, 6));
    const campaigns = buildCampaigns(templates, staleTime);

    // All data is stale
    campaigns.forEach(c => {
      c.spend = Math.round(c.baseBudget * (1 + random.between(-5, 5) / 100));
      c.staleData = true;
      c.dataAge = Math.round((now - staleTime) / (60 * 60 * 1000));
      c.metrics = generateMetrics(c);
    });

    return {
      variation: 'Stale Data',
      description: `Data is ${campaigns[0].dataAge}+ hours old, freshness score impacted`,
      campaigns,
      problemIndices: [...Array(campaigns.length).keys()],
    };
  },

  // Variation 5: Multiple issues combined
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(5, 6));
    const campaigns = buildCampaigns(templates, now);

    // Different issues on different campaigns
    campaigns[0].discrepancy = {
      type: 'spend',
      apiSpend: campaigns[0].baseBudget + random.int(2000, 4000),
      trackerSpend: campaigns[0].baseBudget,
    };
    campaigns[0].spend = campaigns[0].discrepancy.apiSpend;

    campaigns[1].nameMismatch = {
      apiName: campaigns[1].name,
      trackerName: corruptName(campaigns[1].name),
    };

    if (campaigns[2]) {
      campaigns[2].corruptMetadata = generateMetadata(campaigns[2].name, true);
      campaigns[2].metadataIssue = true;
    }

    campaigns.forEach((c, idx) => {
      if (idx > 2) {
        c.spend = Math.round(c.baseBudget * (1 + random.between(-5, 5) / 100));
      }
      c.metrics = generateMetrics(c);
    });

    return {
      variation: 'Multiple Data Quality Issues',
      description: 'Combination of spend discrepancy, name mismatch, and metadata issues',
      campaigns,
      problemIndices: [0, 1, 2],
    };
  },
];

// ============================================================================
// SCENARIO C: WARNING / UNDER-PACING - Multiple Variations
// ============================================================================

const scenarioCVariations = [
  // Variation 1: Single campaign under-pacing
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(5, 7));
    const campaigns = buildCampaigns(templates, now);

    const problemIdx = random.int(0, campaigns.length - 1);
    const underVariance = random.between(-20, -12);

    campaigns.forEach((c, idx) => {
      if (idx === problemIdx) {
        c.spend = Math.round(c.baseBudget * (1 + underVariance / 100));
        c.warning = { type: 'underpacing', variance: underVariance };
      } else {
        c.spend = Math.round(c.baseBudget * (1 + random.between(-5, 5) / 100));
      }
      c.metrics = generateMetrics(c);
    });

    return {
      variation: 'Single Under-Pacing',
      description: `${campaigns[problemIdx].name} under-delivering by ${Math.abs(underVariance).toFixed(0)}%`,
      campaigns,
      problemIndices: [problemIdx],
    };
  },

  // Variation 2: Multiple campaigns under-pacing
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(6, 8));
    const campaigns = buildCampaigns(templates, now);

    const problemCount = random.int(2, 3);
    const problemIndices = random.pickN([...Array(campaigns.length).keys()], problemCount);

    campaigns.forEach((c, idx) => {
      if (problemIndices.includes(idx)) {
        const underVariance = random.between(-22, -11);
        c.spend = Math.round(c.baseBudget * (1 + underVariance / 100));
        c.warning = { type: 'underpacing', variance: underVariance };
      } else {
        c.spend = Math.round(c.baseBudget * (1 + random.between(-5, 5) / 100));
      }
      c.metrics = generateMetrics(c);
    });

    return {
      variation: 'Multiple Under-Pacing',
      description: `${problemCount} campaigns showing delivery issues`,
      campaigns,
      problemIndices,
    };
  },

  // Variation 3: Single campaign over-pacing (warning level)
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(5, 7));
    const campaigns = buildCampaigns(templates, now);

    const problemIdx = random.int(0, campaigns.length - 1);
    const overVariance = random.between(12, 23);

    campaigns.forEach((c, idx) => {
      if (idx === problemIdx) {
        c.spend = Math.round(c.baseBudget * (1 + overVariance / 100));
        c.warning = { type: 'overpacing', variance: overVariance };
      } else {
        c.spend = Math.round(c.baseBudget * (1 + random.between(-5, 5) / 100));
      }
      c.metrics = generateMetrics(c);
    });

    return {
      variation: 'Moderate Over-Pacing',
      description: `${campaigns[problemIdx].name} spending ${overVariance.toFixed(0)}% above target`,
      campaigns,
      problemIndices: [problemIdx],
    };
  },

  // Variation 4: Platform-wide issue
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(6, 8));
    const campaigns = buildCampaigns(templates, now);

    const problemPlatform = random.pick(['google', 'meta', 'tiktok']);
    const problemIndices = [];

    campaigns.forEach((c, idx) => {
      if (c.platform === problemPlatform) {
        const underVariance = random.between(-20, -12);
        c.spend = Math.round(c.baseBudget * (1 + underVariance / 100));
        c.warning = { type: 'underpacing', variance: underVariance, platformWide: true };
        problemIndices.push(idx);
      } else {
        c.spend = Math.round(c.baseBudget * (1 + random.between(-5, 5) / 100));
      }
      c.metrics = generateMetrics(c);
    });

    const platformName = { google: 'Google Ads', meta: 'Meta', tiktok: 'TikTok' }[problemPlatform];

    return {
      variation: 'Platform-Wide Under-Delivery',
      description: `All ${platformName} campaigns under-pacing - possible platform issue`,
      campaigns,
      problemIndices,
    };
  },
];

// ============================================================================
// SCENARIO D: CRITICAL - Multiple Variations
// ============================================================================

const scenarioDVariations = [
  // Variation 1: Single massive overspend
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(5, 6));
    const campaigns = buildCampaigns(templates, now);

    const problemIdx = random.int(0, campaigns.length - 1);
    const overMultiplier = random.between(2.5, 4.5);

    campaigns.forEach((c, idx) => {
      if (idx === problemIdx) {
        c.spend = Math.round(c.baseBudget * overMultiplier);
        c.critical = {
          type: 'overspend',
          multiplier: overMultiplier,
          overspendAmount: c.spend - c.baseBudget,
        };
        c.metrics = generateMetrics(c, true);
      } else {
        c.spend = Math.round(c.baseBudget * (1 + random.between(-3, 3) / 100));
        c.metrics = generateMetrics(c);
      }
    });

    return {
      variation: 'Critical Overspend',
      description: `${campaigns[problemIdx].name} at ${((overMultiplier - 1) * 100).toFixed(0)}% over budget ($${campaigns[problemIdx].critical.overspendAmount.toLocaleString()} overspend)`,
      campaigns,
      problemIndices: [problemIdx],
    };
  },

  // Variation 2: Suspicious spend spike (fraud indicator)
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(5, 6));
    const campaigns = buildCampaigns(templates, now);

    const problemIdx = random.int(0, campaigns.length - 1);
    const spikeMultiplier = random.between(5, 10);

    campaigns.forEach((c, idx) => {
      if (idx === problemIdx) {
        c.spend = Math.round(c.baseBudget * spikeMultiplier);
        c.critical = {
          type: 'spike',
          multiplier: spikeMultiplier,
          possibleFraud: true,
          overspendAmount: c.spend - c.baseBudget,
        };
        c.metrics = generateMetrics(c, true);
      } else {
        c.spend = Math.round(c.baseBudget * (1 + random.between(-3, 3) / 100));
        c.metrics = generateMetrics(c);
      }
    });

    return {
      variation: 'Suspicious Spend Spike',
      description: `${campaigns[problemIdx].name} at ${(spikeMultiplier * 100).toFixed(0)}% of budget - possible fraud/bot traffic`,
      campaigns,
      problemIndices: [problemIdx],
    };
  },

  // Variation 3: Budget exhaustion on single campaign
  () => {
    const now = new Date();
    const templates = random.pickN(campaignTemplates, random.int(5, 6));
    const campaigns = buildCampaigns(templates, now);

    const problemIdx = random.int(0, campaigns.length - 1);
    const overVariance = random.between(55, 90);

    campaigns.forEach((c, idx) => {
      if (idx === problemIdx) {
        c.spend = Math.round(c.baseBudget * (1 + overVariance / 100));
        c.critical = {
          type: 'budget_exhaustion',
          variance: overVariance,
          overspendAmount: c.spend - c.baseBudget,
        };
        c.metrics = generateMetrics(c, true);
      } else {
        c.spend = Math.round(c.baseBudget * (1 + random.between(-3, 3) / 100));
        c.metrics = generateMetrics(c);
      }
    });

    return {
      variation: 'Budget Exhaustion',
      description: `${campaigns[problemIdx].name} exhausted daily budget early - $${campaigns[problemIdx].critical.overspendAmount.toLocaleString()} over`,
      campaigns,
      problemIndices: [problemIdx],
    };
  },
];

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

/**
 * Generate scenario data by selecting a random variation
 */
export function getScenarioData(scenarioId) {
  const now = new Date();
  let variationFn;
  let scenarioType;

  switch (scenarioId) {
    case 'A':
      variationFn = random.pick(scenarioAVariations);
      scenarioType = 'healthy';
      break;
    case 'B':
      variationFn = random.pick(scenarioBVariations);
      scenarioType = 'escalated';
      break;
    case 'C':
      variationFn = random.pick(scenarioCVariations);
      scenarioType = 'warning';
      break;
    case 'D':
      variationFn = random.pick(scenarioDVariations);
      scenarioType = 'critical';
      break;
    default:
      variationFn = random.pick(scenarioAVariations);
      scenarioType = 'healthy';
  }

  const variation = variationFn();

  // Build platform and tracker data
  const platformData = variation.campaigns.map(c => ({
    id: c.id,
    name: c.nameMismatch?.apiName || c.name,
    platform: c.platform,
    spend: c.discrepancy?.apiSpend || c.spend,
    metrics: c.metrics || null,
    metadata: c.metadata,
    timestamp: c.timestamp,
  }));

  const trackerData = variation.campaigns.map(c => ({
    id: c.id,
    name: c.nameMismatch?.trackerName || c.name,
    spend: c.discrepancy?.trackerSpend || c.spend, // actual spend as tracked (matches platform for non-discrepancy)
    target: c.baseBudget, // budget cap / target spend
    metrics: c.metrics || null,
    metadata: c.corruptMetadata || c.metadata,
    timestamp: c.staleData ? new Date(now.getTime() - c.dataAge * 60 * 60 * 1000) : c.timestamp,
  }));

  return {
    scenarioId,
    scenarioName: scenarioMeta[scenarioId].name,
    scenarioType,
    variation: variation.variation,
    description: variation.description,
    platformData,
    trackerData,
    problemIndices: variation.problemIndices || [],
  };
}

/**
 * Scenario metadata for UI
 */
export const scenarioMeta = {
  A: {
    id: 'A',
    name: 'Normal Operation',
    description: 'All campaigns pacing within healthy thresholds',
    expectedStatus: 'healthy',
    color: 'bg-status-healthy',
    variations: scenarioAVariations.length,
  },
  B: {
    id: 'B',
    name: 'Data Mismatch',
    description: 'Data quality issues requiring human review',
    expectedStatus: 'escalated',
    color: 'bg-status-escalated',
    variations: scenarioBVariations.length,
  },
  C: {
    id: 'C',
    name: 'Pacing Warning',
    description: 'Campaigns outside healthy thresholds',
    expectedStatus: 'warning',
    color: 'bg-status-warning',
    variations: scenarioCVariations.length,
  },
  D: {
    id: 'D',
    name: 'Critical Alert',
    description: 'Severe pacing issues requiring immediate action',
    expectedStatus: 'critical',
    color: 'bg-status-critical',
    variations: scenarioDVariations.length,
  },
};

export default {
  getScenarioData,
  scenarioMeta,
};
