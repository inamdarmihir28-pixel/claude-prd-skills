#!/usr/bin/env python3
"""Batch-apply PRD review markup to an unpacked .docx.

Reads a JSON spec of annotations and applies them to word/document.xml,
reusing the docx skill's comment plumbing (comments.xml, rels, content types).

Two annotation types:

  {"type": "comment",
   "anchor": "exact text that appears in a paragraph",
   "pillar": "Security",            # optional; prefixed as [Security] to the note
   "text":  "the reviewer note / question"}

  {"type": "insert",
   "after":  "12.6 Performance Requirements",   # heading text to insert AFTER
   "pillar": "Technical",                        # optional
   "paragraphs": ["First proposed line.", "Second proposed line."],
   "comment": "Proposed starting point — please verify ..."}  # optional paired note

Comments wrap the whole matched paragraph (robust, and the margin note still
points the author to the right place). Insertions are tracked <w:ins> content
so the author accepts or rejects each one; the paragraph mark is also marked
inserted so accepting leaves clean text.

Usage:
    python annotate.py <unpacked_dir> <spec.json> [--author "PRD Review"] \
        [--docx-scripts /mnt/skills/public/docx/scripts]

Run the docx skill's pack.py afterwards to produce the .docx.
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import defusedxml.minidom as minidom

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def _load_add_comment(docx_scripts: str):
    sys.path.insert(0, docx_scripts)
    try:
        from comment import add_comment  # type: ignore
    except Exception as e:  # pragma: no cover
        sys.exit(f"Could not import comment.py from {docx_scripts}: {e}\n"
                 "Pass --docx-scripts with the path to the docx skill's scripts/ dir.")
    return add_comment


def _xml_escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _para_text(p) -> str:
    return "".join(t.firstChild.nodeValue or "" for t in p.getElementsByTagName("w:t") if t.firstChild)


def _next_comment_id(unpacked: Path) -> int:
    cpath = unpacked / "word" / "comments.xml"
    if not cpath.exists():
        return 0
    dom = minidom.parseString(cpath.read_text(encoding="utf-8"))
    ids = [int(c.getAttribute("w:id")) for c in dom.getElementsByTagName("w:comment") if c.getAttribute("w:id").isdigit()]
    return (max(ids) + 1) if ids else 0


def _find_para(doc, anchor: str):
    """Return the first <w:p> whose concatenated text contains anchor."""
    best = None
    for p in doc.getElementsByTagName("w:p"):
        txt = _para_text(p)
        if anchor in txt:
            # Prefer the shortest matching paragraph (most specific).
            if best is None or len(txt) < len(_para_text(best)):
                best = p
    return best


def _make_marker(doc, tag: str, cid: int):
    el = doc.createElement(tag)
    el.setAttribute("w:id", str(cid))
    return el


def _make_ref_run(doc, cid: int):
    r = doc.createElement("w:r")
    rpr = doc.createElement("w:rPr")
    rstyle = doc.createElement("w:rStyle")
    rstyle.setAttribute("w:val", "CommentReference")
    rpr.appendChild(rstyle)
    r.appendChild(rpr)
    ref = doc.createElement("w:commentReference")
    ref.setAttribute("w:id", str(cid))
    r.appendChild(ref)
    return r


def _wrap_paragraph_with_comment(doc, p, cid: int):
    """Insert commentRangeStart after pPr, end + reference run at paragraph end."""
    children = [n for n in p.childNodes if n.nodeType == n.ELEMENT_NODE]
    ppr = next((c for c in children if c.tagName == "w:pPr"), None)
    start = _make_marker(doc, "w:commentRangeStart", cid)
    if ppr and ppr.nextSibling:
        p.insertBefore(start, ppr.nextSibling)
    elif ppr:
        p.appendChild(start)
    else:
        p.insertBefore(start, p.firstChild)
    end = _make_marker(doc, "w:commentRangeEnd", cid)
    p.appendChild(end)
    p.appendChild(_make_ref_run(doc, cid))


def _make_ins_paragraph(doc, text: str, author: str, date: str, ins_id: int):
    """Create a tracked-insertion paragraph; mark the paragraph mark inserted too."""
    p = doc.createElement("w:p")
    ppr = doc.createElement("w:pPr")
    rpr_mark = doc.createElement("w:rPr")
    ins_mark = doc.createElement("w:ins")
    ins_mark.setAttribute("w:id", str(ins_id))
    ins_mark.setAttribute("w:author", author)
    ins_mark.setAttribute("w:date", date)
    rpr_mark.appendChild(ins_mark)
    ppr.appendChild(rpr_mark)
    p.appendChild(ppr)

    ins = doc.createElement("w:ins")
    ins.setAttribute("w:id", str(ins_id + 1))
    ins.setAttribute("w:author", author)
    ins.setAttribute("w:date", date)
    r = doc.createElement("w:r")
    t = doc.createElement("w:t")
    t.setAttribute("xml:space", "preserve")
    t.appendChild(doc.createTextNode(text))
    r.appendChild(t)
    ins.appendChild(r)
    p.appendChild(ins)
    return p


def _ensure_comment_plumbing(unpacked: Path) -> None:
    """Ensure every comment-related part has a relationship AND a content-type
    override. The docx skill's comment.py short-circuits if comments.xml is
    already referenced, which leaves the extended parts (commentsIds, etc.)
    unreferenced when the source doc already contained a comments part. We fix
    that here, idempotently, by checking each target individually."""
    rels_path = unpacked / "word" / "_rels" / "document.xml.rels"
    ct_path = unpacked / "[Content_Types].xml"
    parts = [
        ("comments.xml", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments",
         "/word/comments.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"),
        ("commentsExtended.xml", "http://schemas.microsoft.com/office/2011/relationships/commentsExtended",
         "/word/commentsExtended.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.commentsExtended+xml"),
        ("commentsIds.xml", "http://schemas.microsoft.com/office/2016/09/relationships/commentsIds",
         "/word/commentsIds.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.commentsIds+xml"),
        ("commentsExtensible.xml", "http://schemas.microsoft.com/office/2018/08/relationships/commentsExtensible",
         "/word/commentsExtensible.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.commentsExtensible+xml"),
    ]

    if rels_path.exists():
        dom = minidom.parseString(rels_path.read_text(encoding="utf-8"))
        root = dom.documentElement
        existing_targets = {r.getAttribute("Target") for r in dom.getElementsByTagName("Relationship")}
        used_ids = {r.getAttribute("Id") for r in dom.getElementsByTagName("Relationship")}
        n = 1
        def next_rid():
            nonlocal n
            while f"rId{n}" in used_ids:
                n += 1
            used_ids.add(f"rId{n}")
            return f"rId{n}"
        for target, rtype, _part, _ct in parts:
            if (unpacked / "word" / target).exists() and target not in existing_targets:
                rel = dom.createElement("Relationship")
                rel.setAttribute("Id", next_rid())
                rel.setAttribute("Type", rtype)
                rel.setAttribute("Target", target)
                root.appendChild(rel)
        rels_path.write_text(dom.toxml(), encoding="utf-8")

    if ct_path.exists():
        dom = minidom.parseString(ct_path.read_text(encoding="utf-8"))
        root = dom.documentElement
        existing_parts = {o.getAttribute("PartName") for o in dom.getElementsByTagName("Override")}
        for target, _rtype, part, ct in parts:
            if (unpacked / "word" / target).exists() and part not in existing_parts:
                ov = dom.createElement("Override")
                ov.setAttribute("PartName", part)
                ov.setAttribute("ContentType", ct)
                root.appendChild(ov)
        ct_path.write_text(dom.toxml(), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("unpacked")
    ap.add_argument("spec")
    ap.add_argument("--author", default="PRD Review")
    ap.add_argument("--docx-scripts", default="/mnt/skills/public/docx/scripts")
    args = ap.parse_args()

    add_comment = _load_add_comment(args.docx_scripts)
    unpacked = Path(args.unpacked)
    docpath = unpacked / "word" / "document.xml"
    spec = json.loads(Path(args.spec).read_text(encoding="utf-8"))
    annotations = spec["annotations"] if isinstance(spec, dict) else spec

    date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    cid = _next_comment_id(unpacked)
    ins_id = 9000
    applied, skipped = [], []

    for ann in annotations:
        pillar = ann.get("pillar")
        tag = f"[{pillar}] " if pillar else ""

        if ann["type"] == "comment":
            add_comment(str(unpacked), cid, _xml_escape(tag + ann["text"]), author=args.author,
                        initials="PR")
            # Re-parse after comment.py wrote files, place markers, then write back.
            doc = minidom.parseString(docpath.read_text(encoding="utf-8"))
            p = _find_para(doc, ann["anchor"])
            if p is None:
                skipped.append(f"comment anchor not found: {ann['anchor'][:50]!r}")
                cid += 1
                continue
            _wrap_paragraph_with_comment(doc, p, cid)
            docpath.write_text(doc.toxml(), encoding="utf-8")
            applied.append(f"comment @ {ann['anchor'][:40]!r}")
            cid += 1

        elif ann["type"] == "insert":
            doc = minidom.parseString(docpath.read_text(encoding="utf-8"))
            heading = _find_para(doc, ann["after"])
            if heading is None:
                skipped.append(f"insert heading not found: {ann['after'][:50]!r}")
                continue
            anchor_node = heading
            new_paras = []
            for line in ann["paragraphs"]:
                np = _make_ins_paragraph(doc, line, args.author, date, ins_id)
                ins_id += 2
                new_paras.append(np)
            ref = anchor_node.nextSibling
            parent = anchor_node.parentNode
            for np in new_paras:
                parent.insertBefore(np, ref)
            docpath.write_text(doc.toxml(), encoding="utf-8")
            applied.append(f"insert after {ann['after'][:40]!r} ({len(new_paras)} para)")

            if ann.get("comment"):
                add_comment(str(unpacked), cid, _xml_escape(tag + ann["comment"]),
                            author=args.author, initials="PR")
                doc = minidom.parseString(docpath.read_text(encoding="utf-8"))
                # anchor the paired comment to the first inserted paragraph
                target = _find_para(doc, ann["paragraphs"][0][:30])
                if target is not None:
                    _wrap_paragraph_with_comment(doc, target, cid)
                    docpath.write_text(doc.toxml(), encoding="utf-8")
                cid += 1
        else:
            skipped.append(f"unknown type: {ann.get('type')}")

    _ensure_comment_plumbing(unpacked)

    print(f"Applied {len(applied)} annotation(s).")
    for a in applied:
        print("  +", a)
    if skipped:
        print(f"Skipped {len(skipped)}:")
        for s in skipped:
            print("  !", s)


if __name__ == "__main__":
    main()
