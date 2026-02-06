# Agent Pacer — AI Pacing Agent Dashboard

An interactive dashboard that simulates an autonomous AI agent for monitoring and managing digital ad campaign budgets in real time. Built with React 19, Vite 7, and Tailwind CSS.

**[Live Demo](https://lego-agents.vercel.app)**

![Agent Pacer Screenshot](https://img.shields.io/badge/status-live-brightgreen) ![React 19](https://img.shields.io/badge/React-19-blue) ![Vite 7](https://img.shields.io/badge/Vite-7-purple)

## What It Does

The agent watches ad campaigns across platforms (Google Ads, Meta, TikTok, DV360) and autonomously decides what to do when spending goes off track:

- **Healthy campaigns** — logs and monitors, no action needed
- **Data mismatches** — low confidence in data quality, escalates to a human
- **Warning-level overspend** — recommends bid adjustments with a draft API call
- **Critical overspend** — auto-pauses the campaign and notifies the team

Each run walks through a LangGraph-style state machine: **Fetch → Reconcile → Analyze → Score → Route → Act**.

## Key Features

- **4 demo scenarios** (A–D) with 3–5 random variations each for realistic variety
- **Confidence scoring** — 30% metadata match + 30% name similarity + 20% data freshness + 20% spend consistency. Below 70% confidence, the agent refuses to act autonomously
- **Off-hours protocol** — toggle to simulate nights/weekends, which lowers the auto-pause threshold from 50% to 30% and adds PagerDuty alerts
- **Campaign metrics** — impressions, clicks, CTR, CPC, CPM, conversions, ROAS, and revenue per campaign
- **Action output modals** — view the exact API requests, Slack notifications, and escalation tickets the agent would create
- **Agent flow diagram** — visual SVG map of the decision tree, highlighting the active path per scenario
- **Optional Gemini integration** — connect a Google Gemini API key for LLM-enriched root cause analysis (works fully without it in demo mode)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
git clone https://github.com/alexandreganz/agent-pacer.git
cd agent-pacer
npm install
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

### Gemini API Key (Optional)

The app works fully in demo mode without any API key. To enable LLM-enhanced insights:

```bash
cp .env.example .env
# Edit .env and add your key from https://aistudio.google.com/app/apikey
```

## Project Structure

```
src/
├── agents/
│   ├── PacingAgent.js         # LangGraph-style state machine orchestrator
│   ├── ConfidenceScorer.js    # Data quality confidence scoring
│   └── VarianceAnalyzer.js    # Spend variance classification
├── components/
│   ├── SimulationPanel.jsx    # Scenario selector + off-hours toggle
│   ├── AgentStream.jsx        # Real-time agent log stream
│   ├── CampaignCards.jsx      # Campaign status cards
│   ├── LLMInsights.jsx        # AI analysis panel with per-campaign breakdown
│   ├── ActionOutputModal.jsx  # Modal showing executed actions (API calls, tickets)
│   ├── AgentFlowDiagram.jsx   # SVG decision flow visualization
│   └── StatusBadge.jsx        # Reusable status indicator
├── data/
│   └── mockData.js            # Dynamic mock data generators (4 scenarios, 3-5 variations each)
├── services/
│   └── gemini.js              # Gemini API integration + rule-based fallback
├── utils/
│   └── timeContext.js         # Off-hours detection + demo toggle
├── App.jsx                    # Main app layout and orchestration
├── main.jsx                   # Entry point
└── index.css                  # Tailwind CSS + custom theme
```

## How the Agent Works

```
┌─────────┐    ┌───────────┐    ┌─────────┐    ┌───────┐
│  FETCH   │───▶│ RECONCILE │───▶│ ANALYZE │───▶│ SCORE │
└─────────┘    └───────────┘    └─────────┘    └───┬───┘
                                                    │
                                          ┌─────────▼─────────┐
                                          │  Confidence ≥ 70%? │
                                          └────┬──────────┬────┘
                                               │          │
                                            No │          │ Yes
                                               ▼          ▼
                                         ┌──────────┐ ┌──────────────┐
                                         │ ESCALATE │ │ ROUTE by     │
                                         │ to human │ │ severity     │
                                         └──────────┘ └──┬───┬───┬───┘
                                                         │   │   │
                                                    ≤10% │ 10-25%│ >25%
                                                         ▼   ▼   ▼
                                                       LOG ALERT PAUSE
```

| Scenario | Variance | Confidence | Action |
|----------|----------|------------|--------|
| A — Healthy | ≤10% | ~94% | Log only |
| B — Data Mismatch | Varies | ~42% | Escalate to human |
| C — Warning | 10–25% | ~87% | Recommend bid adjustment |
| D — Critical | >25% | ~98% | Auto-pause + notify team |

## Tech Stack

- **React 19** — hooks-based components, no class components
- **Vite 7** — fast dev server with HMR
- **Tailwind CSS 3** — utility-first styling with custom status colors
- **Google Gemini 1.5 Flash** — optional LLM integration for enriched analysis
- **Vercel** — static SPA deployment

## License

MIT
