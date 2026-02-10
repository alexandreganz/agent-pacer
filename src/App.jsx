import { useState, useEffect, useCallback, useRef } from 'react';
import SimulationPanel from './components/SimulationPanel';
import AgentStream from './components/AgentStream';
import CampaignCards from './components/CampaignCards';
import LLMInsights from './components/LLMInsights';
import AgentFlowDiagram from './components/AgentFlowDiagram';
import { PacingAgent } from './agents/PacingAgent';
import { getScenarioData, scenarioMeta } from './data/mockData';
import { generateInsights, isGeminiConfigured } from './services/gemini';

/**
 * Main App component for AI Pacing Agent Dashboard.
 *
 * Now uses real agent logic with LangGraph-style state machine:
 * Fetch → Reconcile → Analyze → Score → Route → Act
 */
function App() {
  // Scenario state
  const [activeScenario, setActiveScenario] = useState(null);
  const [scenarioInfo, setScenarioInfo] = useState(null);
  const [variationInfo, setVariationInfo] = useState(null);

  // Agent state
  const [isRunning, setIsRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(-1);
  const [displayedLogs, setDisplayedLogs] = useState([]);

  // Results state
  const [campaigns, setCampaigns] = useState([]);
  const [overallStatus, setOverallStatus] = useState('healthy');
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [llmInsight, setLlmInsight] = useState(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [agentActions, setAgentActions] = useState([]);
  const [confidenceData, setConfidenceData] = useState(null);

  // Refs
  const agentRef = useRef(null);
  const logIntervalRef = useRef(null);

  // Diagram visibility
  const [showDiagram, setShowDiagram] = useState(false);

  const geminiAvailable = isGeminiConfigured();

  // Cleanup
  const cleanup = useCallback(() => {
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }
  }, []);

  // Generate LLM insight
  const generateLLMInsight = useCallback(async (campaignData, status, scenarioName, timeContext) => {
    setIsLoadingInsight(true);

    if (!geminiAvailable) {
      // Generate a basic insight without API
      setLlmInsight(generateFallbackInsight(campaignData, status, scenarioName));
      setIsLoadingInsight(false);
      return;
    }

    try {
      const insight = await generateInsights({
        campaigns: campaignData,
        overallStatus: status,
        scenarioName,
        timeContext,
      });

      if (insight) {
        setLlmInsight(insight);
      } else {
        setLlmInsight(generateFallbackInsight(campaignData, status, scenarioName));
      }
    } catch (error) {
      console.error('Failed to generate LLM insight:', error);
      setLlmInsight(generateFallbackInsight(campaignData, status, scenarioName));
    } finally {
      setIsLoadingInsight(false);
    }
  }, [geminiAvailable]);

  // Generate fallback insight without API
  const generateFallbackInsight = (campaignData, status, scenarioName) => {
    const totalSpend = campaignData.reduce((sum, c) => sum + c.spend, 0);
    const totalCap = campaignData.reduce((sum, c) => sum + c.cap, 0);

    const insights = {
      healthy: {
        title: 'All Systems Nominal',
        summary: `All ${campaignData.length} campaigns are pacing within healthy thresholds. Total spend of $${totalSpend.toLocaleString()} against $${totalCap.toLocaleString()} daily budget.`,
        details: [
          'No campaigns exceeding ±10% variance threshold',
          'Data confidence scores above 70% across all sources',
          'No manual intervention required at this time',
        ],
        recommendation: null,
        actionButton: null,
      },
      warning: {
        title: 'Under-Pacing Detected',
        summary: `One or more campaigns showing significant under-delivery. Bid optimization recommended to improve pacing.`,
        details: [
          'Under-pacing campaigns identified in portfolio',
          'Likely causes: competitive auction pressure, narrow targeting',
          'Recommended action: increase bids by 10-15%',
        ],
        recommendation: 'Approve bid increase to improve delivery and reach daily budget targets.',
        actionButton: { label: 'Approve Bid Increase', action: 'approve_bid' },
      },
      critical: {
        title: 'Critical Overspend - Auto-Paused',
        summary: `Emergency protocol executed. One or more campaigns exceeded safe spending thresholds and have been automatically paused.`,
        details: [
          'Critical overspend detected — exceeded safe spending threshold',
          'Campaign automatically paused to prevent further budget loss',
          'Incident ticket created for investigation',
          'Slack notification sent to #media-ops',
        ],
        recommendation: 'Investigate root cause before reactivating. Check for bid multiplier errors or invalid traffic.',
        actionButton: { label: 'View Incident Details', action: 'view_incident' },
      },
      escalated: {
        title: 'Data Discrepancy Detected',
        summary: `Confidence score fell below 70% threshold due to data quality issues. Human review required before autonomous action.`,
        details: [
          'Significant discrepancy between platform API and internal tracker',
          'Metadata fields not matching between sources',
          'Data freshness may be stale (>12 hours)',
        ],
        recommendation: 'Verify correct spend amounts in platform UI before taking pacing action.',
        actionButton: { label: 'Mark as Reviewed', action: 'mark_reviewed' },
      },
    };

    return insights[status] || insights.healthy;
  };

  // Stream logs with typing effect
  const streamLogs = useCallback((logs, onComplete) => {
    let index = 0;
    setDisplayedLogs([]);
    setCurrentLogIndex(0);

    const processNextLog = () => {
      if (index >= logs.length) {
        cleanup();
        onComplete();
        return;
      }

      const log = logs[index];
      setCurrentLogIndex(index);

      // Add log to displayed list after a delay
      const delay = log.message.length > 0 ? Math.min(log.message.length * 12, 350) : 60;

      logIntervalRef.current = setTimeout(() => {
        setDisplayedLogs(prev => [...prev, log]);
        index++;
        processNextLog();
      }, delay);
    };

    processNextLog();
  }, [cleanup]);

  // Run the agent
  const runAgent = useCallback(async (scenarioId) => {
    cleanup();

    // Reset state
    setActiveScenario(scenarioId);
    setScenarioInfo(scenarioMeta[scenarioId]);
    setVariationInfo(null);
    setIsRunning(true);
    setAgentLogs([]);
    setDisplayedLogs([]);
    setCurrentLogIndex(-1);
    setCampaigns([]);
    setOverallStatus('healthy');
    setShowCampaigns(false);
    setShowInsights(false);
    setLlmInsight(null);
    setIsLoadingInsight(false);
    setAgentActions([]);
    setConfidenceData(null);

    // Generate scenario data (random variation)
    const scenarioData = getScenarioData(scenarioId);
    setVariationInfo({
      name: scenarioData.variation,
      description: scenarioData.description,
    });

    // Create and run agent
    const agent = new PacingAgent({
      healthyThreshold: 10.0,
      confidenceThreshold: 0.7,
    });
    agentRef.current = agent;

    try {
      // Run the agent
      const result = await agent.run(scenarioData);

      // Store results
      setCampaigns(result.campaigns);
      setOverallStatus(result.overallStatus);
      setAgentActions(result.actions);
      setConfidenceData(result.confidence);
      setAgentLogs(result.logs);

      // Stream the logs to UI, then chain: campaigns → insights
      streamLogs(result.logs, () => {
        setIsRunning(false);

        // Step 1: Show campaigns after a short pause
        setTimeout(() => {
          setShowCampaigns(true);

          // Step 2: Show insights panel + start generating after campaigns appear
          setTimeout(() => {

            setShowInsights(true);
            setIsLoadingInsight(true);
            generateLLMInsight(
              result.campaigns,
              result.overallStatus,
              scenarioMeta[scenarioId].name,
              result.timeContext
            );
          }, 300);
        }, 200);
      });

    } catch (error) {
      console.error('Agent error:', error);
      setIsRunning(false);
    }
  }, [cleanup, streamLogs, generateLLMInsight]);

  // Handle scenario selection
  const handleSelectScenario = useCallback((scenarioId) => {
    runAgent(scenarioId);
  }, [runAgent]);

  // Handle action button
  const handleAction = useCallback((action) => {
    console.log('Action triggered:', action);
    // Could integrate with backend here
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Format logs for AgentStream component
  const formattedLogs = displayedLogs.map(log => ({
    text: log.message,
    type: log.type,
    delay: 0,
  }));

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🧱</div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Pacing Agent</h1>
              <p className="text-sm text-gray-400">LEGO Media Monitoring Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDiagram(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Agent Flow
            </button>
            <div className="h-8 w-px bg-gray-700" />
            {geminiAvailable ? (
              <div className="flex items-center gap-2 text-sm text-status-healthy">
                <span className="w-2 h-2 rounded-full bg-status-healthy" />
                Gemini Connected
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-status-warning">
                <span className="w-2 h-2 rounded-full bg-status-warning" />
                Demo Mode
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Simulation Panel */}
      <SimulationPanel
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        isRunning={isRunning}
        variationInfo={variationInfo}
      />

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0">
        {/* Agent Stream */}
        <div className="col-span-3 min-h-[500px]">
          <AgentStream
            messages={formattedLogs}
            currentIndex={currentLogIndex}
            currentText={displayedLogs[currentLogIndex]?.message || ''}
            isTyping={isRunning && currentLogIndex >= 0}
          />
        </div>

        {/* Campaign Cards */}
        <div className="col-span-6 bg-gray-800/50 rounded-lg border border-gray-700 min-h-[500px]">
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">Campaign Status</h2>
                <p className="text-sm text-gray-400">
                  {campaigns.length > 0 ? `${campaigns.length} active campaigns` : 'Select a scenario'}
                </p>
              </div>
              {confidenceData && (
                <div className="text-right">
                  <div className="text-sm text-gray-400">Avg Confidence</div>
                  <div className={`font-mono font-bold ${confidenceData.average >= 0.7 ? 'text-status-healthy' : 'text-status-escalated'}`}>
                    {Math.round(confidenceData.average * 100)}%
                  </div>
                </div>
              )}
            </div>
          </div>
          <CampaignCards
            campaigns={campaigns}
            visible={showCampaigns}
          />
        </div>

        {/* LLM Insights */}
        <div className="col-span-3 bg-gray-800/50 rounded-lg border border-gray-700 min-h-[500px]">
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">LLM Insights</h2>
                <p className="text-sm text-gray-400">
                  {geminiAvailable ? 'Powered by Gemini' : 'Rule-based analysis'}
                </p>
              </div>
              {llmInsight?.isLLMGenerated && (
                <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                  AI Generated
                </span>
              )}
            </div>
          </div>
          <LLMInsights
            insight={llmInsight}
            overallStatus={overallStatus}
            visible={showInsights}
            isLoading={isLoadingInsight}
            onAction={handleAction}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-4">
            <span>Powered by LangGraph-style State Machine</span>
            {agentActions.length > 0 && (
              <span className="text-status-healthy">
                {agentActions.length} action{agentActions.length > 1 ? 's' : ''} taken
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>4 Platforms Connected</span>
            <span className="text-status-healthy">All Systems Operational</span>
          </div>
        </div>
      </footer>

      {/* Agent Flow Diagram Modal */}
      <AgentFlowDiagram
        activeScenario={activeScenario}
        isVisible={showDiagram}
        onClose={() => setShowDiagram(false)}
      />
    </div>
  );
}

export default App;
