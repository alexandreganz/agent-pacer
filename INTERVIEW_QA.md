# Interview Q&A — Manager Growth & Enablement (LEGO M&C Central Marketing)

Preparation guide covering the case study presentation (20 min), Q&A on case study (15 min), recruiter additional questions (15 min), and candidate questions (10 min).

---

## SECTION A — Case Study: MVP Scope & Strategic Thinking

### Q1: Why did you choose to focus the MVP on the monitoring and anomaly detection step rather than the full pacing workflow?

**Answer:** The current pacing process has six sequential steps — from pulling data to documenting actions. Monitoring and anomaly detection sit right in the middle and represent the highest-leverage intervention point. Today, analysts spend hours switching between Meta, Google, DV360, and internal dashboards just to reconcile numbers before they can even spot a problem. If the agent automates that reconciliation and flags anomalies in real time, it eliminates the most time-consuming manual work and directly reduces the lead time between issue discovery and remediation — which the discovery findings highlighted as one of the top pain points. Starting here also avoids touching campaign setup or creative workflows, which involve cross-team dependencies with IM, Business Units, and external platforms that would slow down an MVP.

---

### Q2: What would the MVP explicitly NOT do, and why is that boundary important?

**Answer:** The MVP would not handle campaign setup, creative management, budget reallocation across markets, or end-of-campaign reporting. Those involve human judgment, cross-functional approvals, and strategic decisions that are too risky to automate before the team has built trust in the agent's accuracy. Defining clear boundaries is essential because if the agent's scope is ambiguous, stakeholders either expect too much (and get disappointed) or fear too much (and block adoption). A well-scoped MVP that reliably monitors, reconciles, and escalates earns the credibility needed to expand into autonomous bid adjustment and cross-channel reallocation later.

---

### Q3: How did you define success criteria for the MVP? What metrics would you track?

**Answer:** I would propose four success criteria:
1. **Detection speed**: Time from anomaly occurrence to alert — target is under 15 minutes vs. the current hours-long manual cycle.
2. **False positive rate**: Percentage of alerts that turn out to be non-issues when a human investigates — target below 10% to maintain trust.
3. **Manual workload reduction**: Measured in hours per week the GMA team spends on routine pacing checks — target 40-60% reduction.
4. **Escalation accuracy**: When the agent escalates to a human (because confidence is too low), was that the right call? Measured by auditing a sample of escalations weekly.

These metrics matter because if the agent produces too many false alarms, the team will ignore it. If it's too slow, it adds no value over manual checks. And if it escalates the wrong things, it wastes human time rather than saving it.

---

### Q4: The case study mentions no night or weekend coverage. How does your solution address that?

**Answer:** The prototype implements an off-hours protocol that dynamically adjusts the agent's behavior. During business hours, the critical threshold is 50% variance — the agent only auto-pauses a campaign if it deviates by more than 50%. During nights and weekends, that threshold drops to 30%. The reasoning is simple: when no humans are available to catch a problem, the agent should be more conservative and act sooner. In the prototype, this also triggers PagerDuty alerts to the on-call engineer, not just Slack messages. This is a directly implementable answer to the operational risk the case study describes — issues going unnoticed for long stretches because of no night/weekend staffing.

---

### Q5: How do you handle the fragmented data landscape described in the discovery findings?

**Answer:** The discovery findings identify four data challenges: different refresh rates, discrepancies between sources, inconsistent metadata, and API limitations. Rather than trying to fix all of these upstream (which is a data engineering project that could block the MVP), the agent works *with* the fragmentation by building a confidence scoring system. Every campaign gets a confidence score based on four dimensions: metadata match (30%), name similarity (30%), data freshness (20%), and spend consistency (20%). If the confidence score drops below 70%, the agent refuses to act autonomously and escalates to a human. This way, the agent acknowledges its own uncertainty rather than making high-stakes decisions on unreliable data.

---

### Q6: Why a confidence threshold of 70%? How did you arrive at that number?

