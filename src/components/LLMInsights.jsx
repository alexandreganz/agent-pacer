import { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import ActionOutputModal from './ActionOutputModal';

/**
 * LLMInsights - Compact AI analysis display with per-campaign data findings.
 */

const severityColors = {
  CRITICAL: { bg: 'bg-status-critical', text: 'text-white', border: 'border-status-critical' },
  HIGH: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500' },
  MEDIUM: { bg: 'bg-status-warning', text: 'text-gray-900', border: 'border-status-warning' },
  LOW: { bg: 'bg-gray-600', text: 'text-white', border: 'border-gray-600' },
  PAUSED: { bg: 'bg-red-700', text: 'text-white', border: 'border-red-700' },
};

function DataPoint({ label, value, highlight = false, alert = false }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className={`font-mono text-xs ${alert ? 'text-status-critical font-bold' : highlight ? 'text-white font-semibold' : 'text-gray-300'}`}>
        {value}
      </span>
    </div>
  );
}

function MetricsPanel({ metrics }) {
  if (!metrics) return null;

  const metricItems = [
    { label: 'Impressions', value: metrics.impressions.toLocaleString(), alert: metrics.impressions > 1000000 && metrics.conversions < 5 },
    { label: 'Clicks', value: metrics.clicks.toLocaleString() },
    { label: 'CTR', value: `${metrics.ctr}%`, alert: metrics.ctr < 0.5, good: metrics.ctr >= 2.0 },
    { label: 'CPC', value: `$${metrics.cpc.toFixed(2)}`, alert: metrics.cpc > 20 },
    { label: 'CPM', value: `$${metrics.cpm.toFixed(2)}` },
    { label: 'Conversions', value: metrics.conversions.toLocaleString(), alert: metrics.conversions === 0 },
    { label: 'Revenue', value: `$${metrics.revenue.toLocaleString()}` },
    { label: 'ROAS', value: `${metrics.roas}x`, alert: metrics.roas < 1.0, good: metrics.roas >= 3.0 },
  ];

  return (
    <div className="bg-gray-900 rounded p-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-blue-400 text-[10px] font-semibold uppercase tracking-wide">Campaign Metrics</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {metricItems.map((item) => (
          <div key={item.label} className="flex justify-between items-center">
            <span className="text-gray-400 text-[11px]">{item.label}</span>
            <span className={`font-mono text-xs ${item.alert ? 'text-status-critical font-bold' : item.good ? 'text-status-healthy font-semibold' : 'text-gray-300'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignCard({ analysis, isExpanded, onToggle }) {
  const colors = analysis.status === 'PAUSED'
    ? severityColors.PAUSED
    : severityColors[analysis.severity] || severityColors.LOW;

  const isProblem = analysis.severity !== 'LOW';
  const findings = analysis.dataFindings;

  return (
    <div className={`bg-gray-800 rounded-lg border-l-4 ${colors.border} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-700/50 transition-colors text-left"
      >
        {/* Status Badge */}
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colors.bg} ${colors.text} whitespace-nowrap`}>
          {analysis.status === 'PAUSED' ? '⏸ PAUSED' : analysis.severity}
        </span>

        {/* Campaign Info */}
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">{analysis.campaignName}</div>
        </div>

        {/* Quick Stats */}
        <div className={`text-xs font-bold flex-shrink-0 ${findings.variancePercent > 10 || findings.variancePercent < -10 ? 'text-status-critical' : 'text-status-healthy'}`}>
          {findings.variancePercent > 0 ? '+' : ''}{findings.variancePercent}%
        </div>

        {/* Expand Icon */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-gray-700 pt-2.5">
          {/* Key Data Findings */}
          <div className="bg-gray-900 rounded p-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-purple-400 text-[10px] font-semibold uppercase tracking-wide">Key Data Points</span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <DataPoint label="Actual Spend" value={`$${findings.actualSpend.toLocaleString()}`} highlight />
              <DataPoint label="Daily Cap" value={`$${findings.dailyCap.toLocaleString()}`} />
              <DataPoint
                label="Variance %"
                value={`${findings.variancePercent > 0 ? '+' : ''}${findings.variancePercent}%`}
                alert={Math.abs(findings.variancePercent) > 10}
              />
              <DataPoint
                label="Variance $"
                value={`${findings.varianceAmount > 0 ? '+' : ''}$${findings.varianceAmount.toLocaleString()}`}
                alert={Math.abs(findings.varianceAmount) > 1000}
              />
            </div>

            {/* Paused Badge */}
            {findings.isPaused && (
              <div className="mt-2 flex items-center gap-1.5 p-1.5 bg-red-900/30 rounded border border-red-700">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-400 text-xs font-semibold">Campaign was AUTO-PAUSED by agent</span>
              </div>
            )}

            {/* Data Discrepancy */}
            {findings.discrepancy && (
              <div className="mt-2 p-2.5 bg-status-escalated/20 rounded border border-status-escalated/50">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="w-3.5 h-3.5 text-status-escalated" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-status-escalated text-[10px] font-semibold uppercase">Data Discrepancy Detected</span>
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform API:</span>
                    <span className="text-white font-mono">${findings.discrepancy.apiValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Internal DB:</span>
                    <span className="text-white font-mono">${findings.discrepancy.dbValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-0.5 mt-0.5">
                    <span className="text-gray-400">Difference:</span>
                    <span className="text-status-critical font-mono font-bold">${Math.abs(findings.discrepancy.difference).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Campaign Metrics */}
          {findings.metrics && <MetricsPanel metrics={findings.metrics} />}

          {/* Issue + Root Cause combined */}
          {isProblem && (
            <div className="space-y-1.5">
              <div className="bg-gray-900/50 rounded p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-red-400 text-[10px] font-semibold uppercase">Issue</span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">{analysis.issue}</p>
              </div>
              <div className="bg-gray-900/50 rounded p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  <span className="text-yellow-400 text-[10px] font-semibold uppercase">Root Cause</span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">{analysis.rootCause}</p>
              </div>
            </div>
          )}

          {/* Action Required */}
          {isProblem && (
            <div className="bg-status-healthy/10 border border-status-healthy/30 rounded p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3.5 h-3.5 text-status-healthy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="text-status-healthy text-[10px] font-semibold uppercase">Recommended Actions</span>
              </div>
              <p className="text-white text-xs">{analysis.actionRequired}</p>
            </div>
          )}

          {/* Action Output Indicator */}
          {analysis.actionOutput && analysis.actionOutput.type !== 'NO_ACTION_REQUIRED' && (
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-gray-700">
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-purple-400 text-xs">Action: <strong>{analysis.actionOutput.displayName}</strong></span>
            </div>
          )}

          {/* Healthy Campaign Message */}
          {!isProblem && (
            <div className="flex items-center gap-1.5 text-status-healthy">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">Pacing within normal thresholds</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LLMInsights({ insight, overallStatus, visible, isLoading, onAction }) {
  const [showActionModal, setShowActionModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());

  // Auto-expand critical/paused cards when insight changes
  useEffect(() => {
    if (insight?.campaignAnalysis) {
      const autoExpand = new Set();
      insight.campaignAnalysis.forEach((c, i) => {
        if (c.severity === 'CRITICAL' || c.status === 'PAUSED') {
          autoExpand.add(i);
        }
      });
      setExpandedCards(autoExpand);
    }
  }, [insight]);

  const toggleCard = (index) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (insight?.campaignAnalysis) {
      setExpandedCards(new Set(insight.campaignAnalysis.map((_, i) => i)));
    }
  };

  const collapseAll = () => {
    setExpandedCards(new Set());
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 p-3">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-gray-700" />
            <div className="absolute inset-0 rounded-full border-2 border-t-purple-500 animate-spin" />
          </div>
          <div className="text-purple-400 font-medium text-sm">Analyzing campaigns...</div>
          <div className="text-xs text-gray-500 mt-1">Generating per-campaign insights</div>
        </div>
      </div>
    );
  }

  if (!visible || !insight) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 p-3">
        <div className="text-center">
          <div className="text-3xl mb-2">🤖</div>
          <div className="text-sm">AI insights will appear here</div>
        </div>
      </div>
    );
  }

  const hasCampaignAnalysis = insight.campaignAnalysis && insight.campaignAnalysis.length > 0;
  const actionableCampaigns = insight.campaignAnalysis?.filter(c =>
    c.actionOutput?.type !== 'NO_ACTION_REQUIRED'
  ) || [];
  const pausedCampaigns = insight.campaignAnalysis?.filter(c =>
    c.dataFindings?.isPaused
  ) || [];

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">AI Analysis</h2>
          <StatusBadge status={overallStatus} size="sm" />
        </div>

        {/* Title & Summary */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-sm font-bold text-white mb-1">{insight.title}</h3>
          <p className="text-gray-300 text-xs leading-relaxed">{insight.summary}</p>
        </div>

        {/* Portfolio Summary */}
        {insight.portfolioSummary && (
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-status-healthy/20 rounded-lg py-1.5 px-2 text-center">
              <div className="text-lg font-bold text-status-healthy leading-tight">{insight.portfolioSummary.healthyCampaigns}</div>
              <div className="text-[10px] text-gray-400">Healthy</div>
            </div>
            <div className="bg-status-warning/20 rounded-lg py-1.5 px-2 text-center">
              <div className="text-lg font-bold text-status-warning leading-tight">{insight.portfolioSummary.warningCampaigns}</div>
              <div className="text-[10px] text-gray-400">Warning</div>
            </div>
            <div className="bg-status-critical/20 rounded-lg py-1.5 px-2 text-center">
              <div className="text-lg font-bold text-status-critical leading-tight">{insight.portfolioSummary.criticalCampaigns}</div>
              <div className="text-[10px] text-gray-400">Critical</div>
            </div>
          </div>
        )}

        {/* Immediate Action Alert */}
        {insight.immediateAction && (
          <div className="bg-purple-500/10 border border-purple-500/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-purple-400 text-xs font-semibold uppercase">Immediate Action Required</span>
            </div>
            <p className="text-white text-xs">{insight.immediateAction}</p>
          </div>
        )}

        {/* Off-Hours Protocol Banner */}
        {insight.offHoursNotice && (
          <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">🌙</span>
              <span className="text-amber-400 text-xs font-semibold uppercase">Off-Hours Protocol Active</span>
            </div>
            <p className="text-amber-200 text-xs mb-1.5">{insight.offHoursNotice.reason}</p>
            <div className="text-[10px] text-amber-400/70 space-y-0.5">
              <div>Auto-pause threshold: {insight.offHoursNotice.pauseThreshold}% (normal: 50%)</div>
              {insight.notifications?.pagerDuty && (
                <div>PagerDuty: {insight.notifications.pagerDuty.severity} alert → {insight.notifications.pagerDuty.target}</div>
              )}
            </div>
          </div>
        )}

        {/* Hypothetical Risk Scenarios */}
        {insight.hypotheticalScenarios && (
          <div className="bg-gray-800 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-status-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-status-warning text-[10px] font-semibold uppercase tracking-wide">Why Autonomous Action Is Blocked</span>
            </div>
            {insight.hypotheticalScenarios.map((scenario, idx) => (
              <div key={idx} className="bg-gray-900/50 rounded p-2">
                <div className="text-white text-xs font-semibold mb-0.5">{scenario.title}</div>
                <p className="text-gray-400 text-[11px] leading-relaxed">{scenario.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Notifications Sent */}
        {insight.notifications && (
          <div className="bg-gray-800 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg className="w-3.5 h-3.5 text-status-healthy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-status-healthy text-[10px] font-semibold uppercase tracking-wide">Notifications Sent</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="text-status-healthy">Slack → {insight.notifications.slack}</div>
              <div className="text-status-healthy">Email → {insight.notifications.email}</div>
              <div className="text-status-healthy">{insight.notifications.ticket?.startsWith('INC') ? 'Incident' : 'JIRA'} → {insight.notifications.ticket}</div>
              {insight.notifications.pagerDuty && (
                <div className="text-amber-400">PagerDuty {insight.notifications.pagerDuty.severity} → {insight.notifications.pagerDuty.target}</div>
              )}
            </div>
          </div>
        )}

        {/* Campaign Analysis Header */}
        {hasCampaignAnalysis && (
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Campaign Analysis ({insight.campaignAnalysis.length})
            </h4>
            <div className="flex gap-2">
              <button onClick={expandAll} className="text-[10px] text-gray-500 hover:text-white transition-colors">Expand All</button>
              <span className="text-gray-600">|</span>
              <button onClick={collapseAll} className="text-[10px] text-gray-500 hover:text-white transition-colors">Collapse All</button>
            </div>
          </div>
        )}

        {/* Campaign Cards */}
        {hasCampaignAnalysis && (
          <div className="space-y-1.5">
            {insight.campaignAnalysis.map((analysis, idx) => (
              <CampaignCard
                key={analysis.campaignId || idx}
                analysis={analysis}
                isExpanded={expandedCards.has(idx)}
                onToggle={() => toggleCard(idx)}
              />
            ))}
          </div>
        )}

        {/* View Actions Button */}
        {actionableCampaigns.length > 0 && (
          <button
            onClick={() => setShowActionModal(true)}
            className={`
              w-full py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
              ${pausedCampaigns.length > 0
                ? 'bg-status-critical hover:bg-status-critical/80 text-white'
                : overallStatus === 'warning'
                ? 'bg-status-warning hover:bg-status-warning/80 text-gray-900'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View {pausedCampaigns.length > 0 ? `${pausedCampaigns.length} Paused Campaign${pausedCampaigns.length > 1 ? 's' : ''}` : `${actionableCampaigns.length} Action${actionableCampaigns.length > 1 ? 's' : ''}`}
          </button>
        )}

        {/* Footer */}
        {insight.isLLMGenerated && (
          <div className="pt-2 border-t border-gray-700 text-center">
            <div className="text-[10px] text-purple-400/70">Enhanced with Gemini 1.5 Flash</div>
          </div>
        )}
      </div>

      {/* Action Output Modal */}
      <ActionOutputModal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        actionOutputs={insight.campaignAnalysis || []}
        overallStatus={overallStatus}
      />
    </div>
  );
}

export default LLMInsights;
