/* iCONSTRUCTE Site: 3D model and erected-each-day tick-off (roadmap 5.8, TEST VERSION).
 * The job's IFC model, issued like drawings (manifest job.models: {name, path, issued}). For information only: erect from the
 * issued drawings. Supervisors / managers (feature "erect") select members and mark them Erected or Bolted and checked
 * (NSSS 9: bolting, line, level and plumb before sign-off). TEST: status is kept on this phone only; live, it goes through
 * the Azure API so the office and every phone see the same progress.
 * The viewer (three.js + web-ifc, vendor/model-viewer.js, about 4 MB) loads only when a model is opened.
 */
(function () {
  "use strict";
  const { $, esc, LS, S, can, jobByFolder, setBar, route, Src, toast } = IC;

  let viewerLoad = null;
  function loadViewer() {
    if (window.ICModel) return Promise.resolve();
    if (!viewerLoad) viewerLoad = new Promise((ok, fail) => {
      const s = document.createElement("script"); s.src = "vendor/model-viewer.js"; s.onload = ok; s.onerror = () => { viewerLoad = null; fail(new Error("viewer")); };
      document.head.appendChild(s);
    });
    return viewerLoad;
  }

  let current = null;
  window.addEventListener("hashchange", () => { if (current && !location.hash.startsWith("#/model/")) { current.destroy(); current = null; } });

  const kg = (n) => (n >= 1000 ? (n / 1000).toFixed(2) + " t" : Math.round(n) + " kg");
  const LABEL = { erected: "Erected", checked: "Bolted & checked" };

  async function viewModel(args) {
    const folder = args[0], idx = Number(args[1] || 0);
    const j = jobByFolder(folder), m = j && (j.models || [])[idx];
    if (!m) { location.hash = j ? "#/job/" + encodeURIComponent(folder) : "#/jobs"; return; }
    setBar("3D model", j.jobNumber + " · " + m.name.replace(/\.ifc$/i, ""), true);
    const key = "model:" + folder + ":" + m.path;
    const status = LS.get(key, {}) || {};
    const mark = can("erect");
    $("main").innerHTML =
      '<div class="mv-banner">For information: erect from the issued drawings. <b>Test version</b>: ticks are kept on this phone only.</div>' +
      '<div class="mv-box" id="mvBox"></div>' +
      '<div class="mv-tools"><button class="btn sm" id="mvFit">Fit</button><button class="btn sm" id="mvBolts">Hide bolts</button><button class="btn sm" id="mvHide">Hide selected</button><button class="btn sm" id="mvShow" hidden>Show all</button><button class="btn sm" id="mvHeavy" hidden></button><button class="btn sm" id="mvClear">Clear selection</button></div>' +
      '<div id="mvSel"></div><div id="mvProg"></div><div id="mvList"></div>';
    if (current) { current.destroy(); current = null; }
    const box = $("mvBox");
    let url;
    try {
      box.innerHTML = '<div class="mv-load">Loading the viewer …</div>';
      await loadViewer();
      url = URL.createObjectURL(await Src.blob(m.path));
    } catch (e) { box.innerHTML = '<div class="mv-load">Couldn\'t open the model (' + esc(e.message) + ").</div>"; return; }
    const user = (S.user && S.user.name) || "";
    try {
      current = await window.ICModel.open(box, { url, wasmPath: new URL("vendor/", location.href).href, status, user, keepOnMiss: true, onStatus: (st) => LS.set(key, st) });
    } catch (e) { box.innerHTML = '<div class="mv-load">Couldn\'t read the model (' + esc(e.message || String(e)) + ").</div>"; return; }
    const ctl = current;
    let bolts = true, filter = "all";
    $("mvFit").onclick = () => ctl.fit();
    $("mvBolts").onclick = () => { bolts = !bolts; ctl.bolts(bolts); $("mvBolts").textContent = bolts ? "Hide bolts" : "Show bolts"; };
    $("mvHide").onclick = () => ctl.hideSelected();
    $("mvShow").onclick = () => ctl.showAll();
    $("mvClear").onclick = () => ctl.clear();
    let heavyOn = false;
    const hv = ctl.heavyCount();
    if (hv) { $("mvHeavy").hidden = false; $("mvHeavy").textContent = "Show " + hv + " left-out part" + (hv > 1 ? "s" : ""); }
    $("mvHeavy").onclick = () => { heavyOn = !heavyOn; ctl.heavy(heavyOn); $("mvHeavy").textContent = (heavyOn ? "Hide " : "Show ") + hv + " left-out part" + (hv > 1 ? "s" : ""); ctl.fit(); };

    const steel = () => ctl.list();
    const noun = ctl.hasAssemblies ? "assemblies" : "members";
    function info(p) {
      const pr = p.props, rows = [
        ["Mark", p.mark ? esc(p.mark) : '<span class="mv-warn">not in this export</span>'],
        ["Main part", esc(p.profile)], ["Parts", p.asm ? String(p.count) : ""], ["Type", p.asm ? "" : esc(p.kind)],
        ["Material", esc(p.material || "")], ["Length", p.length ? Math.round(p.length) + " mm" : ""],
        ["Weight", p.weight ? kg(p.weight) + (p.heavy ? ' <span class="mv-warn">check: unusually heavy</span>' : "") : ""],
        ["Phase", esc(p.phase)], ["Top / bottom", esc([pr["Top elevation"], pr["Bottom elevation"]].filter(Boolean).map((s) => String(s).trim()).join(" / "))],
        ["Status", ctl.status[p.guid] ? esc(LABEL[ctl.status[p.guid].s] + " · " + ctl.status[p.guid].by + " · " + new Date(ctl.status[p.guid].at).toLocaleDateString("en-GB")) : "Not started"]
      ].filter((r) => r[1]);
      return '<table class="mv-info">' + rows.map((r) => "<tr><th>" + r[0] + "</th><td>" + r[1] + "</td></tr>").join("") + "</table>";
    }
    function refresh() {
      const sel = [...ctl.sel].map((id) => ctl.units.get(id)).filter(Boolean);
      const selSteel = sel;
      $("mvShow").hidden = !ctl.hiddenCount();
      $("mvSel").innerHTML = !sel.length ? '<p class="small mv-hint">Tap the steel to see it' + (mark ? ", tap more to select several, then mark them." : ".") + " Drag to turn, pinch to zoom.</p>" :
        '<div class="card"><div class="mv-selh"><b>' + sel.length + " selected</b>" + (selSteel.length ? " · " + kg(selSteel.reduce((a, p) => a + p.weight, 0)) : "") + "</div>" +
        (sel.length === 1 ? info(sel[0]) : "") +
        (mark && selSteel.length ? '<div class="mv-act"><button class="btn" data-s="erected" style="background:#F5A623;color:#222">Erected</button><button class="btn" data-s="checked" style="background:#2E9E44;color:#fff">Bolted &amp; checked</button><button class="btn" data-s="">Reset</button></div>' : "") + "</div>";
      document.querySelectorAll(".mv-act button").forEach((b) => (b.onclick = () => { const n = [...ctl.sel].length; ctl.mark(b.dataset.s); toast(b.dataset.s ? n + " marked " + LABEL[b.dataset.s].toLowerCase() : n + " reset"); }));

      const all = steel(), counted = all.filter((p) => !p.heavy), heavy = all.filter((p) => p.heavy);
      const sum = (list, s) => list.filter((p) => (s ? ctl.status[p.guid] && ctl.status[p.guid].s === s : !ctl.status[p.guid])).reduce((a, p) => ({ n: a.n + 1, w: a.w + p.weight }), { n: 0, w: 0 });
      const tot = counted.reduce((a, p) => a + p.weight, 0), er = sum(counted, "erected"), ch = sum(counted, "checked"), ns = sum(counted, null);
      const pc = (w) => (tot ? (100 * w) / tot : 0);
      $("mvProg").innerHTML = '<div class="section-h">Progress</div><div class="card">' +
        '<div class="mv-bar"><span style="width:' + pc(ch.w) + '%;background:#2E9E44"></span><span style="width:' + pc(er.w) + '%;background:#F5A623"></span></div>' +
        '<div class="mv-legend"><span><i style="background:#2E9E44"></i>Bolted &amp; checked ' + ch.n + " · " + kg(ch.w) + "</span>" +
        '<span><i style="background:#F5A623"></i>Erected ' + er.n + " · " + kg(er.w) + "</span>" +
        '<span><i style="background:#A7ADB5"></i>Not started ' + ns.n + " · " + kg(ns.w) + "</span></div>" +
        '<div class="small">' + counted.length + " " + noun + ", " + kg(tot) + " in total" + (heavy.length ? " (" + heavy.length + " over 5 t left out)" : "") + ". Bolts not counted.</div></div>";

      const shown = all.filter((p) => filter === "all" || (filter === "none" ? !ctl.status[p.guid] : ctl.status[p.guid] && ctl.status[p.guid].s === filter))
        .sort((a, b) => (a.mark || a.profile).localeCompare(b.mark || b.profile, undefined, { numeric: true }) || b.weight - a.weight);
      $("mvList").innerHTML = '<div class="section-h">' + (ctl.hasAssemblies ? "Assemblies" : "Parts") + " (" + all.length + ")</div>" +
        (ctl.hasAssemblies ? "" : '<p class="small" style="color:var(--sub);margin:0 0 8px">This file was exported without assemblies, so parts are listed. Export with assemblies to list by erection mark.</p>') + '<div class="chips">' +
        [["all", "All"], ["none", "Not started"], ["erected", "Erected"], ["checked", "Checked"]].map(([f, t]) => '<button class="chip' + (filter === f ? " on" : "") + '" data-f="' + f + '">' + t + "</button>").join("") + "</div>" +
        shown.map((p) => { const st = ctl.status[p.guid]; return '<button class="todo mv-row' + (ctl.sel.has(p.id) ? " sel" : "") + '" data-id="' + p.id + '"><span><b>' + esc(p.mark || p.profile) + "</b>" + '<span class="small"> ' + esc((p.mark ? p.profile + " · " : "") + (p.asm && p.count > 1 ? p.count + " parts · " : p.length ? Math.round(p.length) + " mm · " : "") + kg(p.weight)) + "</span></span>" +
          '<span class="pill" style="background:' + (st ? (st.s === "checked" ? "#2E9E44" : "#F5A623") : "#A7ADB5") + ';color:' + (st && st.s === "checked" ? "#fff" : "#222") + '">' + (st ? LABEL[st.s] : "Not started") + "</span></button>"; }).join("");
      document.querySelectorAll("#mvList [data-f]").forEach((b) => (b.onclick = () => { filter = b.dataset.f; refresh(); }));
      document.querySelectorAll(".mv-row").forEach((b) => (b.onclick = () => { const id = Number(b.dataset.id); ctl.select([id], true); ctl.zoomTo(id); window.scrollTo({ top: 0, behavior: "smooth" }); }));
    }
    ctl.onChange = refresh;
    refresh();
  }

  route("model", viewModel);
})();
