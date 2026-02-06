# CLAUDE.md — Agent Pacer

Development guide for Claude Code when working on this project.

## Quick Reference

```bash
npm install          # install dependencies
npm run dev          # dev server at http://localhost:5173
npm run build        # production build to dist/
npm run lint         # ESLint check
npm run preview      # preview production build
```

## Architecture

**Stack:** React 19 + Vite 7 + Tailwind CSS 3. No backend — runs entirely in the browser.

**Data flow:**
```
mockData.js → PacingAgent.js → gemini.js → React components
```

1. `mockData.js` generates scenario data (platform + tracker spend, metadata, campaign metrics)
2. `PacingAgent.js` runs the state machine: FETCH → RECONCILE → ANALYZE → SCORE → ROUTE → ACT
3. `gemini.js` generates AI insights (Gemini API if configured, rule-based fallback otherwise)
4. Components render the results: `AgentStream`, `CampaignCards`, `LLMInsights`, `ActionOutputModal`

### Agent State Machine

The agent in `PacingAgent.js` processes campaigns through these states:

| State | What it does |
|-------|-------------|
| FETCHING | Loads platform API data + internal tracker data |
| RECONCILING | Cross-references campaigns between sources, detects discrepancies |
| ANALYZING | Classifies variance: ≤10% healthy, 10-25% warning, >25% critical |
| SCORING | Confidence score: 30% metadata + 30% name similarity + 20% freshness + 20% spend consistency |
| ROUTING | If confidence < 70% → escalate. Otherwise route by severity |
| ACTING | Execute action: log, alert (bid adjustment), pause, or escalate |
| COMPLETE | Done |

### Scenarios

| ID | Name | Behavior |
|----|------|----------|
| A | Healthy | All campaigns ≤10% variance, high confidence → log only |
| B | Data Mismatch | Spend discrepancy between sources, low confidence → escalate |
| C | Warning | 10-25% overspend, high confidence → recommend bid adjustment |
| D | Critical | >25% overspend, high confidence → auto-pause + notify team |

Each scenario has 3-5 random variations for realistic variety.

### Key Components

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main layout, orchestrates scenario selection → agent run → results display |
| `src/agents/PacingAgent.js` | State machine agent, produces log entries and final results |
| `src/agents/ConfidenceScorer.js` | Levenshtein distance, metadata matching, spend consistency scoring |
| `src/agents/VarianceAnalyzer.js` | Variance classification with severity thresholds |
| `src/data/mockData.js` | Dynamic mock data generators for all 4 scenarios |
| `src/services/gemini.js` | Gemini API integration + rule-based fallback for insights and action outputs |
| `src/utils/timeContext.js` | Off-hours detection with module-level `_forceOffHours` toggle for demos |
| `src/components/SimulationPanel.jsx` | Scenario buttons, off-hours toggle, Gemini status |
| `src/components/AgentStream.jsx` | Real-time scrolling agent log display |
| `src/components/CampaignCards.jsx` | Campaign status cards with spend bars |
| `src/components/LLMInsights.jsx` | AI analysis panel with expandable per-campaign cards |
| `src/components/ActionOutputModal.jsx` | Modal showing API requests, Slack notifications, tickets |
| `src/components/AgentFlowDiagram.jsx` | SVG decision flow diagram |
| `src/components/StatusBadge.jsx` | Reusable colored status indicator |

## Development Patterns

### Adding new fields to the data flow

Thread new fields through the full pipeline:
1. `mockData.js` — add to platform/tracker data generators
2. `PacingAgent.js` — pass through reconcile/analyze steps into `result.campaigns`
3. `gemini.js` — include in `dataFindings` for insights and action outputs
4. Components — render in `LLMInsights`, `CampaignCards`, or `ActionOutputModal`

### Demo toggles

Module-level flags work well for toggles that persist across re-renders:
- `timeContext.js` uses `_forceOffHours` to simulate off-hours mode
- `gemini.js` checks `isGeminiConfigured()` to choose LLM vs rule-based path

### Action output data shapes

The `generateActionOutput()` function in `gemini.js` returns different shapes per action type:

**CAMPAIGN_PAUSED:**
```js
{ type, request: { method, endpoint, body }, response: { status, body }, slackNotification }
```

**BID_ADJUSTMENT_RECOMMENDED:**
```js
{ type, recommendation: { status, proposedChange: { type, direction, percentage }, currentSpend, targetSpend, variance }, draftApiCall }
```

**DATA_DISCREPANCY_TICKET:**
```js
{ type, ticket: { id, priority, status, campaign, discrepancy, assignedTo, requiredActions } }
```

**NO_ACTION_REQUIRED:**
```js
{ type, details: { status, nextCheckIn, metrics } }
```

### Tailwind custom colors

Defined in `tailwind.config.js`:
- `status-healthy` — green
- `status-warning` — amber
- `status-critical` — red
- `status-escalated` — blue

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_GEMINI_API_KEY` | No | Google Gemini API key. App works in demo mode without it |

## Deployment

Deployed on Vercel as a static SPA. `vercel.json` configures the build:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

No environment variables needed on Vercel — demo mode works without an API key.