**Answer:** 70% is a pragmatic starting point designed to balance two risks. Set it too high (say 90%), and the agent escalates nearly everything — effectively becoming a notification system that doesn't reduce manual work. Set it too low (say 50%), and it acts on questionable data, risking pausing a healthy campaign or missing a real overspend. 70% means the agent needs a solid majority of its data signals to agree before it takes autonomous action. In practice, this would be calibrated during the MVP by analyzing historical pacing data — run the confidence scorer retrospectively on past campaigns where we know the ground truth, and see what threshold would have caught real issues without generating excessive false escalations.

---

### Q7: What's the difference between a "data discrepancy" and a "variance"?

**Answer:** This is a crucial distinction. **Variance** is the difference between what a campaign *should* be spending (the target/budget) and what it *actually* spent — that's a pacing problem. **Discrepancy** is when two different systems (e.g., the Google Ads API and the internal GMA spend tracker) report *different actual spend* for the same campaign. A variance tells you the campaign is off-pace. A discrepancy tells you your data is unreliable. The agent treats these very differently: variance triggers bid adjustments or pauses; discrepancy triggers escalation to human review because the agent can't trust either number enough to act.

---

## SECTION B — System Design & Agent Architecture

### Q8: Walk me through the agent's state machine — why did you choose this specific sequence of steps?

**Answer:** The agent follows six states: Fetch, Reconcile, Analyze, Score, Route, Act. This mirrors what a human analyst does when checking campaign pacing, but in a formalized, repeatable sequence.

- **Fetch**: Pull spend data from all connected platforms (Google Ads, Meta, TikTok, DV360) and the internal tracker.
- **Reconcile**: Cross-reference the two data sources to detect discrepancies — this is the step most teams skip or do poorly because it's tedious.
- **Analyze**: Calculate variance between actual spend and target, classify severity (healthy / warning / critical), and apply performance modifiers (e.g., a campaign overspending but with 4x ROAS is different from one burning money).
- **Score**: Compute a confidence score on the data itself — are the campaign names matching? Is the metadata consistent? How fresh is the data?
- **Route**: Decision point. If confidence is below 70%, escalate regardless of severity. If confidence is high, route by severity.
- **Act**: Execute the appropriate action — log only, adjust bids, pause the campaign, or create an escalation ticket.

This sequence ensures the agent never acts on bad data (Score gates Route), and never makes a severity judgment before reconciling its sources (Reconcile gates Analyze).

---

### Q9: How does the Performance Modifier work, and why is it important?

**Answer:** The Performance Modifier prevents the agent from applying a blanket rule to all campaigns. It takes the severity classification from the Variance Analyzer and adjusts it based on actual campaign performance — ROAS, CTR, conversions, and impression volume. For example:

- A campaign overspending by 20% but delivering 4x ROAS gets **downgraded** from warning to healthy — you don't want to throttle profitable spend.
- A campaign overspending by 20% with 0.5x ROAS gets **upgraded** from warning to critical — it's actively losing money.
- A campaign with 1M impressions but only 2 conversions and 0.05% CTR gets flagged as a **fraud signal** — that pattern indicates bot or invalid traffic.

This matters because in media buying, not all overspending is bad and not all underspending is harmless. The agent needs business context, not just arithmetic.

---

### Q10: Explain the confidence scoring system. What are the four dimensions and why those weights?

**Answer:** The confidence score combines four signals:

1. **Metadata match (30%)**: Do the campaign's metadata fields (market, product, dates) match between the platform API and the internal tracker? If they don't, we might be comparing the wrong campaigns.
2. **Name similarity (30%)**: Measured via Levenshtein distance — how close are the campaign names across systems? Inconsistent naming is one of the discovery findings' explicit pain points.
3. **Data freshness (20%)**: How old is the data? If the platform API last synced 24 hours ago, any pacing decision is based on stale information.
4. **Spend consistency (20%)**: Are the two systems reporting the same actual spend? If they diverge by more than 10%, something is wrong with data integrity.

