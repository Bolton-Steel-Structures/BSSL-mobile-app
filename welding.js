/* iCONSTRUCTE Site: welding sets, their calibration certificates and the Monday welding set check (24 Nov 2026),
 * and the workshop equipment check register.
 *
 * Welding sets: each operative is assigned a set (Welding Set Matrix). Each set is calibrated every year to IEC 60974-14
 * (amps and volts), or its wire speed validated; the certificate (W.I.R.E. Ltd's .xlsx, or a PDF) is imported by drag and
 * drop and can be opened in the app by the operative using the set. Every Monday morning the operative checks the set
 * against the WPS they are welding to (WM-14-7 Welding Check Sheet): WPS, F / W, weld type, amps, volts, gas type and gas
 * flow, each within the WPS range; a supervisor verifies the week's sheet. Ranges from BSS's WPSs 1, 2 and 3 (Rev 0).
 * BS EN ISO 3834-2 (equipment, validation of measuring) and BS EN 1090-2 7.4.1 (welding to qualified WPSs).
 *
 * Records: "weldset" { set, serial, make, model, process, assignedTo, assignedName, status }   (id "set-<no>")
 *          "weldcert" { set, kind (Calibration | Wire speed), certNo, make, model, process, calibrated, due, status, by,
 *                       cols, points, fileName, fileType, fileData (data URL) }
 *          "weldcheck" { weekOf, set, wps, role (F | W), weldType, amps, volts, gasOk, flow, inRange, ok, sig, person }
 *          "weldweek" { weekOf, initials, verifiedBy, verifiedByName }
 * Equipment checks are the "wscheck" form; this file adds the register (due, last check, defects) for reviewers.
 */
