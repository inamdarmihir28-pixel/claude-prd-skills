#!/usr/bin/env node
/*
 * build_prd.js — render a V1 PRD (.docx) in the house 18-section template
 * from a JSON content spec.
 *
 *   node build_prd.js content.json output.docx
 *
 * Any missing/empty field renders as a visible "to be determined" marker,
 * never as fabricated content. Schema: see references/template-blueprint.md.
 */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat
} = require('docx');

const [, , specPath, outPath = 'PRD_v1.docx'] = process.argv;
if (!specPath) { console.error('Usage: node build_prd.js content.json [output.docx]'); process.exit(1); }
const C = JSON.parse(fs.readFileSync(specPath, 'utf8'));

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const margins = { top: 80, bottom: 80, left: 120, right: 120 };
const TBD = '\u27E8to be determined\u27E9';

const isEmpty = v => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
  || (Array.isArray(v) && v.length === 0);

function runs(v) {
  if (isEmpty(v)) return [new TextRun({ text: TBD, italics: true, color: '888888' })];
  return [new TextRun(String(v))];
}
function H1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] }); }
function H2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] }); }
function body(v) { return new Paragraph({ children: runs(v), spacing: { after: 120 } }); }
function labelled(label, v) {
  return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: label + ': ', bold: true }), ...runs(v)] });
}
function bullets(arr) {
  if (isEmpty(arr)) return [body(null)];
  return arr.filter(x => !isEmpty(x)).map(x => new Paragraph({ numbering: { reference: 'b', level: 0 }, children: [new TextRun(String(x))] }));
}
function cell(v, w, opts = {}) {
  const children = Array.isArray(v) ? v : [new Paragraph({ children: opts.head ? [new TextRun({ text: String(v), bold: true })] : runs(v) })];
  return new TableCell({ borders, margins, width: { size: w, type: WidthType.DXA },
    shading: opts.head ? { fill: 'D5E8F0', type: ShadingType.CLEAR } : undefined, children });
}
function table(widths, headers, rows, emptyNote) {
  const headRow = new TableRow({ children: headers.map((h, i) => cell(h, widths[i], { head: true })) });
  let bodyRows;
  if (isEmpty(rows)) {
    bodyRows = [new TableRow({ children: [new TableCell({ borders, margins,
      width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnSpan: widths.length,
      children: [new Paragraph({ children: [new TextRun({ text: emptyNote || TBD, italics: true, color: '888888' })] })] })] })];
  } else {
    bodyRows = rows.map(r => new TableRow({ children: r.map((v, i) => cell(v, widths[i])) }));
  }
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, rows: [headRow, ...bodyRows] });
}
// Render a field that may be a string OR a structured object {label: value}.
function flexible(v, subfields) {
  if (typeof v === 'string' || isEmpty(v)) return [body(v)];
  return subfields.filter(([k]) => k in v).map(([k, label]) => labelled(label, v[k]));
}

const dc = C.doc_control || {};
const k = [];

// Title
k.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('Product Requirements Document')] }));
k.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: dc.name || TBD, bold: true, italics: isEmpty(dc.name), color: isEmpty(dc.name) ? '888888' : undefined })] }));

// 1. Document Control
k.push(H1('1. Document Control'));
k.push(H2('1.1 Document Information'));
const dcRows = [
  ['Product / Initiative Name', dc.name], ['Author', dc.author], ['Product Manager', dc.product_manager],
  ['Engineering Lead', dc.engineering_lead], ['Architect', dc.architect], ['Version', dc.version || '0.1 (V1)'],
  ['Status', dc.status || 'Draft'], ['Last Updated', dc.last_updated], ['Target Release', dc.target_release],
];
k.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 6360],
  rows: dcRows.map(([a, b]) => new TableRow({ children: [cell(a, 3000, { head: true }), cell(b, 6360)] })) }));

// 2. Problem Framing
const pr = C.problem || {};
k.push(H1('2. Problem Framing'));
k.push(H2('2.1 Observed Behaviour / Existing Process')); k.push(body(pr.observed_behaviour));
k.push(H2('2.2 Underlying Customer Need')); k.push(body(pr.customer_need));
k.push(H2('2.3 Underlying Business Need')); k.push(body(pr.business_need));
k.push(H2('2.4 Pain Point Framing'));
k.push(table([3120, 3120, 3120], ['Pain Point', 'Impact', 'Evidence'],
  (pr.pain_points || []).map(p => [p.pain, p.impact, p.evidence]), 'No pain points captured yet — open question.'));
k.push(H2('2.5 North Star Statement')); k.push(body(pr.north_star));

// 3. Strategic Alignment
const st = C.strategic || {};
k.push(H1('3. Strategic Alignment'));
k.push(H2('3.1 Business Objective — Alignment'));
bullets(st.alignment).forEach(p => k.push(p));
k.push(H2('3.2 Strategic Fit'));
k.push(labelled('Why now', st.why_now));
k.push(labelled('Why this initiative', st.why_this));
k.push(labelled('Consequences of not doing it', st.consequences));

