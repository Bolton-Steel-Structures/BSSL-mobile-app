/* iCONSTRUCTE Site: check in / check out with location (time keeping).
 * Location is read once at check-in and once at check-out, never in between.
 * If the phone is further than CFG.checkInRadiusM from the site, the check-in is still allowed but flagged, with a reason.
 */
(function () {
  "use strict";
  const { CFG, can, $, esc, fmtTime, fmtDay, fmtHours, fmtDistance, isoDate, Data, myJobs, jobByFolder, jobOptions, locate, distanceM, sheet, toast, setBar, LS, route } = IC;

  async function entries() { return (await Data.list("time")).sort((a, b) => a.at.localeCompare(b.at)); }

  // Pair check-ins with the following check-out.
  function pairs(list) {
    const out = []; let open = null;
    for (const e of list) {
      if (e.type === "in") { if (open) out.push({ in: open, out: null }); open = e; }
      else if (e.type === "out") { out.push({ in: open, out: e }); open = null; }
    }
    if (open) out.push({ in: open, out: null });
    return out.map((p) => Object.assign(p, { ms: p.in && p.out ? new Date(p.out.at) - new Date(p.in.at) : p.in && !p.out && IC.sameDay(p.in.at, new Date()) ? Date.now() - new Date(p.in.at) : 0 }));
  }
  const openShift = (list) => { const last = list[list.length - 1]; return last && last.type === "in" ? last : null; };

  function weekStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x; }

  // ---------------------------------------------------------------- home card
  async function card(el) {
    const list = await entries(), open = openShift(list), ps = pairs(list);
    const today = ps.filter((p) => p.in && IC.sameDay(p.in.at, new Date())).reduce((t, p) => t + p.ms, 0);
    const ws = weekStart(new Date()), week = ps.filter((p) => p.in && new Date(p.in.at) >= ws).reduce((t, p) => t + p.ms, 0);
    const wk = atWorkshop(), jobs = wk ? [] : myJobs();
    let html = '<div class="tc">';
    if (open && !IC.sameDay(open.at, new Date())) {
      html += '<div class="tc-forgot"><b>You didn\'t ' + (wk ? "clock" : "check") + ' out</b> from ' + esc(open.site || open.jobNumber || "site") + " on " + esc(fmtDay(open.at)) + ".<br>What time did you leave?" +
        '<div class="row"><input type="time" id="tcLeft" value="16:00"><button class="btn primary" id="tcFix">Save</button></div></div>';
    } else if (open) {
      html += '<div class="tc-state on"><span class="dot"></span>' + (wk ? "Clocked in" : "On site") + ' · <b>' + esc(open.site || open.jobNumber) + "</b></div>" +
        '<div class="tc-big">' + fmtHours(Date.now() - new Date(open.at)) + '</div><div class="small">' + (wk ? "Clocked" : "Checked") + ' in at ' + fmtTime(open.at) + (open.flagged ? ' · <span class="flag">away from site</span>' : "") + "</div>" +
        '<button class="btn danger block" id="tcOut">' + (wk ? "Clock out" : "Check out") + "</button>";
    } else {
      const last = LS.get("lastJob", jobs[0] && jobs[0].folder);
      html += '<div class="tc-state"><span class="dot"></span>' + (wk ? "Not clocked in" : "Not checked in") + "</div>" +
        (jobs.length ? '<label class="fl">Site<select id="tcJob">' + jobOptions(last, true) + "</select></label>" : "") +
        '<button class="btn go block" id="tcIn">' + (wk ? "Clock in" : "Check in") + "</button>";
    }
    html += '<div class="tc-tot"><div><span>Today</span><b>' + fmtHours(today) + '</b></div><div><span>This week</span><b>' + fmtHours(week) + '</b></div><a href="#/time" class="link">Timesheet ›</a></div></div>';
    el.innerHTML = html;
    if ($("tcIn")) $("tcIn").onclick = () => check("in", $("tcJob") ? $("tcJob").value : "");
    if ($("tcOut")) $("tcOut").onclick = () => check("out", open.jobFolder, open);
    if ($("tcFix")) $("tcFix").onclick = async () => {
      const [h, m] = $("tcLeft").value.split(":").map(Number); const at = new Date(open.at); at.setHours(h, m, 0, 0);
      if (at <= new Date(open.at)) { toast("That's before you checked in."); return; }
      await Data.save("time", { type: "out", at: at.toISOString(), jobFolder: open.jobFolder, jobNumber: open.jobNumber, site: open.site, manual: true, reason: "Forgot to check out; time entered next day" });
      toast("Saved"); card(el);
    };
  }

  // Workshop staff clock in and out at the workshop: no site to pick and no location taken (Liam, 21 Nov)
  const atWorkshop = () => can("workshop") && !can("drawings");
  async function check(type, folder, open) {
    if (atWorkshop()) {
      const r = await Data.save("time", { type, at: new Date().toISOString(), jobFolder: "", jobNumber: "", site: "Workshop", flagged: false });
      toast((type === "in" ? "Clocked in " : "Clocked out ") + fmtTime(r.at)); IC.refreshView(); return;
    }
    const j = folder ? jobByFolder(folder) : null;
    if (type === "in") LS.set("lastJob", folder);
    const sh = sheet("<h3>" + (type === "in" ? "Checking in" : "Checking out") + '</h3><p>Getting your location…</p><div class="progress"><div class="indet"></div></div>');
    const pos = await locate();
    const target = j && j.lat != null ? { lat: j.lat, lng: j.lng } : null;
    const dist = !pos.error && target ? distanceM(pos, target) : null;
    const far = dist != null && dist > Math.max(CFG.checkInRadiusM, (pos.accuracy || 0));
    const rec = { type, at: new Date().toISOString(), jobFolder: folder || "", jobNumber: j ? j.jobNumber : "", site: j ? (j.site || j.customer) : "Yard / no job",
      lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, distanceM: dist == null ? null : Math.round(dist), flagged: !!(pos.error || far), locationError: pos.error || "" };
    const finish = async (reason) => {
      if (reason) rec.reason = reason;
      await Data.save("time", rec); sh.close();
      toast((type === "in" ? "Checked in " : "Checked out ") + fmtTime(rec.at)); IC.refreshView();
    };
    if (!rec.flagged) { await finish(); return; }
    sh.el.querySelector(".sheet-panel").innerHTML = "<h3>" + (pos.error ? "No location" : "You're " + fmtDistance(dist) + " from site") + "</h3>" +
      "<p>" + esc(pos.error || ((j.site || j.jobNumber) + " is " + fmtDistance(dist) + " away. ")) + " You can still " + (type === "in" ? "check in" : "check out") + ", but the office will see it flagged.</p>" +
      '<label class="fl">Reason<textarea id="whyFar" rows="2" placeholder="e.g. collecting materials, parked at compound"></textarea></label>' +
      '<button class="btn primary block" id="farOk">' + (type === "in" ? "Check in anyway" : "Check out anyway") + '</button><button class="btn block" id="farNo">Cancel</button>';
    $("farOk").onclick = () => { const why = $("whyFar").value.trim(); if (!why) { $("whyFar").focus(); toast("Add a short reason"); return; } finish(why); };
    $("farNo").onclick = sh.close;
  }

  // ---------------------------------------------------------------- timesheet
  route("time", async (args) => {
    const off = Number(args[0] || 0);
    const ws = weekStart(new Date()); ws.setDate(ws.getDate() + off * 7); const we = new Date(ws); we.setDate(we.getDate() + 7);
    setBar("Timesheet", "Week of " + fmtDay(ws), true);
    const ps = pairs(await entries()).filter((p) => p.in && new Date(p.in.at) >= ws && new Date(p.in.at) < we);
    const days = []; for (let i = 0; i < 7; i++) { const d = new Date(ws); d.setDate(d.getDate() + i); days.push(d); }
    const total = ps.reduce((t, p) => t + p.ms, 0);
    $("main").innerHTML = '<div class="row nav-week"><a class="btn" href="#/time/' + (off - 1) + '">‹ Previous</a>' + (off < 0 ? '<a class="btn" href="#/time/' + (off + 1) + '">Next ›</a>' : "") + "</div>" +
      '<div class="tot-line">Week total <b>' + fmtHours(total) + "</b></div>" +
      days.map((d) => {
        const dp = ps.filter((p) => IC.sameDay(p.in.at, d));
        if (!dp.length) return d.getDay() === 0 || d.getDay() === 6 ? "" : '<div class="ts-day empty-day"><div class="ts-d">' + fmtDay(d) + '</div><div class="small">' + (IC.isBankHoliday(d) ? "Bank holiday" : "No time recorded") + "</div></div>";
        return '<div class="ts-day"><div class="ts-d">' + fmtDay(d) + "<b>" + fmtHours(dp.reduce((t, p) => t + p.ms, 0)) + "</b></div>" +
          dp.map((p) => '<div class="ts-row"><div><b>' + esc(p.in.site || p.in.jobNumber) + "</b>" + (p.in.jobNumber ? ' <span class="small">' + esc(p.in.jobNumber) + "</span>" : "") +
            '<div class="small">' + fmtTime(p.in.at) + " – " + (p.out ? fmtTime(p.out.at) + (p.out.manual ? " (entered later)" : "") : "still on site") + "</div>" +
            [p.in, p.out].filter((e) => e && e.flagged).map((e) => '<div class="flag">' + (e.type === "in" ? "In" : "Out") + ": " + esc(e.locationError || ("away from site, " + fmtDistance(e.distanceM))) + (e.reason ? " · " + esc(e.reason) : "") + "</div>").join("") +
            "</div><span>" + fmtHours(p.ms) + "</span></div>").join("") + "</div>";
      }).join("");
  });

  IC.Time = { card, entries, pairs };
})();
