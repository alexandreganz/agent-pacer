/**
 * Gemini API integration for AI Pacing Agent.
 * Generates per-campaign analysis with specific data points.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || null;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Generate LLM insights for campaign pacing data.
 */
export async function generateInsights({ campaigns, overallStatus, scenarioName, timeContext }) {
  // Always generate base analysis from actual data first
  const baseAnalysis = generateBaseAnalysis(campaigns, overallStatus, timeContext);

  if (!GEMINI_API_KEY) {
    console.log('[Gemini] No API key - using base analysis');
    return baseAnalysis;
  }

  try {
    const prompt = buildSimplePrompt(campaigns, overallStatus);
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        },
      })
    });

    if (!response.ok) {
      console.error('[Gemini] API error:', response.status);
      return baseAnalysis;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return baseAnalysis;
    }

    // Try to enhance base analysis with Gemini's insights
    return enhanceWithGemini(baseAnalysis, text, campaigns);
  } catch (error) {
    console.error('[Gemini] Error:', error);
    return baseAnalysis;
  }
}

/**
 * Generate base analysis directly from campaign data.
 * This ensures we always have per-campaign analysis.
 */
function generateBaseAnalysis(campaigns, overallStatus, timeContext) {
  const problemCampaigns = campaigns.filter(c =>
    c.status !== 'healthy' || c.paused || c.discrepancy || c.isLowConfidence
  );
  const healthyCampaigns = campaigns.filter(c =>
    c.status === 'healthy' && !c.paused && !c.discrepancy
  );

  // Generate analysis for each campaign
  const campaignAnalysis = campaigns.map(campaign => {
    const isProblem = campaign.status !== 'healthy' || campaign.paused || campaign.discrepancy || campaign.isLowConfidence;
    const variance = campaign.variance || 0;
    const varianceAmount = campaign.spend - campaign.cap;

    // Determine severity
    let severity = 'LOW';
    if (campaign.paused || Math.abs(variance) > 25) severity = 'CRITICAL';
    else if (Math.abs(variance) > 10) severity = 'HIGH';
    else if (campaign.discrepancy) severity = 'HIGH';
    else if (Math.abs(variance) > 5) severity = 'MEDIUM';

    // Generate issue description
    let issue = 'Pacing within normal thresholds';
    let rootCause = 'N/A - Campaign performing as expected';
    let actionRequired = 'Continue monitoring';

    if (campaign.paused) {
      const m = campaign.metrics;
      const metricsSnapshot = m
        ? ` Metrics at time of pause: ${m.impressions.toLocaleString()} impressions, ${m.ctr}% CTR, ${m.conversions} conversions, ${m.roas}x ROAS.`
        : '';
      issue = `Campaign AUTO-PAUSED due to critical overspend. Spent $${campaign.spend.toLocaleString()} against $${campaign.cap.toLocaleString()} cap (${variance > 0 ? '+' : ''}${variance.toFixed(1)}% variance = $${Math.abs(varianceAmount).toLocaleString()} ${varianceAmount > 0 ? 'over' : 'under'} budget).${metricsSnapshot}`;
      rootCause = m && m.roas < 1.0
        ? `Spend surging with poor performance (ROAS ${m.roas}x). Likely causes: bot/invalid traffic inflating impressions without conversions, bid multiplier misconfiguration, or audience saturation`
        : 'Likely causes: bid multiplier misconfiguration, automated rule malfunction, or sudden spike in auction competitiveness';
      actionRequired = `1) Review bid settings in ${campaign.platform.toUpperCase()} UI, 2) Check automated rules for unintended triggers, 3) Audit change history for last 24h, 4) Verify no fraudulent traffic patterns`;
    } else if (campaign.discrepancy) {
      const diff = Math.abs(campaign.discrepancy.api - campaign.discrepancy.internal);
      const apiHigher = campaign.discrepancy.api > campaign.discrepancy.internal;
      issue = `DATA DISCREPANCY: Platform API reports $${campaign.discrepancy.api.toLocaleString()} but internal database shows $${campaign.discrepancy.internal.toLocaleString()} ($${diff.toLocaleString()} mismatch). Agent BLOCKED autonomous action — human verification required.`;
      rootCause = apiHigher
        ? `The platform API is reporting $${diff.toLocaleString()} MORE than our internal tracker. This could mean: (1) API sync pulled data after a late-attributed conversion batch, (2) the tracking pixel on our side dropped events during a network timeout, (3) the platform applied a currency or tax adjustment not reflected in our system, or (4) a duplicate campaign ID is aggregating spend from multiple ad groups.`
        : `Our internal tracker shows $${diff.toLocaleString()} MORE than the platform API. This could mean: (1) the API has a reporting delay and hasn't caught up, (2) our tracker is double-counting spend from retried API calls, (3) a timezone offset is causing spend to be attributed to the wrong day, or (4) a cancelled transaction was reversed in the platform but not in our database.`;
      actionRequired = `IMMEDIATE: Verify spend in ${campaign.platform.toUpperCase()} platform UI manually. THEN: (1) Cross-reference with the platform billing dashboard, (2) Check API sync logs for timeout errors or partial responses, (3) Audit tracking pixel fire rates for anomalies, (4) If confirmed mismatch persists after 2 hours, escalate to platform account rep. DO NOT take automated pacing action until source of truth is confirmed.`;
    } else if (campaign.isLowConfidence) {
      const breakdown = campaign.confidenceBreakdown;
      const issues = [];
      let rootCauseText = '';
      let actionText = '';

      if (breakdown) {
        if (breakdown.nameSimilarity?.score < 0.7) {
          issues.push('campaign names don\'t match between platform API and internal tracker');
          rootCauseText += 'Campaign naming convention differs between systems — possible manual entry error, system migration artifact, or API sync using a different campaign identifier. ';
          actionText += `Verify campaign name mapping in ${campaign.platform.toUpperCase()} platform. `;
        }
        if (breakdown.metadataMatch?.score < 0.7) {
          issues.push('metadata fields are corrupted or missing');
          rootCauseText += 'Campaign metadata (market, product, dates) not matching between sources — data may have been overwritten during a bulk update or API migration. ';
          actionText += 'Cross-reference metadata fields in both systems and correct discrepancies. ';
        }
        if (breakdown.freshness?.score < 0.4) {
          issues.push('data is stale (last sync >12 hours ago)');
          rootCauseText += 'Platform data hasn\'t been refreshed in over 12 hours — possible API sync failure, rate limiting, or authentication token expiry. ';
          actionText += 'Check API sync job status and trigger manual data refresh. ';
        }
        if (breakdown.spendConsistency?.details?.hasDiscrepancy) {
          issues.push(`spend discrepancy of ${breakdown.spendConsistency.details.discrepancyPct}%`);
          rootCauseText += 'Platform reports different spend than internal tracker. ';
          actionText += `Verify actual spend in ${campaign.platform.toUpperCase()} billing dashboard. `;
        }
      }

      if (issues.length === 0) issues.push('overall data confidence below threshold');

      severity = 'HIGH';
      issue = `DATA QUALITY ALERT: Confidence score ${Math.round(campaign.confidence * 100)}% (below 70% threshold). Issues: ${issues.join('; ')}. Agent BLOCKED autonomous action — human verification required.`;
      rootCause = rootCauseText || 'Multiple data quality factors contributing to low confidence score.';
      actionRequired = (actionText || `Manually verify data in ${campaign.platform.toUpperCase()} platform UI. `) + 'DO NOT approve automated actions until data quality is confirmed.';
    } else if (variance > 25) {
      issue = `CRITICAL OVERSPEND: Spent $${campaign.spend.toLocaleString()} against $${campaign.cap.toLocaleString()} cap (${variance.toFixed(1)}% over = $${varianceAmount.toLocaleString()} excess spend)`;
      rootCause = 'Aggressive bidding, high auction competition, or budget pacing set to "accelerated" instead of "standard"';
      actionRequired = `1) Reduce bids by 25-30%, 2) Switch to standard delivery, 3) Add frequency caps, 4) Review audience overlap with other campaigns`;
    } else if (variance < -25) {
      issue = `CRITICAL UNDERSPEND: Only spent $${campaign.spend.toLocaleString()} of $${campaign.cap.toLocaleString()} cap (${variance.toFixed(1)}% under = $${Math.abs(varianceAmount).toLocaleString()} unspent)`;
      rootCause = 'Bids too low to win auctions, audience too narrow, ad disapprovals, or creative fatigue';
      actionRequired = `1) Increase bids by 30-40%, 2) Expand audience targeting, 3) Check ad approval status, 4) Refresh creative assets`;
    } else if (variance > 10) {
      issue = `Moderate overspend: $${campaign.spend.toLocaleString()} vs $${campaign.cap.toLocaleString()} cap (${variance.toFixed(1)}% over)`;
      rootCause = 'Slightly aggressive pacing, may self-correct by end of day';
      actionRequired = `Monitor for next 2 hours. If persists, reduce bids by 10-15%`;
    } else if (variance < -10) {
      issue = `Moderate underspend: $${campaign.spend.toLocaleString()} vs $${campaign.cap.toLocaleString()} cap (${variance.toFixed(1)}% under)`;
      rootCause = 'Bids may be slightly below competitive threshold';
      actionRequired = `Increase bids by 10-15% and monitor delivery rate`;
    }

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      platform: campaign.platform.toUpperCase(),
      status: campaign.paused ? 'PAUSED' : campaign.status.toUpperCase(),
      severity,
      dataFindings: {
        actualSpend: campaign.spend,
        dailyCap: campaign.cap,
        variancePercent: parseFloat(variance.toFixed(1)),
        varianceAmount: varianceAmount,
        isPaused: campaign.paused || false,
        metrics: campaign.metrics || null,
        discrepancy: campaign.discrepancy ? {
          apiValue: campaign.discrepancy.api,
          dbValue: campaign.discrepancy.internal,
          difference: campaign.discrepancy.api - campaign.discrepancy.internal,
        } : null,
      },
      issue,
      rootCause,
      actionRequired,
      actionOutput: generateActionOutput(campaign),
    };
  });

  // Sort: problems first, then by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  campaignAnalysis.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Generate title and summary
  const pausedCount = campaigns.filter(c => c.paused).length;
  const criticalCount = campaigns.filter(c => c.status === 'critical').length;
  const warningCount = campaigns.filter(c => c.status === 'warning').length;
  const discrepancyCount = campaigns.filter(c => c.discrepancy).length;
  const lowConfidenceCount = campaigns.filter(c => c.isLowConfidence && !c.discrepancy).length;

  let title = 'All Campaigns Healthy';
  let summary = `All ${campaigns.length} campaigns pacing within normal thresholds.`;

  if (pausedCount > 0) {
    title = `${pausedCount} Campaign${pausedCount > 1 ? 's' : ''} Auto-Paused`;
    summary = `Critical action taken: ${pausedCount} campaign${pausedCount > 1 ? 's were' : ' was'} automatically paused due to severe overspend.`;
  } else if (criticalCount > 0) {
    title = `${criticalCount} Critical Alert${criticalCount > 1 ? 's' : ''}`;
    summary = `${criticalCount} campaign${criticalCount > 1 ? 's' : ''} showing critical variance requiring immediate attention.`;
  } else if (discrepancyCount > 0) {
    const totalDiscrepancy = campaigns
      .filter(c => c.discrepancy)
      .reduce((sum, c) => sum + Math.abs(c.discrepancy.api - c.discrepancy.internal), 0);
    title = `Data Mismatch — Human Review Required`;
    summary = `${discrepancyCount} campaign${discrepancyCount > 1 ? 's have' : ' has'} a $${totalDiscrepancy.toLocaleString()} discrepancy between the ad platform API and our internal tracking system. The agent has BLOCKED autonomous action because it cannot determine which data source is correct. A human operator must verify the actual spend in the platform UI before any pacing adjustments are made.`;
  } else if (lowConfidenceCount > 0) {
    title = `Data Quality Issues — Human Review Required`;
    summary = `${lowConfidenceCount} campaign${lowConfidenceCount > 1 ? 's have' : ' has'} data quality issues preventing autonomous action. The agent detected inconsistencies in campaign data (name mismatches, corrupted metadata, or stale data) and requires human verification before proceeding.`;
  } else if (warningCount > 0) {
    title = `${warningCount} Warning${warningCount > 1 ? 's' : ''} Detected`;
    summary = `${warningCount} campaign${warningCount > 1 ? 's' : ''} outside optimal pacing thresholds.`;
  }

  const totalOverspend = campaigns.reduce((sum, c) => sum + Math.max(0, c.spend - c.cap), 0);
  const totalUnderspend = campaigns.reduce((sum, c) => sum + Math.max(0, c.cap - c.spend), 0);

  return {
    title,
    summary,
    campaignAnalysis,
    portfolioSummary: {
      healthyCampaigns: healthyCampaigns.length,
      warningCampaigns: warningCount,
      criticalCampaigns: criticalCount + pausedCount,
      totalOverspend,
      totalUnderspend,
    },
    immediateAction: pausedCount > 0
      ? `Review ${pausedCount} paused campaign${pausedCount > 1 ? 's' : ''} and investigate root cause before reactivating`
      : criticalCount > 0
      ? `Address ${criticalCount} critical campaign${criticalCount > 1 ? 's' : ''} immediately to prevent budget loss`
      : discrepancyCount > 0
      ? `URGENT: ${discrepancyCount} campaign${discrepancyCount > 1 ? 's show' : ' shows'} a data mismatch between the ad platform API and internal systems. Log into the platform UI to manually verify actual spend before approving any automated actions. If the platform confirms the higher number, budget may be at risk. If it confirms the lower number, the API response may be stale or corrupted.`
      : lowConfidenceCount > 0
      ? `REVIEW REQUIRED: ${lowConfidenceCount} campaign${lowConfidenceCount > 1 ? 's have' : ' has'} data quality issues. Verify campaign data in platform UI before approving any automated actions.`
      : null,
    hypotheticalScenarios: (overallStatus === 'escalated') ? [
      {
        title: 'API Over-Reporting',
        description: 'If the platform API is inflating spend numbers, the campaign may appear overpaced when it is actually on target. Acting autonomously could pause a healthy campaign, causing missed impressions and revenue loss.',
      },
      {
        title: 'Tracker Under-Reporting',
        description: 'If the internal tracker has a sync delay or dropped events, the campaign may be genuinely overspending. Ignoring this could result in budget exhaustion before end of day.',
      },
      {
        title: 'Duplicate Transaction Logging',
        description: 'A tracking pixel firing multiple times could inflate both spend and conversion data, leading to incorrect ROAS calculations and flawed budget allocation decisions.',
      },
      {
        title: 'Provider-Side Billing Discrepancy',
        description: 'The ad platform may be billing at a different rate than reported in the API (e.g., currency conversion, tax adjustments). This could affect monthly reconciliation and result in unexpected invoice amounts.',
      },
    ] : null,
    notifications: (overallStatus === 'escalated' || overallStatus === 'critical') ? {
      slack: '#media-ops-alerts',
      email: overallStatus === 'critical' ? 'media-ops-urgent@lego.com' : 'data-ops-team@lego.com',
      ticket: overallStatus === 'critical'
        ? `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
        : `DQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      ...(timeContext?.isOffHours ? {
        pagerDuty: {
          target: 'media-ops-oncall',
          severity: 'P1',
          message: `${overallStatus === 'critical' ? 'Critical campaign alert' : 'Data quality escalation'} during off-hours`,
        },
      } : {}),
    } : null,
    offHoursNotice: timeContext?.isOffHours ? {
      active: true,
      reason: timeContext.reason,
      pauseThreshold: timeContext.pauseThresholdOverride,
      timestamp: timeContext.timestamp,
    } : null,
    isLLMGenerated: false,
  };
}

