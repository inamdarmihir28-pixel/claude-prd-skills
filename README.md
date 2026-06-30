[Uploading README.md…]()
# Claude PRD Skills

Two custom [Claude Skills](https://support.claude.com) for working with Product Requirements Documents in a standard 18-section house template. They are designed to pair: use **prd-creation** to draft a V1, then **prd-enrichment** to pressure-test it as it matures.

## Skills

### `prd-creation/`
Creates a V1 PRD by interviewing the user in prioritised rounds, starting from partial inputs (an idea, personas, problem framing). It fills the template only with what the user actually provides and turns every gap into either a labelled **assumption** or an **open question tied to a stakeholder owner** — it never fabricates facts. Output is a polished `.docx` in the 18-section structure.

- `SKILL.md` — interview methodology, the no-fabrication rule, discovery-stage calibration, stakeholder routing.
- `references/template-blueprint.md` — what to elicit per section, plus the JSON schema the builder reads.
- `scripts/build_prd.js` — renders the V1 `.docx`; any blank field shows as a visible "to be determined" marker.

### `prd-enrichment/`
Reviews an existing PRD against four pillars — **Business, Functional, Technical, Security** — calibrated to the document's maturity (the Status field). It returns the same Word document marked up with comments (gaps and clarifying questions) and tracked-change insertions (proposed content for empty-but-existing sections).

- `SKILL.md` — the four-pillar review logic and the comment-vs-insertion rules.
- `references/house-template.md` — the section structure and pillar→section mapping.
- `references/pillar-checklists.md` — deeper probing questions and a compliance quick-map.
- `scripts/annotate.py` — batch-applies comments and tracked insertions from a JSON spec.

## Dependencies
Both skills are built to run alongside Claude's built-in **docx** skill (used for reading, validating, and the comment plumbing). `build_prd.js` uses the `docx` npm package; `annotate.py` uses `defusedxml`.

## Installing in Claude
1. In Claude, enable **Code execution and file creation** (Settings → Capabilities) and the built-in **Word (docx)** skill.
2. Zip the individual skill folder you want (e.g. `prd-creation/`) so the zip contains that folder with its `SKILL.md`.
3. In the Skills section, upload the zip and toggle it on.
4. Start a new chat and either attach a PRD or describe one; Claude loads the matching skill automatically.

## Note
These skills are generic to the 18-section template. They contain no company-, project-, or customer-specific information.