(function () {
  "use strict";
  const { $, esc, Data, can, setBar, sheet, toast, fmtDay, fmtDate, isoDate, parseDate, route } = IC;
  const me = () => (Data.profile || {}).email || "";
  const myName = () => (Data.profile || {}).name || "";
  const initials = (n) => String(n || "").split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).join("");

  // BSS WPSs (01 WPSs, PQRs, WQs register): current, voltage and gas flow ranges a set must be within
  const GAS = "Ar + 13% CO2 + 1.5% O2";
  const WPS = {
    "1": { name: "WPS 1 · butt welds", type: "BW", a: [170, 240], v: [21, 32], f: [15, 20], note: "Root 170–190 A / 21–24 V; fill 195–220 A / 28–32 V; cap 170–240 A / 28–32 V" },
    "2": { name: "WPS 2 · single pass fillet welds", type: "FW", a: [250, 305], v: [30, 33], f: [15, 20], note: "4.5–8 mm throat, 1.2 mm wire" },
    "3": { name: "WPS 3 · multi pass fillet welds", type: "FW", a: [275, 315], v: [30, 33], f: [15, 20], note: "All multi pass throat sizes, 1.2 mm wire" }
  };
  const inR = (x, r) => x !== "" && x != null && !isNaN(x) && Number(x) >= r[0] && Number(x) <= r[1];

  function monday(d) { const x = new Date(d || Date.now()); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  const weekOf = (d) => isoDate(monday(d));
  const setSort = (a, b) => { const n = (s) => (/^\d+$/.test(s) ? Number(s) : 1000 + String(s).charCodeAt(0)); return n(a.set) - n(b.set) || String(a.set).localeCompare(String(b.set)); };
  const daysTo = (iso) => (iso ? Math.round((parseDate(iso) - new Date(new Date().toDateString())) / 864e5) : null);
  function certState(c) {
    if (!c) return { cls: "bad", label: "No certificate", ok: false };
    const d = daysTo(c.due);
    if (String(c.status).toUpperCase() === "FAIL") return { cls: "bad", label: "Failed calibration", ok: false };
    if (d == null) return { cls: "warn", label: "No due date", ok: true };
    if (d < 0) return { cls: "bad", label: "Calibration out of date (" + fmtDate(c.due) + ")", ok: false };
    if (d <= 30) return { cls: "warn", label: "Calibration due " + fmtDate(c.due), ok: true };
    return { cls: "ok", label: "Calibrated to " + fmtDate(c.due), ok: true };
  }

  async function load() {
    const sets = (await Data.list("weldset", "team")).sort(setSort), certs = await Data.list("weldcert", "team");
    // the newest certificate of each kind per set
    const certOf = (set, kind) => certs.filter((c) => String(c.set).toUpperCase() === String(set).toUpperCase() && (!kind || c.kind === kind)).sort((a, b) => (b.calibrated || "").localeCompare(a.calibrated || ""))[0] || null;
    const mainCert = (set) => certOf(set, "Calibration") || certOf(set);
    return { sets, certs, certOf, mainCert };
  }
  const mySet = (sets) => sets.find((s) => s.assignedTo && s.assignedTo === me()) || null;

  // ---------------------------------------------------------------- the welding sets page
  async function viewSets() {
    setBar("Welding sets", "Calibration and the Monday check", true);
    const { sets, mainCert, certs } = await load(), wk = weekOf(), checks = (await Data.list("weldcheck", "team")).filter((c) => c.weekOf === wk);
    const ver = (await Data.list("weldweek", "team")).find((v) => v.weekOf === wk);
    let h = "";
    if (can("weld")) {
      const s = mySet(sets), c = s && mainCert(s.set), st = certState(c), done = s && checks.find((x) => x.set === s.set);
      h += '<div class="card"><b>My welding set</b>' + (s ? '<div class="ws-set"><span class="ws-no">' + esc(s.set) + "</span><span><b>" + esc([s.make, s.model].filter(Boolean).join(" ")) + '</b><span class="small">Serial ' + esc(s.serial || "–") + '</span><span class="pill ' + st.cls + '">' + esc(st.label) + "</span></span></div>" +
        (c ? '<a class="btn block" href="#/weld-cert/' + encodeURIComponent(c.id) + '">View calibration certificate</a>' : "") +
        (done ? '<div class="note ' + (done.ok ? "ok" : "bad") + '">Monday check done ' + esc(fmtDay(new Date(done.createdAt))) + (done.ok ? ": within " + esc(WPS[done.wps].name.split(" · ")[0]) : ": outside the WPS range. Your supervisor has been told.") + "</div>"
          : '<a class="btn primary block" href="#/weld-check">Do this week’s welding set check</a>') : '<p class="small">No welding set is assigned to you. Ask your supervisor.</p>') + "</div>";
    }
    if (can("weld-admin")) {
      const out = checks.filter((x) => !x.ok), missing = sets.filter((s) => s.assignedTo && s.status !== "Out of use" && !checks.some((x) => x.set === s.set));
      const due = sets.filter((s) => { const st = certState(mainCert(s.set)); return s.status !== "Out of use" && (!st.ok || st.cls === "warn"); });
      h += '<div class="stats"><div class="stat"><b>' + checks.length + "</b><span>checked this week</span></div><div class=\"stat" + (missing.length ? " warn" : "") + '"><b>' + missing.length + "</b><span>not checked yet</span></div><div class=\"stat" + (out.length ? " bad" : "") + '"><b>' + out.length + "</b><span>outside the WPS</span></div><div class=\"stat" + (due.length ? " warn" : "") + '"><b>' + due.length + "</b><span>calibration due or out</span></div></div>" +
        '<div class="card"><div class="row-between"><b>Welding check sheet (WM-14-7), week of ' + esc(fmtDay(monday())) + "</b>" + (ver ? '<span class="pill ok">Checked ' + esc(ver.initials) + "</span>" : "") + "</div>" +
        '<div class="wk-wrap"><table class="tbl ws-sheet"><tr><th>Set</th><th>WPS</th><th>Name</th><th>Job</th><th>Weld</th><th>Amps</th><th>Volts</th><th>Gas</th><th>Flow</th></tr>' +
        sets.filter((s) => s.status !== "Out of use").map((s) => { const c = checks.find((x) => x.set === s.set), t = (ok) => (c ? (ok ? '<td class="ok">✓</td>' : '<td class="bad">✗</td>') : "<td></td>");
          return "<tr" + (c && !c.ok ? ' class="bad-row"' : "") + "><td><b>" + esc(s.set) + "</b></td><td>" + (c ? esc(c.wps) : "") + "</td><td>" + esc(c ? c.personName : s.assignedName || s.location || (s.status === "Spare" ? "Spare set" : "")) + "</td><td>" + (c ? esc(c.role) : "") + "</td><td>" + (c ? esc(c.weldType) : "") + "</td>" +
            (c ? t(c.inRange.a) + t(c.inRange.v) + t(c.gasOk) + t(c.inRange.f) : '<td colspan="4" class="small">' + (s.assignedTo ? "not checked" : "") + "</td>") + "</tr>"; }).join("") + "</table></div>" +
        (out.length ? '<p class="err">' + esc(out.map((x) => "Set " + x.set + " (" + x.personName + "): " + [!x.inRange.a && "amps " + x.amps, !x.inRange.v && "volts " + x.volts, !x.gasOk && "gas", !x.inRange.f && "flow " + x.flow].filter(Boolean).join(", ")).join("; ")) + ". Don't weld with these until put right.</p>" : "") +
        '<div class="row">' + (!ver ? '<button class="btn primary" id="wsVerify">Checked: sign off the week</button>' : "") + '<button class="btn" id="wsXlsx">Excel (WM-14-7)</button></div></div>' +
        '<div class="card"><b>Add calibration certificates</b><div class="drop" id="wsDrop" tabindex="0" role="button" aria-label="Choose certificate files"><b>Drop certificates here</b><span class="small">W.I.R.E. calibration or wire speed certificates (.xlsx) read automatically; PDFs and photos asked for the set and dates. The set register (.xlsx: Set, Serial, Name) can be dropped too.</span></div><input type="file" id="wsFiles" multiple accept=".xlsx,.pdf,image/*" hidden></div>' +
        '<div class="card"><b>Sets</b>' + (sets.length ? sets.map((s) => { const c = mainCert(s.set), st = certState(c), wire = certs.some((x) => x.set === s.set && x.kind === "Wire speed");
          return '<div class="ws-row"><span class="ws-no">' + esc(s.set) + '</span><span class="ws-t"><b>' + esc(s.assignedName || s.location || (s.status === "Spare" ? "Spare set" : "Not assigned")) + '</b><span class="small">' + esc([s.make, s.model, s.serial && "serial " + s.serial, s.status !== "In use" ? s.status : ""].filter(Boolean).join(" · ")) + '</span><span class="pill ' + st.cls + '">' + esc(st.label) + (wire && c && c.kind !== "Wire speed" ? " · + wire speed" : "") + "</span></span>" +
            '<span class="ws-a"><button class="btn sm" data-assign="' + esc(s.id) + '">Assign</button>' + (c ? '<a class="btn sm" href="#/weld-cert/' + encodeURIComponent(c.id) + '">Cert</a>' : "") + "</span></div>"; }).join("") : '<p class="small">No sets yet: drop the set register or the certificates above.</p>') +
        '<button class="btn block" id="wsAdd">Add a set</button></div>';
    }
    $("main").innerHTML = h || '<div class="empty">Nothing here for your role.</div>';
    if ($("wsVerify")) $("wsVerify").onclick = async () => {
      if (!checks.length) { toast("No checks done yet this week"); return; }
      await Data.save("weldweek", { weekOf: wk, initials: initials(myName()), verifiedBy: me(), verifiedByName: myName() }); toast("Week signed off"); viewSets();
    };
    if ($("wsXlsx")) $("wsXlsx").onclick = () => sheetXlsx(sets, checks, ver);
    const drop = $("wsDrop"), inp = $("wsFiles");
    if (drop) {
      drop.onclick = () => inp.click(); drop.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") inp.click(); };
      drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("on"); }; drop.ondragleave = () => drop.classList.remove("on");
      drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove("on"); importFiles([...e.dataTransfer.files]); };
      inp.onchange = () => importFiles([...inp.files]);
    }
    $("main").querySelectorAll("[data-assign]").forEach((b) => (b.onclick = () => assignSheet(sets.find((s) => s.id === b.dataset.assign))));
    if ($("wsAdd")) $("wsAdd").onclick = () => assignSheet(null);
  }

  // assign a set to someone (or spare / out of use); also adds a new set
  function assignSheet(s) {
    const ppl = IC.WsHours.people(), cur = s || { set: "", serial: "", make: "", model: "", status: "In use" };
    const sh = sheet("<h3>" + (s ? "Set " + esc(s.set) : "Add a welding set") + "</h3>" +
      (s ? "" : '<label class="fl">Set number<input id="aSet" placeholder="e.g. 17 or WC3"></label>') +
      '<label class="fl">Assigned to<select id="aWho"><option value="">Nobody (spare)</option>' + ppl.map((p) => '<option value="' + esc(p.email) + '"' + (p.email === cur.assignedTo ? " selected" : "") + ">" + esc(p.name) + "</option>").join("") + "</select></label>" +
      '<label class="fl">Status<select id="aSt">' + ["In use", "Spare", "Out of use"].map((x) => "<option" + (x === cur.status ? " selected" : "") + ">" + x + "</option>").join("") + "</select></label>" +
      '<label class="fl">Make<input id="aMake" value="' + esc(cur.make || "") + '"></label><label class="fl">Model<input id="aModel" value="' + esc(cur.model || "") + '"></label><label class="fl">Serial number<input id="aSer" value="' + esc(cur.serial || "") + '"></label>' +
      '<button class="btn primary block" id="aGo">Save</button><button class="btn block" id="aNo">Cancel</button>');
    sh.q("#aNo").onclick = () => sh.close();
    sh.q("#aGo").onclick = async () => {
      const set = s ? s.set : String(sh.q("#aSet").value || "").trim().toUpperCase().replace(/^SET\s*/, "");
      if (!set) { toast("Give the set number"); return; }
      const who = sh.q("#aWho").value, p = ppl.find((x) => x.email === who);
      // one set per person: taking a set moves them off any other
      if (who) for (const o of await Data.list("weldset", "team")) if (o.assignedTo === who && o.set !== set) { o.assignedTo = ""; o.assignedName = ""; o.status = "Spare"; await Data.save("weldset", o); }
      await Data.save("weldset", Object.assign({}, cur, { id: "set-" + set, set, assignedTo: who, assignedName: p ? p.name : "", status: who ? "In use" : sh.q("#aSt").value === "In use" ? "Spare" : sh.q("#aSt").value, make: sh.q("#aMake").value.trim(), model: sh.q("#aModel").value.trim(), serial: sh.q("#aSer").value.trim() }));
      sh.close(); toast("Set " + set + " saved"); viewSets();
    };
  }

  // ---------------------------------------------------------------- importing certificates (and the register)
  const cellsOf = (rows) => rows.flatMap((r) => (r || []).filter((c) => c != null && c !== "").map(String));
  const find = (txt, re) => { for (const t of txt) { const m = t.match(re); if (m) return m[1].trim(); } return ""; };
  const ukIso = (s) => { const m = String(s || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0") : ""; };
  // read a W.I.R.E. certificate sheet: calibration (amps and volts) or wire speed
  function parseCert(rows, fileName) {
    const txt = cellsOf(rows), up = txt.join(" ").toUpperCase();
    if (!/CERTIFICATE/.test(up) || !/(CALIBRATION|WIRE SPEED)/.test(up)) return null;
    const kind = /WIRE SPEED CERTIFICATE/.test(up) ? "Wire speed" : "Calibration";
    let set = find(txt, /Serial No:\s*(?:set\s*)?(\S.*)/i).toUpperCase().replace(/^SET\s*/, "");
    if (!set) { const m = String(fileName).match(/set[\s_-]*(WC\d+|\d+)/i); set = m ? m[1].toUpperCase() : ""; }
    const points = rows.map((r) => (r || []).filter((c) => c != null && c !== "")).filter((r) => r.length >= 4 && /^(pass|fail)$/i.test(String(r[r.length - 1])) && !isNaN(Number(r[0]))).map((r) => r.map((c) => (isNaN(Number(c)) ? String(c).toUpperCase() : Number(c))));
    return { set, kind, certNo: find(txt, /CERTIFICATE\s*-\s*(\S+)/i), make: find(txt, /Manufacturer:\s*(.*)/i), model: find(txt, /Model:\s*(.*)/i), process: find(txt, /Process:\s*(\S.*)/i) || "MIG",
      calibrated: ukIso(find(txt, /Date of Calibration:\s*(.*)/i)), due: ukIso(find(txt, /ReCalibration Due:\s*(.*)/i)), status: find(txt, /Status\s*-\s*(\w+)/i).toUpperCase() || "PASS",
      by: find(txt, /^(W\.I\.R\.E\.[^,]*)$/i) || find(txt, /Verification Organisation\s*(.*)/i) || "", standard: /60974-14/.test(up) ? "IEC 60974-14" : "",
      cols: kind === "Wire speed" ? ["Set (m/min)", "Reading (m/min)", "Error", "Result"] : ["Set A", "Set V", "Machine A", "Machine V", "Meter A", "Meter V", "Error A", "Error V", "Result"], points };
  }
  const asDataUrl = (f) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); });
  async function importFiles(files) {
    const done = [], ask = [], skipped = [];
    for (const f of files) {
      if (/\.xlsx$/i.test(f.name)) {
        let sheets; try { sheets = await IC.Admin.readXlsx(f); } catch (e) { skipped.push(f.name); continue; }
        const first = Object.values(sheets)[0] || [];
        const cert = parseCert(first, f.name);
        if (cert && cert.set) {
          const prev = (await Data.list("weldcert", "team")).find((c) => c.certNo && c.certNo === cert.certNo);
          await Data.save("weldcert", Object.assign(prev ? { id: prev.id } : {}, cert, { fileName: f.name, fileType: f.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileData: await asDataUrl(f) }));
          await ensureSet(cert.set, cert); done.push("Set " + cert.set + " " + cert.kind.toLowerCase() + " " + cert.certNo + " to " + fmtDate(cert.due)); continue;
        }
        const reg = await importRegister(sheets);
        if (reg) { done.push(reg); continue; }
        skipped.push(f.name);
      } else ask.push(f);
    }
    for (const f of ask) await pdfCert(f);
    IC.sheet("<h3>Imported</h3>" + (done.length ? "<p>" + done.map(esc).join("<br>") + "</p>" : "<p>Nothing read automatically.</p>") + (skipped.length ? '<p class="err">Not a certificate or register: ' + esc(skipped.join(", ")) + "</p>" : ""));
    viewSets();
  }
  async function ensureSet(set, c) {
    const all = await Data.list("weldset", "team"), s = all.find((x) => String(x.set).toUpperCase() === set);
    if (!s) await Data.save("weldset", { id: "set-" + set, set, make: c.make || "", model: c.model || "", serial: "", process: c.process || "", status: "Spare", assignedTo: "", assignedName: "" });
    else if (!s.make && c.make) await Data.save("weldset", Object.assign(s, { make: c.make, model: c.model }));
  }
  // the set register (Set | Serial | Name): names are matched to the workshop's people; "Spare" leaves it unassigned
  async function importRegister(sheets) {
    for (const rows of Object.values(sheets)) {
      const hi = rows.findIndex((r) => r && r.some((c) => /set/i.test(String(c || ""))) && r.some((c) => /serial/i.test(String(c || ""))));
      if (hi < 0) continue;
      const h = rows[hi].map((c) => String(c || "").toLowerCase()), iS = h.findIndex((x) => /set/.test(x)), iN = h.findIndex((x) => /name/.test(x)), iR = h.findIndex((x) => /serial/.test(x));
      const ppl = IC.WsHours.people(), match = (n) => ppl.find((p) => p.name.toLowerCase() === n.toLowerCase()) || ppl.find((p) => p.name.split(" ").slice(-1)[0].toLowerCase() === n.split(" ").slice(-1)[0].toLowerCase() && p.name[0].toLowerCase() === n[0].toLowerCase());
      let n = 0, un = [];
      for (const r of rows.slice(hi + 1)) {
        if (!r || r[iS] == null || r[iS] === "") continue;
        const set = String(r[iS]).trim().toUpperCase().replace(/^SET\s*/, ""), name = iN >= 0 ? String(r[iN] || "").trim() : "", shared = /top shop|shared|bay/i.test(name), spare = !name || /spare/i.test(name) || shared, p = spare ? null : match(name);
        const prev = (await Data.list("weldset", "team")).find((x) => x.set === set) || {};
        if (!spare && !p) un.push(name);
        await Data.save("weldset", Object.assign({ id: "set-" + set, make: "", model: "", process: "" }, prev, { set, serial: iR >= 0 ? String(r[iR] || "").trim() : prev.serial || "", assignedTo: p ? p.email : "", assignedName: spare ? "" : p ? p.name : name, location: shared ? name : prev.location || "", status: shared ? "In use" : spare ? "Spare" : "In use" }));
        n++;
      }
      return n + " sets from the register" + (un.length ? " (not matched to an app login, so no Monday reminder until assigned: " + un.join(", ") + ")" : "");
    }
    return "";
  }
  // a PDF or photo of a certificate: ask which set and the dates
  function pdfCert(f) {
    return new Promise((resolve) => {
      const sh = sheet("<h3>" + esc(f.name) + "</h3><p class=\"small\">Which set is this certificate for?</p>" +
        '<label class="fl">Set<input id="pSet" value="' + esc((String(f.name).match(/set[\s_-]*(WC\d+|\d+)/i) || [])[1] || "") + '"></label>' +
        '<label class="fl">Type<select id="pKind"><option>Calibration</option><option>Wire speed</option></select></label>' +
        '<label class="fl">Certificate number<input id="pNo"></label><label class="fl">Date of calibration<input id="pCal" type="date"></label><label class="fl">Recalibration due<input id="pDue" type="date"></label>' +
        '<label class="fl">Result<select id="pSt"><option>PASS</option><option>FAIL</option></select></label><button class="btn primary block" id="pGo">Add</button><button class="btn block" id="pNo2">Skip</button>');
      sh.q("#pNo2").onclick = () => { sh.close(); resolve(); };
      sh.q("#pGo").onclick = async () => {
        const set = String(sh.q("#pSet").value).trim().toUpperCase().replace(/^SET\s*/, "");
        if (!set || !sh.q("#pDue").value) { toast("Give the set and the due date"); return; }
        const c = { set, kind: sh.q("#pKind").value, certNo: sh.q("#pNo").value.trim(), calibrated: sh.q("#pCal").value, due: sh.q("#pDue").value, status: sh.q("#pSt").value, cols: [], points: [], fileName: f.name, fileType: f.type, fileData: await asDataUrl(f) };
        await Data.save("weldcert", c); await ensureSet(set, c); sh.close(); resolve();
      };
    });
  }

  // ---------------------------------------------------------------- a certificate
  async function viewCert(args) {
    const c = (await Data.list("weldcert", "team")).find((x) => x.id === decodeURIComponent(args[0] || ""));
    if (!c) { location.hash = "#/weld"; return; }
    const st = certState(c), others = (await Data.list("weldcert", "team")).filter((x) => x.set === c.set && x.id !== c.id).sort((a, b) => (b.calibrated || "").localeCompare(a.calibrated || ""));
    setBar("Set " + c.set + " · " + c.kind.toLowerCase(), c.certNo || "", true);
    $("main").innerHTML = '<div class="card cert-view"><div class="row-between"><b>' + esc(c.kind === "Wire speed" ? "Wire speed certificate" : "Calibration certificate") + " " + esc(c.certNo || "") + '</b><span class="pill ' + st.cls + '">' + esc(c.status || "") + "</span></div>" +
      '<div class="small">' + esc([c.standard && "To " + c.standard, c.by].filter(Boolean).join(" · ")) + "</div>" +
      '<dl class="kv"><dt>Set</dt><dd>' + esc(c.set) + "</dd><dt>Machine</dt><dd>" + esc([c.make, c.model].filter(Boolean).join(" ")) + "</dd><dt>Process</dt><dd>" + esc(c.process || "") + "</dd><dt>Calibrated</dt><dd>" + esc(c.calibrated ? fmtDate(c.calibrated) : "–") + "</dd><dt>Next due</dt><dd>" + esc(c.due ? fmtDate(c.due) : "–") + ' <span class="pill ' + st.cls + '">' + esc(st.label) + "</span></dd></dl>" +
      (c.points && c.points.length ? '<div class="wk-wrap"><table class="tbl"><tr>' + c.cols.map((x) => "<th>" + esc(x) + "</th>").join("") + "</tr>" + c.points.map((r) => "<tr>" + r.map((x) => "<td" + (/^FAIL$/.test(x) ? ' class="bad"' : "") + ">" + esc(x) + "</td>").join("") + "</tr>").join("") + "</table></div>" : "") +
      (c.fileData ? '<button class="btn block" id="cOpen">Open the original (' + esc(c.fileName || "file") + ")</button>" : "") + "</div>" +
      (others.length ? '<div class="card"><b>Other certificates for set ' + esc(c.set) + "</b>" + others.map((o) => '<a class="tile-row" href="#/weld-cert/' + encodeURIComponent(o.id) + '"><span><b>' + esc(o.kind + " " + (o.certNo || "")) + '</b><span class="small">' + esc((o.calibrated ? fmtDate(o.calibrated) : "") + " to " + (o.due ? fmtDate(o.due) : "")) + "</span></span>›</a>").join("") + "</div>" : "");
    if ($("cOpen")) $("cOpen").onclick = async () => { const blob = await (await fetch(c.fileData)).blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = c.fileName || "certificate"; a.target = "_blank"; document.body.appendChild(a); a.click(); a.remove(); };
  }

  // ---------------------------------------------------------------- the Monday check
  // the operative checks their own set; a supervisor or manager can check any set (e.g. a spare, or for someone without a phone)
  async function viewCheck(args) {
    const { sets, mainCert } = await load(), admin = can("weld-admin"), want = args && args[0] ? decodeURIComponent(args[0]) : "";
    const done = (await Data.list("weldcheck", "team")).filter((x) => x.weekOf === weekOf()).map((x) => x.set);
    const s = sets.find((x) => admin && x.set === want) || mySet(sets) || (admin ? sets.find((x) => x.assignedTo && !done.includes(x.set)) || sets[0] : null);
    setBar("Welding set check", "WM-14-7 · week of " + fmtDay(monday()), true);
    if (!s) { $("main").innerHTML = '<div class="empty">' + (admin ? "No welding sets yet: add them on Welding sets." : "No welding set is assigned to you. Ask your supervisor.") + "</div>"; return; }
    const c = mainCert(s.set), st = certState(c), last = (await Data.list("weldcheck", "team")).filter((x) => x.set === s.set).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];
    $("main").innerHTML = (admin ? '<label class="fl">Set<select id="cSet">' + sets.filter((x) => x.status !== "Out of use").map((x) => '<option value="' + esc(x.set) + '"' + (x.set === s.set ? " selected" : "") + ">Set " + esc(x.set) + " · " + esc(x.assignedName || x.location || "spare") + (done.includes(x.set) ? " (done this week)" : "") + "</option>").join("") + "</select></label>" : "") +
      '<div class="card"><div class="ws-set"><span class="ws-no">' + esc(s.set) + "</span><span><b>" + esc([s.make, s.model].filter(Boolean).join(" ")) + "</b>" + (s.assignedName ? '<span class="small">' + esc(s.assignedName) + "</span>" : "") + '<span class="pill ' + st.cls + '">' + esc(st.label) + "</span></span></div>" +
      (!st.ok ? '<p class="err">This set’s calibration is not valid. Don’t weld with it: tell your supervisor, who will swap it for a calibrated set.</p></div>' :
      '<p class="small">Run the set on a test piece and read the meters while welding. Each reading must be within the range of the WPS you are welding to (WM-14-7).</p></div>' +
      '<div class="card"><label class="fl">WPS<select id="cWps">' + Object.entries(WPS).map(([k, w]) => '<option value="' + k + '"' + ((last ? last.wps : "2") === k ? " selected" : "") + ">" + esc(w.name) + "</option>").join("") + '</select></label><div class="small" id="cRanges"></div>' +
      '<label class="fl">I am the<select id="cRole"><option value="F"' + (last && last.role === "F" ? " selected" : "") + '>Fabricator (F)</option><option value="W"' + (last && last.role === "W" ? " selected" : "") + ">Welder (W)</option></select></label>" +
      '<label class="fl">Amps<input id="cA" type="number" inputmode="numeric" step="1"></label><div class="small rng" id="rA"></div>' +
      '<label class="fl">Volts<input id="cV" type="number" inputmode="decimal" step="0.1"></label><div class="small rng" id="rV"></div>' +
      '<label class="fl chk"><input type="checkbox" id="cGas"> Gas is ' + esc(GAS) + "</label>" +
      '<label class="fl">Gas flow (l/min)<input id="cF" type="number" inputmode="decimal" step="0.5"></label><div class="small rng" id="rF"></div>' +
      '<div id="cSig"></div>' +
      '<button class="btn primary block" id="cGo">Submit check</button></div>');
    if ($("cSet")) $("cSet").onchange = () => { location.hash = "#/weld-check/" + encodeURIComponent($("cSet").value); };
    if (!st.ok) return;
    const pad = IC.signaturePad("Signature *"); $("cSig").appendChild(pad.el);
    const show = () => {
      const w = WPS[$("cWps").value];
      $("cRanges").textContent = w.type + " · " + w.a.join("–") + " A · " + w.v.join("–") + " V · gas " + w.f.join("–") + " l/min. " + w.note;
      [["cA", "rA", w.a, "A"], ["cV", "rV", w.v, "V"], ["cF", "rF", w.f, "l/min"]].forEach(([i, r, rg, u]) => { const x = $(i).value; $(r).className = "small rng " + (x === "" ? "" : inR(x, rg) ? "ok" : "bad"); $(r).textContent = x === "" ? "" : inR(x, rg) ? "Within " + rg.join("–") + " " + u : "Outside " + rg.join("–") + " " + u + ": adjust the set and read again"; });
    };
    ["cWps", "cA", "cV", "cF"].forEach((i) => ($(i).oninput = show)); show();
    $("cGo").onclick = async () => {
      const w = WPS[$("cWps").value], a = $("cA").value, v = $("cV").value, f = $("cF").value;
      if (a === "" || v === "" || f === "") { toast("Fill in amps, volts and gas flow"); return; }
      const inRange = { a: inR(a, w.a), v: inR(v, w.v), f: inR(f, w.f) }, gasOk = $("cGas").checked, ok = inRange.a && inRange.v && inRange.f && gasOk;
      if (!ok && !confirm("Some readings are outside " + w.name.split(" · ")[0] + (gasOk ? "" : " (or the gas isn't " + GAS + ")") + ". Submit as outside the range? Your supervisor is told and the set mustn't be used until it's put right.")) return;
      if (pad.isEmpty()) { toast("Sign the check"); return; }
      const sig = await asDataUrl(await pad.toBlob());
      await Data.save("weldcheck", { weekOf: weekOf(), set: s.set, wps: $("cWps").value, role: $("cRole").value, weldType: w.type, amps: Number(a), volts: Number(v), gasOk, gas: gasOk ? GAS : "", flow: Number(f), inRange, ok, certNo: c ? c.certNo : "", sig, person: me(), personName: myName() });
      toast(ok ? "Check done: set " + s.set + " is within the WPS" : "Check saved: outside the WPS. Tell your supervisor."); location.hash = "#/weld";
    };
  }

  // the week's sheet as Excel, laid out like WM-14-7
  function sheetXlsx(sets, checks, ver) {
    const tick = (b) => (b ? "✓" : "✗");
    const rows = [["Bolton Structures · Welding Check Sheet · WM-14-7 Revision A"], ["Week of " + fmtDay(monday())], [], ["Machine No.", "WPS No.", "Name", "Job", "Weld Type", "Amps", "Volts", "Gas Type", "Gas Flow", "Checked", "Amps read", "Volts read", "Flow read (l/min)", "Certificate", "Due"]];
    for (const s of sets.filter((x) => x.status !== "Out of use")) {
      const c = checks.find((x) => x.set === s.set);
      rows.push([s.set, c ? c.wps : "", c ? c.personName : s.assignedName || s.location || "Spare set", c ? c.role : "", c ? c.weldType : "", c ? tick(c.inRange.a) : "", c ? tick(c.inRange.v) : "", c ? tick(c.gasOk) : "", c ? tick(c.inRange.f) : "", c && ver ? ver.initials : "", c ? c.amps : "", c ? c.volts : "", c ? c.flow : "", c ? c.certNo || "" : "", ""]);
    }
    rows.push([], ["Signature: " + (ver ? ver.verifiedByName + " " + fmtDay(new Date(ver.createdAt)) : "")]);
    const blob = IC.Xlsx.build([{ name: "WM-14-7", rows, widths: [11, 8, 20, 6, 10, 7, 7, 9, 9, 9, 10, 10, 15, 13, 10] }]);
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Welding check sheet WM-14-7 w-c " + weekOf() + ".xlsx"; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 1500);
  }

  // ---------------------------------------------------------------- workshop equipment checks: the register
  // per machine: each of its checks (daily basic / weekly detailed / weekly) with the last one done and whether it's due.
  // A weekly detailed check also counts as that day's basic check. Weekly checks are due from Monday each week.
  async function equipState() {
    const kindOf = (f) => IC.Forms.WS_OLD[f.values.equipType] || f.values.equipType, dayOf = (f) => f.values.checkDate || isoDate(new Date(f.submittedAt));
    const forms = (await Data.list("forms", "team")).filter((f) => f.templateId === "wscheck" && f.status === "submitted").sort((a, b) => (dayOf(b) + (b.submittedAt || "")).localeCompare(dayOf(a) + (a.submittedAt || "")));
    const today = isoDate(new Date()), mon = weekOf(), working = IC.isWorkingDay ? IC.isWorkingDay(new Date()) : true;
    return IC.Forms.WS_EQUIP.map((m) => {
      const keys = m.checks.map((c) => c[0]), mine = forms.filter((f) => keys.includes(kindOf(f)));
      const checks = m.checks.map(([key, every]) => {
        const counts = every === "day" ? keys : [key]; // the weekly detailed counts for the day too
        const last = mine.find((f) => counts.includes(kindOf(f)));
        const due = every === "day" ? working && (!last || dayOf(last) < today) : !last || dayOf(last) < mon;
        return { key, every, last, due, label: every === "day" ? "Daily basic" : m.checks.length > 1 ? "Weekly detailed (Monday)" : "Weekly" };
      });
      const latest = mine[0];
      return { type: m.name, checks, list: mine, last: latest, due: checks.some((c) => c.due), unsafe: latest && latest.values.safe === "No" };
    });
  }
  async function viewEquip() {
    setBar("Workshop equipment checks", "Pre-use checks (PUWER / LOLER)", true);
    const st = await equipState(), review = can("equip-review"), doer = can("form:wscheck");
    const when = (f) => fmtDay(parseDate(f.values.checkDate || isoDate(new Date(f.submittedAt)))) + " by " + (f.values.operator || f.userName || "") + (f.values.equipRef ? " (" + f.values.equipRef + ")" : "");
    $("main").innerHTML = '<p class="small">Forklift and overhead cranes: a basic check every working day before use, and a detailed check every Monday (it counts as Monday\u2019s basic check). The other machines once a week.</p>' +
      st.map((e) => '<div class="card eq' + (e.unsafe ? " bad" : e.due ? " warn" : "") + '"><div class="row-between"><b>' + esc(e.type) + "</b>" + (e.unsafe ? '<span class="pill bad">Not safe to use</span>' : "") + "</div>" +
        e.checks.map((c) => '<div class="eq-c"><span><span class="small"><b>' + esc(c.label) + "</b> · " + (c.last ? "last " + esc(when(c.last)) : "never checked in the app") + '</span></span><span class="eq-a"><span class="pill ' + (c.due ? "warn" : "ok") + '">' + (c.due ? (c.every === "day" ? "Due today" : "Due this week") : "Done") + "</span>" +
          (doer ? '<a class="btn sm' + (c.due ? " primary" : "") + '" href="#/form-new/wscheck/' + encodeURIComponent(c.key) + '">Check</a>' : "") + "</span></div>").join("") +
        (e.last && (e.last.flags || []).length ? '<div class="small err">' + esc((e.last.flags || []).slice(0, 3).map((x) => x.text || x.label || String(x)).join("; ")) + "</div>" : "") +
        (review && e.list.length ? '<details><summary class="small">' + e.list.length + " check" + (e.list.length > 1 ? "s" : "") + "</summary>" + e.list.slice(0, 40).map((f) => '<a class="tile-row" href="#/form/' + encodeURIComponent(f.id) + '"><span><b>' + esc(fmtDay(parseDate(f.values.checkDate || isoDate(new Date(f.submittedAt))))) + " · " + esc((IC.Forms.WS_OLD[f.values.equipType] || f.values.equipType).replace(e.type + " – ", "").replace(e.type, "weekly")) + '</b><span class="small">' + esc((f.values.operator || f.userName || "") + (f.values.equipRef ? " · " + f.values.equipRef : "") + " · " + (f.values.safe === "No" ? "NOT SAFE" : "safe") + ((f.flags || []).length ? " · " + f.flags.length + " defect" + (f.flags.length > 1 ? "s" : "") : "")) + "</span></span>›</a>").join("") + "</details>" : "") + "</div>").join("");
  }

  // ---------------------------------------------------------------- home to-do lines
  async function todos() {
    const out = [];
    if (can("weld")) {
      const { sets, mainCert } = await load(), s = mySet(sets);
      if (s && certState(mainCert(s.set)).ok && !(await Data.list("weldcheck", "team")).some((x) => x.set === s.set && x.weekOf === weekOf())) out.push({ href: "#/weld-check", title: "Welding set " + s.set + " check", sub: "Every Monday morning, before welding", alert: true });
      if (s && !certState(mainCert(s.set)).ok) out.push({ href: "#/weld", title: "Welding set " + s.set + ": calibration not valid", sub: "Don't weld with it; tell your supervisor", alert: true });
    }
    if (can("weld-admin")) {
      const wk = weekOf(), out2 = (await Data.list("weldcheck", "team")).filter((x) => x.weekOf === wk && !x.ok);
      if (out2.length) out.push({ href: "#/weld", title: out2.length + " welding set" + (out2.length > 1 ? "s" : "") + " outside the WPS", sub: out2.map((x) => "set " + x.set).join(", "), alert: true });
    }
    if (can("equip-check") || can("equip-review")) {
      const st = await equipState(), unsafe = st.filter((e) => e.unsafe), due = st.filter((e) => e.due && !e.unsafe);
      if (unsafe.length && can("equip-review")) out.push({ href: "#/equip", title: unsafe.map((e) => e.type).join(", ") + " not safe to use", sub: "Last equipment check", alert: true });
      const dueC = st.flatMap((e) => e.checks.filter((c) => c.due).map((c) => c.key));
      if (dueC.length && can("equip-check")) out.push({ href: "#/equip", title: dueC.length + " equipment check" + (dueC.length > 1 ? "s" : "") + " due", sub: dueC.join(", ") });
    }
    return out;
  }

  route("weld", () => viewSets());
  route("weld-cert", (args) => viewCert(args));
  route("weld-check", (args) => viewCheck(args));
  route("equip", () => viewEquip());
  IC.Welding = { WPS, todos, parseCert, certState, weekOf };
})();