Metadata and naming get 60% combined because identity matching is the most critical — if the agent can't confirm it's comparing the same campaign across systems, nothing else matters. Freshness and spend consistency get 20% each because they're important but less foundational. There's also a **circuit breaker**: if any single dimension scores critically low (e.g., name similarity below 0.7), the overall confidence is capped at 60% regardless of the weighted average. This prevents one good signal from masking a catastrophic data quality issue.

---

### Q11: What happens when the agent encounters a situation it's not confident about?

**Answer:** It escalates. This is by design — the agent follows a principle of "know what you don't know." When the confidence score drops below 70%, the agent:
1. Blocks all autonomous actions (no bid changes, no pausing).
2. Creates a data quality ticket with the specific discrepancies found.
3. Sends a Slack notification to #media-ops-alerts.
4. Generates hypothetical scenarios explaining what could go wrong if the data is wrong in either direction (e.g., "if the API is over-reporting, pausing would hurt a healthy campaign; if the tracker is under-reporting, the campaign may genuinely be overspending").

This is crucial for stakeholder trust. An AI agent that says "I don't know, here's what I need a human to check" is infinitely more trustworthy than one that silently makes a wrong call.

---

### Q12: Why does the agent lower its critical threshold during off-hours instead of just alerting?

**Answer:** Because alerts without humans to read them are useless. If a campaign is 35% overspent at 2 AM on Saturday and no one is checking Slack, by Monday morning it could be 100%+ over budget. The off-hours protocol is a risk management decision: when the safety net of human oversight is absent, the agent compensates by being more conservative — auto-pausing at 30% instead of 50%. This is exactly the operational gap the case study identifies: "no night coverage and no weekend coverage... issues can go unnoticed for long stretches of time." The agent fills that gap proportionally — it doesn't become reckless, it becomes more cautious.

---

## SECTION C — Phased Approach & Scaling

### Q13: How would you move from MVP to a more capable agent? What does the phased approach look like?

**Answer:**

**Phase 1 — MVP (Monitoring + Alerting):** The agent pulls data, reconciles, detects anomalies, and alerts. All actions are recommendations only — humans approve every change. This builds trust and generates training data.

**Phase 2 — Supervised Autonomy:** For high-confidence, low-severity situations (e.g., healthy campaigns with 94% confidence), the agent can auto-log without human approval. For warnings, it proposes bid adjustments that a human approves with one click. Critical actions still require human sign-off.

**Phase 3 — Conditional Autonomy:** The agent can execute bid adjustments autonomously for warning-level issues when confidence is above 85%. Critical actions (pause/stop) remain human-approved during business hours but become autonomous during off-hours (with the lowered threshold).

**Phase 4 — Full Autonomy + Cross-Channel:** The agent handles reallocation across channels and markets, runs what-if simulations, and learns from its own past actions. Humans shift to exception handling and strategic decisions only.

Each phase requires validation: Phase 1 validates detection accuracy, Phase 2 validates recommendation quality, Phase 3 validates autonomous decision-making, Phase 4 validates strategic optimization.

---

### Q14: What are the key dependencies to move forward?

**Answer:**
1. **Data team**: Need API access to all platforms (Meta, Google, DV360, TikTok) and the internal trackers. Different refresh rates and API limitations (rate limits, sampling) must be mapped.
2. **GMA operations team**: Need to define the thresholds, approval workflows, and escalation chains. Their domain expertise validates the agent's rules.
3. **IT/Security**: Platform API credentials management, data storage for audit trails, and compliance review (especially around autonomous financial actions).
4. **Marketing Investment Planning (MIP)**: Budget allocation data — the agent needs to know the targets it's monitoring against.
5. **Analytics teams (MMM)**: Historical performance data to calibrate thresholds and train confidence scoring.

The biggest risk is data access — if the platform APIs are slow, rate-limited, or inconsistent, the agent's effectiveness is capped by its inputs.

---

### Q15: What risks should GMA plan for early on?

