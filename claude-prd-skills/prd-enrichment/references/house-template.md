# House PRD Template — structure & pillar mapping

This is the team's standard PRD structure. When a PRD follows it (or roughly follows it), use these exact section numbers and names in comments so feedback lands where the author expects. When a PRD uses a *different* structure, adapt — speak in that document's own section names — but the pillar mapping and the "dimensions with no home" list below still tell you what to look for.

## The template, section by section

1. **Document Control** — 1.1 Document Information (Product name, Author, PM, Eng Lead, Architect, Version, **Status [Draft / Review / Approved]**, Last Updated, Target Release)
2. **Problem Framing** — 2.1 Observed Behaviour / Existing Process · 2.2 Underlying customer need · 2.3 Underlying business need · 2.4 Pain point framing (table: Pain Point / Impact / Evidence) · 2.5 North Star statement
3. **Strategic Alignment** — 3.1 Business Objective (align to: Company Strategy, Product Vision, Revenue Goals, Customer Commitments, Regulatory Requirements) · 3.2 Strategic Fit (Why now? Why this? Consequences of not doing it)
4. **Opportunity** — Revenue / Cost Reduction / Productivity / CX improvement
5. **Success Metrics** — 5.1 Business KPIs · 5.2 Product KPIs
6. **Customer & User Research** — links to interview sessions
7. **Personas** — 7.1 Persona Summary (table: Persona / Relationship / Job-to-be-done [Given–When–Then] / How this serves them) · 7.2 Detail description
8. **Solution Concept** — *deliberately not a specification; scope stays open pending discovery*
9. **Scope Definition** — 9.1 In Scope · 9.2 Out of Scope
10. **Design and Technical Guardrails** — entitlements, SSO, design principles, UX deliverables
11. **Data Requirements** — inputs, outputs, transformations, data quality rules
12. **Technical Requirements** *(to be filled by Architecture)* — 12.1 Solution Overview · 12.2 High-Level Architecture · 12.3 Technology Stack · 12.4 Integration Requirements · 12.5 API Requirements (endpoints, auth, rate limits, error handling) · 12.6 Performance Requirements *(to be filled by Product)*
13. **Security Requirements** *(to be filled by Architecture)* — 13.1 Authentication & Authorization (SSO, RBAC, MFA, Azure AD) · 13.2 Data Protection (encryption at rest/in transit, secrets management)
13/14. **Non-Functional Requirements** *(template numbers this 13 again — see numbering note)*
14. **Risks & Assumptions** — Risk matrix (table: Risk / Impact / Probability / Mitigation) · Assumptions
16. **Open Questions** — table: Question / Owner / Due Date
17. **Decision Log** — table: Date / Decision / Owner
18. **Delivery & Release Plan** — table: Milestone / Target Date

### Known numbering hiccups in the template
- Two sections are numbered **13** (Security Requirements and Non-Functional Requirements).
- Section **14** (Risks & Assumptions) has subsections numbered **15.1 / 15.2**, and "15.1 Risk metric" likely means "Risk matrix."

Only fix these if the user asks, or raise a single low-priority comment offering to. They are not the point of the review.

## Pillar → section mapping

| Pillar | Lives mainly in |
|---|---|
| **Business** | 2 (Problem Framing), 3 (Strategic Alignment), 4 (Opportunity), 5 (Success Metrics), 6 (Research), 7 (Personas) |
| **Functional** | 8 (Solution Concept), 9 (Scope), 10 (Guardrails), 11 (Data Requirements) — *see thin spots below* |
| **Technical** | 11 (Data Requirements), 12 (Technical Requirements), the NFR section |
| **Security** | 13 (Security Requirements), parts of 12.5 (API auth / rate limits) |

## Dimensions with no natural home in this template

These four-pillar concerns are not represented by any section. Per the user's instruction, **raise them as comments only — do not insert new sections.** Anchor each comment to the closest existing section.

- **Functional spec depth:** explicit functional requirements, acceptance criteria, edge cases & error states, roles/permissions. (Closest homes: §8, §9, §11. Calibrate to Status — see SKILL.md.)
- **Accessibility** requirements. (Closest: §10 Guardrails.)
- **Internationalization / localization.** (Closest: §10 or §9.)
- **Analytics / instrumentation** to measure the §5 KPIs. (Closest: §5 or §11.)
- **Observability** — logging, metrics, alerting. (Closest: §12.)
- **Rollout / rollback / feature-flagging / migration.** (Closest: §18 Delivery, or §12.)
- **Backward compatibility / versioning.** (Closest: §12.)
- **Security depth beyond §13:** threat model / abuse cases, data classification, PII/PHI handling, data retention & deletion, audit logging, vendor/third-party risk, applicable compliance regimes. (Closest: §13.)

Within sections that *do* exist but are empty or thin (e.g. an empty §13.2, or §12.6 Performance Requirements left blank), drafting a proposed starting point as a tracked insertion is appropriate.

## "(To be filled by …)" placeholders

The template explicitly marks some sections for a specific owner — §12 and §13 "to be filled by Architecture," §12.6 "by Product." When such a section is empty:
- If the doc is early-stage (Status = Draft), a comment nudging the named owner is usually right — don't do their job for them prematurely.
- If the doc is later-stage (Review/Approved) and still empty, that's a real gap worth a firmer comment, and a drafted starting point (tracked insertion, clearly labelled "proposed starting point for Architecture to confirm") can help — but keep ownership explicit.