/**
 * Build a simple prompt for Gemini to enhance our base analysis.
 */
function buildSimplePrompt(campaigns, overallStatus) {
  const problemCampaigns = campaigns.filter(c =>
    c.status !== 'healthy' || c.paused || c.discrepancy || c.isLowConfidence
  );

  if (problemCampaigns.length === 0) {
    return `As a media buying analyst, write a brief 2-sentence positive summary for a healthy campaign portfolio with ${campaigns.length} campaigns all pacing within normal thresholds. Be specific and professional.`;
  }

  const discrepancyCampaigns = problemCampaigns.filter(c => c.discrepancy);

  // Special prompt for data mismatch / escalation scenarios
  if (discrepancyCampaigns.length > 0 || overallStatus === 'escalated') {
    const discrepancyDetails = discrepancyCampaigns.map(c => {
      const diff = Math.abs(c.discrepancy.api - c.discrepancy.internal);
      return `Campaign "${c.name}" (${c.id}) on ${c.platform.toUpperCase()}: Platform API reports $${c.discrepancy.api.toLocaleString()} but internal database shows $${c.discrepancy.internal.toLocaleString()} — $${diff.toLocaleString()} discrepancy`;
    }).join('\n');

    const otherDetails = problemCampaigns.filter(c => !c.discrepancy).map(c => {
      if (c.isLowConfidence) {
        const issues = [];
        const b = c.confidenceBreakdown;
        if (b?.nameSimilarity?.score < 0.7) issues.push('name mismatch between systems');
        if (b?.metadataMatch?.score < 0.7) issues.push('metadata corruption');
        if (b?.freshness?.score < 0.4) issues.push('stale data (>12h old)');
        if (b?.spendConsistency?.details?.hasDiscrepancy) issues.push('spend discrepancy');
        return `Campaign "${c.name}" (${c.id}) on ${c.platform.toUpperCase()}: DATA QUALITY ISSUES — ${issues.join(', ') || 'low confidence'} (confidence: ${Math.round(c.confidence * 100)}%)`;
      }
      return `Campaign "${c.name}" (${c.id}): ${c.variance > 0 ? 'overspending' : 'underspending'} at ${c.variance}% variance`;
    }).join('\n');

    return `You are a senior media buying analyst investigating a DATA MISMATCH between the ad platform API and our internal tracking system. This has been escalated for human review because the AI agent cannot determine the source of truth.

DATA DISCREPANCIES FOUND:
${discrepancyDetails}
${otherDetails ? '\nOTHER CAMPAIGN ISSUES:\n' + otherDetails : ''}

For each campaign with a discrepancy, provide:
1. The most likely technical root cause (ONE specific reason)
2. A hypothetical worst-case scenario if this mismatch is ignored (e.g., budget waste, incorrect billing, compliance risk)
3. What a human operator should verify first

Also describe what could happen if the agent acted autonomously on mismatched data — for example, pausing a campaign that is actually healthy, or failing to pause one that is genuinely overspending.

Format your response as:
Campaign ID: [root cause] | [worst-case scenario if ignored] | [first verification step]

Be specific — mention actual ad platform settings, API sync mechanisms, tracking pixel issues, or billing discrepancies that could cause this.`;
  }

  const details = problemCampaigns.map(c => {
    let info = `Campaign "${c.name}" (${c.id}) on ${c.platform.toUpperCase()}: `;
    if (c.paused) {
      info += `AUTO-PAUSED, spent $${c.spend.toLocaleString()} vs $${c.cap.toLocaleString()} cap (${c.variance}% over)`;
    } else {
      info += `${c.variance > 0 ? 'overspending' : 'underspending'} at ${c.variance}% (spend: $${c.spend.toLocaleString()}, cap: $${c.cap.toLocaleString()})`;
    }
    return info;
  }).join('\n');

  return `As a media buying analyst, provide a brief root cause analysis for each of these campaign issues. For each campaign, give ONE specific technical reason why this might be happening.

${details}

Format your response as:
Campaign ID: [specific technical root cause in 1 sentence]

Be specific - mention actual settings, configurations, or technical issues that could cause this.`;
}

