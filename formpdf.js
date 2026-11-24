/* iCONSTRUCTE Site: any completed form as a PDF, to email or share from the phone (20 Nov: completed forms
 * emailed from the app to a client or manager). The phone's own share sheet is used (Outlook, Gmail, WhatsApp …),
 * so it goes from the person's own email; where a phone can't share files, the PDF downloads and an email opens.
 */
(function () {
  "use strict";
  const { fmtDate, fmtDay, fmtTime, Data, S } = IC;

  function blobToImg(blob, maxSide) {
    return new Promise((res) => {
      const url = URL.createObjectURL(blob), img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res({ data: c.toDataURL("image/jpeg", 0.72), w: c.width, h: c.height });
      };
      img.onerror = () => { URL.revokeObjectURL(url); res(null); };
      img.src = url;
    });
  }
  async function imageFor(id, maxSide) {
    const b = await IC.Store.get(id, "blobs");
    return b ? blobToImg(b.blob, maxSide) : null;
  }
  async function logo() {
    try { const r = await fetch("icons/bss-logo.jpg"); if (r.ok) return await blobToImg(await r.blob(), 700); } catch (e) { /* none */ }
    return null;
  }

  // Toolbox talk (23 Nov): printed in the layout of BSS's paper Toolbox Talk Briefing Register
  async function register(rec) {
    const v = rec.values || {}, { jsPDF } = window.jspdf, doc = new jsPDF({ unit: "mm", format: "a4" });
    const M = 20, R = 190, cols = [[M, 26, "DATE"], [M + 26, 52, "NAME"], [M + 78, 42, "OCCUPATION"], [M + 120, 50, "SIGNATURE"]];
    let y = 15;
    const lg = await logo();
    if (lg) { const h = 18, w = (lg.w / lg.h) * h; doc.addImage(lg.data, "JPEG", 105 - w / 2, y, w, h); }
    y += 28; doc.setFont("times", "bold"); doc.setFontSize(12); doc.setTextColor(0, 0, 0);
    doc.text("Toolbox Talk Briefing Register", 105, y, { align: "center" }); doc.line(105 - 30, y + 1, 105 + 30, y + 1);
    y += 12; doc.setFontSize(11); doc.text("Subject: ", M, y); doc.setFont("times", "normal");
    doc.text(doc.splitTextToSize((v.talk && v.talk.title) || "", R - M - 20), M + 18, y);
    const job = IC.jobByFolder(rec.jobFolder) || {};
    if (rec.jobNumber) { y += 6; doc.setFont("times", "bold"); doc.text("Job: ", M, y); doc.setFont("times", "normal"); doc.text(rec.jobNumber + (job.site ? " · " + job.site : ""), M + 18, y); }
    y += 10; doc.setFontSize(10.5);
    const st = doc.splitTextToSize("To confirm the briefing on the above subject has been held and understood, all operatives involved must sign below.", R - M);
    doc.text(st, M, y); y += st.length * 5 + 4;
    const rowH = 11, people = v.attendees || [], brief = v.date ? IC.parseDate(v.date) : new Date(rec.submittedAt || rec.updatedAt);
    const headRow = () => { doc.setFont("times", "bold"); doc.setFontSize(10); cols.forEach(([x, w, h]) => { doc.rect(x, y, w, 7); doc.text(h, x + 2, y + 5); }); y += 7; doc.setFont("times", "normal"); };
    headRow();
    const rows = Math.max(people.length, 8);
    for (let i = 0; i < rows; i++) {
      if (y + rowH > 230) { doc.addPage(); y = 20; headRow(); }
      const p = people[i]; cols.forEach(([x, w]) => doc.rect(x, y, w, rowH));
      if (p) {
        doc.text(fmtDate(p.signedAt ? new Date(p.signedAt) : brief), cols[0][0] + 2, y + 7);
        doc.text(doc.splitTextToSize(p.name || "", cols[1][1] - 4)[0], cols[1][0] + 2, y + 7);
        doc.text(doc.splitTextToSize(p.occupation || "", cols[2][1] - 4)[0], cols[2][0] + 2, y + 7);
        const im = p.sig ? await imageFor(p.sig, 400) : null;
        if (im) { const h = rowH - 2, w = Math.min(cols[3][1] - 4, (im.w / im.h) * h); doc.addImage(im.data, "JPEG", cols[3][0] + 2, y + 1, w, h); }
      }
      y += rowH;
    }
    if (y > 225) { doc.addPage(); y = 20; }
    y += 8; const cm = [v.points ? "Key points: " + v.points : "", v.comments || "", v.mins ? "Duration: " + v.mins + " minutes" : ""].filter(Boolean).join("\n");
    const cl = doc.splitTextToSize(cm, R - M - 6), ch = Math.max(30, cl.length * 5 + 12);
    doc.rect(M, y, R - M, ch); doc.setFont("times", "bold"); doc.text("Comments:", M + 3, y + 6); doc.setFont("times", "normal"); doc.text(cl, M + 3, y + 12);
    y += ch + 14; if (y > 265) { doc.addPage(); y = 25; }
    doc.setFont("times", "bold"); doc.text("Briefing Delivered by", M, y); doc.setFont("times", "normal"); doc.text(v.by || rec.userName || "", M + 42, y); doc.line(M + 40, y + 1, M + 120, y + 1);
    y += 14; doc.setFont("times", "bold"); doc.text("Signature", M, y);
    const bs = v.bySig ? await imageFor(v.bySig, 500) : null;
    if (bs) { const h = 12, w = Math.min(50, (bs.w / bs.h) * h); doc.addImage(bs.data, "JPEG", M + 22, y - 10, w, h); }
    doc.line(M + 20, y + 1, M + 80, y + 1);
    doc.text("Date", M + 92, y); doc.setFont("times", "normal"); doc.text(fmtDate(brief), M + 104, y); doc.line(M + 102, y + 1, M + 150, y + 1);
    if ((v.photos || []).length) {
      doc.addPage(); y = 20; doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Photos", M, y); y += 6; let x = M;
      for (const id of v.photos.slice(0, 12)) { const im = await imageFor(id, 700); if (!im) continue; const w = 54, h = Math.min(40, (im.h / im.w) * w); if (x + w > R) { x = M; y += 44; } doc.addImage(im.data, "JPEG", x, y, w, h); x += w + 4; }
    }
    return doc.output("blob");
  }

  async function build(rec) {
    if (rec.templateId === "toolbox") return register(rec);
    const t = IC.Forms.tpl(rec.templateId) || { title: rec.templateTitle || "Form", fields: [] }, v = rec.values || {};
    const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: "mm", format: "a4" });
    const M = 15, R = 195, BOTTOM = 280;
    let y = M;
    const need = (h) => { if (y + h > BOTTOM) { doc.addPage(); y = M; } };
    const text = (s, x, size, style, colour) => { doc.setFont("helvetica", style || "normal"); doc.setFontSize(size || 10); doc.setTextColor(...(colour || [33, 33, 33])); doc.text(String(s), x, y); };
    const para = (s, x, w, size, style, colour) => { doc.setFont("helvetica", style || "normal"); doc.setFontSize(size || 9.5); doc.setTextColor(...(colour || [33, 33, 33])); const l = doc.splitTextToSize(String(s || ""), w); need(l.length * 4.4 + 1); doc.text(l, x, y); y += l.length * 4.4; };

    // a row of photos (up to 8), 42 mm wide, wrapping onto new lines and pages
    const photoRow = async (ids) => {
      let x = M; need(36);
      for (const id of (ids || []).slice(0, 8)) { const im = await imageFor(id, 700); if (!im) continue; const w = 42, h = Math.min(32, (im.h / im.w) * w); if (x + w > R) { x = M; y += 35; need(36); } doc.addImage(im.data, "JPEG", x, y, w, h); x += w + 3; }
      y += 35;
    };

    const lg = await logo();
    if (lg) { const h = 14, w = (lg.w / lg.h) * h; doc.addImage(lg.data, "JPEG", M, y, w, h); }
    y += 6; doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(33, 33, 33); doc.text(rec.templateTitle || t.title, R, y, { align: "right" });
    y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(97, 97, 97); doc.text(t.ref || "", R, y, { align: "right" });
    y += 10;
    const job = IC.jobByFolder(rec.jobFolder) || {};
    const head = [["Job", (rec.jobNumber || "") + (job.site || rec.site ? " · " + (job.site || rec.site) : "")], ["Client", job.customer || ""], ["Completed by", rec.userName || ""], ["Date", fmtDay(rec.submittedAt || rec.updatedAt) + " " + fmtTime(rec.submittedAt || rec.updatedAt)]];
    head.filter((h) => h[1]).forEach(([k, val]) => { text(k, M, 9, "bold", [97, 97, 97]); doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(33, 33, 33); doc.text(String(val), M + 32, y); y += 5; });
    y += 3; doc.setDrawColor(220, 220, 220); doc.line(M, y, R, y); y += 7;

    for (const f of t.fields) {
      const val = v[f.id];
      if (!f.id || f.type === "hidden" || val == null || val === "" || (Array.isArray(val) && !val.length)) continue;
      need(12); text(f.label || (f.type === "docs" ? "Document signed for" : ""), M, 9, "bold", [97, 97, 97]); y += 5;
      if (f.type === "docs") {
        const d = (v.docs || [])[0];
        para(d ? d.name : String(val).split("/").pop(), M, 180, 10, "bold");
        if (d) para("Issue dated " + fmtDate(d.issued) + (d.issuedBy ? ", issued by " + d.issuedBy : ""), M, 180, 9.5);
        y += 4; continue;
      }
      if (f.type === "checklist") {
        const acts = v[f.id + "Actions"] || {};
        for (const [k, a] of Object.entries(val)) {
          const l = doc.splitTextToSize(k, 150); need(l.length * 4.4 + 2);
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(33, 33, 33); doc.text(l, M, y);
          doc.setFont("helvetica", "bold"); doc.setTextColor(...(a === f.badAnswer ? [197, 15, 31] : [16, 124, 16])); doc.text(a || "", R, y, { align: "right" });
          y += l.length * 4.4;
          if (acts[k]) { y += 0.5; para("Action: " + acts[k], M + 4, 170, 9, "italic", [197, 15, 31]); }
          y += 1.5;
        }
      } else if (f.type === "inspect") {
        for (const it0 of f.items) {
          const it = typeof it0 === "string" ? it0 : it0.t, r = val[it] || {};
          const extra = r.x && typeof it0 !== "string" && it0.x ? it0.x.label + ": " + r.x : "";
          const l = doc.splitTextToSize(it, 150); need(l.length * 4.4 + 2);
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(33, 33, 33); doc.text(l, M, y);
          doc.setFont("helvetica", "bold"); doc.setTextColor(...(r.a === "N" ? [197, 15, 31] : [16, 124, 16])); doc.text(r.a || "", R, y, { align: "right" });
          y += l.length * 4.4;
          if (extra) para(extra, M + 4, 170, 9, "normal", [97, 97, 97]);
          if (r.c) para((r.a === "N" ? "Snag / action: " : "") + r.c, M + 4, 170, 9, "italic", r.a === "N" ? [197, 15, 31] : [97, 97, 97]);
          if (r.p && r.p.length) { y += 1; await photoRow(r.p); }
          y += 1.5;
        }
      } else if (f.type === "yesno") {
        para(val, M, 180, 10, "bold", val === f.badAnswer ? [197, 15, 31] : [33, 33, 33]);
        if (v[f.id + "Action"]) para("Action: " + v[f.id + "Action"], M + 4, 170, 9, "italic", [197, 15, 31]);
      } else if (f.type === "people") {
        for (const p of val) {
          need(20); text(p.name, M, 10); const im = p.sig ? await imageFor(p.sig, 400) : null;
          if (im) doc.addImage(im.data, "JPEG", M + 70, y - 5, 40, (im.h / im.w) * 40);
          y += 16;
        }
      } else if (f.type === "signature") {
        const im = await imageFor(val, 500); need(26);
        if (im) { doc.addImage(im.data, "JPEG", M, y - 2, 60, Math.min(24, (im.h / im.w) * 60)); y += 24; } else { para("Signed", M, 180); }
      } else if (f.type === "photos") {
        await photoRow(val);
      } else if (f.type === "rows") {
        val.forEach((r, i) => para((i + 1) + ". " + f.columns.map((c) => (r[c.id] ? c.label + ": " + r[c.id] : "")).filter(Boolean).join(" · "), M, 180));
      } else if (f.type === "date") para(IC.fmtDay(IC.parseDate(val)), M, 180, 10);
      else if (f.type === "talk") para(val.title, M, 180, 10);
      else if (f.type === "confirm") para(val ? "Confirmed: " + f.text : "Not confirmed", M, 180);
      else if (f.type === "tolerance") val.forEach((r) => para((r.loc || "") + " " + r.check + ": " + r.dev + " mm (permitted " + r.permitted + ")", M, 180, 9.5, "normal", r.ok === false ? [197, 15, 31] : [33, 33, 33]));
      else para(typeof val === "object" ? JSON.stringify(val) : val, M, 180);
      y += 4;
    }
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(140, 140, 140); doc.text(t.title + " · " + (rec.jobNumber || ""), M, 290); doc.text("Page " + i + " of " + n, R, 290, { align: "right" }); }
    return doc.output("blob");
  }

  const fileName = (rec) => {
    const t = IC.Forms.tpl(rec.templateId) || { title: "Form" }, d = new Date(rec.submittedAt || rec.updatedAt);
    return (t.title.replace(/[\\/:*?"<>|]+/g, "") + " " + (rec.jobNumber || "").replace("/", "-") + " " + d.getFullYear() + "-" + IC.pad(d.getMonth() + 1) + "-" + IC.pad(d.getDate())).trim() + ".pdf";
  };

  async function share(rec) {
    const blob = await build(rec), name = fileName(rec), t = IC.Forms.tpl(rec.templateId) || { title: "Form" };
    const subject = t.title + (rec.jobNumber ? " · " + rec.jobNumber : ""), body = subject + ", completed " + fmtDate(rec.submittedAt || rec.updatedAt) + " by " + (rec.userName || "") + ".";
    const file = new File([blob], name, { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: subject, text: body }); return; } catch (e) { if (e && e.name === "AbortError") return; }
    }
    // no file sharing on this device: save the PDF, then open an email to attach it to
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => (location.href = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body + "\n\nPDF attached: " + name)), 600);
  }

  IC.FormPdf = { build, share, fileName };
})();
