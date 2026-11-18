/* iCONSTRUCTE Site: QA (quality assurance) section: BSS Works Inspection, snag list with close-out, completion certificates.
 * BSS want this to be detailed. This screen sets out the planned structure, following the erection sequence in
 * QFC05 Site Erection, QFC06 Identification & Traceability and NSSS 7th Edition Sections 2, 5, 6, 8, 9 and 10.
 * Items marked "Available" open the quality forms that already work. "Planned" items are to be specified with BSS.
 */
(function () {
  "use strict";
  const { $, esc, Data, myJobs, jobByFolder, jobOptions, setBar, route, LS } = IC;

  // stage → items. form = existing form template id (available now); otherwise planned.
  const STAGES = [
    { title: "1. Before erection", items: [
      { name: "Pre-site inspection", ref: "QFC05 Q05.1", text: "Access, ground conditions, crane positions, erection sequence and plant needs, with photos." },
      { name: "Safe site handover", ref: "NSSS 8.2, 8.3 · Table 1.5(x)", form: "handover" },
      { name: "Foundation & holding-down bolt survey", ref: "NSSS 9.1, 9.2", form: "foundation" },
      { name: "Inspection & test plan (ITP)", ref: "Project specification", text: "Hold and witness points for the job, set up in the office and signed off on site as each is reached." }
    ] },
    { title: "2. Deliveries & traceability", items: [
      { name: "Delivery check", ref: "QFC05 · QFC06", text: "Check each delivery against the delivery note and drawings: piece marks, quantities, damage. Photos, and an NCR if anything's wrong." },
      { name: "Material traceability", ref: "QFC06 · NSSS 2 · BS EN 10204 3.1", text: "Link piece marks to mill certificates. Photograph the marks on site so the job record traces back to the steel order." },
      { name: "Bolt batches & certificates", ref: "NSSS 6", text: "Record bolt batch, grade and certificate for each delivery and where each batch was used." }
    ] },
    { title: "3. Erection", items: [
      { name: "Erection progress", ref: "QFC05", text: "Mark members erected by grid and level, ticking them off on the erection drawing." },
      { name: "Line, level & plumb survey", ref: "NSSS 8.6, 9.3, 9.6", form: "erection" },
      { name: "Bolting & tightening", ref: "NSSS 6.3, 6.4, 8.8", form: "bolting" },
      { name: "Preloaded bolt inspection", ref: "NSSS 6.3.3 · BS EN 1090-2", text: "Inspection of tightening by method (torque, combined, DTI, HRC), with sample results and the tool calibration record (QP06)." },
      { name: "Site welding", ref: "NSSS 5, 8.7", form: "welding" },
      { name: "Welder & WPS check", ref: "WPS / PQR / WQ register", text: "Pick the welder and WPS from the register; the app warns if a qualification has lapsed." },
      { name: "Packs & shims", ref: "NSSS 6.4.1, 8.6.1", text: "Where packs and shims were used, and that they're secured." }
    ] },
    { title: "4. Protective treatment", items: [
      { name: "Site touch-up & repairs", ref: "NSSS 10.5.5, 10.5.9", text: "Surface preparation to St3, primer and build-up coats, with photos before and after." },
      { name: "Paint conditions", ref: "NSSS 10.5.4", text: "Air temperature (min 10°C), humidity (max 85%), and steel temperature at least 3°C above dew point. The app checks the readings." },
      { name: "DFT readings", ref: "NSSS 10.5.6 · Table 10.3", text: "Enter readings per area. The app applies the NSSS acceptance rules (mean ≥ nominal, all ≥ 80%, fewer than 20% between 80% and 100%, none above max) and the 25 µm profile correction." },
      { name: "DFT gauge calibration", ref: "NSSS 10.5.6", text: "Calibration before the first readings and once per shift, with the shim and test plate recorded." }
    ] },
    { title: "5. Close-out", items: [
      { name: "Site inspection / handover", ref: "BSS Works Inspection · NSSS 8.9", form: "works" },
      { name: "Snagging", ref: "QFC05", form: "snag" },
      { name: "Non-conformance & corrective action", ref: "QP08 · QFC05 Q05.12", form: "ncr" },
      { name: "Completion & handover certificate", ref: "NSSS 8.9 · QFC05 Q05.11", form: "completion" },
      { name: "QA dossier", ref: "QFC05 Q05.11 · QFC06", text: "One PDF per job of every QA record, certificate and photo, ready to hand to the client and file against the job in iCONSTRUCTE." }
    ] }
  ];

  // ---------------------------------------------------------------- snags, close-out and the completion certificate
  // Each N on a Works Inspection becomes a snag on the job's snag list. A snag is closed out with what was done, photos
  // after, the name and signature of whoever closed it. When every snag from an inspection is closed (or there were
  // none), the completion certificate PDF is made and sent to the office to file in the job's 09 - QA folder.
  const T = () => IC.Forms.tpl("works");

  async function afterInspection(rec) {
    const areas = (rec.values && rec.values.areas) || {};
    let made = 0;
    for (const [area, r] of Object.entries(areas)) {
      if (r.a !== "N" || r.d || r.snagId) continue;
      const sn = await Data.save("snags", { jobFolder: rec.jobFolder, jobNumber: rec.jobNumber, site: rec.site, inspectionId: rec.id, area, description: r.c, photos: r.p || [],
        glRef: rec.values.glRef, stage: rec.values.stage, raisedBy: (Data.profile && Data.profile.name) || rec.userName, raisedAt: new Date().toISOString(), status: "open" });
      r.snagId = sn.id; made++;
    }
    if (made) { rec.flags = IC.Forms.flagsFor(T(), rec.values); await Data.save("forms", rec); IC.toast(made + " snag" + (made > 1 ? "s" : "") + " added to the job's snag list"); }
    await checkComplete(rec.id);
  }

  async function snagsFor(rec) { return (await Data.list("snags", "team")).filter((x) => x.inspectionId === rec.id); }

  async function checkComplete(inspectionId) {
    const rec = await Data.get("forms", inspectionId);
    if (!rec || rec.certificate) return;
    const snags = await snagsFor(rec);
    if (snags.some((x) => x.status !== "closed")) return;
    const sh = IC.sheet('<h3>Creating the completion certificate</h3><p>All snags are closed out. Making the PDF…</p><div class="progress"><div class="indet"></div></div>');
    try {
      const blob = await IC.Cert.build(rec, await Data.list("snags", "team"));
      const name = IC.Cert.fileName(rec), path = rec.jobFolder + "/09 - QA/" + name;
      const uploadId = await Data.queueUpload(path, blob, { kind: "completion-certificate", inspectionId: rec.id, jobNumber: rec.jobNumber });
      rec.certificate = { name, path, uploadId, createdAt: new Date().toISOString() };
      await Data.save("forms", rec);
      sh.close(); IC.toast("Completion certificate created");
    } catch (e) {
      console.error(e); sh.close(); IC.toast("Couldn't make the certificate: " + e.message);
    }
  }

  async function certState(rec) {
    if (!rec.certificate) return null;
    const up = (await Data.uploads()).find((u) => u.key === "up:" + rec.certificate.uploadId);
    if (IC.DEMO) return { text: "Demo: not sent anywhere. Download to see it.", up, cls: "warn" };
    if (!up || up.sent) return { text: "Sent to the office: iCONSTRUCTE files it in job folder 09 - QA.", up, cls: "ok" };
    return { text: "Waiting to send (it goes when there's signal)." + (up.error ? " Last try: " + up.error : ""), up, cls: "warn" };
  }

  async function inspectionStatusHtml(rec) {
    const snags = await snagsFor(rec), open = snags.filter((x) => x.status !== "closed");
    let h = "";
    if (rec.certificate) {
      const st = await certState(rec);
      h += '<div class="cert-box"><b>Completion certificate</b><div class="small">' + esc(rec.certificate.name) + "</div><div class=\"small " + (st.cls === "ok" ? "ok-t" : "") + '">' + esc(st.text) + "</div>" +
        (st.up ? '<button class="btn block" id="certDl">Open certificate</button>' : "") + "</div>";
    } else if (open.length) {
      h += '<div class="note"><b>' + open.length + " snag" + (open.length > 1 ? "s" : "") + " to close out.</b> The completion certificate is created automatically when they're all closed.</div>" +
        open.map((x) => '<a class="tile-row" href="#/snag/' + x.id + '"><span class="ti">' + IC.ICON.forms + "</span><span><b>" + esc(x.area) + '</b><span class="small">' + esc(x.description || "") + '</span></span><span class="pill declined">Open</span></a>').join("");
    }
    return h;
  }

  function bindStatus(rec) {
    const b = document.getElementById("certDl");
    if (b && rec.certificate) b.onclick = async () => {
      const up = (await Data.uploads()).find((u) => u.key === "up:" + rec.certificate.uploadId);
      if (!up) return;
      const a = document.createElement("a"); a.href = URL.createObjectURL(up.blob); a.download = rec.certificate.name; a.target = "_blank"; document.body.appendChild(a); a.click(); a.remove();
    };
  }

  // ---------------------------------------------------------------- snag screen: details and close-out
  route("snag", async (args) => {
    const sn = await Data.get("snags", args[0]); if (!sn) { location.hash = "#/qa"; return; }
    setBar("Snag", (sn.jobNumber || "") + " · " + (sn.stage || ""), true);
    const photos = await IC.Forms.photoStrip(sn.photos || []);
    let h = '<div class="card"><div class="small">Area</div><b>' + esc(sn.area) + '</b><div class="small" style="margin-top:8px">Snag / defect</div><div>' + esc(sn.description || "") + "</div>" +
      (photos ? '<div class="thumbs" style="margin-top:8px">' + photos + "</div>" : "") +
      '<div class="small" style="margin-top:8px">Raised ' + esc(IC.fmtDate(sn.raisedAt)) + " by " + esc(sn.raisedBy || "") + (sn.glRef ? " · GL " + esc(sn.glRef) : "") + "</div></div>";
    if (sn.status === "closed") {
      const c = sn.closeOut || {}, after = await IC.Forms.photoStrip(c.photos || []), sig = c.sig ? await Data.blobUrl(c.sig) : "";
      h += '<div class="section-h">Closed out</div><div class="card"><div>' + esc(c.comment || "") + "</div>" + (after ? '<div class="thumbs" style="margin-top:8px">' + after + "</div>" : "") +
        '<div class="small" style="margin-top:8px">' + esc(IC.fmtDate(c.closedAt) + " by " + (c.closedBy || "")) + "</div>" + (sig ? '<img class="sig-img sm" src="' + sig + '">' : "") + "</div>";
      $("main").innerHTML = h; return;
    }
    h += '<div class="section-h">Close out</div><form class="frm" novalidate id="coForm"></form>';
    $("main").innerHTML = h;
    const f = $("coForm");
    const fields = [
      { type: "text", id: "comment", label: "What was done to put it right", multiline: true, required: true },
      { type: "photos", id: "photos", label: "Photo after", required: true },
      { type: "text", id: "closedBy", label: "Closed out by", prefill: "me", required: true },
      { type: "signature", id: "sig", label: "Signature", required: true }
    ];
    const ws = fields.map((fd) => { const w = IC.Forms.field(fd, undefined, { job: jobByFolder(sn.jobFolder) }); w.f = fd; f.appendChild(w.el); return w; });
    f.insertAdjacentHTML("beforeend", '<div class="err" id="coErr" hidden></div><button type="submit" class="btn primary block">Close out snag</button>');
    f.onsubmit = async (e) => {
      e.preventDefault();
      const errs = ws.map((w) => w.check()).filter(Boolean);
      if (errs.length) { $("coErr").hidden = false; $("coErr").innerHTML = errs.map(esc).join("<br>"); return; }
      const v = {}; for (const w of ws) v[w.f.id] = await w.get();
      sn.status = "closed"; sn.closeOut = { comment: v.comment, photos: v.photos, closedBy: v.closedBy, sig: v.sig, closedAt: new Date().toISOString() };
      await Data.save("snags", sn);
      IC.toast("Snag closed out");
      await checkComplete(sn.inspectionId);
      location.hash = "#/qa/" + encodeURIComponent(sn.jobFolder);
    };
  });

  // ---------------------------------------------------------------- QA page
  route("qa", async (args) => {
    setBar("Quality assurance", "Inspections, snags and handover", false);
    const jobs = myJobs();
    let folder = args[0] ? decodeURIComponent(args[0]) : LS.get("lastJob", jobs[0] && jobs[0].folder);
    if (!jobByFolder(folder)) folder = (jobs[0] || {}).folder || "";
    const j = jobByFolder(folder);
    const forms = (await Data.list("forms", "team")).filter((f) => f.status === "submitted" && f.jobFolder === folder);
    const snags = (await Data.list("snags", "team")).filter((x) => x.jobFolder === folder);
    const open = snags.filter((x) => x.status !== "closed"), closed = snags.filter((x) => x.status === "closed");
    const count = (id) => forms.filter((f) => f.templateId === id).length;
    const total = STAGES.reduce((t, s) => t + s.items.length, 0), ready = STAGES.reduce((t, s) => t + s.items.filter((i) => i.form).length, 0);
    const inspections = forms.filter((f) => f.templateId === "works").sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""));
    const insRow = (f) => {
      const n = snags.filter((x) => x.inspectionId === f.id && x.status !== "closed").length;
      const pill = f.certificate ? '<span class="pill ok">Certificate</span>' : n ? '<span class="pill declined">' + n + " open</span>" : '<span class="pill">Clear</span>';
      return '<a class="tile-row" href="#/form/' + f.id + '"><span class="ti quality">' + IC.ICON.check + '</span><span><b>' + esc((f.values && f.values.stage) || "Inspection") + '</b><span class="small">' +
        esc(((f.values && f.values.glRef) ? "GL " + f.values.glRef + " · " : "") + IC.fmtDate(f.submittedAt || f.updatedAt)) + "</span></span>" + pill + "</a>";
    };
    const snagRow = (x) => '<a class="tile-row" href="#/snag/' + x.id + '"><span class="ti">' + IC.ICON.forms + "</span><span><b>" + esc(x.area) + '</b><span class="small">' + esc((x.description || "") + " · raised " + IC.fmtDate(x.raisedAt)) + "</span></span>" +
      (x.status === "closed" ? '<span class="pill ok">Closed</span>' : '<span class="pill declined">Open</span>') + "</a>";
    $("main").innerHTML =
      (jobs.length ? '<label class="fl">Job<select id="qaJob">' + jobOptions(folder, false) + "</select></label>" : "") +
      (j ? '<div class="qa-job"><div><b>' + esc(j.jobNumber) + '</b> <span class="small">' + esc(j.site || j.customer || "") + '</span></div><div class="small">' + forms.length + " QA record" + (forms.length === 1 ? "" : "s") + " · " + open.length + " open snag" + (open.length === 1 ? "" : "s") + "</div></div>" : "") +
      '<div class="section-h">Site inspection / handover</div>' +
      '<div class="card"><div class="small" style="margin-bottom:10px">BSS Works Inspection: 20 areas, each with photos. Any N becomes a snag on the list below. When every snag is closed out, the completion certificate is created and filed in the job\'s 09 - QA folder.</div>' +
      (folder ? '<a class="btn primary block" href="#/form-new/works/' + encodeURIComponent(folder) + '">New inspection</a>' : "") + "</div>" +
      (inspections.length ? inspections.map(insRow).join("") : '<div class="empty small">No inspections on this job yet.</div>') +
      '<div class="section-h">Snag list (' + open.length + " open)</div>" + (open.length ? open.map(snagRow).join("") : '<div class="empty small">No open snags.</div>') +
      (closed.length ? '<details class="closed-snags"><summary>' + closed.length + " closed snag" + (closed.length > 1 ? "s" : "") + "</summary>" + closed.map(snagRow).join("") + "</details>" : "") +
      '<div class="qa-intro" style="margin-top:18px"><b>More QA to come.</b> The outline below follows QFC05, QFC06 and the NSSS. ' + ready + " of " + total + " items work now; the rest are planned and will be built to BSS's documents.</div>" +
      STAGES.map((s) => '<div class="section-h">' + esc(s.title) + "</div>" + s.items.map((it) => {
        const n = it.form ? count(it.form) : 0;
        const inner = '<span class="ti ' + (it.form ? "quality" : "") + '">' + (it.form ? IC.ICON.check : IC.ICON.forms) + '</span><span><b>' + esc(it.name) + '</b><span class="small">' + esc(it.ref) + "</span>" +
          (it.text ? '<span class="qa-desc">' + esc(it.text) + "</span>" : "") + "</span>" +
          (it.form ? '<span class="pill ok">' + (n ? n + " done" : "Available") + "</span>" : '<span class="pill">Planned</span>');
        return it.form && folder
          ? '<a class="tile-row qa-item" href="#/form-new/' + it.form + "/" + encodeURIComponent(folder) + '">' + inner + "</a>"
          : '<div class="tile-row qa-item planned">' + inner + "</div>";
      }).join("")).join("") +
      '<p class="small">Send the office any other standard QA documents (ITPs, DFT records, delivery checks) and they will be built in the same way.</p>';
    if ($("qaJob")) $("qaJob").onchange = (e) => { LS.set("lastJob", e.target.value); location.hash = "#/qa/" + encodeURIComponent(e.target.value); };
  });

  IC.QA = { afterInspection, checkComplete, inspectionStatusHtml, bindStatus };
})();
