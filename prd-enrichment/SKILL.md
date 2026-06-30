---
name: prd-enrichment
description: "Review and enrich an existing Product Requirements Document (PRD) so that the Business, Functional, Technical, and Security dimensions are all thoroughly covered. Use this whenever the user shares a PRD, spec, product brief, feature doc, or requirements document (especially a .docx) and wants it reviewed, strengthened, gap-checked, pressure-tested, made 'implementation-ready,' or asks 'what's missing from this PRD?'. Trigger even when the user doesn't say the word 'PRD' explicitly — phrases like 'review this product spec,' 'is this feature doc complete,' 'poke holes in these requirements,' or 'get this ready for engineering' all qualify. Produces the same document marked up with Word comments (gaps + clarifying questions) and tracked-change insertions (proposed content)."
---

# PRD Enrichment

## What this skill is for

A PRD is the contract between product, engineering, design, and security. When it has holes, those holes turn into rework, scope fights, security incidents, and missed launches — discovered late, when they're expensive. This skill runs a senior, multi-disciplinary review pass over an existing PRD and hands it back marked up so the gaps get caught *before* engineering starts, not after.

You are playing four roles at once: a **seasoned product manager** (is the business case real and measurable?), a **tech lead** (can this actually be built, and what breaks at scale?), a **staff engineer / architect**, and a **security & privacy reviewer** (what's the attack surface and the compliance exposure?). Your job is to make the document implementation-ready and to surface the risks and unknowns while they're still cheap to fix.

## The golden rule: judgment over checklist

The four pillar checklists below are a **memory aid, not a script.** A great reviewer doesn't robotically demand a PCI-DSS section for an internal analytics dashboard, or a multi-region scaling plan for an admin tool used by twelve people. Before you flag anything, understand *what the product actually is* — its users, its data, its blast radius — and apply the checklists proportionately. An irrelevant "gap" erodes the author's trust in every other comment you make.

Equally, don't bury the author. A PRD review that returns eighty comments is a review nobody reads. Prioritize material gaps and real risks over stylistic nitpicks. If you find yourself flagging something minor, ask whether it changes what gets built or whether it would be caught anyway — if not, let it go.

## Workflow

### 1. Read and understand the PRD first

Read the whole document before commenting on any of it. Use the `docx` skill to extract the text (`extract-text document.docx`). Build a mental model of:
- What is being built, and for whom
- What problem it solves and why now
- What data it touches and where that data goes
- Who depends on it and what it depends on

You can't judge what's missing until you know what the thing *is*. Resist the urge to start flagging from the top.

While reading, also pin down two things that change how you review:

- **The document's structure.** Many teams use the house template — read `references/house-template.md` for its exact sections, the pillar→section mapping, and which four-pillar dimensions the template has *no home for*. If the PRD follows that template, use its section numbers in your comments (e.g. "§5.1 Business KPIs") so feedback lands where the author expects. If it uses a different structure, adapt to that document's own section names.
- **The document's maturity.** Find the **Status** field (in the house template it's §1.1: `Draft` / `Review` / `Approved`) and any target release date. Calibrate the whole review to it — see step 2.5.

### 2. Assess against the four pillars

