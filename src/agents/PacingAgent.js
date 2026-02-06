/**
 * PacingAgent - Main orchestrator for the AI Pacing Agent.
 *
 * Implements the LangGraph-style state machine flow:
 * Fetch → Reconcile → Calculate Variance → Score Confidence → Route → Act
 */

import { VarianceAnalyzer } from './VarianceAnalyzer';
import { ConfidenceScorer } from './ConfidenceScorer';
import { getTimeContext } from '../utils/timeContext';

/**
 * Agent state machine states
 */
export const AgentState = {
  IDLE: 'idle',
  FETCHING: 'fetching',
  RECONCILING: 'reconciling',
  ANALYZING: 'analyzing',
  SCORING: 'scoring',
  ROUTING: 'routing',
  ACTING: 'acting',
  COMPLETE: 'complete',
};

/**
 * Action types the agent can take
 */
export const ActionType = {
  LOG_ONLY: 'log_only',
  ALERT: 'alert',
  PAUSE: 'pause',
  ESCALATE: 'escalate',
  RECOMMEND_BID: 'recommend_bid',
  RECOMMEND_BUDGET: 'recommend_budget',
};

export class PacingAgent {
  constructor(options = {}) {
    this.varianceAnalyzer = new VarianceAnalyzer({
      healthyThreshold: options.healthyThreshold || 10.0,
      warningThreshold: options.warningThreshold || 25.0,
    });

    this.confidenceScorer = new ConfidenceScorer({
      confidenceThreshold: options.confidenceThreshold || 0.7,
    });

    this.state = AgentState.IDLE;
    this.logs = [];
    this.onStateChange = options.onStateChange || (() => {});
    this.onLog = options.onLog || (() => {});
  }

