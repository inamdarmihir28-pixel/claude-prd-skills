# Pillar Checklists — deep reference

Read this when you want to go deeper than the summary in SKILL.md, or when the PRD touches a domain you want to pressure-test thoroughly (regulated data, high-scale systems, payments, etc.). These are probing questions to ask of the document — not a list to dump verbatim into comments.

## Table of contents
- [Business](#business)
- [Functional](#functional)
- [Technical](#technical)
- [Security](#security)
- [Compliance quick map](#compliance-quick-map)

---

## Business

Probing questions:
- What happens if we *don't* build this? Is the cost of inaction quantified?
- Is the problem validated with data or user research, or is it an assumption dressed as a fact?
- Does each success metric have (a) a definition, (b) a current baseline, (c) a target, and (d) a measurement window?
- Are the metrics actually attributable to this work, or could they move for unrelated reasons?
- Is there a guardrail metric — something that must *not* get worse (e.g., support load, latency, churn)?
- Who is the single accountable decision-maker, and who merely needs to be informed?
- What's the opportunity cost — what are we not building to build this?
- Is there a kill criterion: under what result would we roll this back or stop investing?

Common weak spots: vanity metrics, missing non-goals, no baseline, no owner, timeline with no dependencies acknowledged.

## Functional

Probing questions:
- For each happy-path flow, what's the unhappy path? (validation failure, timeout, partial success, duplicate submission, race condition.)
- What are the permission boundaries — can a user act on another user's data? An admin? A logged-out visitor?
- What's the behavior at the limits: zero items, one item, the maximum, beyond the maximum?
- What's the empty state, loading state, and error state for each surface?
- Are acceptance criteria written so QA could turn them into test cases without asking a follow-up?
- What existing behavior could this change or break? (Regression surface.)
- How will each success metric actually be instrumented — which events, which properties?

Common weak spots: edge cases, error states, permissions, instrumentation that doesn't match the success metrics.

## Technical

Probing questions:
- What are the concrete NFR targets (p95 latency, requests/sec, data volume, concurrent users)? "Fast" is not a target.
- What's the failure mode when each dependency is slow or down? Is there graceful degradation?
- Is there a data migration? Is it reversible? What's the plan if it fails halfway?
- How does this roll out and, critically, roll *back*?
- What's the observability story — would an on-call engineer be able to diagnose a 2am incident from what's specified?
- Where's the state, and what are the consistency requirements?
- What are the build-vs-buy and architectural trade-offs, and is the reasoning captured so future engineers understand the "why"?
- What's the cost envelope at expected and peak scale?

Common weak spots: missing NFR numbers, no rollback, no observability, dependency failure modes ignored.

## Security

Probing questions:
- What data does this collect, store, or transmit, and how is each field classified (public / internal / confidential / regulated)?
- Is any of it PII, PHI, financial, biometric, or location data? If yes, what minimizes collection and what governs retention/deletion?
- How is authentication handled? Authorization (who can do what)? Is least privilege enforced?
- What new entry points does this create (endpoints, forms, uploads, webhooks, queues), and what validates input on each?
- What are the realistic abuse cases — enumeration, scraping, injection, privilege escalation, denial of service — and what stops them?
- Is data encrypted in transit and at rest? How are keys and secrets managed?
- Are sensitive actions audit-logged in a tamper-evident way?
- For each third-party dependency: what's their security posture, and what data do they get?
- Is there a rate-limiting / quota story?
- Does this change the compliance footprint (new region, new data type, new processor)?

Common weak spots: "the platform handles security," no data classification, no threat model, no retention/deletion policy, unbounded inputs.

## Compliance quick map

Use this to sanity-check which regimes likely attach. This is orientation, not legal advice — flag for the team's legal/security function rather than asserting a definitive compliance determination.

| If the PRD involves… | Likely in scope |
|---|---|
| Personal data of EU/UK residents | GDPR / UK GDPR (lawful basis, data subject rights, DPA, retention) |
| Personal data of California residents | CCPA / CPRA (notice, opt-out, deletion) |
| Protected health information (US) | HIPAA (BAA, safeguards, minimum necessary) |
| Card / payment data | PCI-DSS (scope reduction, tokenization, no raw PAN storage) |
| Selling to enterprises / B2B SaaS | SOC 2 (audit logging, access control, change management evidence) |
| Children's data (US, under 13) | COPPA (verifiable parental consent) |
| Financial services data | regional financial regs (e.g. GLBA, PSD2) |
| Biometric data (e.g. Illinois) | BIPA and similar state laws |

When a PRD introduces a new data type or a new geography, treat the compliance footprint as something that has *changed* and call it out explicitly — these shifts are easy to miss and expensive to retrofit.