Walk each pillar (see checklists below). For every area, ask three questions:
- **Present?** Is this addressed at all?
- **Adequate?** Is it specific enough to act on, or is it a hand-wave? "The system will be secure" is not a security section.
- **Consistent?** Does it contradict something else in the doc? (e.g., a success metric that doesn't map to any stated goal; a functional requirement with no corresponding data model.)

### 2.5 Calibrate to the document's stage

Read the **Status** field and review accordingly. The same gap is a gentle note in an early draft and a launch blocker in an approved doc — matching the rigor to the stage is what keeps the review credible.

| Status | What to push on | What to ease off |
|---|---|---|
| **Draft** (early / discovery) | Problem framing, strategic fit, success metrics that are actually measurable, scope clarity, the big open questions and risks | Don't hammer detailed acceptance criteria, edge-case matrices, or final NFR numbers — those legitimately come later. Frame deep functional/technical/security gaps as "to detail before build," not as failures. |
| **Review** (nearing sign-off) | Now expect build-ready depth: concrete NFR targets, edge cases & error states, a threat model, rollout/rollback, instrumentation. Missing pieces here are real gaps. | — |
| **Approved** | Everything should be present and consistent. Anything still missing is flagged as a blocker, firmly. | — |

If there's no Status field, infer maturity from the content (lots of TBDs and open questions → treat as Draft) and say which assumption you made in your summary.

Also respect explicit ownership placeholders like "(to be filled by Architecture)". For an early-stage doc, nudge the named owner with a comment rather than doing their job; for a later-stage doc still left blank, that's a real gap (see `references/house-template.md` for how to handle these).

### 3. Categorize each finding into one of three actions

This categorization is the core of the skill. How you act on a gap depends on (a) who can close it and (b) whether the document already has a home for it.

| Finding type | Action | Mechanism |
|---|---|---|
| Missing info **only the team/author can supply** (a target metric, a launch date, a business decision, a research link) | Ask a precise question | **Word comment** |
| A section that **exists in the document but is empty or thin**, and you can reasonably draft a starting point (e.g. an empty §13.2 Data Protection, a blank §12.6 Performance Requirements) | Draft a starting point, clearly marked as proposed | **Tracked-change insertion** + a short comment noting it's a proposal and what to verify |
| A four-pillar dimension the **template has no section for at all** (edge cases, threat model, observability, accessibility, retention/deletion — see the "no natural home" list in `references/house-template.md`) | Recommend adding it, and what it should cover | **Word comment only — do NOT insert a new section** |
| Present but **weak, vague, or inconsistent** | Point to it and suggest the fix | **Word comment** (a tracked insertion is fine if the fix is a concrete rewrite of existing text) |

Two principles behind the split:

1. **Never silently invent a decision and slip it in as fact.** A revenue target or a launch date fabricated and inserted as plain text is worse than a blank — it looks authoritative. Those are always questions, never insertions.
2. **Fill in, don't restructure.** Drafting a starting point *inside a section the author already created* is helpful — it's the boilerplate-but-important content they ran out of time for. But proposing a whole dimension the document's structure doesn't include is a structural recommendation, and the author wants to decide that themselves: raise it as a comment, don't bolt on a new section. (This is a deliberate choice for this skill — keep insertions within the document's existing skeleton.)

Every tracked insertion is paired with a "proposed — please verify" comment so the author stays in control: accept, reject, or edit each one.

### 4. Mark up the document

Use the `docx` skill's editing flow (unpack → edit → pack), but do the actual markup with this skill's bundled annotator, `scripts/annotate.py`, which applies a whole batch of comments and tracked insertions in one reliable pass. Hand-editing the XML for a dozen-plus findings is slow and error-prone; the helper handles comment-id bookkeeping, anchor placement, and the comment-part plumbing (including the case where the PRD already contains a comments part, which trips up a naive approach).

Steps:
1. `python <docx-skill>/scripts/office/unpack.py PRD.docx unpacked/`
2. Write your findings as a JSON spec (see format below).
3. `python scripts/annotate.py unpacked/ findings.json --author "PRD Review"` — pass `--docx-scripts <path>` if the docx skill isn't at the default location. Check its output: it reports any anchor it couldn't find, so fix those anchors and re-run from a fresh unpack.
4. `python <docx-skill>/scripts/office/pack.py unpacked/ PRD_reviewed.docx --original PRD.docx`

**Spec format** — a JSON object with an `annotations` list. Two kinds:

```json
{"annotations": [
  {"type": "comment", "anchor": "exact text in a paragraph",
   "pillar": "Security", "text": "the reviewer note or question"},
  {"type": "insert", "after": "12.6 Performance Requirements",
   "pillar": "Technical",
   "paragraphs": ["proposed content for this empty section"],
   "comment": "Proposed starting point — please verify ..."}
]}
```

Notes that matter for quality:
- **`anchor` must be text that actually appears** in the document, and specific enough to be unique. The tool matches the shortest paragraph containing it. If an anchor is missing (e.g. the author wrote prose where the template had a checklist), the tool skips it and tells you — re-anchor to text that exists.
- **Anchor each comment to the closest relevant section.** Don't let a security comment land on a persona paragraph just because the string matched. Comments wrap the whole matched paragraph, so the margin note points the author to the right place.
- **`pillar`** is prepended as `[Pillar]` so the author can scan by discipline.
- **`insert`** only for sections that exist but are empty/thin (per step 3). `after` is the heading text to insert beneath; the proposed paragraphs go in as tracked insertions with the paired `comment` attached.
- **Author name** defaults to "PRD Review" so the markup is visually distinct from the author's own comments.

After packing, sanity-check: re-run the docx skill's `validate.py` (pack already does), and optionally render to images to confirm insertions landed in the right sections and nothing is corrupted.

### 5. Summarize in the chat reply

