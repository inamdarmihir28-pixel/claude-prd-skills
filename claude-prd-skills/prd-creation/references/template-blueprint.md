# Template Blueprint — what to elicit, and the builder schema

The house PRD has 18 sections. This file says, for each, what to ask the user and how the builder renders it. (The source template numbers two sections "13"; the builder uses clean sequential numbering — Security is 13, Non-Functional Requirements is 14, Risks is 15 — while keeping every section title unchanged.)

How unknowns render: any field left empty/null in the JSON becomes a visible italic marker — *⟨to be determined⟩* — never fabricated content. If an unknown matters, also add it to `open_questions` with an owner.

## Section-by-section

1. **Document Control** → `doc_control`. Ask: product/initiative name, author, PM, eng lead, architect, target release. Default Version "0.1 (V1)" and Status "Draft" for a new V1. Unknown owners are fine — leave them as open questions if no one is assigned yet.
2. **Problem Framing** → `problem`. Observed behaviour / existing process; underlying customer need; underlying business need; pain points (each with impact and *evidence* — push for real evidence, mark as assumption if it's a hunch); North Star statement.
3. **Strategic Alignment** → `strategic`. What it aligns to (company strategy, product vision, revenue goals, customer commitments, regulatory); why now; why this initiative; consequences of not doing it.
4. **Opportunity** → `opportunity`. Revenue / cost-reduction / productivity / CX. Get rough sizing if it exists; if not, it's an open question for Business, not a guess.
5. **Success Metrics** → `success_metrics`. Business KPIs and Product KPIs. For each, push for a definition, baseline, and target. Missing baseline/target → open question for the PM, not a blank.
6. **Customer & User Research** → `research`. Links/references to interviews or studies. If none yet, say so plainly and consider an open question or assumption about validation.
7. **Personas** → `personas`. Summary table (persona, relationship, job-to-be-done as Given–When–Then, how the offering serves them) plus detail description.
8. **Solution Concept** → `solution_concept`. Frame as a concept, not a specification; scope can remain open pending discovery.
9. **Scope Definition** → `scope`. Explicit in-scope and out-of-scope lists. Out-of-scope is high value — push for it.
10. **Design & Technical Guardrails** → `guardrails`. Entitlements, SSO, design principles, UX deliverables, constraints.
11. **Data Requirements** → `data_requirements`. Inputs, outputs, transformations, data quality rules.
12. **Technical Requirements** *(to be filled by Architecture)* → `technical`. For a V1, capture only what's genuinely known (e.g. an existing stack constraint). Route real design work to open questions owned by Architecture.
13. **Security Requirements** *(to be filled by Architecture)* → `security`. Authn/authz and data protection. Same as above: capture knowns, route the rest to Security/Architecture as open questions. Do not invent controls.
14. **Non-Functional Requirements** → `nfr`. Performance, availability, reliability, scalability expectations if known; otherwise open questions.
15. **Risks & Assumptions** → `risks` (table: risk/impact/probability/mitigation) and `assumptions` (labelled list). Assumptions recorded here are the ones the user confirmed or you proposed and they accepted.
16. **Open Questions** → `open_questions` (table: question/owner/due). The home for every unknown. Each row needs an owner (route by role using the table in SKILL.md).
17. **Decision Log** → `decision_log` (table: date/decision/owner). Capture decisions the user makes during the interview.
18. **Delivery & Release Plan** → `delivery` (table: milestone/target). Known milestones and target dates only.

## JSON schema for build_prd.js

All fields optional. Strings may be omitted/empty (→ rendered as *⟨to be determined⟩*). Arrays may be empty. Bullet fields accept an array of strings.

```json
{
  "doc_control": {
    "name": "", "author": "", "product_manager": "", "engineering_lead": "",
    "architect": "", "version": "0.1 (V1)", "status": "Draft",
    "last_updated": "YYYY-MM-DD", "target_release": ""
  },
  "problem": {
    "observed_behaviour": "", "customer_need": "", "business_need": "",
    "pain_points": [ {"pain": "", "impact": "", "evidence": ""} ],
    "north_star": ""
  },
  "strategic": {
    "alignment": ["Company Strategy: ...", "Product Vision: ..."],
    "why_now": "", "why_this": "", "consequences": ""
  },
  "opportunity": "",
  "success_metrics": { "business_kpis": [""], "product_kpis": [""] },
  "research": "",
  "personas": {
    "summary": [ {"persona": "", "relationship": "", "jtbd": "", "serves": ""} ],
    "detail": ""
  },
  "solution_concept": "",
  "scope": { "in": [""], "out": [""] },
  "guardrails": "",
  "data_requirements": { "inputs": "", "outputs": "", "transformations": "", "quality_rules": "" },
  "technical": { "solution_overview": "", "architecture": "", "stack": "", "integration": "", "api": "", "performance": "" },
  "security": { "authn_authz": "", "data_protection": "" },
  "nfr": "",
  "risks": [ {"risk": "", "impact": "", "probability": "", "mitigation": ""} ],
  "assumptions": [""],
  "open_questions": [ {"question": "", "owner": "", "due": ""} ],
  "decision_log": [ {"date": "", "decision": "", "owner": ""} ],
  "delivery": [ {"milestone": "", "target": ""} ]
}
```

`data_requirements`, `guardrails`, `solution_concept`, `opportunity`, `nfr`, and the `technical`/`security` subfields also accept a plain string if a structured breakdown isn't warranted yet.
