/* iCONSTRUCTE Site: any completed form as a PDF, to email or share from the phone (Liam, 20 Nov: completed forms
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

  async function build(rec) {
    const t = IC.Forms.tpl(rec.templateId) || { title: rec.templateTitle || "Form", fields: [] }, v = rec.values || {};
    const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: "mm", format: "a4" });
    const M = 15, R = 195, BOTTOM = 280;
    let y = M;
    const need = (h) => { if (y + h > BOTTOM) { doc.addPage(); y = M; } };
    const text = (s, x, size, style, colour) => { doc.setFont("helvetica", style || "normal"); doc.setFontSize(size || 10); doc.setTextColor(...(colour || [33, 33, 33])); doc.text(String(s), x, y); };
    const para = (s, x, w, size, style, colour) => { doc.setFont("helvetica", style || "normal"); doc.setFontSize(size || 9.5); doc.setTextColor(...(colour || [33, 33, 33])); const l = doc.splitTextToSize(String(s || ""), w); need(l.length * 4.4 + 1); doc.text(l, x, y); y += l.length * 4.4; };

    const lg = await logo();
    if (lg) { const h = 14, w = (lg.w / lg.h) * h; doc.addImage(lg.data, "JPEG", M, y, w, h); }
    y += 6; doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(33, 33, 33); doc.text(t.title, R, y, { align: "right" });
    y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(97, 97, 97); doc.text(t.ref || "", R, y, { align: "right" });
    y += 10;
    const job = IC.jobByFolder(rec.jobFolder) || {};
    const head = [["Job", (rec.jobNumber || "") + (job.site || rec.site ? " · " + (job.site || rec.site) : "")], ["Client", job.customer || ""], ["Completed by", rec.userName || ""], ["Date", fmtDay(rec.submittedAt || rec.updatedAt) + " " + fmtTime(rec.submittedAt || rec.updatedAt)]];
    head.filter((h) => h[1]).forEach(([k, val]) => { text(k, M, 9, "bold", [97, 97, 97]); doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(33, 33, 33); doc.text(String(val), M + 32, y); y += 5; });
    y += 3; doc.setDrawColor(220, 220, 220); doc.line(M, y, R, y); y += 7;

    for (const f of t.fields) {
      const val = v[f.id];
      if (!f.id || f.type === "hidden" || val == null || val === "" || (Array.isArray(val) && !val.length)) continue;
      need(12); text(f.label || "", M, 9, "bold", [97, 97, 97]); y += 5;
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
        let x = M; need(36);
        for (const id of val.slice(0, 8)) { const im = await imageFor(id, 700); if (!im) continue; const w = 42, h = Math.min(32, (im.h / im.w) * w); if (x + w > R) { x = M; y += 35; need(36); } doc.addImage(im.data, "JPEG", x, y, w, h); x += w + 3; }
        y += 35;
      } else if (f.type === "rows") {
        val.forEach((r, i) => para((i + 1) + ". " + f.columns.map((c) => (r[c.id] ? c.label + ": " + r[c.id] : "")).filter(Boolean).join(" · "), M, 180));
      } else if (f.type === "talk") para(val.title, M, 180, 10);
      else if (f.type === "confirm") para(val ? "✓ " + f.text : "Not confirmed", M, 180);
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