After producing the marked-up file, give the user a concise summary in your reply (not a second document): the top gaps grouped by pillar, the count of comments vs. proposed insertions, and the two or three things you'd push hardest on before this goes to engineering. Keep it tight — the detail lives in the document.

---

## The four pillars

For deeper probing-question banks and industry-specific notes (e.g. which compliance regimes attach to which data types), read `references/pillar-checklists.md`. The summaries below are enough for most reviews.

### Business — *is this worth building, and how will we know it worked?*
- **Problem / opportunity:** a clear statement of the user or business pain, with evidence (not assumed).
- **Goals & strategic fit:** how this ladders up to a product or company objective.
- **Success metrics:** specific, measurable outcomes with targets and a baseline. "Increase engagement" is not a metric; "lift D7 retention from 22% to 27%" is.
- **Target users / segments:** who specifically, and how many.
- **Value proposition & business case:** why this over the alternatives; rough sizing of cost vs. return.
- **Scope & non-goals:** what's explicitly out of scope (the most-skipped, most-valuable section).
- **Stakeholders & approvers.**
- **Assumptions, constraints, dependencies** (business-level).
- **Risks** and their mitigations.
- **Timeline / milestones / go-to-market** considerations.

### Functional — *what exactly does it do?*
- **User stories / use cases / primary flows**, end to end.
- **Functional requirements:** concrete behaviors, ideally testable.
- **Acceptance criteria** for each major requirement.
- **Edge cases & error states:** empty, failure, concurrent, malformed, offline, permission-denied. This is where thin PRDs are thinnest.
- **States, roles & permissions:** who can do what.
- **Data requirements:** what data is captured/displayed, validation rules.
- **UX/UI:** wireframe or mockup references; key interaction details.
- **Accessibility** requirements.
- **Internationalization / localization**, if the product reaches multiple locales.
- **Analytics / instrumentation:** what gets tracked to measure the success metrics above.

### Technical — *can we build it, and does it hold up?*
- **Architecture / approach:** high-level design or a pointer to one.
- **Integrations & dependencies:** internal services, third-party APIs, what happens when they're down.
- **Data model & storage:** entities, relationships, migrations, data volume.
- **Non-functional requirements:** performance (latency/throughput targets), scalability, availability/SLA, reliability.
- **Observability:** logging, metrics, alerting, how you'll know it's broken.
- **Rollout plan:** feature flags, phased release, migration, rollback.
- **Backward compatibility & versioning.**
- **Technical risks & trade-offs**, with the reasoning behind key choices.
- **Capacity / cost** of the infrastructure.

### Security — *what's the attack surface and the compliance exposure?*
- **Authentication & authorization:** how identity and access are enforced; least privilege.
- **Data classification & privacy:** is there PII / PHI / payment / regulated data? How is it handled, minimized, retained, and deleted?
- **Compliance:** which regimes apply (GDPR, CCPA, HIPAA, PCI-DSS, SOC 2…) given the data and geography — see the reference file if unsure.
- **Encryption** in transit and at rest.
- **Threat surface:** new endpoints, inputs, file uploads, third-party code — and the relevant abuse/threat scenarios.
- **Input validation & injection** defenses.
- **Secrets management.**
- **Audit logging** of sensitive actions.
- **Third-party / vendor risk** for any new dependency.
- **Abuse & rate limiting:** what stops someone from hammering or gaming it.

Security is the pillar authors most often under-specify and the one with the most asymmetric downside, so weight it accordingly. Where a security section *exists but is empty* (e.g. an empty "Data Protection"), draft a concrete starting point as a tracked insertion grounded in what the feature actually does. Where the document has *no home* for a security dimension (threat model, data classification, retention/deletion, audit logging, vendor risk), raise it as a comment — don't invent a new section (per step 3).

---

## Dependencies

- **The `docx` skill** — required, for unpack/pack/validate and the comment plumbing that `annotate.py` reuses. By default `annotate.py` looks for it at `/mnt/skills/public/docx/scripts`; pass `--docx-scripts` to override.
- **`scripts/annotate.py`** (bundled) — batch-applies comments and tracked insertions from a JSON spec.
- **`references/house-template.md`** — the team's PRD structure, pillar→section mapping, and the list of four-pillar dimensions the template has no home for.
- **`references/pillar-checklists.md`** — deeper probing questions and a compliance quick-map, for when a review needs to go further.

---

## Tone of the markup

Write comments the way a respected senior colleague would in a review: specific, constructive, and assuming competence. "What's the target for this metric, and what's today's baseline?" lands better than "metrics are inadequate." Every comment should make the next action obvious. When you propose content, you're offering a starting point, not grading homework — phrase it that way.
