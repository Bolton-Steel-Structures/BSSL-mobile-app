/* iCONSTRUCTE Site: home screen, jobs and drawings, navigation and start-up.
 * Drawings: reads site-manifest.json and the issued files from the "Site Drawings" SharePoint library (filled by
 * iCONSTRUCTE's Site Issue button). Shows only live jobs where the operative is on the site team. Offline copies are
 * kept on the phone and deleted automatically when a file is superseded or withdrawn.
 */
(function () {
  "use strict";
  const { CFG, DEMO, LS, SAMPLES, can, roleOf, $, esc, fmtDate, fmtDay, Store, Src, Data, S, myJobs, myWeek, jobByFolder, status, setBar, sheet, toast } = IC;
  const fileKey = (f) => f.path + "|" + f.issued;
  const D = { viewed: LS.get("viewed", {}), offlineJobs: LS.get("offlineJobs", []), saved: new Set(), loading: false };

  const ICON = {
    file: '<svg viewBox="0 0 24 24"><path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5M9 13h7M9 17h7"/></svg>',
    hs: '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg>',
    check: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 12 3 3 5-6"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5"/></svg>',
    jobs: '<svg viewBox="0 0 24 24"><path d="M3 7h18v13H3z"/><path d="M8 7V4h8v3M3 12h18"/></svg>',
    forms: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v3h6V3M8.5 11h7M8.5 15h7"/></svg>',
    leave: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/></svg>',
    money: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    card: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.5 1.7-2.2 3-2.2s2.4.7 3 2.2M14 10h4M14 13h3"/></svg>',
    team: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c.8-3.4 3.2-5.2 6-5.2s5.2 1.8 6 5.2"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.6c2.4.2 4.2 1.8 5 5"/></svg>'
  };
  IC.ICON = ICON;

  // ---------------------------------------------------------------- drawings data
  const isNew = (f) => (Date.now() - new Date(f.issued).getTime()) < CFG.newDays * 864e5 && D.viewed[f.path] !== f.issued;

  async function refresh() {
    if (D.loading || !S.user) return;
    D.loading = true; $("btnRefresh").classList.add("spin");
    try {
      const m = await Src.manifest();
      S.manifest = m; LS.set("manifest", m); LS.set("fetchedAt", new Date().toISOString());
      await syncOffline();
      status(null);
    } catch (e) {
      console.warn(e);
      const at = LS.get("fetchedAt", null);
      status(navigator.onLine === false || !e.status
        ? "No signal. Showing drawings as last checked" + (at ? " on " + fmtDate(at) + " " + new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "") + ". Forms and check-ins are kept on the phone and sent when you have signal."
        : "Couldn't check for updates (" + (e.status || "error") + "). Showing the last copy.");
    } finally {
      await Data.pull(); await Data.flush();
      D.loading = false; $("btnRefresh").classList.remove("spin");
      // only redraw list screens, never a form someone is filling in
      if (["", "jobs", "job"].includes(location.hash.replace(/^#\/?/, "").split("/")[0])) route();
    }
  }

  async function syncOffline() {
    const jobs = IC.viewableJobs(), wanted = new Map();
    jobs.forEach((j) => (j.files || []).forEach((f) => wanted.set(fileKey(f), { f, j })));
    for (const k of await Store.keys()) if (!wanted.has(k)) await Store.del(k);
    D.offlineJobs = D.offlineJobs.filter((folder) => jobs.some((j) => j.folder === folder)); LS.set("offlineJobs", D.offlineJobs);
    const have = new Set(await Store.keys());
    for (const [k, v] of wanted) {
      if (!D.offlineJobs.includes(v.j.folder)) continue;
      // HC2.19: a saved copy whose size doesn't match the issued file is replaced, never shown
      if (have.has(k) && v.f.size) { const cur = await Store.get(k); if (cur && cur.blob && cur.blob.size !== v.f.size) { await Store.del(k); have.delete(k); } }
      if (!have.has(k)) {
        try {
          const blob = await Src.blob(v.f.path);
          if (v.f.size && blob.size !== v.f.size) throw new Error("incomplete download (" + blob.size + " of " + v.f.size + " bytes)");
          await Store.put({ key: k, path: v.f.path, issued: v.f.issued, blob, savedAt: Date.now() });
        } catch (e) { console.warn("offline save failed", v.f.path, e); }
      }
    }
    D.saved = new Set(await Store.keys());
  }

  // ---------------------------------------------------------------- home
  async function viewHome() {
    const p = Data.profile || {}, h = new Date().getHours();
    setBar((h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening") + ", " + String(p.name || S.user.name).split(" ")[0], fmtDay(new Date()), false);
    const tile = (f, href, icon, title, sub) => (can(f) ? '<a class="tile" href="' + href + '">' + icon + "<b>" + title + "</b><span>" + sub + "</span></a>" : "");
    const anyForm = IC.Forms.templates.some((t) => t.id !== "rams" && !t.retired && can("form:" + t.id));
    $("main").innerHTML = (can("time") ? '<div class="card" id="timeCard"></div>' : "") + '<div id="myweek"></div>' + '<div id="todo"></div>' +
      '<div class="tiles">' +
      tile("manager", "#/manager", ICON.team, "Manager tools", "Approvals, team, who's on site") +
      tile("drawings", "#/jobs", ICON.jobs, can("all-jobs") ? "Projects" : "Drawings", can("all-jobs") ? "Live projects and packages" : "My jobs") +
      (anyForm ? '<a class="tile" href="#/forms">' + ICON.hs + "<b>" + "Safety" + "</b><span>" + (can("form:toolbox") ? (can("rams") ? "RAMS, toolbox talks, checks" : "Toolbox talks, checks") : "POWRA, near miss, report a problem") + "</span></a>" : "") +
      tile("qa", "#/qa", ICON.check, "QA", "Quality records by job") +
      tile("leave", "#/leave", ICON.leave, "Holidays", "Request and calendar") +
      tile("expenses", "#/expenses", ICON.money, "Expenses", "Claims and receipts") +
      tile("time", "#/time", ICON.clock, "Timesheet", "Hours this week") +
      tile("week", "#/week", ICON.jobs, "This week", can("team-week") ? "Me and the team" : can("crew") ? "My sites and who's with me" : "Where I'm working") +
      tile("cards", "#/cards", ICON.card, "My cards", "CSCS, IPAF, PASMA …") + "</div>";
    if ($("timeCard")) IC.Time.card($("timeCard"));
    // My week: where the labour planner has me for the next 7 days (W2)
    const in6 = new Date(); in6.setDate(in6.getDate() + 6); const week = can("time") ? myWeek().filter((a) => a.date <= IC.isoDate(in6)) : [];
    if (week.length && $("myweek")) {
      $("myweek").innerHTML = '<div class="section-h">My week <a href="#/week" style="float:right;font-weight:600">Details ›</a></div>' + week.map((a) => {
        const d = IC.parseDate(a.date), isToday = a.date === IC.isoDate(new Date()), job = jobByFolder(a.folder);
        if (a.off) return '<div class="todo info"><span class="ti">' + ICON.leave + "</span><span><b>" + (isToday ? "Today" : esc(fmtDay(d))) + ': Off</b><span class="small">On the planner as off</span></span></div>';
        return '<a class="todo' + (isToday ? "" : " info") + '"' + (job ? ' href="#/job/' + encodeURIComponent(a.folder) + '"' : "") + '><span class="ti">' + ICON.jobs + "</span><span><b>" + (isToday ? "Today" : esc(fmtDay(d))) + ": " + esc(a.jobNumber + (a.site ? " · " + a.site : "")) + '</b><span class="small">' + (a.start ? "Start " + esc(a.start) : "Start time TBC") + (a.workingAway ? " · working away" : "") + (a.description ? " · " + esc(a.description) : "") + "</span></span>" + (job ? "›" : "") + "</a>";
      }).join("");
    }
    // things to do
    const todo = [];
    // RAMS to sign: only for the site you're on today (Liam, 20 Nov: people can be reallocated before later days), i.e.
    // today's planner allocation and the job you're checked in at
    const todaySites = await sitesToday();
    for (const j of can("rams") ? myJobs().filter((x) => todaySites.has(x.folder)) : []) {
      const r = await IC.Forms.ramsStatus(j);
      for (const d of r.unsigned || []) todo.push('<a class="todo" href="#/form-new/rams/' + encodeURIComponent(j.folder) + "/" + encodeURIComponent(d.file.path) + '"><span class="ti safety">' + ICON.hs + "</span><span><b>Sign the " + esc(d.kind) + " for " + esc(j.jobNumber) + '</b><span class="small">' + esc(d.file.name) + "</span></span>›</a>");
    }
    // POWRA every day (Liam, 20 Nov): supervisors carry one out each working day on the site they're on; the to-do stays
    // until they've submitted one for that job today
    if (roleOf(Data.profile) === "Supervisor" && can("form:powra")) {
      const mineToday = (await Data.list("forms")).filter((f) => f.templateId === "powra" && f.status !== "draft" && IC.sameDay(f.submittedAt || f.updatedAt, new Date()));
      for (const j of myJobs().filter((x) => todaySites.has(x.folder) && !mineToday.some((f) => f.jobFolder === x.folder)))
        todo.push('<a class="todo" href="#/form-new/powra/' + encodeURIComponent(j.folder) + '"><span class="ti safety">' + ICON.hs + "</span><span><b>Today's POWRA for " + esc(j.jobNumber) + '</b><span class="small">' + esc(j.site || "") + " · before work starts</span></span>›</a>");
    }
    const drafts = (await Data.list("forms")).filter((f) => f.status === "draft").length;
    if (drafts) todo.push('<a class="todo" href="#/forms"><span class="ti">' + ICON.forms + "</span><span><b>" + drafts + " form" + (drafts > 1 ? "s" : "") + ' not finished</b><span class="small">Saved as drafts</span></span>›</a>');
    const myDue = !can("cards") ? [] : (await Data.list("cards")).filter((c) => IC.Cards.live(c) && (IC.Cards.state(c).days ?? 999) <= IC.Cards.SOON_DAYS);
    if (myDue.length) todo.push('<a class="todo" href="#/cards"><span class="ti">' + ICON.card + "</span><span><b>" + esc(myDue.map(IC.Cards.name).join(", ")) + (myDue.length > 1 ? " cards" : " card") + (myDue.some((c) => IC.Cards.state(c).days < 0) ? " out of date" : " expiring") + '</b><span class="small">' + esc(IC.Cards.state(myDue[0]).label) + "</span></span>›</a>");
    if (p.isManager) {
      const l = await IC.Leave.pendingForManager(), e = await IC.Expenses.pendingForManager();
      if (l) todo.push('<a class="todo" href="#/leave/team"><span class="ti">' + ICON.leave + "</span><span><b>" + l + " holiday request" + (l > 1 ? "s" : "") + ' to review</b><span class="small">Team calendar</span></span>›</a>');
      const late = await IC.Manager.lateCheckIns();
      if (late.length) todo.push('<a class="todo alert-row" href="#/manager/live"><span class="ti">' + ICON.clock + "</span><span><b>" + late.length + " not checked in by " + esc(late.by) + '</b><span class="small">' + esc(late.map((x) => x.p.name).join(", ")) + "</span></span>›</a>");
      if (e) todo.push('<a class="todo" href="#/expenses/team"><span class="ti">' + ICON.money + "</span><span><b>" + e + " expense claim" + (e > 1 ? "s" : "") + ' to approve</b></span>›</a>');
    }
    if (Data.pending) todo.push('<div class="todo info"><span class="ti">' + ICON.clock + "</span><span><b>" + Data.pending + ' item(s) waiting to send</b><span class="small">They\'ll go when you have signal</span></span></div>');
    if ($("todo")) $("todo").innerHTML = todo.length ? '<div class="section-h">To do</div>' + todo.join("") : "";
  }

  // ---------------------------------------------------------------- jobs and drawings
  // Managers (feature all-jobs; Liam 20 Nov): every live project, grouped by project number (the part before "/"),
  // "My projects" (where they're the job card's PM) first; tap a project for its packages of work.
  const projectOf = (j) => String(j.jobNumber || "").split("/")[0].trim();
  function viewProjects(args) {
    const all = IC.viewableJobs(), me = new Set((S.user && S.user.emails) || []);
    if (!S.manifest) { $("main").innerHTML = '<div class="empty">Loading…</div>'; return; }
    const groups = new Map();
    all.forEach((j) => { const k = projectOf(j); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(j); });
    const mineOnly = (args[0] || "") !== "all";
    let keys = [...groups.keys()].sort();
    const isMine = (k) => groups.get(k).some((j) => me.has(String(j.pm || "").toLowerCase()));
    const myCount = keys.filter(isMine).length;
    if (mineOnly) keys = keys.filter(isMine);
    setBar("Projects", (mineOnly ? myCount + " of mine" : groups.size + " live"), false);
    $("main").innerHTML = '<div class="tabs"><a' + (mineOnly ? ' class="on"' : "") + ' href="#/jobs">My projects</a><a' + (mineOnly ? "" : ' class="on"') + ' href="#/jobs/all">All live</a></div>' +
      (keys.length ? keys.map((k) => {
        const js = groups.get(k).sort((a, b) => String(a.jobNumber).localeCompare(String(b.jobNumber))), f = js[0];
        const dn = js.reduce((t, j) => t + (j.files || []).filter((x) => x.category !== "H&S").length, 0), n = js.reduce((t, j) => t + (j.files || []).filter(isNew).length, 0);
        return '<button class="card" data-project="' + esc(k) + '"><div class="card-top"><span class="job-no">' + esc(k) + "</span></div>" +
          '<div class="job-site">' + esc(f.site || f.customer || "") + "</div>" +
          '<div class="job-meta">' + esc(f.customer || "") + "</div>" +
          '<div class="pills"><span class="pill">' + js.length + (js.length === 1 ? " package" : " packages") + '</span><span class="pill">' + dn + (dn === 1 ? " drawing" : " drawings") + "</span>" + (n ? '<span class="pill new">' + n + " new</span>" : "") + "</div></button>";
      }).join("") : '<div class="empty small">' + (mineOnly ? 'No live projects with you as project manager. <a href="#/jobs/all">See all live projects</a>.' : "No live projects.") + "</div>");
    document.querySelectorAll("[data-project]").forEach((b) => (b.onclick = () => (location.hash = "#/project/" + encodeURIComponent(b.dataset.project))));
  }

  function viewProject(args) {
    const k = decodeURIComponent(args[0] || ""), js = IC.viewableJobs().filter((j) => projectOf(j) === k).sort((a, b) => String(a.jobNumber).localeCompare(String(b.jobNumber)));
    if (!js.length) { location.hash = "#/jobs"; return; }
    setBar("Project " + k, js[0].site || js[0].customer || "", true);
    $("main").innerHTML = '<div class="section-h">Packages of work (' + js.length + ")</div>" + js.map(jobCard).join("");
    document.querySelectorAll("[data-job]").forEach((b) => (b.onclick = () => (location.hash = "#/job/" + encodeURIComponent(b.dataset.job))));
  }

  function jobCard(j) {
    const files = j.files || [], n = files.filter(isNew).length, off = D.offlineJobs.includes(j.folder);
    const dn = files.filter((f) => f.category !== "H&S").length;
    return '<button class="card" data-job="' + esc(j.folder) + '"><div class="card-top"><span class="job-no">' + esc(j.jobNumber) + "</span></div>" +
      '<div class="job-site">' + esc(j.description || j.site || j.customer || "") + "</div>" +
      '<div class="job-meta">' + esc([j.site, j.customer].filter(Boolean).join(" · ")) + "</div>" +
      '<div class="pills"><span class="pill">' + dn + (dn === 1 ? " drawing" : " drawings") + "</span>" +
      (files.some((f) => f.category === "H&S") ? '<span class="pill">RAMS / H&amp;S</span>' : "") +
      (n ? '<span class="pill new">' + n + " new</span>" : "") + (off ? '<span class="pill ok">Saved offline</span>' : "") + "</div></button>";
  }

  // Which of my jobs to show (Liam, 20 Nov): operatives the job they're on today; supervisors their current and recent
  // jobs (this week on the planner, or checked in at in the last 14 days)
  async function sitesToday() {
    const today = IC.isoDate(new Date()), set = new Set(myWeek().filter((a) => a.date === today && !a.off && a.folder).map((a) => a.folder));
    try { const ps = IC.Time.pairs(await IC.Time.entries()), open = ps.find((p) => p.in && !p.out && IC.sameDay(p.in.at, new Date())); if (open && open.in.jobFolder) set.add(open.in.jobFolder); } catch (e) { /* no time records */ }
    return set;
  }
  async function sitesRecent() {
    const set = await sitesToday(), mine = new Set(S.user.emails), from = new Date(); from.setDate(from.getDate() - 14);
    ((S.manifest && S.manifest.allocations) || []).forEach((a) => { if (mine.has(String(a.email).toLowerCase()) && !a.off && a.folder) set.add(a.folder); });
    try { (await IC.Time.entries()).forEach((e) => { if (e.jobFolder && new Date(e.at) >= from) set.add(e.jobFolder); }); } catch (e) { /* no time records */ }
    return set;
  }

  async function viewJobs(args) {
    if (can("all-jobs")) return viewProjects(args || []);
    const supervisor = can("crew");
    setBar(supervisor ? "My jobs" : "Today's job", S.user ? S.user.name : "", false);
    if (!S.manifest) { $("main").innerHTML = '<div class="empty">Loading…</div>'; return; }
    const keep = supervisor ? await sitesRecent() : await sitesToday();
    const jobs = myJobs().filter((j) => keep.has(j.folder)).sort((a, b) => String(a.jobNumber).localeCompare(String(b.jobNumber)));
    if (!jobs.length) {
      $("main").innerHTML = '<div class="empty"><h2>' + (supervisor ? "No current jobs" : "No job today") + "</h2></div>";
      return;
    }
    if (false) {
      $("main").innerHTML = '<div class="empty"><h2>No jobs yet</h2><p>You are not on the site team for any live job. Ask the office to add you to the job in iCONSTRUCTE (Job card &gt; Site Issue &gt; Site Team).</p></div>';
      return;
    }
    $("main").innerHTML = jobs.map((j) => {
      const files = j.files || [], n = files.filter(isNew).length, off = D.offlineJobs.includes(j.folder);
      const dn = files.filter((f) => f.category !== "H&S").length;
      return '<button class="card" data-job="' + esc(j.folder) + '"><div class="card-top"><span class="job-no">' + esc(j.jobNumber) + "</span></div>" +
        '<div class="job-site">' + esc(j.site || j.customer || "") + "</div>" +
        '<div class="job-meta">' + esc([j.customer, j.description].filter(Boolean).join(" · ")) + "</div>" +
        '<div class="pills"><span class="pill">' + dn + (dn === 1 ? " drawing" : " drawings") + "</span>" +
        (files.some((f) => f.category === "H&S") ? '<span class="pill">RAMS / H&amp;S</span>' : "") +
        (n ? '<span class="pill new">' + n + " new</span>" : "") + (off ? '<span class="pill ok">Saved offline</span>' : "") + "</div></button>";
    }).join("");
    document.querySelectorAll("[data-job]").forEach((b) => (b.onclick = () => (location.hash = "#/job/" + encodeURIComponent(b.dataset.job))));
  }

  function fileRow(f) {
    const saved = D.saved.has(fileKey(f));
    return '<button class="file" data-path="' + esc(f.path) + '"><span class="file-ic">' + (f.category === "H&S" ? ICON.hs : ICON.file) + "</span>" +
      '<span class="file-body"><span class="file-name">' + esc(f.name) + '</span><div class="file-meta">Issued ' + esc(fmtDate(f.issued)) + "</div></span>" +
      '<span class="file-flags">' + (isNew(f) ? '<span class="pill new">New</span>' : "") + (saved ? '<span class="pill ok">Offline</span>' : "") + "</span></button>";
  }

  // Job page (Liam, 20 Nov): the job's details, then a tile for each kind of site document; each opens its own page.
  async function viewJob(folder, section) {
    const j = jobByFolder(folder);
    if (!j) { location.hash = "#/jobs"; return; }
    const files = (j.files || []).slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const dr = files.filter((f) => f.category !== "H&S"), hs = files.filter((f) => f.category === "H&S");
    const off = D.offlineJobs.includes(j.folder), rams = await IC.Forms.ramsStatus(j);
    const f = encodeURIComponent(j.folder);
    const bindFiles = () => document.querySelectorAll("[data-path]").forEach((b) => (b.onclick = () => (location.hash = "#/view/" + f + "/" + encodeURIComponent(b.dataset.path))));
    if (section === "drawings") {
      setBar("Drawings", j.jobNumber, true);
      $("main").innerHTML = dr.length ? dr.map(fileRow).join("") : '<div class="empty">No drawings issued yet.</div>';
      return bindFiles();
    }
    if (section === "rams") {
      setBar("RAMS & crane plan", j.jobNumber, true);
      // each document signed for on its own (RAMS, crane plan)
      $("main").innerHTML = hs.length ? rams.docs.map((d) => fileRow(d.file) + (can("rams") ? (d.signed ? '<div class="signed">✓ You signed the ' + esc(d.kind) + " on " + esc(fmtDate(d.signed.submittedAt)) + "</div>" : '<a class="btn go block" href="#/form-new/rams/' + f + "/" + encodeURIComponent(d.file.path) + '">Read &amp; sign the ' + esc(d.kind) + "</a>") : "")).join("") : '<div class="empty">No RAMS issued yet.</div>';
      return bindFiles();
    }
    if (section === "model") {
      setBar("3D model", j.jobNumber, true);
      $("main").innerHTML = (j.models || []).map((mo, i) => '<a class="tile-row" href="#/model/' + f + "/" + i + '"><span class="ti">' + ICON.jobs + '</span><span><b>' + esc(mo.name.replace(/\.ifc$/i, "")) + '</b><span class="small">' + (mo.issued ? "Issued " + esc(fmtDate(mo.issued)) : "") + "</span></span>›</a>").join("");
      return;
    }
    if (section === "forms") {
      setBar("Forms", j.jobNumber, true);
      $("main").innerHTML = [["toolbox", "Toolbox talk", "#/toolbox/"], ["powra", "Point of work risk assessment", "#/form-new/powra/"], ["daywork", "Day work sheet", "#/form-new/daywork/"], ["nearmiss", "Near miss / hazard", "#/form-new/nearmiss/"], ["ncr", "Report a problem (NCR)", "#/form-new/ncr/"]]
        .filter(([id]) => can("form:" + id) && !(can("qa") && IC.Forms.QA_FORMS.includes(id))).map(([id, t, h]) => '<a class="tile-row" href="' + h + f + '"><span class="ti safety">' + ICON.hs + "</span><span><b>" + esc(t) + "</b></span>›</a>").join("");
      return;
    }
    setBar(j.jobNumber, j.site || j.customer, true);
    // site location from the job card: its Google Maps link (and the position, when the link contains one)
    const safeLink = j.mapLink && /^https?:\/\//i.test(j.mapLink) ? j.mapLink : "";
    const dirUrl = j.lat != null ? "https://www.google.com/maps/dir/?api=1&destination=" + j.lat + "," + j.lng : safeLink;
    const loc = dirUrl ? '<div class="loc-row"><span>📍 ' + esc(j.site || "Site") + '</span><a class="btn sm" href="' + esc(dirUrl) + '" target="_blank" rel="noopener">Directions</a></div>' : "";
    const nNew = dr.filter(isNew).length;
    const t = (show, href, icon, title, sub, badge) => (show ? '<a class="tile" href="' + href + '">' + icon + "<b>" + title + "</b><span>" + sub + "</span>" + (badge ? '<em class="tile-badge">' + badge + "</em>" : "") + "</a>" : "");
    const models = j.models || [];
    $("main").innerHTML = loc +
      '<div class="row"><button class="btn ' + (off ? "" : "primary") + '" id="btnOffline">' + (off ? "Saved offline ✓" : "Save for offline") + "</button></div>" +
      '<div class="tiles">' +
      t(true, "#/job/" + f + "/drawings", ICON.file, "Drawings", dr.length + (dr.length === 1 ? " drawing" : " drawings"), nNew ? nNew + " new" : "") +
      t(models.length && can("model"), models.length === 1 ? "#/model/" + f + "/0" : "#/job/" + f + "/model", ICON.jobs, "3D model", can("erect") ? "View and mark erected" : "View the model") +
      t(hs.length || can("rams"), "#/job/" + f + "/rams", ICON.hs, "RAMS", hs.length ? (can("rams") ? (rams.signed ? "Signed" : rams.unsigned.length + " to sign") : hs.length + " document" + (hs.length > 1 ? "s" : "")) : "None issued", can("rams") && rams.needed && !rams.signed ? "Sign" : "") +
      t(can("form:plant") && (j.plant || []).length, "#/plant/" + f, ICON.check, "Plant checks", (j.plant || []).length + " machine" + ((j.plant || []).length === 1 ? "" : "s")) +
      t(can("qa"), "#/qa/" + f, ICON.check, "QA", "Handover, audit, snags") +
      t(true, "#/job/" + f + "/forms", ICON.forms, "Forms", "Toolbox, POWRA, day work") +
      "</div>";
    $("btnOffline").onclick = () => toggleOffline(j);
  }

  async function toggleOffline(j) {
    if (D.offlineJobs.includes(j.folder)) {
      D.offlineJobs = D.offlineJobs.filter((x) => x !== j.folder); LS.set("offlineJobs", D.offlineJobs);
      for (const f of j.files || []) await Store.del(fileKey(f));
      D.saved = new Set(await Store.keys()); route(); return;
    }
    const files = j.files || [];
    const sh = sheet("<h3>Saving " + esc(j.jobNumber) + " for offline</h3><p>Downloading " + files.length + ' file(s). Keep the app open.</p><div class="progress"><div id="prog"></div></div><div class="small" id="progTxt"></div>');
    let done = 0, failed = 0;
    for (const f of files) {
      if (!D.saved.has(fileKey(f))) { try { await Store.put({ key: fileKey(f), path: f.path, issued: f.issued, blob: await Src.blob(f.path), savedAt: Date.now() }); } catch (e) { failed++; } }
      done++; $("prog").style.width = Math.round((100 * done) / files.length) + "%"; $("progTxt").textContent = done + " of " + files.length;
    }
    D.offlineJobs.push(j.folder); LS.set("offlineJobs", D.offlineJobs);
    D.saved = new Set(await Store.keys()); sh.close();
    if (failed) status(failed + " file(s) could not be saved. Try again with a better signal.");
    route();
  }

  // ---------------------------------------------------------------- viewer
  let viewerState = null;
  // the office's toolbox talks (manifest toolboxTalks) open in the same viewer as drawings
  const talkLibrary = () => ({ jobNumber: "Toolbox talk", folder: "_toolbox", files: ((S.manifest && S.manifest.toolboxTalks) || []).map((t) => ({ name: t.title, path: t.path, issued: t.issued })) });
  async function viewFile(folder, path) {
    const j = folder === "_toolbox" ? talkLibrary() : jobByFolder(folder), f = j && (j.files || []).find((x) => x.path === path);
    if (!f) { location.hash = j ? "#/job/" + encodeURIComponent(folder) : "#/jobs"; return; }
    $("main").innerHTML = "";
    const v = document.createElement("div"); v.className = "viewer";
    v.innerHTML = '<header class="bar"><button class="icon-btn" id="vBack" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15.5 4.5 8 12l7.5 7.5"/></svg></button>' +
      '<div class="bar-title"><div class="bar-main">' + esc(f.name) + '</div><div class="bar-sub">' + esc(j.jobNumber + " · issued " + fmtDate(f.issued)) + "</div></div></header>" +
      '<div class="vbanner" id="vBanner" hidden></div><div class="vscroll" id="vScroll"><div class="vpages" id="vPages"><div class="vmsg">Opening…</div></div></div>' +
      '<div class="vtools"><button class="btn" id="zOut" aria-label="Zoom out">−</button><button class="btn" id="zFit">Fit</button><button class="btn" id="zIn" aria-label="Zoom in">+</button></div>';
    document.body.appendChild(v);
    v.querySelector("#vBack").onclick = () => (history.length > 1 ? history.back() : (location.hash = "#/job/" + encodeURIComponent(folder)));
    viewerState = { el: v, zoom: 1, pdf: null, img: null };
    const rec = await Store.get(fileKey(f)); let blob = rec && rec.blob; const fromOffline = !!blob;
    if (!blob) {
      try { blob = await Src.blob(f.path); } catch (e) {
        v.querySelector("#vPages").innerHTML = '<div class="vmsg">This drawing isn\'t saved on this device and there\'s no signal.<br><br>Use “Save for offline” on the job while you have signal.</div>'; return;
      }
    }
    if (fromOffline && navigator.onLine === false) { const b = v.querySelector("#vBanner"); b.hidden = false; b.textContent = "Offline copy, issued " + fmtDate(f.issued) + ". Check for updates when you have signal."; }
    D.viewed[f.path] = f.issued; LS.set("viewed", D.viewed);
    const isPdf = /\.pdf$/i.test(f.name) || blob.type === "application/pdf", isImg = /\.(png|jpe?g|gif|webp)$/i.test(f.name);
    const pages = v.querySelector("#vPages");
    if (isPdf) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
      try { viewerState.pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise; }
      catch (e) { pages.innerHTML = '<div class="vmsg">This PDF could not be opened.</div>'; return; }
      await renderPdf();
    } else if (isImg) {
      const img = new Image(); img.src = URL.createObjectURL(blob); viewerState.img = img; pages.innerHTML = ""; pages.appendChild(img); sizeImg();
    } else {
      pages.innerHTML = '<div class="vmsg">' + esc(f.name) + ' can\'t be shown in the app.<br><br><a class="btn primary" id="dl" download="' + esc(f.name) + '">Download</a></div>';
      pages.querySelector("#dl").href = URL.createObjectURL(blob);
    }
    const setZoom = (z) => { viewerState.zoom = Math.min(8, Math.max(0.5, z)); viewerState.pdf ? renderPdf() : sizeImg(); };
    v.querySelector("#zIn").onclick = () => setZoom(viewerState.zoom * 1.5);
    v.querySelector("#zOut").onclick = () => setZoom(viewerState.zoom / 1.5);
    v.querySelector("#zFit").onclick = () => setZoom(1);
    pinch(v.querySelector("#vScroll"), pages, (scale) => setZoom(viewerState.zoom * scale));
  }
  function sizeImg() { const s = viewerState; if (!s.img) return; const w = s.el.querySelector("#vScroll").clientWidth - 24; s.img.style.width = Math.round(w * s.zoom) + "px"; }
  let renderToken = 0;
  async function renderPdf() {
    const s = viewerState, my = ++renderToken, scroll = s.el.querySelector("#vScroll"), pages = s.el.querySelector("#vPages");
    const avail = scroll.clientWidth - 24, dpr = Math.min(window.devicePixelRatio || 1, 2);
    pages.style.transform = ""; pages.innerHTML = "";
    for (let n = 1; n <= s.pdf.numPages; n++) {
      if (my !== renderToken) return;
      const page = await s.pdf.getPage(n), base = page.getViewport({ scale: 1 });
      const cssScale = (avail / base.width) * s.zoom; let px = cssScale * dpr;
      const maxPx = 16e6; // stay under mobile canvas limits on large A0/A1 sheets
      if (base.width * base.height * px * px > maxPx) px = Math.sqrt(maxPx / (base.width * base.height));
      const vp = page.getViewport({ scale: px }), c = document.createElement("canvas");
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      c.style.width = Math.floor(base.width * cssScale) + "px"; c.style.height = Math.floor(base.height * cssScale) + "px";
      pages.appendChild(c);
      await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    }
  }
  function pinch(scroller, target, done) {
    let d0 = 0, scale = 1;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    scroller.addEventListener("touchstart", (e) => { if (e.touches.length === 2) { d0 = dist(e.touches); scale = 1; } }, { passive: true });
    scroller.addEventListener("touchmove", (e) => { if (e.touches.length === 2 && d0) { e.preventDefault(); scale = dist(e.touches) / d0; target.style.transform = "scale(" + scale + ")"; } }, { passive: false });
    scroller.addEventListener("touchend", (e) => { if (d0 && e.touches.length < 2) { d0 = 0; target.style.transform = ""; if (Math.abs(scale - 1) > 0.05) done(scale); } });
  }
  function closeViewer() { const v = document.querySelector(".viewer"); if (v) v.remove(); viewerState = null; renderToken++; }

  // ---------------------------------------------------------------- sign-in, account, navigation
  function viewSignIn() {
    setBar("iCONSTRUCTE Site", "", false); $("nav").hidden = true;
    $("main").innerHTML = '<div class="signin"><span class="logo-wrap"><img class="logo" src="icons/iconstructe-logo.png" alt="iCONSTRUCTE"></span><div class="company">BOLTON STEEL STRUCTURES</div><h1>Site app</h1>' +
      "<p>Sign in with your Bolton Steel Structures work account.</p>" +
      (DEMO ? '<p class="small">Demo: choose a sample login. Sample data only, nothing leaves this phone.</p>' +
        SAMPLES.map((u) => '<button class="btn block sample-login" data-sample="' + u.id + '"><b>' + esc(u.name) + '</b><span class="small">' + esc(u.role) + "</span></button>").join("")
        : '<button class="btn primary block" id="btnSignIn">Sign in</button>') + "</div>";
    if ($("btnSignIn")) $("btnSignIn").onclick = () => Src.signIn();
    document.querySelectorAll("[data-sample]").forEach((b) => (b.onclick = () => Src.signIn(b.dataset.sample)));
  }

  function accountSheet() {
    const p = Data.profile || {};
    const sh = sheet("<h3>" + esc(p.name || S.user.name) + "</h3><p>" + esc(S.user.emails[0]) + " · " + esc(roleOf(p)) + "</p>" +

      (p.isManager ? '<a class="btn block" href="#/manager" id="sMgrTools">Manager tools</a>' : "") +
      '<button class="btn block" id="sCheck">Check for updates</button>' + (DEMO ? '<button class="btn block" id="sReset">Demo: reset sample data</button>' : "") +
      '<button class="btn block" id="sOut">' + (DEMO ? "Switch sample login" : "Sign out") + "</button>" + '<button class="btn block" id="sClose">Close</button>');
    $("sCheck").onclick = () => { sh.close(); refresh(); };
    $("sClose").onclick = sh.close;
    if ($("sMgrTools")) $("sMgrTools").onclick = () => sh.close();
    if ($("sReset")) $("sReset").onclick = async () => { LS.set("demoSeeded", 0); await Data.loadProfile(S.user); sh.close(); toast("Sample data reset"); route(); };
    $("sOut").onclick = async () => {
      if (Data.pending && !(await IC.ask(Data.pending + " item(s) haven't been sent yet and will be lost. Sign out anyway?", "Sign out"))) return;
      for (const k of await Store.keys()) await Store.del(k);
      await Data.clearAll(); LS.set("offlineJobs", []); LS.set("user", null); LS.set("profile", null); Src.signOut();
    };
  }

  const NAV = [["", "Home", ICON.home, ["", "time", "manager", "cards", "card", "card-new"], ""], ["jobs", "Jobs", ICON.jobs, ["jobs", "job", "view", "project"], "drawings"], ["qa", "QA", ICON.check, ["qa", "snag"], "qa"], ["forms", "Forms", ICON.forms, ["forms", "form", "form-new"], "forms"],
    ["leave", "Holidays", ICON.leave, ["leave", "leave-new"], "leave"], ["expenses", "Expenses", ICON.money, ["expenses", "expense", "expense-new"], "expenses"]];
  const anyForm = () => IC.Forms.templates.some((t) => t.id !== "rams" && !t.retired && can("form:" + t.id));
  const allowed = (f) => !f || (f === "forms" ? anyForm() : can(f));
  function drawNav(name) {
    $("nav").hidden = false;
    $("nav").innerHTML = NAV.filter((n) => allowed(n[4])).map(([h, t, ic, names]) => '<a href="#/' + h + '" class="' + (names.includes(name) ? "on" : "") + '">' + ic + "<span>" + t + "</span></a>").join("");
  }
  // Which permission each screen needs (config.js roles). A screen the role doesn't have goes back to Home.
  function permitted(name, args) {
    if (["jobs", "job", "view", "project"].includes(name)) return can("drawings");
    if (["qa", "snag"].includes(name)) return can("qa");
    if (name === "forms") return anyForm();
    if (name === "form-new") return args[0] === "rams" ? can("rams") : can("form:" + args[0]);
    if (name === "toolbox") return can("form:toolbox");
    if (name === "plant") return can("form:plant");
    if (["leave", "leave-new"].includes(name)) return can("leave");
    if (["expenses", "expense", "expense-new"].includes(name)) return can("expenses");
    if (name === "time") return can("time");
    if (["cards", "card-new"].includes(name)) return can("cards");
    if (name === "manager") return can("manager");
    if (name === "week") return can("week");
    if (name === "model") return can("model");
    return true;
  }

  function route() {
    closeViewer(); window.scrollTo(0, 0);
    if (!S.user) { viewSignIn(); return; }
    const parts = location.hash.replace(/^#\/?/, "").split("/"), name = parts[0] || "", args = parts.slice(1);
    drawNav(name);
    $("sheet").hidden = true;
    if (!permitted(name, args)) { toast("That isn't part of your role in the app"); location.hash = "#/"; return; }
    if (name === "") viewHome();
    else if (name === "jobs") viewJobs(args).catch((e) => console.error(e));
    else if (name === "project" && args[0]) viewProject(args);
    else if (name === "job" && args[0]) viewJob(decodeURIComponent(args[0]), args[1] || "");
    else if (name === "view" && args[0]) viewFile(decodeURIComponent(args[0]), decodeURIComponent(args.slice(1).join("/")));
    else if (IC.routes[name]) Promise.resolve(IC.routes[name](args)).catch((e) => { console.error(e); $("main").innerHTML = '<div class="empty">Something went wrong: ' + esc(e.message) + "</div>"; });
    else location.hash = "#/";
  }
  IC.refreshView = route;

  async function start() {
    $("btnBack").onclick = () => (history.length > 1 ? history.back() : (location.hash = "#/"));
    $("btnRefresh").onclick = () => refresh();
    $("btnMenu").onclick = accountSheet;
    window.addEventListener("hashchange", route);
    window.addEventListener("online", () => refresh());
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refresh(); });
    if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
    try { D.saved = new Set(await Store.keys()); } catch (e) { /* storage blocked */ }
    IC.loadBankHolidays();

    let signedIn = false, initFailed = false;
    try { signedIn = await Src.init(); } catch (e) { console.warn(e); initFailed = true; }
    if (!signedIn && !initFailed) { S.user = null; LS.set("user", null); route(); return; }
    if (initFailed && S.user) status("Working offline. Sign-in will be checked when you have signal.");
    if (signedIn) { try { S.user = await Src.user(); LS.set("user", S.user); } catch (e) { console.warn(e); } }
    if (!S.user) { route(); return; }
    $("btnRefresh").hidden = false; $("btnMenu").hidden = false;
    await Data.loadProfile(S.user);
    if (!S.manifest) { try { S.manifest = await Src.manifest(); LS.set("manifest", S.manifest); } catch (e) { /* offline */ } }
    route();
    refresh();
  }

  start();
})();
