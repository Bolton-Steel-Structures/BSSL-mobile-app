/* iCONSTRUCTE Site: the BSS Site Inspection / Handover PDF (PM handover to the client, laid out as the BSS template).
 * Made on the phone once every snag from the inspection has been closed out (or straight away if there were none),
 * then sent to the "Site Returns" library; iCONSTRUCTE files it in the job's "09 - QA" folder.
 * Content: company header, contract details, NSSS 8.9 completion statement, all 20 areas with results, each snag
 * with its close-out (before and after photos), area photos, and the BSSL / client sign-off or 5-day deemed acceptance.
 */
(function () {
  "use strict";
  const { esc, fmtDate, Data, S, Src } = IC;
  const FALLBACK = { name: "Bolton Steel Structures Ltd", lines: ["Unit 1 B, Pocket Nook Lane", "Lowton, Nr Warrington", "WA3 1AW"], tel: "01942 676 294", email: "info@example.com" };
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

  // The BSS Site Inspection / Handover sheet (24 Nov: the "XXXX - Handover" template), page 1 laid out as the
  // template: logo, title, contract box, the areas table (Date | Area inspected | Accept Y/N | Comments / snags / defects |
  // Date cleared), comments, BSSL and client signatures with dates, and the 5-day note. Snag close-outs and photos follow.
  // Made when the PM submits it (issued to the client, snags open) and again when every snag is cleared.
  async function build(rec, snags) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210, M = 12, R = W - M, BOTTOM = 282;
    const job = IC.jobByFolder(rec.jobFolder) || { jobNumber: rec.jobNumber, site: rec.site, customer: "" };
    const v = rec.values || {}, t = IC.Forms.tpl(rec.templateId) || IC.Forms.tpl("works"), itemsRaw = t.fields.find((f) => f.type === "inspect").items;
    const xLabel = (it) => { const o = itemsRaw.find((x) => typeof x !== "string" && x.t === it); return o && o.x ? o.x.label : ""; };
    // the template's areas, then any area answered on an older version of the form, then the extra rows
    const fixed = itemsRaw.map((x) => (typeof x === "string" ? x : x.t));
    const items = fixed.concat(Object.keys(v.areas || {}).filter((k) => !fixed.includes(k)));
    let y = M;
    const need = (h) => { if (y + h > BOTTOM) { doc.addPage(); y = M; } };
    const text = (str, x, size, style, color, opts) => { doc.setFont("helvetica", style || "normal"); doc.setFontSize(size); doc.setTextColor(...(color || [33, 33, 33])); doc.text(String(str == null ? "" : str), x, y, opts || {}); };
    const box = (x, yy, w, h) => { doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.25); doc.rect(x, yy, w, h); };
    const insp = v.date ? IC.parseDate(v.date) : new Date(rec.submittedAt || rec.updatedAt);
    const subDate = new Date(rec.submittedAt || rec.updatedAt);

    // logo centred, title
    const lg = await logo();
    if (lg) { const h = 16, w = Math.min(80, lg.w * h / lg.h); doc.addImage(lg.data, "JPEG", (W - w) / 2, y, w, h); y += h + 8; }
    else { y += 6; text("BOLTON STEEL STRUCTURES LTD", W / 2, 14, "bold", null, { align: "center" }); y += 8; }
    text("Site Inspection / Handover", W / 2, 15, "bold", null, { align: "center" }); y += 5;

    // contract box: Contract | Contract No, Completed By | GL Ref, Work Stage | Date
    const top = y, rowH = 7, half = M + 128;
    const hdr = [["Contract:", job.site || rec.site || job.customer || "", "Contract No:", job.jobNumber || rec.jobNumber || ""],
      ["Completed By:", v.bssName || rec.userName || "", "GL Ref", v.glRef || ""],
      ["Work Stage:", v.stage || "", "Date", fmtDate(insp)]];
    hdr.forEach((r, i) => {
      y = top + i * rowH + 5;
      text(r[0], M + 1.5, 8.5, "bold"); text(doc.splitTextToSize(r[1], 92)[0] || "", M + 26, 9);
      text(r[2], half, 8.5, "bold"); text(doc.splitTextToSize(r[3], 40)[0] || "", half + 24, 9);
    });
    y = top + 3 * rowH; box(M, top, R - M, 3 * rowH + 7);
    y += 5; text("AREAS INSPECTED/SNAGS & DEFECTS NOTED - ** DELETE AS APPLICABLE**", M + 1.5, 8.5, "bold"); y += 2;

    // areas table
    const cw = [20, 52, 16, 70, 28], cx = cw.reduce((a, w, i) => (a.push(i ? a[i - 1] + cw[i - 1] : M), a), []);
    const grid = (yy, h) => { doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.2); cx.forEach((x, i) => doc.rect(x, yy, cw[i], h)); };
    const head = () => { need(10); grid(y, 8); ["Date", "Area Inspected", "ACCEPT Y/N", "Comments/Snags/Defects", "Date Cleared"].forEach((h, i) => { const l = doc.splitTextToSize(h, cw[i] - 2); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(33, 33, 33); doc.text(l, cx[i] + cw[i] / 2, y + (l.length > 1 ? 3.3 : 5), { align: "center" }); }); y += 8; };
    head();
    const rowsOut = items.map((it) => {
      const r = (v.areas && v.areas[it]) || {}, sn = r.snagId ? snags.find((x) => x.id === r.snagId) : null;
      const cleared = r.d ? fmtDate(r.d) : sn && sn.closeOut ? fmtDate(sn.closeOut.closedAt) : "";
      return { area: it.toUpperCase(), a: r.a === "Y" || r.a === "Yes" ? "Y" : r.a === "N" || r.a === "No" ? "N" : r.a ? "N/A" : "", c: (r.x ? xLabel(it) + ": " + r.x + (r.c ? ". " : "") : "") + (r.c || ""), cleared };
    }).concat((v.otherAreas || []).filter((o) => o.area).map((o) => ({ area: String(o.area).toUpperCase(), a: o.accept === "Yes" ? "Y" : o.accept === "No" ? "N" : o.accept || "", c: o.comment || "", cleared: "" })));
    for (let k = 0; k < 2; k++) rowsOut.push({ area: "", a: "", c: "", cleared: "", blank: true }); // as the template's spare rows
    for (const r of rowsOut) {
      const area = doc.splitTextToSize(r.area, cw[1] - 2), com = doc.splitTextToSize(r.c, cw[3] - 2);
      const h = Math.max(area.length, com.length, 1) * 3.0 + 1.8;
      if (y + h > BOTTOM) { doc.addPage(); y = M; head(); }
      grid(y, h);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.3); doc.setTextColor(33, 33, 33);
      if (!r.blank) doc.text(fmtDate(insp), cx[0] + 1, y + 3.2);
      doc.text(area, cx[1] + 1, y + 3.2); doc.text(com, cx[3] + 1, y + 3.2); doc.text(r.cleared, cx[4] + 1, y + 3.2);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...(r.a === "N" ? [197, 15, 31] : [33, 33, 33])); doc.text(r.a, cx[2] + cw[2] / 2, y + 3.2, { align: "center" });
      y += h;
    }

    // comments box
    const cl = doc.splitTextToSize(v.comments || "", R - M - 4), ch = Math.max(16, cl.length * 3.8 + 9);
    need(ch + 2); box(M, y, R - M, ch); y += 4.5; text("Comments:", M + 1.5, 8.5, "bold"); y += 4.5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(cl, M + 1.5, y); y += ch - 9 + 2;

    // signatures: BSSL and client, printed names and dates, as the template
    need(54);
    const sigTop = y;
    const line = async (label, val, sigId, date, yy) => {
      y = yy; text(label, M + 1.5, 8, "normal");
      if (sigId) { const im = await imageFor(sigId, 500, "image/png"); if (im) doc.addImage(im.data, "PNG", M + 62, yy - 8, Math.min(50, im.w * 10 / im.h), 10); }
      else if (val) text(val, M + 62, 9, "bold");
      doc.setDrawColor(120, 120, 120); doc.line(M + 60, yy + 1, M + 122, yy + 1);
      text("Date", M + 140, 8, "normal"); text(date || "", M + 152, 9); doc.line(M + 150, yy + 1, R - 2, yy + 1);
    };
    const left = (v.clientMode || "").indexOf("Left with client") === 0;
    await line("Signed by BSSL Representative:", "", v.sig, fmtDate(subDate), sigTop + 8);
    await line("Name (Printed)", v.bssName || rec.userName, null, fmtDate(subDate), sigTop + 17);
    if (left) {
      const d = new Date(subDate); d.setDate(d.getDate() + 5);
      await line("Signed by Client Representative", "Left with client " + fmtDate(subDate), null, "", sigTop + 27);
      await line("Name (Printed)", "Deemed accepted " + fmtDate(d) + " if not returned", null, "", sigTop + 36);
    } else {
      await line("Signed by Client Representative", "", v.clientSig, fmtDate(subDate), sigTop + 27);
      await line("Name (Printed)", v.clientName, null, fmtDate(subDate), sigTop + 36);
    }
    box(M, sigTop, R - M, 40); y = sigTop + 40;
    const dl = doc.splitTextToSize(DEEMED, R - M - 6); box(M, y, R - M, dl.length * 3.4 + 4);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(33, 33, 33); doc.text(dl, W / 2, y + 3.6, { align: "center" }); y += dl.length * 3.4 + 8;

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

    // footer on every page
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(140, 140, 140);
      doc.text("Site Inspection / Handover · " + (job.jobNumber || "") + " · " + (v.stage || "") + (rec.certificate || (snags || []).filter((x) => x.inspectionId === rec.id).every((x) => x.status === "closed") ? "" : " · snags open"), M, 290); doc.text("Page " + i + " of " + n, R, 290, { align: "right" }); }
    return doc.output("blob");
  }

  const safe = (s) => String(s || "").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
  function fileName(rec, cleared) {
    const d = new Date(); const pad = IC.pad;
    return safe("Site Inspection Handover " + (rec.jobNumber || "").replace("/", "-") + " - " + ((rec.values || {}).stage || "Handover") + (cleared ? " - snags cleared" : "")) + " - " + d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + ".pdf";
  }

  IC.Cert = { build, fileName };
})();