**Answer:**
1. **Over-trust / under-trust**: The team may either blindly accept the agent's outputs or ignore them entirely. Mitigation: start with recommendations-only mode and gradually increase autonomy as accuracy is proven.
2. **Threshold miscalibration**: The 10%/50% variance thresholds and 70% confidence threshold work in the prototype but may need adjustment per market or campaign type. Mitigation: make thresholds configurable and review weekly during MVP.
3. **Platform API changes**: Meta, Google, and TikTok frequently update their APIs. A breaking change could silently corrupt the agent's data pipeline. Mitigation: data freshness monitoring and automated API health checks.
4. **Edge cases**: Zero-delivery campaigns, currency differences across markets, campaigns that span multiple platforms. Mitigation: the agent should have explicit handling for these rather than relying on general rules.
5. **Organizational change management**: Analysts whose daily job is manual pacing checks may feel threatened. Mitigation: position the agent as removing tedious work (reconciliation, monitoring) so analysts can focus on strategy and optimization.

---

## SECTION D — Technical Deep Dive

### Q16: Why did you choose a rule-based approach with optional LLM enhancement rather than a fully LLM-driven agent?

**Answer:** Three reasons. First, **reliability**: pacing decisions involve real money — a rule-based system produces deterministic, auditable outputs. If the agent pauses a campaign, I can trace exactly which rule triggered it (variance > 50%, confidence > 70%, direction = overspending). An LLM might give a different answer on a second run. Second, **latency**: the rule-based path runs in milliseconds; an LLM API call adds 1-3 seconds per request plus the risk of API downtime. Third, **cost**: calling an LLM API for every campaign check across hundreds of campaigns per day would be expensive and unnecessary for what is fundamentally a numerical classification task. The LLM (Gemini) is used where it adds genuine value — generating natural-language root cause analysis and hypothetical scenario descriptions that help humans understand and act on the agent's findings.

---

### Q17: How does the prototype handle fraud detection?

**Answer:** The PerformanceModifier includes a fraud signal detection pattern. It looks for a specific combination: very high impressions (>100K), near-zero conversions (<=2), and extremely low CTR (<0.1%). This pattern is a classic indicator of bot traffic or impression fraud — automated systems inflating delivery numbers without real user engagement. When detected, the agent:
1. Immediately escalates severity to critical regardless of variance level.
2. Auto-pauses the campaign.
3. Generates specific remediation steps: file an invalid traffic dispute with the platform, request spend credits, review placement/network exclusion lists, and enable enhanced fraud detection.

This is relevant to the LEGO context because with insourced media buying, the fraud detection responsibility shifts from the agency to the internal team — the agent needs to cover this gap.

---

### Q18: Why do you use Levenshtein distance for name matching instead of exact matching?

**Answer:** Because the discovery findings explicitly call out "incomplete or inconsistent metadata (campaign names, naming mismatches)" as a real problem. In practice, the same campaign might be called "LEGO Star Wars - Search" in Google Ads and "LEGO_StarWars_Search_Q1" in the internal tracker. Exact matching would fail and flag every campaign as unmatched. Levenshtein distance measures the minimum number of single-character edits needed to transform one string into another, then normalizes by string length to get a similarity score between 0 and 1. A score of 0.85 means the names are very similar despite minor formatting differences. This handles real-world naming inconsistency without requiring a separate mapping table.

---

### Q19: Explain the circuit breaker pattern in the confidence scorer.

**Answer:** The confidence score is a weighted average of four dimensions. The problem with weighted averages is dilution: if metadata match is 1.0, name similarity is 1.0, freshness is 1.0, but spend consistency is 0.1 (severe discrepancy), the weighted average could still come out to 0.82 — above the 70% threshold. The agent would act autonomously on data where the two systems disagree dramatically on spend. The circuit breaker prevents this: if ANY single dimension scores critically low (metadata < 0.7, name < 0.7, freshness < 0.4, spend consistency < 0.5), the overall confidence is capped at 60%, which is below the 70% threshold. This forces escalation. The principle is: a chain is only as strong as its weakest link. One catastrophic data quality signal should not be drowned out by three good ones.

