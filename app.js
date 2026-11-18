/* iCONSTRUCTE Site: home screen, jobs and drawings, navigation and start-up.
 * Drawings: reads site-manifest.json and the issued files from the "Site Drawings" SharePoint library (filled by
 * iCONSTRUCTE's Site Issue button). Shows only live jobs where the operative is on the site team. Offline copies are
 * kept on the phone and deleted automatically when a file is superseded or withdrawn.
 */
(function () {
  "use strict";
  const { CFG, DEMO, LS, $, esc, fmtDate, fmtDay, Store, Src, Data, S, myJobs, jobByFolder, status, setBar, sheet, toast } = IC;
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
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
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
    const jobs = myJobs(), wanted = new Map();
    jobs.forEach((j) => (j.files || []).forEach((f) => wanted.set(fileKey(f), { f, j })));
    for (const k of await Store.keys()) if (!wanted.has(k)) await Store.del(k);
    D.offlineJobs = D.offlineJobs.filter((folder) => jobs.some((j) => j.folder === folder)); LS.set("offlineJobs", D.offlineJobs);
    const have = new Set(await Store.keys());
    for (const [k, v] of wanted) {
      if (D.offlineJobs.includes(v.j.folder) && !have.has(k)) {
        try { await Store.put({ key: k, path: v.f.path, issued: v.f.issued, blob: await Src.blob(v.f.path), savedAt: Date.now() }); } catch (e) { console.warn("offline save failed", v.f.path, e); }
      }
    }
    D.saved = new Set(await Store.keys());
  }

  // ---------------------------------------------------------------- home
  async function viewHome() {
    const p = Data.profile || {}, h = new Date().getHours();
    setBar((h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening") + ", " + String(p.name || S.user.name).split(" ")[0], fmtDay(new Date()), false);
    $("main").innerHTML = '<div class="card" id="timeCard"></div><div id="todo"></div>' +
      '<div class="tiles">' +
      '<a class="tile" href="#/jobs">' + ICON.jobs + "<b>Drawings</b><span>My jobs</span></a>" +
      '<a class="tile" href="#/forms">' + ICON.hs + "<b>Safety</b><span>RAMS, toolbox talks, checks</span></a>" +
      '<a class="tile" href="#/qa">' + ICON.check + "<b>QA</b><span>Quality records by job</span></a>" +
      '<a class="tile" href="#/leave">' + ICON.leave + "<b>Holidays</b><span>Request and calendar</span></a>" +
      '<a class="tile" href="#/expenses">' + ICON.money + "<b>Expenses</b><span>Claims and receipts</span></a>" +
      '<a class="tile" href="#/time">' + ICON.clock + "<b>Timesheet</b><span>Hours this week</span></a></div>";
    IC.Time.card($("timeCard"));
    // things to do
    const todo = [];
    for (const j of myJobs()) {
      const r = await IC.Forms.ramsStatus(j);
      if (r.needed && !r.signed) todo.push('<a class="todo" href="#/form-new/rams/' + encodeURIComponent(j.folder) + '"><span class="ti safety">' + ICON.hs + "</span><span><b>Sign the RAMS for " + esc(j.jobNumber) + '</b><span class="small">' + esc(j.site || "") + " · new or updated RAMS</span></span>›</a>");
    }
    const drafts = (await Data.list("forms")).filter((f) => f.status === "draft").length;
    if (drafts) todo.push('<a class="todo" href="#/forms"><span class="ti">' + ICON.forms + "</span><span><b>" + drafts + " form" + (drafts > 1 ? "s" : "") + ' not finished</b><span class="small">Saved as drafts</span></span>›</a>');
    if (p.isManager) {
      const l = await IC.Leave.pendingForManager(), e = await IC.Expenses.pendingForManager();
      if (l) todo.push('<a class="todo" href="#/leave/team"><span class="ti">' + ICON.leave + "</span><span><b>" + l + " holiday request" + (l > 1 ? "s" : "") + ' to review</b><span class="small">Team calendar</span></span>›</a>');
      if (e) todo.push('<a class="todo" href="#/expenses/team"><span class="ti">' + ICON.money + "</span><span><b>" + e + " expense claim" + (e > 1 ? "s" : "") + ' to approve</b></span>›</a>');
    }
    if (Data.pending) todo.push('<div class="todo info"><span class="ti">' + ICON.clock + "</span><span><b>" + Data.pending + ' item(s) waiting to send</b><span class="small">They\'ll go when you have signal</span></span></div>');
    if ($("todo")) $("todo").innerHTML = todo.length ? '<div class="section-h">To do</div>' + todo.join("") : "";
  }

  // ---------------------------------------------------------------- jobs and drawings
  function viewJobs() {
    setBar("My jobs", S.user ? S.user.name : "", false);
    const jobs = myJobs().sort((a, b) => String(a.jobNumber).localeCompare(String(b.jobNumber)));
    if (!S.manifest) { $("main").innerHTML = '<div class="empty">Loading…</div>'; return; }
    if (!jobs.length) {
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

  async function viewJob(folder) {
    const j = jobByFolder(folder);
    if (!j) { location.hash = "#/jobs"; return; }
    setBar(j.jobNumber, j.site || j.customer, true);
    const files = (j.files || []).slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const dr = files.filter((f) => f.category !== "H&S"), hs = files.filter((f) => f.category === "H&S");
    const off = D.offlineJobs.includes(j.folder), rams = await IC.Forms.ramsStatus(j);
    const f = encodeURIComponent(j.folder);
    // site location from the job card (Google pin / coordinates / what3words)
    const loc = j.lat != null ? '<div class="loc-row"><span>📍 ' + Number(j.lat).toFixed(5) + ", " + Number(j.lng).toFixed(5) + (j.w3w ? " · ///" + esc(j.w3w) : "") + "</span>" +
        '<a class="btn sm" href="https://www.google.com/maps/dir/?api=1&destination=' + j.lat + "," + j.lng + '" target="_blank" rel="noopener">Directions</a>' +
        (j.w3w ? '<a class="btn sm" href="https://what3words.com/' + encodeURIComponent(j.w3w) + '" target="_blank" rel="noopener">what3words</a>' : "") + "</div>"
      : j.w3w ? '<div class="loc-row"><span>📍 ///' + esc(j.w3w) + '</span><a class="btn sm" href="https://what3words.com/' + encodeURIComponent(j.w3w) + '" target="_blank" rel="noopener">what3words</a></div>'
      : '<div class="loc-row small">No site location on the job card yet, so check-ins and photos can\'t show distance from site.</div>';
    $("main").innerHTML = loc +
      '<div class="row"><button class="btn ' + (off ? "" : "primary") + '" id="btnOffline">' + (off ? "Saved offline ✓" : "Save for offline") + "</button></div>" +
      (hs.length ? '<div class="section-h">RAMS &amp; crane plan</div>' + hs.map(fileRow).join("") +
        (rams.signed ? '<div class="signed">✓ You signed these on ' + esc(fmtDate(rams.signed.submittedAt)) + "</div>" : '<a class="btn go block" href="#/form-new/rams/' + f + '">Read &amp; sign the RAMS</a>') : "") +
      '<div class="section-h">Drawings (' + dr.length + ")</div>" + (dr.length ? dr.map(fileRow).join("") : '<div class="empty">No drawings issued yet.</div>') +
      '<div class="section-h">Forms for this job</div><div class="chips">' +
      [["toolbox", "Toolbox talk"], ["plant", "Plant check"], ["daywork", "Day work sheet"], ["erection", "Line, level & plumb"], ["bolting", "Bolting check"], ["ncr", "Report a problem (NCR)"], ["completion", "Handover certificate"]]
        .map(([id, t]) => '<a class="chip" href="#/form-new/' + id + "/" + f + '">' + esc(t) + "</a>").join("") + '<a class="chip" href="#/qa/' + f + '">QA for this job ›</a><a class="chip" href="#/forms">All forms ›</a></div>' +
      '<p class="small">Only the current issue of each drawing is shown. Superseded drawings are removed automatically, including offline copies.</p>';
    document.querySelectorAll("[data-path]").forEach((b) => (b.onclick = () => (location.hash = "#/view/" + f + "/" + encodeURIComponent(b.dataset.path))));
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
  async function viewFile(folder, path) {
    const j = jobByFolder(folder), f = j && (j.files || []).find((x) => x.path === path);
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
      '<button class="btn primary block" id="btnSignIn">Sign in</button>' + (DEMO ? '<p class="small" style="margin-top:16px">Demo mode: sample data, nothing leaves this phone.</p>' : "") + "</div>";
    $("btnSignIn").onclick = () => Src.signIn();
  }

  function accountSheet() {
    const p = Data.profile || {};
    const sh = sheet("<h3>" + esc(p.name || S.user.name) + "</h3><p>" + esc(S.user.emails[0]) + (p.role ? " · " + esc(p.role) : "") + "</p>" +
      (DEMO ? '<label class="confirm"><input type="checkbox" id="sMgr"' + (p.isManager ? " checked" : "") + "><span>Demo: show manager screens (approvals, team calendar)</span></label>" : "") +
      '<button class="btn block" id="sCheck">Check for updates</button>' + (DEMO ? '<button class="btn block" id="sReset">Demo: reset sample data</button>' : "") +
      '<button class="btn block" id="sOut">Sign out</button><button class="btn block" id="sClose">Close</button>');
    $("sCheck").onclick = () => { sh.close(); refresh(); };
    $("sClose").onclick = sh.close;
    if ($("sMgr")) $("sMgr").onchange = (e) => { LS.set("demoManager", e.target.checked); Data.profile.isManager = e.target.checked; LS.set("profile", Data.profile); sh.close(); route(); };
    if ($("sReset")) $("sReset").onclick = async () => { LS.set("demoSeeded", 0); await Data.loadProfile(S.user); sh.close(); toast("Sample data reset"); route(); };
    $("sOut").onclick = async () => {
      if (Data.pending && !(await IC.ask(Data.pending + " item(s) haven't been sent yet and will be lost. Sign out anyway?", "Sign out"))) return;
      for (const k of await Store.keys()) await Store.del(k);
      await Data.clearAll(); LS.set("offlineJobs", []); LS.set("user", null); LS.set("profile", null); Src.signOut();
    };
  }

  const NAV = [["", "Home", ICON.home, ["", "time"]], ["jobs", "Jobs", ICON.jobs, ["jobs", "job", "view"]], ["qa", "QA", ICON.check, ["qa"]], ["forms", "Forms", ICON.forms, ["forms", "form", "form-new"]],
    ["leave", "Holidays", ICON.leave, ["leave", "leave-new"]], ["expenses", "Expenses", ICON.money, ["expenses", "expense", "expense-new"]]];
  function drawNav(name) {
    $("nav").hidden = false;
    $("nav").innerHTML = NAV.map(([h, t, ic, names]) => '<a href="#/' + h + '" class="' + (names.includes(name) ? "on" : "") + '">' + ic + "<span>" + t + "</span></a>").join("");
  }

  function route() {
    closeViewer(); window.scrollTo(0, 0);
    if (!S.user) { viewSignIn(); return; }
    const parts = location.hash.replace(/^#\/?/, "").split("/"), name = parts[0] || "", args = parts.slice(1);
    drawNav(name);
    $("sheet").hidden = true;
    if (name === "") viewHome();
    else if (name === "jobs") viewJobs();
    else if (name === "job" && args[0]) viewJob(decodeURIComponent(args[0]));
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
