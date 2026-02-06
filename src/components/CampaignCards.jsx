import StatusBadge from './StatusBadge';

/**
 * CampaignCards - Grid display of campaign status cards.
 *
 * Shows spend progress, variance, and status for each campaign.
 */

const platformIcons = {
  google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  meta: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.19 2.24.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" fill="#1877F2"/>
    </svg>
  ),
  tiktok: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  dv360: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
};

const platformColors = {
  google: 'border-blue-500',
  meta: 'border-blue-600',
  tiktok: 'border-pink-500',
  dv360: 'border-green-500',
};

function formatCurrency(value) {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Build a list of data quality issues from a campaign's confidence breakdown.
 */
function getDataQualityIssues(campaign) {
  if (!campaign.isLowConfidence && !campaign.discrepancy) return [];
  const issues = [];
  const b = campaign.confidenceBreakdown;

  if (campaign.discrepancy) {
    issues.push({
      label: 'Spend Mismatch',
      detail: `API reports ${formatCurrency(campaign.discrepancy.api)} but tracker shows ${formatCurrency(campaign.discrepancy.internal)}`,
      severity: 'high',
    });
  }

  if (b?.nameSimilarity?.score < 0.7) {
    issues.push({
      label: 'Name Mismatch',
      detail: `Similarity score ${Math.round(b.nameSimilarity.score * 100)}% — names differ between platform and tracker`,
      severity: 'high',
    });
  }

  if (b?.metadataMatch?.score < 0.7) {
    const details = b.metadataMatch.details;
    const badFields = [
      ...(details?.mismatchedFields?.map(f => f.field) || []),
      ...(details?.missingFields || []),
    ];
    issues.push({
      label: 'Metadata Corruption',
      detail: badFields.length > 0
        ? `Fields affected: ${badFields.join(', ')}`
        : `Match score ${Math.round(b.metadataMatch.score * 100)}% — fields missing or invalid`,
      severity: 'medium',
    });
  }

  if (b?.freshness?.score < 0.4) {
    issues.push({
      label: 'Stale Data',
      detail: `Freshness score ${Math.round(b.freshness.score * 100)}% — data may be 12+ hours old`,
      severity: 'medium',
    });
  }

  if (b?.spendConsistency?.details?.hasDiscrepancy && !campaign.discrepancy) {
    issues.push({
      label: 'Spend Inconsistency',
      detail: `${b.spendConsistency.details.discrepancyPct}% difference between sources`,
      severity: 'high',
    });
  }

  return issues;
}

function CampaignCard({ campaign, index }) {
  const { name, platform, spend, cap, variance, status, paused, discrepancy, metrics } = campaign;
  const progress = Math.min((spend / cap) * 100, 100);
  const overBudget = spend > cap;
  const dataIssues = getDataQualityIssues(campaign);
  const hasDataQualityProblem = dataIssues.length > 0;
  const isCritical = status === 'critical' || paused;
  const isZeroDelivery = spend === 0 && cap > 0;
  const isHealthy = status === 'healthy' && !paused && !hasDataQualityProblem;

  // Card style priority: paused/critical (red) > data quality (amber) > default (platform color)
  let cardStyle = 'bg-gray-800 ' + (platformColors[platform] || 'border-gray-500');
  if (isCritical) {
    cardStyle = 'bg-red-950/50 border-red-500 ring-1 ring-red-500/40';
  } else if (hasDataQualityProblem) {
    cardStyle = 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/30';
  }

  return (
    <div
      className={`rounded-lg border-l-4 p-4 animate-slide-in ${cardStyle}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{platformIcons[platform]}</span>
          <div>
            <h3 className="font-medium text-white text-sm">{name}</h3>
            <span className="text-xs text-gray-500 uppercase">{platform}</span>
          </div>
        </div>
        <StatusBadge status={paused ? 'paused' : hasDataQualityProblem ? 'escalated' : status} size="sm" />
      </div>

      {/* Spend info */}
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Spend</span>
          <span className={overBudget ? 'text-status-critical font-semibold' : 'text-white'}>
            {formatCurrency(spend)} / {formatCurrency(cap)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`
              h-full rounded-full transition-all duration-1000 ease-out
              ${isCritical ? 'bg-red-500' : overBudget ? 'bg-status-critical' : status === 'warning' ? 'bg-status-warning' : 'bg-status-healthy'}
            `}
            style={{
              width: `${Math.min(progress, 100)}%`,
              animation: 'progress-fill 0.8s ease-out forwards',
            }}
          />
        </div>
      </div>

      {/* Variance */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Variance</span>
        <span
          className={`
            font-mono font-semibold
            ${Math.abs(variance) <= 5 ? 'text-status-healthy' : ''}
            ${Math.abs(variance) > 5 && Math.abs(variance) <= 15 ? 'text-status-warning' : ''}
            ${Math.abs(variance) > 15 ? 'text-status-critical' : ''}
          `}
        >
          {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
        </span>
      </div>

      {/* Data Quality Issues panel (Scenario B) */}
      {hasDataQualityProblem && (
        <div className="mt-3 p-3 bg-amber-900/30 rounded-lg border border-amber-500/40">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs text-amber-400 font-semibold uppercase">Data Quality — Human Review Required</span>
          </div>
          <div className="space-y-1.5">
            {dataIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${issue.severity === 'high' ? 'bg-amber-400' : 'bg-amber-600'}`} />
                <div>
                  <span className="text-xs text-amber-300 font-medium">{issue.label}: </span>
                  <span className="text-xs text-gray-400">{issue.detail}</span>
                </div>
              </div>
            ))}
          </div>
          {campaign.confidence != null && (
            <div className="mt-2 pt-2 border-t border-amber-500/20 flex justify-between text-xs">
              <span className="text-amber-400/70">Confidence Score</span>
              <span className="text-amber-300 font-mono font-semibold">{Math.round(campaign.confidence * 100)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Critical / Halted Campaign panel (Scenario D) */}
      {isCritical && !hasDataQualityProblem && (
        <div className="mt-3 p-3 bg-red-900/40 rounded-lg border border-red-500/50">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {paused
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              }
            </svg>
            <span className="text-xs text-red-400 font-semibold uppercase">
              {paused ? 'Campaign Halted — Auto-Paused by Agent' : isZeroDelivery ? 'Zero Delivery — Campaign Not Spending' : 'Critical Variance — Review in AI Analysis'}
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            {isZeroDelivery ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Budget at Risk</span>
                  <span className="text-red-300 font-mono font-semibold">{formatCurrency(cap)}</span>
                </div>
                <div className="text-red-300/70">Campaign has $0 spend — check ad approval, targeting, and billing status.</div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">{variance > 0 ? 'Overspend' : 'Underspend'}</span>
                  <span className="text-red-300 font-mono font-semibold">
                    {variance > 0 ? '+' : ''}{formatCurrency(Math.abs(spend - cap))} ({variance > 0 ? '+' : ''}{variance.toFixed(0)}%)
                  </span>
                </div>
                {paused && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Action Taken</span>
                    <span className="text-red-300 font-medium">Pause + Incident Ticket</span>
                  </div>
                )}
                {!paused && (
                  <div className="text-red-300/70">Threshold not reached for auto-pause — see AI Analysis for recommended action.</div>
                )}
              </>
            )}
            {metrics && metrics.roas < 1.0 && !isZeroDelivery && (
              <div className="flex justify-between">
                <span className="text-gray-400">ROAS</span>
                <span className="text-red-300 font-mono font-semibold">{metrics.roas}x</span>
              </div>
            )}
            {metrics && metrics.conversions <= 2 && metrics.impressions > 10000 && (
              <div className="mt-1.5 pt-1.5 border-t border-red-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-red-300">Fraud signal: {metrics.impressions.toLocaleString()} impressions, {metrics.conversions} conversions</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics strip */}
      {metrics && (
        <div className="mt-3 pt-2 border-t border-gray-700 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-gray-500 uppercase">CTR</div>
            <div className={`text-xs font-mono font-semibold ${metrics.ctr < 0.5 ? 'text-status-critical' : 'text-gray-300'}`}>
              {metrics.ctr}%
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase">ROAS</div>
            <div className={`text-xs font-mono font-semibold ${metrics.roas < 1.0 ? 'text-status-critical' : metrics.roas >= 3.0 ? 'text-status-healthy' : 'text-gray-300'}`}>
              {metrics.roas}x
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Conv</div>
            <div className="text-xs font-mono font-semibold text-gray-300">
              {metrics.conversions.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBanner({ campaigns }) {
  const pausedCount = campaigns.filter(c => c.paused).length;
  const criticalCount = campaigns.filter(c => c.status === 'critical' && !c.paused).length;
  const dataQualityCount = campaigns.filter(c => getDataQualityIssues(c).length > 0).length;

  if (pausedCount === 0 && criticalCount === 0 && dataQualityCount === 0) return null;

  if (pausedCount > 0 || criticalCount > 0) {
    const totalAffected = pausedCount + criticalCount;
    const totalOverspend = campaigns
      .filter(c => c.status === 'critical' || c.paused)
      .reduce((sum, c) => sum + Math.max(0, c.spend - c.cap), 0);
    const hasZeroDelivery = campaigns.some(c => (c.status === 'critical' || c.paused) && c.spend === 0);

    return (
      <div className="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-500/40 flex items-start gap-3">
        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <div className="text-sm text-red-300 font-semibold">
            {totalAffected} campaign{totalAffected > 1 ? 's' : ''} flagged
            {pausedCount > 0 && ` — ${pausedCount} halted`}
            {totalOverspend > 0 && ` — ${formatCurrency(totalOverspend)} overspend`}
            {hasZeroDelivery && ' — zero delivery detected'}
          </div>
          <div className="text-xs text-red-400/70 mt-0.5">Check AI Analysis panel for root cause and recommended actions.</div>
        </div>
      </div>
    );
  }

  if (dataQualityCount > 0) {
    return (
      <div className="mb-4 p-3 bg-amber-900/30 rounded-lg border border-amber-500/40 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <div className="text-sm text-amber-300 font-semibold">
            {dataQualityCount} campaign{dataQualityCount > 1 ? 's' : ''} with data quality issues — autonomous action blocked
          </div>
          <div className="text-xs text-amber-400/70 mt-0.5">Human verification required. See AI Analysis for details.</div>
        </div>
      </div>
    );
  }

  return null;
}

function severityRank(campaign) {
  if (campaign.paused) return 0;
  if (campaign.status === 'critical') return 1;
  if (getDataQualityIssues(campaign).length > 0) return 2;
  if (campaign.status === 'warning') return 3;
  return 4;
}

export function CampaignCards({ campaigns, visible }) {
  if (!visible || campaigns.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div>Campaign data will appear here</div>
        </div>
      </div>
    );
  }

  const sorted = [...campaigns].sort((a, b) => severityRank(a) - severityRank(b));

  return (
    <div className="h-full overflow-y-auto p-4">
      <SummaryBanner campaigns={campaigns} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {sorted.map((campaign, index) => (
          <CampaignCard key={campaign.id} campaign={campaign} index={index} />
        ))}
      </div>
    </div>
  );
}

export default CampaignCards;