---

### Q20: How does the prototype simulate realistic media buying data?

**Answer:** The mockData.js file generates data using LEGO-branded campaign templates across four platforms (Google, Meta, TikTok, DV360) with realistic budget ranges. Each scenario (Healthy, Data Mismatch, Warning, Critical) has 3-5 variations randomly selected at runtime, so the same scenario never produces identical data twice. Metrics like impressions, clicks, CTR, CPC, CPM, conversions, and ROAS are generated using platform-specific ranges — Google Search has higher CTR (2-6%) while DV360 programmatic has lower CTR (0.1-0.8%). For data mismatch scenarios, the generator deliberately introduces spend discrepancies, corrupted metadata fields, garbled campaign names, and stale timestamps. This simulates the real fragmented data landscape described in the discovery findings.

---

## SECTION E — Business & Stakeholder Communication

### Q21: How would you explain the agent's decision-making to a non-technical VP of Global Media Activation?

**Answer:** "The agent works like a very diligent junior analyst who checks every campaign every 15 minutes. It pulls the numbers from each ad platform, compares them against our internal tracker, and asks itself two questions: (1) Is this campaign spending where it should be? and (2) Do I trust the data I'm looking at? If the spending is off but the data is reliable, it takes action — small corrections automatically, big problems it pauses the campaign and alerts the team. If the data itself is unreliable — numbers don't match between systems, campaign names are different, data is stale — it refuses to act and escalates to a human with a clear explanation of what looks wrong. The agent never guesses. It acts when it's confident, and it asks for help when it's not."

---

### Q22: A stakeholder asks: "What if the agent pauses a campaign that shouldn't be paused?" How do you respond?

**Answer:** "That's exactly the right concern, and the system is designed to minimize that risk through three safeguards. First, the agent only auto-pauses when it has high data confidence (above 70%) AND the variance exceeds a severe threshold (50% during business hours, 30% off-hours). Second, every pause action generates a full audit trail — the exact data that triggered it, the confidence score, the variance calculation — so the team can review and reverse in minutes. Third, in the MVP phase, we would run in shadow mode first: the agent calculates what it *would* do but only sends recommendations. We track how often its proposed pauses are correct by comparing against what the human team actually decides. Only after we prove accuracy do we enable autonomous pausing. If we find the threshold is too aggressive, we adjust it — that's why thresholds are configurable, not hard-coded."

---

### Q23: How do you manage the change management aspect — analysts whose job currently is manual pacing?

**Answer:** The framing matters. This agent doesn't replace analysts — it replaces the most tedious parts of their work: switching between five dashboards, reconciling numbers, checking spend vs. targets for 50+ campaigns. Those tasks are repetitive, error-prone, and don't require strategic thinking. With the agent handling monitoring, analysts can focus on what humans are better at: interpreting *why* a campaign is underperforming, optimizing creative strategy, negotiating with platforms, and planning budget reallocations across markets. The role evolves from "data checker" to "strategic optimizer." In practice, I'd involve the GMA analysts in defining the agent's rules and thresholds — their domain expertise is what makes the agent accurate. That creates ownership rather than resistance.

---

### Q24: How does this project set a precedent for other AI initiatives within M&C?

**Answer:** This would be one of the first truly agentic AI workflows in M&C — not just a chatbot or a dashboard, but an AI system that can take autonomous action with real financial consequences. The patterns we establish here become the template: confidence-based escalation, phased autonomy rollout, audit trail requirements, off-hours protocols, human-in-the-loop design. If this succeeds, the same framework could be applied to Trade & Shopper Marketing (automated retail activation), Membership & Personalisation (automated CRM triggers), or Marketing Investment Planning (automated budget reallocation). The key precedent is the governance model: how much autonomy to grant AI, how to build trust incrementally, and how to maintain human oversight at the right moments.

---

### Q25: What is the business case? How would you quantify the ROI of this agent?

