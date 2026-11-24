/* iCONSTRUCTE Site: workshop fabrication status (roadmap W4; 21 Nov 2026).
 * The workshop runs its own iCONSTRUCTE with its own job numbers (shown here with a W prefix); each BSS Fab Issue links to one
 * workshop job. Fabricators mark each line of the job's QA list (the list issued from folder 03, or another customer's list
 * converted to the same layout) Fabricated, Welded, Checked, Loaded, in that order and by quantity. Checked must be marked by
 * someone other than the person who marked that line welded (fabricators check each other's work): the QFC04 Q04.8 final
 * check record. When everything on a job is checked and loaded the office is told the load is ready for dispatch; the office
 * still presses Dispatch on Goods Out when it is collected.
 * Manifest: workshop: [{ wno, client, site, phase, bssJob, bssFolder, fabIssue, exc, requiredOn, list, lines: [{ mark, section, length, qty, kg, finish }] }]
 * Records: kind "fab", one line per tick, never overwritten: { wno, mark, stage, qty (negative = undone) }.
 * DEMO: kept on this phone. Live: through the Azure API, so every phone and the office see the same status.
 */
(function () {
  "use strict";
  const { $, esc, S, Data, can, setBar, sheet, toast, fmtDay } = IC;
  const STAGES = [["fabricated", "Fabricated", "F"], ["welded", "Welded", "W"], ["checked", "Checked", "C"], ["loaded", "Loaded", "L"]];
  const LABEL = Object.fromEntries(STAGES.map((s) => [s[0], s[1]]));
  // : marks are counted per QA list line, not per mark: the same mark on two lines (e.g. two finishes) keeps two
  // counts. A line's key is its mark; a repeat of the same mark becomes "mark#2", "mark#3" … (earlier records, which only
  // name the mark, still belong to the first line with that mark).
  const keyLines = (job) => { if (!job._keyed) { const n = {}; (job.lines || []).forEach((l) => { n[l.mark] = (n[l.mark] || 0) + 1; l.key = n[l.mark] === 1 ? l.mark : l.mark + "#" + n[l.mark]; }); job._keyed = true; } return job; };
  const jobs = () => ((S.manifest && S.manifest.workshop) || []).map(keyLines);
  const jobOf = (wno) => jobs().find((j) => j.wno === wno);
  const tonnes = (kg) => (kg >= 1000 ? (kg / 1000).toFixed(2) + " t" : Math.round(kg) + " kg");
  const fmtTime = (d) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const me = () => (Data.profile || {}).email || "";

  // done[mark][stage] = pieces marked; who[mark][stage] = net pieces per person
  function tally(job, log) {
    const done = {}, who = {}, last = {};
    keyLines(job);
    job.lines.forEach((l) => { done[l.key] = { fabricated: 0, welded: 0, checked: 0, loaded: 0 }; who[l.key] = { fabricated: {}, welded: {}, checked: {}, loaded: {} }; last[l.key] = {}; });
    const lk = (r) => r.line || r.mark;
    // An undo is its own line (negative quantity) naming the mark it takes back (undoOf) and whose mark that was
    // (undoUser): the pieces come off THAT person, not whoever pressed Undo, so "checked by someone other than the
    // welder" can't be got round by undoing someone else's mark. A mark that has been undone is never "the last".
    const mine = log.filter((r) => r.wno === job.wno && done[lk(r)] && LABEL[r.stage]).sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    const undone = new Set(mine.filter((r) => r.undoOf).map((r) => r.undoOf));
    mine.forEach((r) => {
      done[lk(r)][r.stage] += r.qty; const w = who[lk(r)][r.stage], u = r.qty < 0 && r.undoUser ? r.undoUser : r.user; w[u] = (w[u] || 0) + r.qty;
      if (r.qty > 0 && !undone.has(r.id)) last[lk(r)][r.stage] = r;
    });
    job.lines.forEach((l) => STAGES.forEach(([s]) => { done[l.key][s] = Math.max(0, Math.min(l.qty, done[l.key][s])); }));
    return { done, who, last };
  }
  // how many more pieces of this line can go to this stage now (each stage follows the one before)
  function room(line, d, stage) {
    const i = STAGES.findIndex((s) => s[0] === stage), before = i === 0 ? line.qty : d[STAGES[i - 1][0]];
    return Math.max(0, before - d[stage]);
  }
  function progress(job, t) {
    const pcs = job.lines.reduce((n, l) => n + l.qty, 0), kg = job.lines.reduce((n, l) => n + l.qty * (l.kg || 0), 0), out = { pcs, kg };
    STAGES.forEach(([s]) => {
      const p = job.lines.reduce((n, l) => n + t.done[l.key][s], 0), k = job.lines.reduce((n, l) => n + t.done[l.key][s] * (l.kg || 0), 0);
      out[s] = { pcs: p, kg: k, pct: kg > 0 ? Math.round((k / kg) * 100) : pcs ? Math.round((p / pcs) * 100) : 0 };
    });
    out.ready = pcs > 0 && out.checked.pcs === pcs && out.loaded.pcs === pcs;
    return out;
  }
  const bar = (name, p) => '<div class="fab-bar"><span class="fab-bar-l">' + esc(name) + '</span><span class="fab-bar-t"><i style="width:' + p.pct + '%"></i></span><span class="fab-bar-n">' + p.pct + "%</span></div>";
  const jobTitle = (j) => esc(j.wno) + " · " + esc(j.client || "");
  const jobSub = (j) => esc([j.site, j.phase].filter(Boolean).join(" · "));

  // ---------------------------------------------------------------- dashboard: every workshop job and its % at each stage
  async function dashboardHtml() {
    const log = await Data.list("fab", "team"), rows = jobs().map((j) => ({ j, p: progress(j, tally(j, log)) }));
    const going = rows.filter((r) => !r.p.ready), toCheck = rows.reduce((n, r) => n + (r.p.welded.pcs - r.p.checked.pcs), 0);
    return '<div class="stats"><div class="stat"><b>' + going.length + "</b><span>jobs in progress</span></div><div class=\"stat\"><b>" + toCheck + "</b><span>pieces waiting to be checked</span></div><div class=\"stat\"><b>" + (rows.length - going.length) + "</b><span>ready for dispatch</span></div></div>" +
      (rows.length ? rows.map(({ j, p }) => '<a class="card fab-job" href="#/workshop/' + encodeURIComponent(j.wno) + '"><div class="fab-job-h"><span><b>' + jobTitle(j) + '</b><span class="small"> ' + jobSub(j) + "</span></span>" + (p.ready ? '<span class="pill ok">Ready for dispatch</span>' : "") + "</div>" +
        '<div class="small">' + esc([j.bssJob ? "BSS job " + j.bssJob : "", j.fabIssue, j.exc, p.pcs + " pieces", tonnes(p.kg)].filter(Boolean).join(" · ")) + "</div>" +
        STAGES.map(([s, name]) => bar(name, p[s])).join("") + "</a>").join("") : '<div class="empty">No workshop jobs have been sent to the app yet.</div>');
  }

  async function viewDashboard() {
    setBar("Workshop", "Fabrication status", false);
    $("main").innerHTML = (await dashboardHtml()) + (can("board") ? '<a class="btn block" href="#/board">Open as a wall board (TV screen)</a>' : "");
  }

  // Wall board for a TV in the workshop or office: every job, large, no menus, refreshed every minute
  let boardTimer = null;
  async function viewBoard() {
    clearTimeout(boardTimer);
    setBar("Workshop board", fmtDay(new Date()) + " · " + fmtTime(new Date()), !can("screens")); $("nav").hidden = true;
    $("main").innerHTML = '<div class="board">' + (await dashboardHtml()) + "</div>";
    boardTimer = setTimeout(() => { if (location.hash.startsWith("#/board")) viewBoard(); }, 60000);
  }

  // ---------------------------------------------------------------- each assembly's own drawing
  // Assembly drawings in the job's 03 folder are matched to the QA list mark by file name: the name (less ".pdf" and a
  // trailing revision) is the mark, or contains the mark as a whole word ("B101 Rev A.pdf", "2627-004 - B101 - Rev B.pdf";
  // not B1010 or AB101). Only current drawings are in the manifest, so this is always the issued revision.
  const ICON_DWG = '<svg class="fab-dwg" viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>';
  function drawingFor(mark, draws, allMarks) {
    const m = String(mark || "").trim().toUpperCase();
    if (!m || !draws || !draws.length) return null;
    const stem = (f) => f.name.replace(/\.pdf$/i, "").replace(/[\s_-]*rev(ision)?[\s_.-]*[A-Z0-9]{1,3}$/i, "").trim().toUpperCase();
    const exact = draws.find((f) => stem(f) === m);
    if (exact) return exact;
    const word = new RegExp("(^|[^A-Z0-9])" + m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^A-Z0-9]|$)");
    // a name listing several of the job's marks ("Assemblies B103-P101") is a combined file: found by page instead
    const others = (allMarks || []).map((x) => String(x).trim().toUpperCase()).filter((x) => x && x !== m);
    const multi = (f) => others.some((o) => new RegExp("(^|[^A-Z0-9])" + o.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^A-Z0-9]|$)").test(stem(f)));
    const hits = draws.filter((f) => word.test(stem(f)) && !/^(GA|GENERAL)/.test(stem(f)) && !multi(f));
    return hits.length ? hits.sort((a, b) => a.name.length - b.name.length)[0] : null;
  }

  // Combined assembly drawings (23 Nov: several assemblies are often in one PDF). Each drawing PDF of the linked job
  // is read once per issue (text only, nothing drawn) and every page searched for the job's marks as whole words; a mark
  // goes to the page where it is printed largest (the title / mark label), and on a tie the page naming fewest of the
  // job's marks (so a GA or a list sheet never wins). Kept on the phone against the file and its issue date.
  const IDX_KEY = "markidx";
  const idxMem = {};
  function readIdx() { return IC.LS.get(IDX_KEY, {}); }
  async function indexFile(f, marks) {
    const key = f.path + "|" + f.issued, all = readIdx(), have = all[key];
    if (have && marks.every((m) => m in have.m)) return have;
    const rec = await IC.Store.get(f.path + "|" + f.issued);
    const blob = (rec && rec.blob) || (await IC.Src.blob(f.path));
    pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
    const want = new Set(marks), best = {}, perPage = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const tc = await (await pdf.getPage(n)).getTextContent(), seen = {};
      for (const it of tc.items) {
        const size = Math.abs(it.transform ? it.transform[3] || it.transform[0] : 0) || 1;
        for (const w of String(it.str || "").toUpperCase().split(/[^A-Z0-9]+/)) if (w && want.has(w)) seen[w] = Math.max(seen[w] || 0, size);
      }
      perPage.push(seen);
    }
    perPage.forEach((seen, i) => {
      const count = Object.keys(seen).length;
      for (const m of Object.keys(seen)) {
        const b = best[m];
        if (!b || seen[m] > b[1] + 0.01 || (Math.abs(seen[m] - b[1]) <= 0.01 && count < b[2])) best[m] = [i + 1, seen[m], count];
      }
    });
    const out = { n: pdf.numPages, m: {} };
    marks.forEach((m) => { out.m[m] = best[m] || null; });
    const fresh = readIdx(); fresh[key] = out;
    // keep the store small: only files still in the manifest
    const live = new Set(((S.manifest && S.manifest.jobs) || []).flatMap((x) => (x.files || []).map((y) => y.path + "|" + y.issued)));
    Object.keys(fresh).forEach((k) => { if (!live.has(k)) delete fresh[k]; });
    IC.LS.set(IDX_KEY, fresh);
    return out;
  }
  // { MARK: { f, page } } for marks with no drawing of their own, from the job's multi-sheet PDFs
  async function combinedPages(j, draws, marks) {
    const out = {};
    const files = draws.filter((f) => /\.pdf$/i.test(f.name) && !/^(GA|GENERAL)/i.test(f.name));
    for (const f of files) {
      let ix;
      try { ix = await indexFile(f, marks); } catch (e) { continue; }
      if (!ix || ix.n < 2) continue;
      for (const m of marks) {
        const hit = ix.m[m];
        if (!hit) continue;
        const cur = out[m];
        if (!cur || hit[1] > cur.size + 0.01 || (Math.abs(hit[1] - cur.size) <= 0.01 && hit[2] < cur.count)) out[m] = { f, page: hit[0], size: hit[1], count: hit[2], of: ix.n };
      }
    }
    return out;
  }

  // ---------------------------------------------------------------- one job: mark each QA list line through the four stages
  const search = {}; // what was typed in each job's search box, kept while marking
  async function viewJob(wno, filter) {
    const j = jobOf(wno); if (!j) { location.hash = "#/workshop"; return; }
    setBar(j.wno, [j.client, j.phase].filter(Boolean).join(" · "), true);
    const log = await Data.list("fab", "team"), t = tally(j, log), p = progress(j, t), mark = can("fab-mark");
    const bss = IC.Workshop.linkedJob(j.bssFolder), draws = bss ? (bss.files || []).filter((f) => f.category === "Drawing") : [];
    // a mark's drawing: its own file (by name), else its sheet in a combined PDF once those have been read
    const pages = idxMem[j.wno] || {};
    const allMarks = j.lines.map((x) => x.mark);
    const dwg = (l) => { const f = drawingFor(l.mark, draws, allMarks); if (f) return { f, page: 0 }; const c = pages[String(l.mark).trim().toUpperCase()]; return c ? { f: c.f, page: c.page, of: c.of } : null; };
    const dwgHref = (d) => "#/view/" + encodeURIComponent(j.bssFolder) + "/" + encodeURIComponent(d.f.path) + (d.page ? "?page=" + d.page : "");
    const dwgName = (d) => d.f.name.replace(/\.pdf$/i, "") + (d.page ? ", sheet " + d.page + " of " + d.of : "");
    const withDwg = j.lines.filter(dwg).length;
    const F = [["all", "All"], ["fabricated", "To fabricate"], ["welded", "To weld"], ["checked", "To check"], ["loaded", "To load"]];
    filter = F.some((x) => x[0] === filter) ? filter : "all";
    const shown = j.lines.filter((l) => filter === "all" || room(l, t.done[l.key], filter) > 0);
    const btn = (l, [s, name, letter]) => {
      const d = t.done[l.key][s], r = room(l, t.done[l.key], s), full = d === l.qty;
      return '<button type="button" class="fab-b' + (full ? " done" : d ? " part" : "") + '" data-key="' + esc(l.key) + '" data-stage="' + s + '"' + (!full && !r ? " disabled" : "") + ' aria-label="' + esc(name + " " + d + " of " + l.qty) + '">' +
        "<b>" + letter + "</b><span>" + (full ? "✓" : l.qty > 1 ? d + "/" + l.qty : "") + "</span></button>";
    };
    $("main").innerHTML = '<div class="card"><b>' + jobSub(j) + "</b>" + (p.ready ? ' <span class="pill ok">Ready for dispatch</span>' : "") +
      '<div class="small">' + esc([j.bssJob ? "BSS job " + j.bssJob : "", j.fabIssue, j.exc, j.requiredOn ? "required " + fmtDay(IC.parseDate(j.requiredOn)) : ""].filter(Boolean).join(" · ")) + "</div>" +
      '<div class="small">' + esc((j.list || "QA list") + " · " + p.pcs + " pieces · " + tonnes(p.kg)) + "</div>" + STAGES.map(([s, name]) => bar(name, p[s])).join("") + "</div>" +
      (can("ws-hours") ? '<button class="btn block" id="fabHours">Book hours to this job</button>' : "") +
      (draws.length ? '<details class="fab-docs"><summary>Fabrication details (' + draws.length + " drawings" + (withDwg < j.lines.length ? "; " + (j.lines.length - withDwg) + " assemblies have no drawing of their own" : "") + ")</summary>" + draws.map((f) => '<a class="doc-link" href="#/view/' + encodeURIComponent(j.bssFolder) + "/" + encodeURIComponent(f.path) + '">' + esc(f.name) + "</a>").join("") + "</details>" : "") +
      '<div class="chips fab-filter">' + F.map(([k, n]) => '<a class="pill' + (k === filter ? " on" : "") + '" href="#/workshop/' + encodeURIComponent(wno) + "/" + k + '">' + n + "</a>").join("") + "</div>" +
      '<input type="search" id="fabSearch" class="fab-search" placeholder="Search mark or section" aria-label="Search assemblies" autocomplete="off" autocapitalize="characters" value="' + esc(search[wno] || "") + '">' +
      (mark && filter !== "all" && shown.length ? '<button class="btn block" id="fabAll"></button>' : "") +
      '<div class="fab-key small">F fabricated · W welded · C checked · L loaded. Checked is marked by someone other than the welder.</div>' +
      (shown.length ? shown.map((l) => { const f = dwg(l); return '<div class="fab-line" data-key="' + esc(l.key) + '"><div class="fab-line-t">' + (f ? '<a class="fab-mark" href="' + dwgHref(f) + '" aria-label="Open the drawing for ' + esc(l.mark) + " (" + esc(dwgName(f)) + ')"><b>' + esc(l.mark) + "</b>" + ICON_DWG + "</a>" : "<b>" + esc(l.mark) + "</b>") + (l.qty > 1 ? "<b> ×" + l.qty + "</b>" : "") + '<span class="small"> ' + esc([l.section, l.length ? l.length + " mm" : "", l.kg ? tonnes(l.kg) + (l.qty > 1 ? " each" : "") : "", l.finish].filter(Boolean).join(" · ")) + "</span></div>" +
        '<div class="fab-bs">' + STAGES.map((s) => btn(l, s)).join("") + "</div></div>"; }).join("") : '<div class="empty small">Nothing left ' + esc(LABEL[filter] ? "to mark as " + LABEL[filter].toLowerCase() : "") + ".</div>") + '<div class="empty small" id="fabNone" hidden>No assembly matches the search.</div>';

    // search box: every word typed must be in the mark, section or finish; "Mark all shown" follows what is in view
    const hit = (l) => { const q = (search[wno] || "").toLowerCase().split(/\s+/).filter(Boolean), txt = (l.mark + " " + (l.section || "") + " " + (l.finish || "")).toLowerCase(); return q.every((w) => txt.includes(w)); };
    const inView = () => shown.filter(hit);
    const applySearch = () => {
      const marks = new Set(inView().map((l) => l.key));
      $("main").querySelectorAll(".fab-line").forEach((el) => { el.hidden = !marks.has(el.dataset.key); });
      if ($("fabNone")) $("fabNone").hidden = !shown.length || marks.size > 0;
      if ($("fabAll")) { $("fabAll").hidden = !marks.size; $("fabAll").textContent = "Mark all " + marks.size + " shown as " + LABEL[filter].toLowerCase(); }
    };
    if ($("fabHours")) $("fabHours").onclick = () => IC.WsHours.bookSheet(IC.isoDate(new Date()), (Data.profile || {}).email, () => toast("Booked: see My hours"), j.wno);
    $("fabSearch").oninput = () => { search[wno] = $("fabSearch").value; applySearch(); };
    const missing = j.lines.filter((l) => !dwg(l)).map((l) => String(l.mark).trim().toUpperCase());
    if (missing.length && draws.length && !idxMem[j.wno + ":busy"] && !(j.wno in idxMem && missing.every((m) => (idxMem[j.wno + ":tried"] || []).includes(m)))) {
      idxMem[j.wno + ":busy"] = true;
      combinedPages(j, draws, missing).then((found) => {
        idxMem[j.wno] = Object.assign({}, idxMem[j.wno] || {}, found);
        idxMem[j.wno + ":tried"] = missing;
        delete idxMem[j.wno + ":busy"];
        // redraw only if still on this job and something new was found; keep the scroll position
        if (Object.keys(found).length && location.hash.startsWith("#/workshop/" + encodeURIComponent(wno))) { const y = $("main").scrollTop; viewJob(wno, filter).then(() => { $("main").scrollTop = y; }); }
      }).catch(() => { delete idxMem[j.wno + ":busy"]; });
    }
    applySearch();

    // why this person can't mark this line at this stage ("" = they can)
    const blocked = (l, s) => (s === "checked" && (t.who[l.key].welded[me()] || 0) > 0 ? "Checked has to be marked by someone other than the person who welded it" : "");
    async function add(l, s, qty, undo) {
      await Data.save("fab", Object.assign({ wno: j.wno, mark: l.mark, line: l.key, stage: s, qty }, undo ? { undoOf: undo.id, undoUser: undo.user, undoUserName: undo.userName || "" } : {}));
    }
    async function after() {
      const now = progress(j, tally(j, await Data.list("fab", "team")));
      if (now.ready && !p.ready) { await Data.save("fabready", { wno: j.wno }); toast(j.wno + " is checked and loaded: the office has been told the load is ready for dispatch"); }
      viewJob(wno, filter);
    }
    $("main").querySelectorAll(".fab-b").forEach((b) => (b.onclick = () => {
      const l = j.lines.find((x) => x.key === b.dataset.key), s = b.dataset.stage, d = t.done[l.key][s], r = room(l, t.done[l.key], s), lastRec = t.last[l.key][s];
      const nextStage = STAGES[STAGES.findIndex((x) => x[0] === s) + 1], usedNext = nextStage ? t.done[l.key][nextStage[0]] : 0;
      const names = Object.keys(t.who[l.key][s]).filter((u) => t.who[l.key][s][u] > 0).map((u) => (log.find((x) => x.user === u) || {}).userName || u);
      // your own mark the same day; supervisors and managers (fab-correct) can take back anyone's
      const canUndo = lastRec && d - lastRec.qty >= usedNext && (can("fab-correct") || (mark && lastRec.user === me() && IC.sameDay(lastRec.createdAt, new Date())));
      const why = r ? blocked(l, s) : "";
      const sh = sheet("<h3>" + esc(l.mark) + " · " + LABEL[s] + "</h3><p>" + d + " of " + l.qty + " " + LABEL[s].toLowerCase() + (names.length ? " · " + esc(names.join(", ")) + (lastRec ? ", " + esc(fmtDay(lastRec.createdAt) + " " + fmtTime(lastRec.createdAt)) : "") : "") + "</p>" +
        (why ? '<p class="err">' + esc(why) + ".</p>" : "") +
        (dwg(l) ? '<a class="btn block" id="fabDwg" href="' + dwgHref(dwg(l)) + '">Open drawing ' + esc(dwgName(dwg(l))) + "</a>" : "") +
        (mark && r && !why ? (r > 1 ? '<label class="ff-l" for="fabQty">How many?</label><input id="fabQty" type="number" inputmode="numeric" min="1" max="' + r + '" value="' + r + '">' : "") + '<button class="btn primary block" id="fabGo">Mark ' + LABEL[s].toLowerCase() + "</button>" : "") +
        (canUndo ? '<button class="btn block" id="fabUndo">Undo ' + (lastRec.user === me() ? "my" : esc(lastRec.userName || "the") + "\u2019s") + " last mark (" + lastRec.qty + ")</button>" : "") + '<button class="btn block" id="fabNo">Close</button>');
      sh.q("#fabNo").onclick = () => sh.close();
      if (sh.q("#fabDwg")) sh.q("#fabDwg").addEventListener("click", () => sh.close());
      if (sh.q("#fabGo")) sh.q("#fabGo").onclick = async () => { const q = sh.q("#fabQty") ? Math.max(1, Math.min(r, Math.round(Number(sh.q("#fabQty").value) || 0))) : 1; sh.close(); await add(l, s, q); after(); };
      if (sh.q("#fabUndo")) sh.q("#fabUndo").onclick = async () => { sh.close(); await add(l, s, -lastRec.qty, lastRec); after(); };
    }));
    // the filter buttons swap the view without adding steps to Back: one press of Back returns to the screen before
    $("main").querySelectorAll(".fab-filter a").forEach((x) => (x.onclick = (e) => { e.preventDefault(); location.replace(x.getAttribute("href")); }));
    if ($("fabAll")) $("fabAll").onclick = async () => {
      let n = 0, skipped = 0;
      for (const l of inView()) { const r = room(l, t.done[l.key], filter); if (!r) continue; if (blocked(l, filter)) { skipped++; continue; } await add(l, filter, r); n++; }
      if (skipped) toast(skipped + " left for someone else to check (you welded them)");
      after();
    };
  }

  IC.route("board", () => viewBoard());
  IC.route("workshop", (args) => (args[0] ? viewJob(decodeURIComponent(args[0]), args[1] || "all") : viewDashboard()));

  // Home to-do for managers: loads that became ready in the last 3 days (the office then dispatches on Goods Out)
  IC.Workshop = {
    dashboardHtml,
    jobs,
    drawingFor,
    // the BSS job a workshop job is linked to: workshop staff may open its drawings (and nothing else of the job)
    linkedJob(folder) { return folder && jobs().some((w) => w.bssFolder === folder) ? ((S.manifest && S.manifest.jobs) || []).find((x) => x.folder === folder) || null : null; },
    async readyTodos() {
      const log = await Data.list("fab", "team"), since = Date.now() - 3 * 864e5, flags = await Data.list("fabready", "team");
      return jobs().filter((j) => progress(j, tally(j, log)).ready && flags.some((f) => f.wno === j.wno && new Date(f.createdAt).getTime() >= since));
    }
  };
})();
