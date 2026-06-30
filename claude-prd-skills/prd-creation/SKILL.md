---
name: prd-creation
description: "Create a V1 Product Requirements Document by interviewing the user iteratively, starting from partial inputs like an initial idea, user personas, or problem framing. Use whenever the user wants to write, draft, start, or 'spin up' a new PRD, product spec, product brief, or requirements doc from scratch or from rough notes — phrases like 'help me write a PRD for…', 'turn this idea into a PRD', 'draft a product brief', or 'I have an idea and some personas, build me a PRD'. The skill gathers information in rounds, fills the house PRD template only with what the user actually provides, and documents every gap as either a labelled assumption or an open question tied to a stakeholder owner. It never fabricates facts. Produces a polished .docx in the team's 18-section structure. (For reviewing or gap-checking an EXISTING PRD, use prd-enrichment instead.)"
---

# PRD Creation

## What this skill is for

Turn a rough starting point — an idea, some personas, a problem statement — into a credible **V1 PRD** by interviewing the user, not by guessing. The output is a discovery-stage document in the team's house template, where everything the user actually knows is captured, and everything they don't is made visible as a documented assumption or an open question owned by a named stakeholder.

The hard part of a first PRD isn't formatting — it's the discipline to separate what's known from what's assumed from what's genuinely unknown, and to route the unknowns to the people who can resolve them. That discipline is the whole point of this skill.

## Non-negotiable principles

1. **Never fabricate.** Do not invent metrics, targets, dates, architecture, revenue figures, research findings, or any other fact the user has not given you. This is the single most important rule. A blank that's honestly marked is infinitely better than a plausible-looking number that's made up.
2. **Three buckets for everything.** As you gather information, sort each item into:
   - **Known** — the user told you, or it's a safe restatement of what they told you. Goes into the document as content.
   - **Assumption** — a reasonable working belief, *explicitly labelled as an assumption* and recorded in section 15.2. You may *propose* candidate assumptions for the user to confirm, but never silently bake one into a factual field.
   - **Unknown** — nobody in the room knows yet. Goes into the Open Questions table (section 16) with a stakeholder owner and, where possible, a due date.
3. **Discovery-stage calibration.** A V1 is a framing-and-scope document, not a build spec. The template's Technical (section 12) and Security (section 13) areas are marked "to be filled by Architecture." For a V1, capture what the user genuinely knows there and route the rest to open questions owned by Architecture/Security — do not write speculative architecture to fill space.
4. **Don't re-ask what you've been given.** If the user already supplied the idea, personas, or problem framing, confirm and build on it; don't make them repeat themselves.
5. **Iterate in small rounds.** Never dump the whole template's worth of questions at once. Ask a focused, prioritised batch, reflect back what you captured, then continue.

## Workflow

### 1. Intake

Take whatever the user has given (idea, personas, problem framing, notes) and map it onto the template sections (see `references/template-blueprint.md`). Form a quick mental inventory: which sections are partly answered, which are empty. Briefly reflect this back so the user sees the starting point and the shape of what's missing.

### 2. Interview in rounds

Work through four rounds, in order of leverage. Within each round, ask a small batch (roughly 3–6 focused questions), prioritising the items that most shape the product. After each round, summarise what you captured and flag what's now an assumption or an open question.

- **Round A — Problem & strategic framing.** Observed behaviour / existing process; the underlying customer need and business need; the sharpest pain points and what evidence backs them; the North Star; what company strategy / vision / revenue goal / commitment / regulation this aligns to; why now; the cost of not doing it; the opportunity and (if known) its rough size.
- **Round B — Users, success, scope.** Persona detail and jobs-to-be-done; the business KPIs and product KPIs that define success — push for a baseline and target on each, and if they don't exist yet, that's an open question, not a blank; what's explicitly in and out of scope.
- **Round C — Solution concept, data, guardrails.** The solution concept (frame it as a concept, not a spec — scope can stay open); the data the product consumes and produces and any quality rules; design and technical guardrails (entitlements, SSO, design principles, UX deliverables).
- **Round D — Risks, unknowns, delivery.** Key risks with impact/probability/mitigation; assumptions to record; the technical and security questions to route to Architecture/Security as owned open questions; known delivery milestones and any target dates.

**How to ask.** In a chat interface, prefer tappable options for genuinely discrete choices and short open prompts otherwise; keep each batch small. Accept "I don't know" or "not decided yet" gracefully — that's a valid, useful answer that becomes an open question or assumption. Let the user volunteer to skip ahead or jump around.

### 3. Maintain the buckets continuously

Keep a running list of assumptions (each one labelled) and open questions (each with a candidate stakeholder owner — see the routing table below). When the user states a decision, capture it for the Decision Log (section 17). Don't wait until the end to assemble these.

### 4. Confirm before generating

Before producing the document, show the user the assembled picture in the chat: the key framing, the success metrics, scope, and — importantly — the full list of assumptions and open questions with their owners. Let them correct owners, promote an assumption to a fact (or vice versa), or answer a question on the spot. This checkpoint is where a V1 earns trust.

### 5. Generate the V1 PRD

Build the document with the bundled builder rather than hand-assembling docx XML:

1. Assemble the gathered content into a JSON spec (schema in `references/template-blueprint.md`; missing fields are allowed and render as a visible "to be determined" marker, never as invented content).
2. `node scripts/build_prd.js content.json PRD_v1.docx`
3. Validate: `python <docx-skill>/scripts/office/validate.py PRD_v1.docx`

Set Status to **Draft** and Version to **0.1 (V1)** in the document-control block unless the user says otherwise. The builder renders the full 18-section house structure, the standard tables (pain points, personas, risks, open questions, decision log, delivery), and turns any unfilled field into an explicit placeholder so nothing reads as fabricated.

### 6. Deliver and summarise

Present the file, then give a tight chat summary: what the V1 captures, the open questions grouped by stakeholder owner, the headline assumptions, and the two or three things that most need resolving to move the document from Draft toward Review.

## Stakeholder routing for open questions

Every open question needs an owner. Assign the most likely one and let the user correct it:

| Question is about… | Likely owner |
|---|---|
| Success metrics, targets, baselines, business case, pricing intent | Product Manager / Business |
| Market sizing, competitive positioning, GTM | Product Marketing / Sales |
| Architecture, integrations, performance, feasibility, tech stack | Architecture / Engineering Lead |
| Data classification, PII/retention, compliance, threat model | Security / Legal / Privacy |
| UX, flows, accessibility, design deliverables | Design |
| Scope trade-offs, prioritisation, sequencing | Product Manager |
| Delivery dates, capacity, staffing | Engineering Lead / Delivery |

When the user hasn't named real people, owner by role is fine (e.g. "Architecture"). Note in your summary that owners are best-guess until confirmed.

## Dependencies

- **The `docx` skill** — for validation and (if needed) rendering/inspection. `build_prd.js` uses the `docx` npm package; if it isn't already available, install with `npm install docx`.
- **`scripts/build_prd.js`** (bundled) — renders the V1 PRD from a JSON content spec.
- **`references/template-blueprint.md`** (bundled) — the 18-section structure, what to elicit for each section, how unknowns are represented, and the full JSON schema the builder expects.