  /**
   * Log a message and notify listeners.
   */
  log(message, type = 'info') {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      type,
      state: this.state,
    };
    this.logs.push(entry);
    this.onLog(entry);
    return entry;
  }

  /**
   * Transition to a new state.
   */
  transition(newState) {
    const oldState = this.state;
    this.state = newState;
    this.onStateChange({ from: oldState, to: newState });
  }

  /**
   * Simulate async delay for realistic demo.
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run the agent on campaign data.
   * @param {Object} data - Platform and tracker data
   * @returns {Object} Agent result with analysis and actions
   */
  async run(data) {
    this.logs = [];
    this.timeContext = getTimeContext();
    const result = {
      campaigns: [],
      overallStatus: 'healthy',
      confidence: null,
      actions: [],
      logs: this.logs,
      timeContext: this.timeContext,
    };

    try {
      // Step 1: Fetch data from platforms
      this.transition(AgentState.FETCHING);
      this.log('Initializing AI Pacing Agent v2.1...', 'system');
      await this.delay(400);

      // Off-Hours Protocol banner
      if (this.timeContext.isOffHours) {
        this.log('', 'info');
        this.log('  ╔═══════════════════════════════════════════════╗', 'warning');
        this.log('  ║   OFF-HOURS PROTOCOL ACTIVE                   ║', 'warning');
        this.log('  ╚═══════════════════════════════════════════════╝', 'warning');
        this.log(`  ${this.timeContext.reason}`, 'warning');
        this.log(`  Auto-pause threshold lowered to ${this.timeContext.pauseThresholdOverride}%`, 'warning');
        this.log('', 'info');
        await this.delay(400);
      }

      this.log('Connecting to media platforms...', 'info');
      await this.delay(300);

      // Fetch from each platform
      const platforms = [...new Set(data.platformData.map(c => c.platform))];
      for (const platform of platforms) {
        this.log(`Fetching ${this.formatPlatform(platform)} data...`, 'info');
        await this.delay(500);
        const count = data.platformData.filter(c => c.platform === platform).length;
        this.log(`  ✓ ${this.formatPlatform(platform)}: ${count} campaign${count > 1 ? 's' : ''} retrieved`, 'success');
        await this.delay(200);
      }

      // Step 2: Reconcile platform data with internal tracker
      this.transition(AgentState.RECONCILING);
      this.log('Reconciling data across platforms...', 'info');
      await this.delay(400);

      const reconciled = this.reconcileData(data.platformData, data.trackerData);

      // Check for discrepancies
      const discrepancies = reconciled.filter(r => r.hasDiscrepancy);
      if (discrepancies.length > 0) {
        this.log(`  ⚠ DATA DISCREPANCY DETECTED`, 'warning');
        for (const d of discrepancies) {
          this.log(`  Platform API: $${d.platformSpend.toLocaleString()} spend reported`, 'warning');
          this.log(`  Internal DB:  $${d.trackerSpend.toLocaleString()} spend recorded`, 'warning');
        }
        await this.delay(300);
      }

      // Step 3: Calculate variance for each campaign
      this.transition(AgentState.ANALYZING);
      this.log('Calculating variance metrics...', 'info');
      await this.delay(400);

      const analysisResults = [];
      let hasCritical = false;
      let hasWarning = false;

      for (const campaign of reconciled) {
        const analysis = this.varianceAnalyzer.analyzeCampaign({
          id: campaign.id,
          name: campaign.name,
          platform: campaign.platform,
          targetSpend: campaign.trackerTarget,
          actualSpend: campaign.platformSpend,
        });

        analysisResults.push({
          ...campaign,
          ...analysis,
        });

        if (analysis.severity === 'critical') {
          hasCritical = true;
          if (analysis.direction === 'overspending' && analysis.variancePct > 100) {
            this.log('', 'info');
            this.log('  ╔═══════════════════════════════════╗', 'critical');
            this.log('  ║   CRITICAL OVERSPEND ALERT   ║', 'critical');
            this.log('  ╚═══════════════════════════════════╝', 'critical');
            this.log('', 'info');
            this.log(`  ${campaign.name} at +${analysis.variancePct}% variance!`, 'critical');
            this.log(`  Spend: $${campaign.platformSpend.toLocaleString()} | Cap: $${campaign.trackerSpend.toLocaleString()}`, 'critical');
          } else if (analysis.direction === 'underspending') {
            this.log(`  ⚠ UNDER-PACING DETECTED`, 'warning');
            this.log(`  ${campaign.name} at ${analysis.variancePct}% variance`, 'warning');
          }
          await this.delay(300);
        } else if (analysis.severity === 'warning') {
          hasWarning = true;
          this.log(`  ⚠ ${analysis.direction.toUpperCase()} DETECTED`, 'warning');
          this.log(`  ${campaign.name} at ${analysis.variancePct > 0 ? '+' : ''}${analysis.variancePct}% variance`, 'warning');
          await this.delay(200);
        }
      }

      this.log('Analyzing pacing patterns...', 'info');
      await this.delay(300);

      // Step 4: Score confidence
      this.transition(AgentState.SCORING);
      this.log('Running confidence scoring...', 'info');
      await this.delay(400);

      const confidenceResults = [];
      let lowestConfidence = 1.0;

      for (let i = 0; i < reconciled.length; i++) {
        const campaign = reconciled[i];
        const platformData = data.platformData.find(p => p.id === campaign.id);
        const trackerData = data.trackerData.find(t => t.id === campaign.id);

        const confidence = this.confidenceScorer.scoreConfidence({
          platformName: platformData?.name || campaign.name,
          trackerName: trackerData?.name || campaign.name,
          platformMetadata: platformData?.metadata || {},
          trackerMetadata: trackerData?.metadata || {},
          platformTimestamp: platformData?.timestamp || new Date(),
          trackerTimestamp: trackerData?.timestamp || new Date(),
          platformSpend: campaign.platformSpend,
          trackerSpend: campaign.trackerSpend,
        });

        confidenceResults.push(confidence);
        if (confidence.overallScore < lowestConfidence) {
          lowestConfidence = confidence.overallScore;
        }
      }

      const avgConfidence = confidenceResults.reduce((sum, c) => sum + c.overallScore, 0) / confidenceResults.length;
      const avgConfidencePct = Math.round(avgConfidence * 100);
      const lowestConfidencePct = Math.round(lowestConfidence * 100);

      // Route based on lowest per-campaign confidence — if ANY source is unreliable, escalate
      const shouldEscalate = lowestConfidence < this.confidenceScorer.confidenceThreshold;

      if (shouldEscalate) {
        this.log(`  Confidence Score: ${lowestConfidencePct}% (lowest) / ${avgConfidencePct}% (avg)`, 'warning');
        this.log(`  Score below 70% threshold — data integrity compromised`, 'warning');
        if (discrepancies.length > 0) {
          this.log(`  Source-of-truth mismatch detected between API and internal systems`, 'warning');
        }
      } else {
        this.log(`  Confidence Score: ${avgConfidencePct}%`, 'success');
      }
      await this.delay(200);

      result.confidence = {
        average: avgConfidence,
        lowest: lowestConfidence,
        individual: confidenceResults,
        isHighConfidence: !shouldEscalate,
      };

      // Step 5: Route based on confidence and severity
      this.transition(AgentState.ROUTING);

      // If any campaign has unreliable data, escalate the entire portfolio
      if (shouldEscalate) {
        result.overallStatus = 'escalated';
      } else if (hasCritical) {
        result.overallStatus = 'critical';
      } else if (hasWarning) {
        result.overallStatus = 'warning';
      } else {
        result.overallStatus = 'healthy';
      }

      // Step 6: Take action based on routing
      this.transition(AgentState.ACTING);

      if (result.overallStatus === 'escalated') {
        this.log('', 'info');
        this.log('  ╔═══════════════════════════════════════════════╗', 'escalated');
        this.log('  ║   ESCALATED TO HUMAN REVIEW                  ║', 'escalated');
        this.log('  ╚═══════════════════════════════════════════════╝', 'escalated');
        this.log('', 'info');
        this.log('  Data quality issues prevent autonomous action', 'escalated');
        this.log('  Autonomous action BLOCKED — awaiting verification', 'escalated');
        await this.delay(400);
        this.log('Generating LLM insights...', 'info');
        await this.delay(500);

        result.actions.push({
          type: ActionType.ESCALATE,
          reason: 'Data quality issues — confidence score below threshold',
          confidence: lowestConfidencePct,
          discrepancies: discrepancies.map(d => ({
            campaign: d.name,
            apiSpend: d.platformSpend,
            trackerSpend: d.trackerSpend,
            difference: Math.abs(d.platformSpend - d.trackerSpend),
          })),
        });
      } else if (result.overallStatus === 'critical') {
        // Find critical campaigns
        const criticalCampaigns = analysisResults.filter(a => a.severity === 'critical');
        for (const campaign of criticalCampaigns) {
          if (campaign.direction === 'overspending' && campaign.variancePct > this.timeContext.pauseThresholdOverride) {
            this.log('Initiating emergency protocol...', 'critical');
            await this.delay(400);
            this.log('  ✓ Campaign PAUSED automatically', 'success');
            if (this.timeContext.isOffHours) {
              this.log(`  ✓ Off-hours threshold applied (${this.timeContext.pauseThresholdOverride}% vs normal 50%)`, 'warning');
            }
            await this.delay(200);
            this.log('  ✓ Slack alert sent to #media-ops', 'success');
            await this.delay(200);
            this.log(`  ✓ Incident ticket created: INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`, 'success');
            if (this.timeContext.isOffHours) {
              await this.delay(200);
              this.log('  ✓ PagerDuty alert sent to on-call engineer', 'success');
            }

            result.actions.push({
              type: ActionType.PAUSE,
              campaignId: campaign.id,
              campaignName: campaign.name,
              reason: `Critical overspend: ${campaign.variancePct}%${this.timeContext.isOffHours ? ' (off-hours threshold)' : ''}`,
            });

            // Mark campaign as paused in results
            const idx = analysisResults.findIndex(a => a.id === campaign.id);
            if (idx !== -1) {
              analysisResults[idx].paused = true;
            }
          } else {
            this.log('Generating bid adjustment recommendation...', 'info');
            await this.delay(400);
            const bidChange = campaign.direction === 'underspending' ? 12 : -15;
            this.log(`  Recommended: ${bidChange > 0 ? 'Increase' : 'Decrease'} bid by ${Math.abs(bidChange)}%`, 'info');

            result.actions.push({
              type: ActionType.RECOMMEND_BID,
              campaignId: campaign.id,
              campaignName: campaign.name,
              bidChangePercent: bidChange,
              reason: `${campaign.severity} ${campaign.direction}: ${campaign.variancePct}%`,
            });
          }
        }
        this.log('Generating LLM insights...', 'info');
      } else if (result.overallStatus === 'warning') {
        const warningCampaigns = analysisResults.filter(a => a.severity === 'warning');
        for (const campaign of warningCampaigns) {
          this.log('Generating bid adjustment recommendation...', 'info');
          await this.delay(400);
          const bidChange = campaign.direction === 'underspending' ? 12 : -10;
          this.log(`  Recommended: ${bidChange > 0 ? 'Increase' : 'Decrease'} bid by ${Math.abs(bidChange)}%`, 'info');

          result.actions.push({
            type: ActionType.RECOMMEND_BID,
            campaignId: campaign.id,
            campaignName: campaign.name,
            bidChangePercent: bidChange,
            reason: `${campaign.severity} ${campaign.direction}: ${campaign.variancePct}%`,
          });
        }
        this.log('Generating LLM insights...', 'info');
      } else {
        this.log('Generating LLM insights...', 'info');
        result.actions.push({
          type: ActionType.LOG_ONLY,
          reason: 'All campaigns healthy',
        });
      }

      await this.delay(500);

      // Final status message
      this.log('', 'info');
      this.log('═══════════════════════════════════════', 'system');

      if (result.overallStatus === 'healthy') {
        this.log('  STATUS: ALL SYSTEMS NOMINAL', 'success');
        this.log('  No action required', 'success');
      } else if (result.overallStatus === 'warning') {
        this.log('  STATUS: ACTION RECOMMENDED', 'warning');
        this.log('  Awaiting human approval for bid change', 'warning');
      } else if (result.overallStatus === 'critical') {
        this.log('  STATUS: CRITICAL - AUTO-PAUSED', 'critical');
        this.log('  Campaign paused, awaiting investigation', 'critical');
      } else if (result.overallStatus === 'escalated') {
        this.log('  STATUS: ESCALATED TO HUMAN REVIEW', 'escalated');
        this.log('  Confidence too low for autonomous action', 'escalated');
      }

      this.log('═══════════════════════════════════════', 'system');

      // Build final campaign results
      result.campaigns = analysisResults.map((a, i) => ({
        id: a.id,
        name: a.name,
        platform: a.platform,
        spend: a.actualSpend,
        cap: a.targetSpend,
        variance: a.variancePct,
        status: a.severity,
        paused: a.paused || false,
        direction: a.direction,
        confidence: confidenceResults[i]?.overallScore || 0,
        confidenceBreakdown: confidenceResults[i]?.breakdown || null,
        isLowConfidence: confidenceResults[i] ? !confidenceResults[i].isHighConfidence : false,
        metrics: reconciled[i]?.metrics || null,
        discrepancy: reconciled[i]?.hasDiscrepancy ? {
          api: reconciled[i].platformSpend,
          internal: reconciled[i].trackerSpend,
        } : null,
      }));

      this.transition(AgentState.COMPLETE);
      result.logs = this.logs;

      return result;

    } catch (error) {
      this.log(`Error: ${error.message}`, 'critical');
      this.transition(AgentState.COMPLETE);
      result.logs = this.logs;
      result.error = error.message;
      return result;
    }
  }

  /**
   * Reconcile platform data with tracker data.
   */
  reconcileData(platformData, trackerData) {
    return platformData.map(platform => {
      const tracker = trackerData.find(t => t.id === platform.id);
      // Discrepancy = two systems report DIFFERENT actual spend (not variance from target)
      const hasDiscrepancy = tracker && Math.abs(platform.spend - tracker.spend) > (tracker.spend * 0.1);

      return {
        id: platform.id,
        name: platform.name,
        platform: platform.platform,
        platformSpend: platform.spend,
        trackerSpend: tracker?.spend || platform.spend,
        trackerTarget: tracker?.target || tracker?.spend || platform.spend,
        hasDiscrepancy,
        metrics: platform.metrics || tracker?.metrics || null,
        platformMetadata: platform.metadata,
        trackerMetadata: tracker?.metadata,
      };
    });
  }

  /**
   * Format platform name for display.
   */
  formatPlatform(platform) {
    const names = {
      google: 'Google Ads',
      meta: 'Meta Ads',
      tiktok: 'TikTok Ads',
      dv360: 'DV360',
    };
    return names[platform] || platform;
  }
}

export default PacingAgent;
