/**
 * AgentFlowDiagram - Visual representation of the agent decision flow.
 * Fixed layout with proper connections and no hover movement.
 * Includes Performance Modifier decision matrix tab.
 */

import { useState } from 'react';

const scenarioColors = {
  A: { primary: '#00C49A', label: 'Scenario A', path: 'healthy' },
  B: { primary: '#118AB2', label: 'Scenario B', path: 'escalated' },
  C: { primary: '#FFB703', label: 'Scenario C', path: 'warning' },
  D: { primary: '#EF476F', label: 'Scenario D', path: 'critical' },
};

export function AgentFlowDiagram({ activeScenario, isVisible, onClose }) {
  const [activeTab, setActiveTab] = useState('flow');

  if (!isVisible) return null;

  const scenario = activeScenario ? scenarioColors[activeScenario] : null;

  // Determine which paths are active based on scenario
  const isActive = (nodeId) => {
    if (!activeScenario) return true;

    const activePaths = {
      A: ['fetch', 'reconcile', 'analyze', 'perfMod', 'score', 'confidenceCheck', 'highConfidence', 'severityRoute', 'healthy', 'logAction'],
      B: ['fetch', 'reconcile', 'analyze', 'perfMod', 'score', 'confidenceCheck', 'lowConfidence', 'escalateAction'],
      C: ['fetch', 'reconcile', 'analyze', 'perfMod', 'score', 'confidenceCheck', 'highConfidence', 'severityRoute', 'warning', 'alertAction'],
      D: ['fetch', 'reconcile', 'analyze', 'perfMod', 'score', 'confidenceCheck', 'highConfidence', 'severityRoute', 'critical', 'pauseAction'],
    };

    return activePaths[activeScenario]?.includes(nodeId);
  };

  const getOpacity = (nodeId) => activeScenario ? (isActive(nodeId) ? 1 : 0.25) : 1;
  const getStrokeWidth = (nodeId) => activeScenario && isActive(nodeId) ? 3 : 2;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Agent Decision Flow</h2>
            <p className="text-sm text-gray-400">LangGraph-style State Machine Architecture</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Scenario Legend */}
            <div className="flex items-center gap-2">
              {Object.entries(scenarioColors).map(([id, config]) => (
                <div
                  key={id}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                    activeScenario === id ? 'ring-2 ring-white/50' : ''
                  }`}
                  style={{ backgroundColor: `${config.primary}20`, color: config.primary }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.primary }} />
                  {config.label}
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex px-6 pt-3 gap-1 bg-gray-900 flex-shrink-0">
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'flow'
                ? 'bg-gray-950 text-white border border-gray-700 border-b-gray-950'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            Decision Flow
          </button>
          <button
            onClick={() => setActiveTab('perfmod')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'perfmod'
                ? 'bg-gray-950 text-white border border-gray-700 border-b-gray-950'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            Performance Modifier
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">NEW</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'flow' ? (
          <>
            {/* Diagram Container */}
            <div className="flex-1 overflow-auto p-6 bg-gray-950">
              <svg
                viewBox="0 0 1100 585"
                className="w-full h-auto min-w-[900px]"
                style={{ maxHeight: 'calc(95vh - 240px)' }}
              >
                <defs>
                  {/* Gradients */}
                  <linearGradient id="processGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#4F46E5" />
                  </linearGradient>
                  <linearGradient id="perfModGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#0891B2" />
                  </linearGradient>
                  <linearGradient id="healthyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00C49A" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="warningGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFB703" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <linearGradient id="criticalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EF476F" />
                    <stop offset="100%" stopColor="#DC2626" />
                  </linearGradient>
                  <linearGradient id="escalatedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#118AB2" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>

                  {/* Arrow markers */}
                  <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#64748B" />
                  </marker>
                  <marker id="arrowActive" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#A78BFA" />
                  </marker>
                  <marker id="arrowCyan" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#06B6D4" />
                  </marker>
                </defs>

                {/* ===== CONNECTION LINES ===== */}

                {/* Fetch -> Reconcile */}
                <line x1="140" y1="70" x2="140" y2="110"
                  stroke="#64748B" strokeWidth={getStrokeWidth('fetch')}
                  opacity={getOpacity('reconcile')} markerEnd="url(#arrow)" />

                {/* Reconcile -> Analyze */}
                <line x1="140" y1="170" x2="140" y2="210"
                  stroke="#64748B" strokeWidth={getStrokeWidth('reconcile')}
                  opacity={getOpacity('analyze')} markerEnd="url(#arrow)" />

                {/* Analyze -> Perf Mod */}
                <line x1="220" y1="250" x2="270" y2="250"
                  stroke="#06B6D4" strokeWidth={getStrokeWidth('analyze')}
                  opacity={getOpacity('perfMod')} markerEnd="url(#arrowCyan)" />

                {/* Perf Mod -> down into Score top */}
                <path d="M 350 275 L 350 295 L 140 295 L 140 318"
                  fill="none" stroke="#06B6D4" strokeWidth={getStrokeWidth('perfMod')}
                  opacity={getOpacity('score')} markerEnd="url(#arrowCyan)"
                  strokeDasharray="4,3" />

                {/* Score -> Confidence Check */}
                <line x1="220" y1="340" x2="320" y2="340"
                  stroke="#64748B" strokeWidth={getStrokeWidth('score')}
                  opacity={getOpacity('confidenceCheck')} markerEnd="url(#arrow)" />

                {/* Confidence Check -> Low Confidence (Escalate) */}
                <path d="M 400 305 L 400 250 L 520 250"
                  fill="none" stroke="#118AB2" strokeWidth={getStrokeWidth('lowConfidence')}
                  opacity={getOpacity('lowConfidence')} markerEnd="url(#arrow)"
                  strokeDasharray={activeScenario === 'B' ? '0' : '5,5'} />

                {/* Confidence Check -> High Confidence (Severity Route) */}
                <path d="M 400 375 L 400 420 L 520 420"
                  fill="none" stroke="#64748B" strokeWidth={getStrokeWidth('highConfidence')}
                  opacity={getOpacity('highConfidence')} markerEnd="url(#arrow)" />

                {/* Severity Route -> Healthy */}
                <path d="M 680 420 L 750 420 L 750 250 L 850 250"
                  fill="none" stroke="#00C49A" strokeWidth={getStrokeWidth('healthy')}
                  opacity={getOpacity('healthy')} markerEnd="url(#arrow)"
                  strokeDasharray={activeScenario === 'A' ? '0' : '5,5'} />

                {/* Severity Route -> Warning */}
                <line x1="680" y1="420" x2="850" y2="420"
                  stroke="#FFB703" strokeWidth={getStrokeWidth('warning')}
                  opacity={getOpacity('warning')} markerEnd="url(#arrow)"
                  strokeDasharray={activeScenario === 'C' ? '0' : '5,5'} />

                {/* Severity Route -> Critical */}
                <path d="M 680 420 L 750 420 L 750 490 L 850 490"
                  fill="none" stroke="#EF476F" strokeWidth={getStrokeWidth('critical')}
                  opacity={getOpacity('critical')} markerEnd="url(#arrow)"
                  strokeDasharray={activeScenario === 'D' ? '0' : '5,5'} />

                {/* ===== PROCESS NODES (Left Column) ===== */}

                {/* FETCH */}
                <g opacity={getOpacity('fetch')}>
                  <rect x="60" y="30" width="160" height="40" rx="8" fill="url(#processGrad)" />
                  <text x="140" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">FETCH</text>
                </g>

                {/* RECONCILE */}
                <g opacity={getOpacity('reconcile')}>
                  <rect x="60" y="130" width="160" height="40" rx="8" fill="url(#processGrad)" />
                  <text x="140" y="155" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">RECONCILE</text>
                </g>

                {/* ANALYZE */}
                <g opacity={getOpacity('analyze')}>
                  <rect x="60" y="230" width="160" height="40" rx="8" fill="url(#processGrad)" />
                  <text x="140" y="249" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">ANALYZE</text>
                  <text x="140" y="263" textAnchor="middle" fill="#C4B5FD" fontSize="9">Variance + Performance</text>
                </g>

                {/* PERF MOD node */}
                <g opacity={getOpacity('perfMod')}>
                  <rect x="275" y="228" width="150" height="44" rx="8" fill="#0E2C3A" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4,2" />
                  <text x="350" y="248" textAnchor="middle" fill="#22D3EE" fontSize="11" fontWeight="700">PERF MODIFIER</text>
                  <text x="350" y="263" textAnchor="middle" fill="#67E8F9" fontSize="9">ROAS / CTR / Conv.</text>
                </g>

                {/* SCORE */}
                <g opacity={getOpacity('score')}>
                  <rect x="60" y="320" width="160" height="40" rx="8" fill="url(#processGrad)" />
                  <text x="140" y="345" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">SCORE</text>
                </g>

                {/* ===== DECISION DIAMONDS ===== */}

                {/* Confidence Check Diamond */}
                <g opacity={getOpacity('confidenceCheck')}>
                  <polygon points="400,300 460,340 400,380 340,340" fill="#1E293B" stroke="#6366F1" strokeWidth="2" />
                  <text x="400" y="335" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Confidence</text>
                  <text x="400" y="350" textAnchor="middle" fill="#94A3B8" fontSize="10">{'\u2265'}70%?</text>
                </g>

                {/* Severity Route Diamond */}
                <g opacity={getOpacity('severityRoute')}>
                  <polygon points="600,380 660,420 600,460 540,420" fill="#1E293B" stroke="#6366F1" strokeWidth="2" />
                  <text x="600" y="413" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Adjusted</text>
                  <text x="600" y="428" textAnchor="middle" fill="#94A3B8" fontSize="10">Severity</text>
                </g>

                {/* ===== CONFIDENCE LABELS ===== */}
                <text x="420" y="240" fill="#118AB2" fontSize="11" fontWeight="500">&lt;70%</text>
                <text x="420" y="410" fill="#64748B" fontSize="11" fontWeight="500">{'\u2265'}70%</text>

                {/* ===== SEVERITY LABELS ===== */}
                <text x="790" y="245" fill="#00C49A" fontSize="11" fontWeight="500">Healthy</text>
                <text x="790" y="415" fill="#FFB703" fontSize="11" fontWeight="500">Warning</text>
                <text x="790" y="485" fill="#EF476F" fontSize="11" fontWeight="500">Critical</text>

                {/* ===== ACTION NODES (Right Column) ===== */}

                {/* ESCALATE */}
                <g opacity={getOpacity('escalateAction')}>
                  <rect x="530" y="220" width="140" height="60" rx="10" fill="url(#escalatedGrad)" />
                  <text x="600" y="248" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">ESCALATE</text>
                  <text x="600" y="265" textAnchor="middle" fill="#BAE6FD" fontSize="11">Human Review</text>
                  {activeScenario === 'B' && (
                    <circle cx="660" cy="230" r="6" fill="#118AB2" stroke="white" strokeWidth="2">
                      <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>

                {/* LOG (Healthy) */}
                <g opacity={getOpacity('logAction')}>
                  <rect x="860" y="220" width="120" height="60" rx="10" fill="url(#healthyGrad)" />
                  <text x="920" y="248" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">LOG</text>
                  <text x="920" y="265" textAnchor="middle" fill="#D1FAE5" fontSize="11">Monitor Only</text>
                  {activeScenario === 'A' && (
                    <circle cx="970" cy="230" r="6" fill="#00C49A" stroke="white" strokeWidth="2">
                      <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>

                {/* ALERT (Warning) */}
                <g opacity={getOpacity('alertAction')}>
                  <rect x="860" y="390" width="120" height="60" rx="10" fill="url(#warningGrad)" />
                  <text x="920" y="416" textAnchor="middle" fill="#1E293B" fontSize="13" fontWeight="700">ALERT</text>
                  <text x="920" y="433" textAnchor="middle" fill="#451A03" fontSize="10">Perf-Tuned Bid</text>
                  {activeScenario === 'C' && (
                    <circle cx="970" cy="400" r="6" fill="#FFB703" stroke="white" strokeWidth="2">
                      <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>

                {/* PAUSE (Critical) */}
                <g opacity={getOpacity('pauseAction')}>
                  <rect x="860" y="460" width="120" height="60" rx="10" fill="url(#criticalGrad)" />
                  <text x="920" y="486" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">PAUSE</text>
                  <text x="920" y="503" textAnchor="middle" fill="#FECACA" fontSize="10">Auto-Stop + Fraud</text>
                  {activeScenario === 'D' && (
                    <circle cx="970" cy="470" r="6" fill="#EF476F" stroke="white" strokeWidth="2">
                      <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>

                {/* ===== THRESHOLD BOX ===== */}
                <g>
                  <rect x="60" y="420" width="160" height="80" rx="8" fill="#1E293B" stroke="#334155" strokeWidth="1" />
                  <text x="140" y="445" textAnchor="middle" fill="#94A3B8" fontSize="11" fontWeight="600">THRESHOLDS</text>
                  <text x="75" y="465" fill="#00C49A" fontSize="10">{'\u25CF'} Healthy: {'\u2264'}10%</text>
                  <text x="75" y="480" fill="#FFB703" fontSize="10">{'\u25CF'} Warning: 10-50%</text>
                  <text x="75" y="495" fill="#EF476F" fontSize="10">{'\u25CF'} Critical: &gt;50%</text>
                </g>

                {/* ===== PERFORMANCE BOX ===== */}
                <g>
                  <rect x="60" y="510" width="160" height="68" rx="8" fill="#0E2C3A" stroke="#06B6D4" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="140" y="530" textAnchor="middle" fill="#22D3EE" fontSize="10" fontWeight="600">PERFORMANCE RATINGS</text>
                  <text x="75" y="546" fill="#4ADE80" fontSize="9">{'\u25CF'} Strong: ROAS{'\u2265'}3 + Conv{'\u2265'}10</text>
                  <text x="75" y="558" fill="#FBBF24" fontSize="9">{'\u25CF'} Poor: ROAS&lt;1</text>
                  <text x="75" y="570" fill="#F87171" fontSize="9">{'\u25CF'} Fraud: 100K imp + {'\u2264'}2 conv</text>
                </g>

                {/* ===== STEP LABELS ===== */}
                <text x="140" y="20" textAnchor="middle" fill="#64748B" fontSize="10">Step 1</text>
                <text x="140" y="120" textAnchor="middle" fill="#64748B" fontSize="10">Step 2</text>
                <text x="140" y="220" textAnchor="middle" fill="#64748B" fontSize="10">Step 3</text>
                <text x="140" y="310" textAnchor="middle" fill="#64748B" fontSize="10">Step 4</text>
                <text x="400" y="290" textAnchor="middle" fill="#64748B" fontSize="10">Step 5</text>
                <text x="600" y="370" textAnchor="middle" fill="#64748B" fontSize="10">Step 6</text>
              </svg>
            </div>

            {/* Scenario Path Description */}
            {activeScenario && (
              <div className="px-6 py-4 border-t border-gray-700 bg-gray-900 flex-shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scenario.primary }} />
                  <h3 className="text-white font-semibold">{scenario.label} Execution Path</h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {activeScenario === 'A' && (
                    <>
                      <PathChip label="1. Fetch Data" />
                      <PathChip label="2. Reconcile" />
                      <PathChip label="3. Analyze + Perf" desc="All {'\u2264'}10%, normal perf" />
                      <PathChip label="4. Score Confidence" desc="94%" />
                      <PathChip label="5. Check {'\u2265'}70%" desc="Pass" color="#00C49A" />
                      <PathChip label="6. Route: Healthy" color="#00C49A" />
                      <PathChip label="{'\u2192'} LOG" desc="No action needed" color="#00C49A" />
                    </>
                  )}
                  {activeScenario === 'B' && (
                    <>
                      <PathChip label="1. Fetch Data" />
                      <PathChip label="2. Reconcile" desc="Discrepancy found" color="#118AB2" />
                      <PathChip label="3. Analyze + Perf" />
                      <PathChip label="4. Score Confidence" desc="42%" color="#118AB2" />
                      <PathChip label="5. Check {'\u2265'}70%" desc="Fail" color="#118AB2" />
                      <PathChip label="{'\u2192'} ESCALATE" desc="Human review" color="#118AB2" />
                    </>
                  )}
                  {activeScenario === 'C' && (
                    <>
                      <PathChip label="1. Fetch Data" />
                      <PathChip label="2. Reconcile" />
                      <PathChip label="3. Analyze + Perf" desc="10-50%, perf may adjust" color="#FFB703" />
                      <PathChip label="4. Score Confidence" desc="87%" />
                      <PathChip label="5. Check {'\u2265'}70%" desc="Pass" />
                      <PathChip label="6. Route: Adjusted Severity" color="#FFB703" />
                      <PathChip label="{'\u2192'} ALERT" desc="Perf-tuned bid" color="#FFB703" />
                    </>
                  )}
                  {activeScenario === 'D' && (
                    <>
                      <PathChip label="1. Fetch Data" />
                      <PathChip label="2. Reconcile" />
                      <PathChip label="3. Analyze + Perf" desc=">50%, fraud check" color="#EF476F" />
                      <PathChip label="4. Score Confidence" desc="98%" />
                      <PathChip label="5. Check {'\u2265'}70%" desc="Pass" />
                      <PathChip label="6. Route: Critical" color="#EF476F" />
                      <PathChip label="{'\u2192'} PAUSE" desc="Auto-stop + fraud detect" color="#EF476F" />
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Performance Modifier Tab */
          <div className="flex-1 overflow-auto p-6 bg-gray-950">
            <PerformanceModifierTable />
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Performance Modifier Decision Matrix ===== */

function PerformanceModifierTable() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header description */}
      <div className="mb-6 p-4 rounded-xl bg-gray-900 border border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-lg">⚡</span>
          <h3 className="text-white font-bold text-lg">Performance Modifier — Decision Matrix</h3>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          The agent first classifies spend variance ({'<'}10% healthy, 10–50% warning, {'>'}50% critical),
          then assesses campaign performance (
          <span className="text-emerald-400 font-medium">strong</span>: ROAS {'\u2265'}3 & conversions {'\u2265'}10 |{' '}
          <span className="text-amber-400 font-medium">poor</span>: ROAS {'<'}1 |{' '}
          <span className="text-red-400 font-medium">fraud</span>: 100K+ impressions & {'\u2264'}2 conversions).
          The final severity determines the action taken.
        </p>
      </div>

      {/* Overspending Section */}
      <SectionHeader icon="📈" title="Overspending Campaigns" subtitle="Spend exceeds budget target" />
      <div className="mb-6 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <TableHead />
          <tbody>
            <ModifierRow
              direction="overspend"
              variance="warning"
              performance="strong"
              finalSeverity="healthy"
              logic="Profitable overspend — don't throttle revenue-generating spend"
            />
            <ModifierRow
              direction="overspend"
              variance="warning"
              performance="poor"
              finalSeverity="critical"
              logic="Burning money on non-converting traffic — escalate immediately"
            />
            <ModifierRow
              direction="overspend"
              variance="warning"
              performance="fraud"
              finalSeverity="critical"
              logic="Bot/invalid traffic inflating spend — emergency auto-pause"
            />
            <ModifierRow
              direction="overspend"
              variance="critical"
              performance="strong"
              finalSeverity="warning"
              logic="Pausing would destroy profitable revenue — downgrade to bid adjustment"
            />
          </tbody>
        </table>
      </div>

      {/* Underspending Section */}
      <SectionHeader icon="📉" title="Underspending Campaigns" subtitle="Spend is below budget target" />
      <div className="mb-6 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <TableHead />
          <tbody>
            <ModifierRow
              direction="underspend"
              variance="warning"
              performance="strong"
              finalSeverity="critical"
              logic="Missing profitable scale — high-ROAS campaign needs more budget urgently"
            />
            <ModifierRow
              direction="underspend"
              variance="warning"
              performance="poor"
              finalSeverity="healthy"
              logic="Low spend on a low-ROAS campaign — maybe good we're not spending more"
            />
            <ModifierRow
              direction="underspend"
              variance="critical"
              performance="poor"
              finalSeverity="warning"
              logic="Poor performance softens urgency — no rush to scale a losing campaign"
            />
          </tbody>
        </table>
      </div>

      {/* No Change Section */}
      <SectionHeader icon="➖" title="No Modification" subtitle="Severity stays as classified by variance" />
      <div className="rounded-xl border border-gray-700 overflow-hidden opacity-60">
        <table className="w-full">
          <TableHead />
          <tbody>
            <ModifierRow
              direction="any"
              variance="healthy"
              performance="any"
              finalSeverity="nochange"
              logic="Pacing is fine — nothing to modify regardless of performance"
            />
            <ModifierRow
              direction="any"
              variance="any"
              performance="normal"
              finalSeverity="nochange"
              logic="Normal performance — no strong signal to upgrade or downgrade"
              isLast
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-1">
      <span className="text-sm">{icon}</span>
      <span className="text-white font-semibold text-sm">{title}</span>
      <span className="text-gray-500 text-xs">— {subtitle}</span>
    </div>
  );
}

function TableHead() {
  return (
    <thead>
      <tr className="bg-gray-800/50">
        <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-4 py-3 w-[14%]">Campaign</th>
        <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-4 py-3 w-[14%]">Variance</th>
        <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-4 py-3 w-[14%]">Performance</th>
        <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-4 py-3 w-[20%]">Final Severity</th>
        <th className="text-left text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-4 py-3 w-[38%]">Logic</th>
      </tr>
    </thead>
  );
}

const badgeStyles = {
  overspend: 'bg-red-500/10 text-red-400 border-red-500/20',
  underspend: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  any: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  strong: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  poor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  fraud: 'bg-red-500/10 text-red-400 border-red-500/20',
  normal: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  nochange: 'bg-gray-500/10 text-gray-500 border-gray-600/20 border-dashed italic',
};

const dotColors = {
  overspend: 'bg-red-400',
  underspend: 'bg-cyan-400',
  any: 'bg-gray-500',
  healthy: 'bg-emerald-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-400',
  strong: 'bg-emerald-400',
  poor: 'bg-amber-400',
  fraud: 'bg-red-400',
  normal: 'bg-gray-500',
  nochange: 'bg-gray-600',
};

const labels = {
  overspend: 'Overspend',
  underspend: 'Underspend',
  any: 'Any',
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  strong: 'Strong',
  poor: 'Poor',
  fraud: 'Fraud',
  normal: 'Normal',
  nochange: 'No change',
};

function Badge({ type }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border ${badgeStyles[type]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[type]}`} />
      {labels[type]}
    </span>
  );
}

function ModifierRow({ direction, variance, performance, finalSeverity, logic, isLast = false }) {
  return (
    <tr className={`${!isLast ? 'border-b border-gray-800' : ''} hover:bg-gray-800/30 transition-colors`}>
      <td className="px-4 py-3"><Badge type={direction} /></td>
      <td className="px-4 py-3"><Badge type={variance} /></td>
      <td className="px-4 py-3"><Badge type={performance} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">{'\u2192'}</span>
          <Badge type={finalSeverity} />
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-gray-500 text-xs italic">{logic}</span>
      </td>
    </tr>
  );
}

function PathChip({ label, desc, color = '#6366F1' }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
      style={{ backgroundColor: `${color}20`, borderLeft: `3px solid ${color}` }}
    >
      <span className="text-white font-medium">{label}</span>
      {desc && <span className="text-gray-400 text-xs">({desc})</span>}
    </div>
  );
}

export default AgentFlowDiagram;