**Answer:** The business case rests on three pillars:
1. **Time savings**: If GMA analysts spend an estimated 2-3 hours daily on manual pacing checks across markets, and the agent reduces that by 60%, that's roughly 6-9 hours per day freed up across the team for strategic work.
2. **Risk reduction**: A single critical overspend detected 4 hours earlier could save tens of thousands of dollars. During peak trading periods (e.g., holiday season), the stakes multiply.
3. **Coverage expansion**: The agent provides 24/7 monitoring that the current team cannot. Issues that would previously go undetected during nights and weekends are now caught within minutes.

For the pilot, I'd measure actual time spent on pacing before and after MVP deployment, track the dollar value of anomalies detected early, and survey the team on workload reduction.

---

## SECTION F — Recruiter Additional Questions (Behavioral / Role Fit)

### Q26: How do you approach a situation where business stakeholders want AI to do something that isn't technically feasible yet?

**Answer:** I start by understanding the *need* behind the request rather than debating the solution. If the VP asks for "fully autonomous cross-market budget reallocation in month one," the underlying need is probably "I don't want my team wasting time on routine budget moves." I'd acknowledge that need, then propose a phased path: "We can start with automated monitoring and recommendations in month one, which solves 70% of the pain. Full autonomy requires validated thresholds and data quality improvements that we'll build toward in phases two and three." I translate ambiguity into concrete, achievable steps — that's the core of the G&E Manager role.

---

### Q27: How do you prioritize when multiple M&C teams need your help simultaneously?

**Answer:** I use three criteria: business impact (how much revenue or risk is at stake), urgency (is there a deadline or peak trading period approaching), and feasibility (can we ship something useful quickly, or does it need months of groundwork). For this case study, GMA's need is high-impact (insourcing is already happening, creating immediate operational risk), urgent (no night/weekend coverage creates gaps now), and feasible (the data exists, the workflow is well-understood). I'd communicate priorities transparently with all teams so no one is surprised, and look for patterns where a solution for one team's problem can be reused by others.

---

### Q28: Tell me about a time you had to make a trade-off between speed and quality.

**Answer (framework to adapt with your own experience):** The MVP itself embodies this trade-off. The "right" solution would be a fully integrated data platform with normalized schemas across all ad platforms, real-time streaming, and ML-based anomaly detection. That could be a year-long project. Instead, the MVP uses rule-based logic with configurable thresholds, works with fragmented data as-is (and compensates with confidence scoring), and can ship within weeks. The trade-off is explicit: we accept less sophistication in exchange for immediate impact. The key is making the trade-off visible — not cutting corners silently, but deliberately choosing "good enough now" over "perfect later" and building the path from one to the other.

---

### Q29: How do you stay current on AI/automation developments relevant to this role?

**Answer (personalize with your own habits):** The field moves fast, so I combine practical experimentation with structured learning. I build prototypes (like this agent) to understand how technologies actually work under real constraints, not just in theory. I follow developments in agentic AI frameworks (LangGraph, CrewAI, AutoGen), LLM capabilities (function calling, structured output), and platform-specific APIs. But I also focus on the business application layer — what's the gap between what the technology can do and what the organization needs? The G&E role is about bridging that gap, not just tracking the technology frontier.

---

### Q30: What questions would you ask in your first week in this role?

**Answer:**
1. "What does the GMA team's daily workflow actually look like, end to end?" — I need to see the real process, not just the SIPOC diagram.
2. "Where are the biggest pain points that people have given up trying to fix?" — These reveal the highest-impact opportunities.
3. "What has been tried before and didn't work?" — Avoids repeating failures and signals organizational constraints.
4. "Who are the informal decision-makers and influencers beyond the org chart?" — Getting buy-in requires knowing who actually shapes decisions.
5. "What does 'success' look like for G&E in 6 months vs. 18 months?" — Aligns my priorities with leadership expectations.
6. "What data do we actually have access to today, and what's the quality like?" — The technical reality may be very different from the aspiration.
