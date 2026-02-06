import { useState } from 'react';

/**
 * ActionOutputModal - Displays fake API responses for executed actions.
 */

export function ActionOutputModal({ isOpen, onClose, actionOutputs, overallStatus }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen || !actionOutputs || actionOutputs.length === 0) return null;

  // Filter to only show actionable outputs (not NO_ACTION_REQUIRED)
  const actionableOutputs = actionOutputs.filter(o => o.actionOutput?.type !== 'NO_ACTION_REQUIRED');

  if (actionableOutputs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-lg w-full p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">All Systems Healthy</h2>
            <p className="text-gray-400 mb-6">No actions were required. All campaigns are pacing within acceptable thresholds.</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-status-healthy text-white rounded-lg font-medium hover:bg-status-healthy/80"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentOutput = actionableOutputs[activeTab];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Executed Actions</h2>
            <p className="text-sm text-gray-400">{actionableOutputs.length} action(s) taken by the agent</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        {actionableOutputs.length > 1 && (
          <div className="flex border-b border-gray-700 px-4">
            {actionableOutputs.map((output, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === idx
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {output.campaignId || `Action ${idx + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <ActionOutputContent output={currentOutput} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Actions executed at {new Date().toLocaleTimeString()}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const json = JSON.stringify(currentOutput.actionOutput, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open JSON
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-500"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionOutputContent({ output }) {
  const actionOutput = output.actionOutput;

  if (!actionOutput) return null;

  if (actionOutput.type === 'CAMPAIGN_PAUSED') {
    return (
      <div className="space-y-6">
        {/* Status Banner */}
        <div className="bg-status-critical/20 border border-status-critical/50 rounded-lg p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-status-critical/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-status-critical" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold">Campaign Paused</div>
            <div className="text-status-critical">{output.campaignName}</div>
          </div>
        </div>

        {/* API Request */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">API Request</h3>
          <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <div className="text-purple-400 mb-2">
              {actionOutput.request.method} {actionOutput.request.endpoint}
            </div>
            <pre className="text-gray-300">{JSON.stringify(actionOutput.request.body, null, 2)}</pre>
          </div>
        </div>

        {/* API Response */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">API Response</h3>
          <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-status-healthy/20 text-status-healthy rounded text-xs">
                {actionOutput.response.status} OK
              </span>
            </div>
            <pre className="text-gray-300">{JSON.stringify(actionOutput.response.body, null, 2)}</pre>
          </div>
        </div>

        {/* Slack Notification */}
        {actionOutput.slackNotification && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Slack Notification Sent</h3>
            <div className="bg-[#1a1d21] rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-[#E01E5A]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                </svg>
                <span className="text-white font-medium">{actionOutput.slackNotification.channel}</span>
              </div>
              <div className="bg-[#222529] rounded p-3">
                <div className="text-white font-bold mb-1">🚨 Campaign Auto-Paused</div>
                <div className="text-gray-300 text-sm whitespace-pre-line">
                  <strong>Campaign:</strong> {output.campaignName}{'\n'}
                  <strong>ID:</strong> {output.campaignId}{'\n'}
                  <strong>Variance:</strong> {output.dataFindings?.variancePercent}%{'\n'}
                  <strong>Overspend:</strong> ${Math.abs(output.dataFindings?.varianceAmount || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (actionOutput.type === 'BID_ADJUSTMENT_RECOMMENDED') {
    const rec = actionOutput.recommendation;
    return (
      <div className="space-y-6">
        {/* Status Banner */}
        <div className="bg-status-warning/20 border border-status-warning/50 rounded-lg p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-status-warning/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-status-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold">Bid Adjustment Recommended</div>
            <div className="text-status-warning">{output.campaignName}</div>
          </div>
        </div>

        {/* Recommendation Details */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Proposed Change</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-500 text-xs">Direction</div>
              <div className="text-white font-medium">{rec.proposedChange.direction} by {rec.proposedChange.percentage}%</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Status</div>
              <div className="text-status-warning font-medium">{rec.status}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Current Spend</div>
              <div className="text-white font-medium">${rec.currentSpend?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Variance</div>
              <div className="text-white font-medium">{rec.variance}%</div>
            </div>
          </div>
        </div>

        {/* Draft API Call */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Draft API Call (Pending Approval)</h3>
          <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <div className="text-yellow-400 mb-2">
              {actionOutput.draftApiCall.method} {actionOutput.draftApiCall.endpoint}
            </div>
            <pre className="text-gray-300">{JSON.stringify(actionOutput.draftApiCall.body, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  if (actionOutput.type === 'DATA_DISCREPANCY_TICKET') {
    const ticket = actionOutput.ticket;
    return (
      <div className="space-y-6">
        {/* Status Banner */}
        <div className="bg-status-escalated/20 border border-status-escalated/50 rounded-lg p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-status-escalated/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-status-escalated" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold">Escalation Ticket Created</div>
            <div className="text-status-escalated">{ticket.id}</div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Ticket Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-500 text-xs">Ticket ID</div>
              <div className="text-white font-mono">{ticket.id}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Priority</div>
              <div className="text-status-critical font-medium">{ticket.priority}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Assigned To</div>
              <div className="text-white">{ticket.assignedTo}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Status</div>
              <div className="text-status-warning font-medium">{ticket.status}</div>
            </div>
          </div>
        </div>

        {/* Campaign Info */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Affected Campaign</h3>
          <div className="text-white">
            <div><strong>ID:</strong> {ticket.campaign.id}</div>
            <div><strong>Name:</strong> {ticket.campaign.name}</div>
            <div><strong>Platform:</strong> {ticket.campaign.platform}</div>
          </div>
        </div>

        {/* Required Actions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Required Actions</h3>
          <ul className="space-y-2">
            {ticket.requiredActions.map((action, idx) => (
              <li key={idx} className="flex items-center gap-3 text-gray-300">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-gray-800" />
                {action}
              </li>
            ))}
          </ul>
        </div>

        {/* Slack Thread Link */}
        {ticket.slackThread && (
          <div className="bg-gray-800 rounded-lg p-4">
            <a
              href={ticket.slackThread}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-status-escalated hover:underline"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
              </svg>
              View Slack Thread
            </a>
          </div>
        )}
      </div>
    );
  }

  // Default fallback
  return (
    <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
      <pre className="text-gray-300">{JSON.stringify(actionOutput, null, 2)}</pre>
    </div>
  );
}

export default ActionOutputModal;
