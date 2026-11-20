/* iCONSTRUCTE Site: completion certificate PDF for a BSS Works Inspection (site inspection / handover).
 * Made on the phone once every snag from the inspection has been closed out (or straight away if there were none),
 * then sent to the "Site Returns" library; iCONSTRUCTE files it in the job's "09 - QA" folder.
 * Content: company header, contract details, NSSS 8.9 completion statement, all 20 areas with results, each snag
 * with its close-out (before and after photos), area photos, and the BSSL / client sign-off or 5-day deemed acceptance.
 */
(function () {
  "use strict";
  const { esc, fmtDate, Data, S, Src } = IC;
  const FALLBACK = { name: "Bolton Steel Structures Ltd", lines: ["Unit 1 B, Pocket Nook Lane", "Lowton, Nr Warrington", "WA3 1AW"], tel: "01942 676 294", email: "info@boltonstructures.com" };
  const DEEMED = "This document will be presented to a suitable client representative for handing over on partial or full completion of the above noted project. If the client is unable to complete this document with the BSSL representative, it will be left with the client and a 5 day period will be permitted before acceptance is deemed granted if not returned prior.";

  function blobToDataUrl(blob) { return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsDataURL(blob); }); }
  // Photos go into the PDF small (keeps the certificate a sensible size to email and file)
  async function imageFor(id, maxSide, type) {
    const b = await Store().get(id, "blobs");
    if (!b) return null;
    const im = await shrinkTo(b.blob, maxSide, type);
    if (im) im.meta = b.meta || null;
    return im;
  }
  // "18/11/2026 09:12 · 53.57681, -2.42820" under each photo
  const caption = (m) => !m ? "" : IC.fmtStamp(new Date(m.takenAt)).slice(0, 16) + (m.lat != null ? " · " + m.lat.toFixed(5) + ", " + m.lng.toFixed(5) : " · no location");
  function Store() { return IC.Store; }
  function shrinkTo(blob, maxSide, type) {
    return new Promise((res) => {
      const url = URL.createObjectURL(blob), img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext("2d"); if (type !== "image/png") { g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); }
        g.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        res({ data: c.toDataURL(type || "image/jpeg", 0.72), w: c.width, h: c.height });
      };
      img.onerror = () => { URL.revokeObjectURL(url); res(null); };
      img.src = url;
    });
  }

  // BSS logo built into the app (icons/bss-logo.jpg); the logo from iCONSTRUCTE Admin is only used if that's missing
  async function logo() {
    try { const r = await fetch("icons/bss-logo.jpg"); if (r.ok) return await shrinkTo(await r.blob(), 900, "image/jpeg"); } catch (e) { /* fall through */ }
    const c = (S.manifest && S.manifest.company) || {};
    if (!c.logo) return null;
    try { return await shrinkTo(await Src.blob(c.logo), 600, "image/jpeg"); } catch (e) { return null; }
  }

  async function build(rec, snags) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210, M = 15, R = W - M, BOTTOM = 280;
    const job = IC.jobByFolder(rec.jobFolder) || { jobNumber: rec.jobNumber, site: rec.site, customer: "" };
    const v = rec.values || {}, t = IC.Forms.tpl(rec.templateId) || IC.Forms.tpl("works"), itemsRaw = t.fields.find((f) => f.type === "inspect").items, items = itemsRaw.map((x) => (typeof x === "string" ? x : x.t)), xLabel = (it) => { const o = itemsRaw.find((x) => typeof x !== "string" && x.t === it); return o && o.x ? o.x.label : ""; };
    const co = Object.assign({}, FALLBACK, (S.manifest && S.manifest.company) || {});
    let y = M;
    const need = (h) => { if (y + h > BOTTOM) { doc.addPage(); y = M; } };
    const text = (str, x, size, style, color, opts) => { doc.setFont("helvetica", style || "normal"); doc.setFontSize(size); doc.setTextColor(...(color || [33, 33, 33])); doc.text(String(str == null ? "" : str), x, y, opts || {}); };

    // header
    const lg = await logo();
    if (lg) { const h = 18, w = Math.min(90, lg.w * h / lg.h); doc.addImage(lg.data, "JPEG", M, y + 1, w, h); }
    else { doc.setFillColor(17, 17, 17); doc.rect(M, y, 70, 20, "F"); y += 8; text("BOLTON", M + 5, 13, "bold", [255, 255, 255]); y += 6; text("STEEL STRUCTURES LTD", M + 5, 7.5, "bold", [255, 255, 255]); y -= 14; }
    let hy = y + 3; doc.setFontSize(8.5); doc.setTextColor(80, 80, 80);
    [co.name].concat(co.lines || [], [co.tel, co.email]).filter(Boolean).forEach((l) => { doc.text(String(l), R, hy, { align: "right" }); hy += 4; });
    y += 26; doc.setDrawColor(17, 17, 17); doc.setLineWidth(0.6); doc.line(M, y, R, y); doc.setDrawColor(243, 146, 0); doc.setLineWidth(0.4); doc.line(M, y + 1.2, R, y + 1.2);
    y += 10; text("COMPLETION CERTIFICATE", M, 17, "bold");
    y += 6; text("Site inspection / handover  ·  BSS Works Inspection  ·  NSSS 8.9", M, 9, "normal", [97, 97, 97]);
    y += 8;

    // details
    const subDate = new Date(rec.submittedAt || rec.updatedAt);
    const rows = [["Contract", job.site || rec.site || ""], ["Contract no.", job.jobNumber || rec.jobNumber || ""], ["Customer", job.customer || ""], ["GL ref", v.glRef || ""], ["Work stage", v.stage || ""],
      ["Inspected", fmtDate(subDate) + " by " + (v.bssName || rec.userName || "")], ["Certificate date", fmtDate(new Date())]];
    doc.setDrawColor(224, 224, 224); doc.setLineWidth(0.2);
    rows.forEach(([k, val], i) => {
      const col = i % 2, x = M + col * 92;
      if (col === 0 && i > 0) y += 7;
      text(k, x, 8, "normal", [97, 97, 97]); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(33, 33, 33);
      doc.text(doc.splitTextToSize(String(val), 58)[0] || "", x + 28, y);
    });
    y += 9;
    const statement = "Bolton Steel Structures confirms that the steelwork described above has been inspected, that every snag and defect noted at inspection has been cleared and recorded below, and that the works are complete in accordance with the National Structural Steelwork Specification (NSSS 8.9) and the contract requirements.";
    doc.setFillColor(255, 244, 229); const st = doc.splitTextToSize(statement, R - M - 8); doc.rect(M, y - 4.5, R - M, st.length * 4.6 + 5, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(33, 33, 33); doc.text(st, M + 4, y + 0.5); y += st.length * 4.6 + 6;

    // areas table
    const colX = [M, M + 82, M + 98, M + 158], colW = [80, 14, 58, 22];
    const head = () => { need(10); doc.setFillColor(240, 240, 240); doc.rect(M, y - 4.5, R - M, 7, "F"); ["Area inspected", "Accept", "Comments / snags / defects", "Cleared"].forEach((h, i) => text(h, colX[i] + 1.5, 8.5, "bold")); y += 6; };
    need(14); text("AREAS INSPECTED / SNAGS & DEFECTS", M, 10.5, "bold"); y += 6; head();
    for (const it of items) {
      const r = v.areas && v.areas[it] || {}, sn = r.snagId ? snags.find((x) => x.id === r.snagId) : null;
      const cleared = r.d ? fmtDate(r.d) : sn && sn.closeOut ? fmtDate(sn.closeOut.closedAt) : "";
      const comment = doc.splitTextToSize((r.x ? xLabel(it) + ": " + r.x + (r.c ? ". " : "") : "") + (r.c || ""), colW[2] - 2), area = doc.splitTextToSize(it, colW[0] - 2);
      const h = Math.max(comment.length, area.length, 1) * 4 + 2.5;
      if (y + h > BOTTOM) { doc.addPage(); y = M; head(); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(33, 33, 33);
      doc.text(area, colX[0] + 1.5, y); doc.setFont("helvetica", "bold"); doc.setTextColor(...(r.a === "N" ? [197, 15, 31] : [16, 124, 16])); doc.text(r.a || "", colX[1] + 4, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(33, 33, 33); doc.text(comment, colX[2] + 1.5, y); doc.text(cleared, colX[3] + 1.5, y);
      y += h - 2.5; doc.setDrawColor(230, 230, 230); doc.line(M, y, R, y); y += 4;
    }
    if (v.comments) { need(16); y += 2; text("Comments", M, 9.5, "bold"); y += 5; const c = doc.splitTextToSize(v.comments, R - M); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(c, M, y); y += c.length * 4.3 + 2; }

    // snag close-outs, with before / after photos
    const mine = snags.filter((x) => x.inspectionId === rec.id);
    if (mine.length) {
      need(16); y += 4; text("SNAG CLOSE-OUT", M, 10.5, "bold"); y += 7;
      for (const sn of mine) {
        need(26);
        text(sn.area, M, 9.5, "bold"); y += 4.6;
        const lines = doc.splitTextToSize("Defect: " + (sn.description || ""), R - M); doc.setFont("helvetica", "normal"); doc.setFontSize(8.8); doc.setTextColor(33, 33, 33); doc.text(lines, M, y); y += lines.length * 4.2;
        const co2 = sn.closeOut || {};
        const done = doc.splitTextToSize("Closed out " + fmtDate(co2.closedAt) + " by " + (co2.closedBy || "") + ": " + (co2.comment || ""), R - M); doc.setTextColor(16, 124, 16); doc.text(done, M, y); y += done.length * 4.2 + 1;
        const pics = (sn.photos || []).map((id) => ["Before", id]).concat((co2.photos || []).map((id) => ["After", id])).slice(0, 8);
        let x = M; const pw = 42, ph = 31;
        for (const [lab, id] of pics) {
          const im = await imageFor(id, 700); if (!im) continue;
          if (x + pw > R) { x = M; y += ph + 7; }
          need(ph + 8);
          const w = Math.min(pw, im.w * ph / im.h); doc.addImage(im.data, "JPEG", x, y, w, ph); doc.setFontSize(7); doc.setTextColor(97, 97, 97); doc.text(lab, x, y + ph + 3.5);
          doc.setFontSize(5.8); doc.text(caption(im.meta), x, y + ph + 6.3);
          x += pw + 3;
        }
        if (pics.length) y += ph + 9;
        doc.setDrawColor(230, 230, 230); doc.line(M, y - 2, R, y - 2); y += 3;
      }
    }

    // photos taken against each area
    const areaPics = items.filter((it) => v.areas && v.areas[it] && (v.areas[it].p || []).length);
    if (areaPics.length) {
      need(16); y += 2; text("INSPECTION PHOTOS", M, 10.5, "bold"); y += 7;
      for (const it of areaPics) {
        need(42); text(it, M, 8.8, "bold"); y += 3;
        let x = M; const pw = 42, ph = 31;
        for (const id of v.areas[it].p.slice(0, 8)) {
          const im = await imageFor(id, 700); if (!im) continue;
          if (x + pw > R) { x = M; y += ph + 6; need(ph + 6); }
          doc.addImage(im.data, "JPEG", x, y, Math.min(pw, im.w * ph / im.h), ph); doc.setFont("helvetica", "normal"); doc.setFontSize(5.8); doc.setTextColor(97, 97, 97); doc.text(caption(im.meta), x, y + ph + 3); x += pw + 3;
        }
        y += ph + 8;
      }
    }

    // sign-off
    need(70); y += 4; text("SIGN-OFF", M, 10.5, "bold"); y += 8;
    const sigBox = async (title, name, sigId, date, x) => {
      text(title, x, 8.5, "normal", [97, 97, 97]);
      const im = sigId ? await imageFor(sigId, 500, "image/png") : null;
      if (im) doc.addImage(im.data, "PNG", x, y + 2, Math.min(60, im.w * 20 / im.h), 20);
      doc.setDrawColor(150, 150, 150); doc.line(x, y + 23, x + 80, y + 23);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(33, 33, 33); doc.text(name || "", x, y + 28);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(date ? "Date: " + date : "", x, y + 33);
    };
    const supervisorOnly = rec.templateId === "supcomp";
    await sigBox(supervisorOnly ? "Signed by BSS supervisor" : "Signed by BSSL representative", v.bssName || rec.userName, v.sig, fmtDate(subDate), M);
    const left = (v.clientMode || "").indexOf("Left with client") === 0;
    if (supervisorOnly) { /* Supervisors Completion: BSS's own sign-off, no client box */ }
    else if (left) {
      const d = new Date(subDate); d.setDate(d.getDate() + 5);
      text("Client representative", M + 95, 8.5, "normal", [97, 97, 97]);
      const l = doc.splitTextToSize("Left with the client on " + fmtDate(subDate) + ". Acceptance deemed granted on " + fmtDate(d) + " if not returned before then.", 80);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(33, 33, 33); doc.text(l, M + 95, y + 8);
    } else await sigBox("Signed by client representative", v.clientName, v.clientSig, fmtDate(subDate), M + 95);
    y += 42;
    if (!supervisorOnly) { need(16); const dl = doc.splitTextToSize(DEEMED, R - M); doc.setFont("helvetica", "italic"); doc.setFontSize(7.8); doc.setTextColor(97, 97, 97); doc.text(dl, M, y); }

    // footer on every page
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(140, 140, 140);
      doc.text("Completion certificate · " + (job.jobNumber || "") + " · " + (v.stage || ""), M, 290); doc.text("Page " + i + " of " + n, R, 290, { align: "right" }); }
    return doc.output("blob");
  }

  const safe = (s) => String(s || "").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
  function fileName(rec) {
    const d = new Date(); const pad = IC.pad;
    return safe("Completion Certificate " + (rec.jobNumber || "").replace("/", "-") + " - " + ((rec.values || {}).stage || "Handover")) + " - " + d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + ".pdf";
  }

  IC.Cert = { build, fileName };
})();