/**
 * Enhance base analysis with Gemini's insights.
 */
function enhanceWithGemini(baseAnalysis, geminiText, campaigns) {
  // Try to extract per-campaign insights from Gemini's response
  const lines = geminiText.split('\n').filter(l => l.trim());

  baseAnalysis.campaignAnalysis.forEach(analysis => {
    // Look for this campaign in Gemini's response
    const campaignLine = lines.find(line =>
      line.toLowerCase().includes(analysis.campaignId.toLowerCase()) ||
      line.toLowerCase().includes(analysis.campaignName.toLowerCase().slice(0, 20))
    );

    if (campaignLine && analysis.severity !== 'LOW') {
      // Extract the insight part after the colon
      const parts = campaignLine.split(':');
      if (parts.length > 1) {
        const insight = parts.slice(1).join(':').trim();
        if (insight.length > 10) {
          analysis.rootCause = insight;
        }
      }
    }
  });

  baseAnalysis.isLLMGenerated = true;
  return baseAnalysis;
}

/**
 * Generate action output for a campaign based on its status.
 */
function generateActionOutput(campaign) {
  const timestamp = new Date().toISOString();
  const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;

  if (campaign.paused) {
    return {
      type: 'CAMPAIGN_PAUSED',
      displayName: 'Campaign Pause API Call',
      timestamp,
      request: {
        method: 'POST',
        endpoint: `https://ads.googleapis.com/v14/customers/123456789/campaigns/${campaign.id}:pause`,
        headers: {
          'Authorization': 'Bearer [REDACTED]',
          'Content-Type': 'application/json',
          'x-request-id': requestId,
        },
        body: {
          campaignId: campaign.id,
          action: 'PAUSE',
          reason: 'AUTOMATIC_OVERSPEND_PROTECTION',
          triggeredBy: 'AI_PACING_AGENT_v2.1',
          spendAtPause: campaign.spend,
          dailyCap: campaign.cap,
          variancePercent: campaign.variance,
        },
      },
      response: {
        status: 200,
        body: {
          success: true,
          campaignId: campaign.id,
          previousStatus: 'ENABLED',
          newStatus: 'PAUSED',
          pausedAt: timestamp,
          incidentId: `INC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
        },
      },
      slackNotification: {
        channel: '#media-ops-alerts',
        sentAt: timestamp,
        message: `🚨 Campaign Auto-Paused\n*${campaign.name}*\nID: ${campaign.id}\nOverspend: $${(campaign.spend - campaign.cap).toLocaleString()} (${campaign.variance}%)`,
      },
    };
  }

  if (campaign.discrepancy) {
    return {
      type: 'DATA_DISCREPANCY_TICKET',
      displayName: 'Data Quality Escalation',
      timestamp,
      ticket: {
        id: `DQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
        priority: 'HIGH',
        status: 'OPEN',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          platform: campaign.platform.toUpperCase(),
        },
        discrepancy: {
          apiValue: campaign.discrepancy.api,
          dbValue: campaign.discrepancy.internal,
          difference: campaign.discrepancy.api - campaign.discrepancy.internal,
        },
        assignedTo: 'data-ops-team@lego.com',
        requiredActions: [
          `Verify spend in ${campaign.platform.toUpperCase()} platform UI`,
          'Check API sync logs for errors',
          'Compare with billing reports',
          'Review tracking pixel implementation',
        ],
      },
    };
  }

  if (campaign.status === 'warning' || campaign.status === 'critical') {
    const isUnder = campaign.variance < 0;
    const bidChange = isUnder ? 15 : -15;
    return {
      type: 'BID_ADJUSTMENT_RECOMMENDED',
      displayName: 'Bid Adjustment Recommendation',
      timestamp,
      recommendation: {
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: 'PENDING_APPROVAL',
        proposedChange: {
          type: 'BID_MODIFIER',
          direction: isUnder ? 'INCREASE' : 'DECREASE',
          percentage: Math.abs(bidChange),
        },
        currentSpend: campaign.spend,
        targetSpend: campaign.cap,
        variance: campaign.variance,
      },
      draftApiCall: {
        method: 'POST',
        endpoint: `https://ads.googleapis.com/v14/customers/123456789/campaigns/${campaign.id}:updateBids`,
        body: {
          bidModifier: isUnder ? 1.15 : 0.85,
          reason: `Variance correction: ${campaign.variance}%`,
        },
      },
    };
  }

  return {
    type: 'NO_ACTION_REQUIRED',
    displayName: 'Monitoring Only',
    timestamp,
    status: {
      campaignId: campaign.id,
      health: 'GOOD',
      message: 'Campaign pacing within acceptable thresholds',
    },
  };
}

export function isGeminiConfigured() {
  return Boolean(GEMINI_API_KEY);
}

export default { generateInsights, isGeminiConfigured };