// 4. Opportunity
k.push(H1('4. Opportunity'));
flexible(C.opportunity, [['type', 'Type'], ['sizing', 'Rough sizing']]).forEach(p => k.push(p));

// 5. Success Metrics
const sm = C.success_metrics || {};
k.push(H1('5. Success Metrics'));
k.push(H2('5.1 Business KPIs')); bullets(sm.business_kpis).forEach(p => k.push(p));
k.push(H2('5.2 Product KPIs')); bullets(sm.product_kpis).forEach(p => k.push(p));

// 6. Customer & User Research
k.push(H1('6. Customer & User Research'));
k.push(body(C.research));

// 7. Personas
const pe = C.personas || {};
k.push(H1('7. Personas'));
k.push(H2('7.1 Persona Summary'));
k.push(table([2200, 1800, 3360, 2000], ['Persona', 'Relationship', 'Job to be done (Given–When–Then)', 'How this offering serves them'],
  (pe.summary || []).map(p => [p.persona, p.relationship, p.jtbd, p.serves]), 'No personas captured yet.'));
k.push(H2('7.2 Detail Description')); k.push(body(pe.detail));

// 8. Solution Concept
k.push(H1('8. Solution Concept'));
k.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Framed as a concept, not a specification — scope decisions remain open pending discovery.', italics: true, color: '666666' })] }));
k.push(body(C.solution_concept));

// 9. Scope Definition
const sc = C.scope || {};
k.push(H1('9. Scope Definition'));
k.push(H2('9.1 In Scope')); bullets(sc.in).forEach(p => k.push(p));
k.push(H2('9.2 Out of Scope')); bullets(sc.out).forEach(p => k.push(p));

// 10. Guardrails
k.push(H1('10. Design & Technical Guardrails'));
(Array.isArray(C.guardrails) ? bullets(C.guardrails) : [body(C.guardrails)]).forEach(p => k.push(p));

// 11. Data Requirements
k.push(H1('11. Data Requirements'));
flexible(C.data_requirements, [['inputs', 'Inputs'], ['outputs', 'Outputs'], ['transformations', 'Transformations'], ['quality_rules', 'Data Quality Rules']]).forEach(p => k.push(p));

// 12. Technical Requirements
const te = C.technical || {};
k.push(H1('12. Technical Requirements (to be filled by Architecture)'));
k.push(H2('12.1 Solution Overview')); k.push(body(te.solution_overview));
k.push(H2('12.2 High-Level Architecture')); k.push(body(te.architecture));
k.push(H2('12.3 Technology Stack')); k.push(body(te.stack));
k.push(H2('12.4 Integration Requirements')); k.push(body(te.integration));
k.push(H2('12.5 API Requirements (Endpoints, Authentication, Rate Limits, Error Handling)')); k.push(body(te.api));
k.push(H2('12.6 Performance Requirements')); k.push(body(te.performance));

// 13. Security Requirements
const se = C.security || {};
k.push(H1('13. Security Requirements (to be filled by Architecture)'));
k.push(H2('13.1 Authentication & Authorization')); k.push(body(se.authn_authz));
k.push(H2('13.2 Data Protection')); k.push(body(se.data_protection));

// 14. Non-Functional Requirements
k.push(H1('14. Non-Functional Requirements'));
(Array.isArray(C.nfr) ? bullets(C.nfr) : [body(C.nfr)]).forEach(p => k.push(p));

// 15. Risks & Assumptions
k.push(H1('15. Risks & Assumptions'));
k.push(H2('15.1 Risk Matrix'));
k.push(table([3000, 2120, 2120, 2120], ['Risk', 'Impact', 'Probability', 'Mitigation'],
  (C.risks || []).map(r => [r.risk, r.impact, r.probability, r.mitigation]), 'No risks captured yet.'));
k.push(H2('15.2 Assumptions'));
bullets(C.assumptions).forEach(p => k.push(p));

// 16. Open Questions
k.push(H1('16. Open Questions'));
k.push(table([5360, 2000, 2000], ['Question', 'Owner', 'Due Date'],
  (C.open_questions || []).map(q => [q.question, q.owner, q.due]), 'No open questions captured yet.'));

// 17. Decision Log
k.push(H1('17. Decision Log'));
k.push(table([2000, 5360, 2000], ['Date', 'Decision', 'Owner'],
  (C.decision_log || []).map(d => [d.date, d.decision, d.owner]), 'No decisions logged yet.'));

// 18. Delivery & Release Plan
k.push(H1('18. Delivery & Release Plan'));
k.push(table([6360, 3000], ['Milestone', 'Target Date'],
  (C.delivery || []).map(d => [d.milestone, d.target]), 'No milestones captured yet.'));

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, font: 'Arial', color: '1F3864' }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '2E5496' }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 1 } },
    ]
  },
  numbering: { config: [{ reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children: k }]
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync(outPath, buf); console.log('Wrote', outPath, buf.length, 'bytes'); });
