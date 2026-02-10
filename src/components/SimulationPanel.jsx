import { useState } from 'react';
import { getForceOffHours, setForceOffHours, isOffHours, isNightTime, isWeekend } from '../utils/timeContext';

/**
 * SimulationPanel - Scenario selection buttons with variation tooltips.
 *
 * Shows 4 scenario buttons with hover tooltips showing potential variations.
 */

const scenarioConfig = {
  A: {
    label: 'Scenario A',
    subtitle: 'Normal Operation',
    color: 'bg-status-healthy',
    hoverColor: 'hover:bg-status-healthy/80',
    borderColor: 'border-status-healthy',
    variations: [
      { name: 'Perfect Pacing', desc: 'All campaigns within ±3% variance' },
      { name: 'Balanced Portfolio', desc: 'Mix of slight over/under pacing, all healthy' },
      { name: 'Strong Delivery', desc: 'All campaigns delivering slightly above target' },
    ],
  },
  B: {
    label: 'Scenario B',
    subtitle: 'Data Mismatch',
    color: 'bg-status-escalated',
    hoverColor: 'hover:bg-status-escalated/80',
    borderColor: 'border-status-escalated',
    variations: [
      { name: 'Spend Discrepancy', desc: 'API reports different spend than internal tracker' },
      { name: 'Campaign Name Mismatch', desc: 'Names don\'t match between platform and database' },
      { name: 'Metadata Corruption', desc: 'Missing or invalid metadata fields' },
      { name: 'Stale Data', desc: 'Data is 24-72 hours old, freshness impacted' },
      { name: 'Multiple Issues', desc: 'Combination of spend, name, and metadata problems' },
    ],
  },
  C: {
    label: 'Scenario C',
    subtitle: 'Pacing Warning',
    color: 'bg-status-warning',
    hoverColor: 'hover:bg-status-warning/80',
    textColor: 'text-gray-900',
    borderColor: 'border-status-warning',
    variations: [
      { name: 'Single Under-Pacing', desc: 'One campaign under-delivering by 12-20%' },
      { name: 'Multiple Under-Pacing', desc: '2-3 campaigns showing delivery issues' },
      { name: 'Moderate Over-Pacing', desc: 'One campaign spending 12-23% above target' },
      { name: 'Platform-Wide Issue', desc: 'All campaigns on one platform under-pacing' },
    ],
  },
  D: {
    label: 'Scenario D',
    subtitle: 'Critical Alert',
    color: 'bg-status-critical',
    hoverColor: 'hover:bg-status-critical/80',
    borderColor: 'border-status-critical',
    variations: [
      { name: 'Critical Overspend', desc: 'One campaign 250-450% over budget — auto-paused' },
      { name: 'Suspicious Spike', desc: 'One campaign 500-1000% spike with fraud signals — auto-paused' },
      { name: 'Budget Exhaustion', desc: 'One campaign exhausted daily budget early (55-90% over) — auto-paused' },
    ],
  },
};

function VariationTooltip({ config, isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 w-72 animate-fadeIn">
      {/* Arrow */}
      <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 ${config.color}`} />

      {/* Tooltip content */}
      <div className={`relative bg-gray-900 rounded-xl border-2 ${config.borderColor} shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`${config.color} ${config.textColor || 'text-white'} px-4 py-2`}>
          <div className="font-semibold">{config.label}</div>
          <div className="text-sm opacity-80">{config.variations.length} possible variations</div>
        </div>

        {/* Variations list */}
        <div className="p-3 space-y-2">
          {config.variations.map((variation, idx) => (
            <div key={idx} className="flex items-start gap-3 group">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${config.color} ${config.textColor || 'text-white'}
              `}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium">{variation.name}</div>
                <div className="text-gray-400 text-xs leading-relaxed">{variation.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700">
          <div className="text-xs text-gray-500 text-center">
            Click to run a random variation
          </div>
        </div>
      </div>
    </div>
  );
}

export function SimulationPanel({ activeScenario, onSelectScenario, isRunning, variationInfo }) {
  const [hoveredScenario, setHoveredScenario] = useState(null);
  const [forceOffHours, setForceOff] = useState(getForceOffHours());
  const naturallyOffHours = isNightTime() || isWeekend();
  const effectiveOffHours = forceOffHours || naturallyOffHours;

  const toggleOffHours = () => {
    const newValue = !forceOffHours;
    setForceOff(newValue);
    setForceOffHours(newValue);
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-medium">Demo Scenarios:</span>
          <div className="flex gap-3">
            {Object.entries(scenarioConfig).map(([id, config]) => (
              <div
                key={id}
                className="relative"
                onMouseEnter={() => setHoveredScenario(id)}
                onMouseLeave={() => setHoveredScenario(null)}
              >
                <button
                  onClick={() => onSelectScenario(id)}
                  disabled={isRunning && activeScenario !== id}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm transition-all relative
                    ${activeScenario === id
                      ? `${config.color} ${config.textColor || 'text-white'} ring-2 ring-white/30`
                      : `bg-gray-700 text-gray-300 ${config.hoverColor} hover:text-white`
                    }
                    ${isRunning && activeScenario !== id ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div>{config.label}</div>
                  <div className={`text-xs ${activeScenario === id ? 'opacity-80' : 'text-gray-500'}`}>
                    {config.subtitle}
                  </div>
                  {/* Variation count badge */}
                  <span className={`
                    absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold
                    ${activeScenario === id ? 'bg-white/30 text-white' : 'bg-gray-600 text-gray-300'}
                  `}>
                    {config.variations.length}
                  </span>
                </button>

                {/* Hover tooltip */}
                <VariationTooltip
                  config={config}
                  isVisible={hoveredScenario === id && !isRunning}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Variation info and status */}
        <div className="flex items-center gap-4">
          {/* Off-Hours Toggle */}
          <button
            onClick={toggleOffHours}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
              ${effectiveOffHours
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : 'bg-gray-700 text-gray-400 border-gray-600 hover:border-gray-500'
              }
            `}
            title={naturallyOffHours && !forceOffHours
              ? 'Off-hours active (real time) — toggle to override'
              : 'Simulate off-hours (nights/weekends) — lowers auto-pause threshold to 30%'
            }
          >
            <span>{effectiveOffHours ? '🌙' : '☀️'}</span>
            <span>{naturallyOffHours && !forceOffHours ? 'Off-Hours (Live)' : 'Off-Hours'}</span>
            <div className={`w-7 h-4 rounded-full relative transition-colors ${forceOffHours ? 'bg-amber-500' : naturallyOffHours ? 'bg-amber-500/50' : 'bg-gray-600'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${forceOffHours ? 'left-3.5' : 'left-0.5'}`} />
            </div>
          </button>

          {variationInfo && (
            <div className="text-right max-w-xs">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm font-medium text-white">{variationInfo.name}</span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                  Active
                </span>
              </div>
              <div className="text-xs text-gray-400 truncate">{variationInfo.description}</div>
            </div>
          )}

          {isRunning && (
            <div className="flex items-center gap-2 text-status-healthy pl-4 border-l border-gray-700">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-status-healthy" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-status-healthy animate-ping" />
              </div>
              <span className="text-sm font-medium">Running</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimulationPanel;
