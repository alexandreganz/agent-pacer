/**
 * AgentFlowDiagram - Visual representation of the agent decision flow.
 * Fixed layout with proper connections and no hover movement.
 */

const scenarioColors = {
  A: { primary: '#00C49A', label: 'Scenario A', path: 'healthy' },
  B: { primary: '#118AB2', label: 'Scenario B', path: 'escalated' },
  C: { primary: '#FFB703', label: 'Scenario C', path: 'warning' },
  D: { primary: '#EF476F', label: 'Scenario D', path: 'critical' },
};

export function AgentFlowDiagram({ activeScenario, isVisible, onClose }) {
  if (!isVisible) return null;

  const scenario = activeScenario ? scenarioColors[activeScenario] : null;

  // Determine which paths are active based on scenario
  const isActive = (nodeId) => {
    if (!activeScenario) return true;

    const activePaths = {
      A: ['fetch', 'reconcile', 'analyze', 'score', 'confidenceCheck', 'highConfidence', 'severityRoute', 'healthy', 'logAction'],
      B: ['fetch', 'reconcile', 'analyze', 'score', 'confidenceCheck', 'lowConfidence', 'escalateAction'],
      C: ['fetch', 'reconcile', 'analyze', 'score', 'confidenceCheck', 'highConfidence', 'severityRoute', 'warning', 'alertAction'],
      D: ['fetch', 'reconcile', 'analyze', 'score', 'confidenceCheck', 'highConfidence', 'severityRoute', 'critical', 'pauseAction'],
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

        {/* Diagram Container */}
        <div className="flex-1 overflow-auto p-6 bg-gray-950">
          <svg
            viewBox="0 0 1100 520"
            className="w-full h-auto min-w-[900px]"
            style={{ maxHeight: 'calc(95vh - 200px)' }}
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="processGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#4F46E5" />
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

            {/* Analyze -> Score */}
            <line x1="140" y1="270" x2="140" y2="310"
              stroke="#64748B" strokeWidth={getStrokeWidth('analyze')}
              opacity={getOpacity('score')} markerEnd="url(#arrow)" />

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
              <text x="140" y="255" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">ANALYZE</text>
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
              <text x="400" y="350" textAnchor="middle" fill="#94A3B8" fontSize="10">≥70%?</text>
            </g>

            {/* Severity Route Diamond */}
            <g opacity={getOpacity('severityRoute')}>
              <polygon points="600,380 660,420 600,460 540,420" fill="#1E293B" stroke="#6366F1" strokeWidth="2" />
              <text x="600" y="415" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Severity</text>
              <text x="600" y="430" textAnchor="middle" fill="#94A3B8" fontSize="10">Route</text>
            </g>

            {/* ===== CONFIDENCE LABELS ===== */}
            <text x="420" y="240" fill="#118AB2" fontSize="11" fontWeight="500">&lt;70%</text>
            <text x="420" y="410" fill="#64748B" fontSize="11" fontWeight="500">≥70%</text>

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
              <text x="920" y="418" textAnchor="middle" fill="#1E293B" fontSize="14" fontWeight="700">ALERT</text>
              <text x="920" y="435" textAnchor="middle" fill="#451A03" fontSize="11">Recommend Bid</text>
              {activeScenario === 'C' && (
                <circle cx="970" cy="400" r="6" fill="#FFB703" stroke="white" strokeWidth="2">
                  <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* PAUSE (Critical) */}
            <g opacity={getOpacity('pauseAction')}>
              <rect x="860" y="460" width="120" height="60" rx="10" fill="url(#criticalGrad)" />
              <text x="920" y="488" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">PAUSE</text>
              <text x="920" y="505" textAnchor="middle" fill="#FECACA" fontSize="11">Auto-Stop</text>
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
              <text x="75" y="465" fill="#00C49A" fontSize="10">● Healthy: ≤10%</text>
              <text x="75" y="480" fill="#FFB703" fontSize="10">● Warning: 10-25%</text>
              <text x="75" y="495" fill="#EF476F" fontSize="10">● Critical: &gt;25%</text>
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
                  <PathChip label="3. Analyze Variance" desc="All ≤10%" />
                  <PathChip label="4. Score Confidence" desc="94%" />
                  <PathChip label="5. Check ≥70%" desc="Pass" color="#00C49A" />
                  <PathChip label="6. Route: Healthy" color="#00C49A" />
                  <PathChip label="→ LOG" desc="No action needed" color="#00C49A" />
                </>
              )}
              {activeScenario === 'B' && (
                <>
                  <PathChip label="1. Fetch Data" />
                  <PathChip label="2. Reconcile" desc="Discrepancy found" color="#118AB2" />
                  <PathChip label="3. Analyze" />
                  <PathChip label="4. Score Confidence" desc="42%" color="#118AB2" />
                  <PathChip label="5. Check ≥70%" desc="Fail" color="#118AB2" />
                  <PathChip label="→ ESCALATE" desc="Human review" color="#118AB2" />
                </>
              )}
              {activeScenario === 'C' && (
                <>
                  <PathChip label="1. Fetch Data" />
                  <PathChip label="2. Reconcile" />
                  <PathChip label="3. Analyze Variance" desc="10-25%" color="#FFB703" />
                  <PathChip label="4. Score Confidence" desc="87%" />
                  <PathChip label="5. Check ≥70%" desc="Pass" />
                  <PathChip label="6. Route: Warning" color="#FFB703" />
                  <PathChip label="→ ALERT" desc="Bid +12%" color="#FFB703" />
                </>
              )}
              {activeScenario === 'D' && (
                <>
                  <PathChip label="1. Fetch Data" />
                  <PathChip label="2. Reconcile" />
                  <PathChip label="3. Analyze Variance" desc=">25%" color="#EF476F" />
                  <PathChip label="4. Score Confidence" desc="98%" />
                  <PathChip label="5. Check ≥70%" desc="Pass" />
                  <PathChip label="6. Route: Critical" color="#EF476F" />
                  <PathChip label="→ PAUSE" desc="Auto-stop" color="#EF476F" />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
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
