/* iCONSTRUCTE Site: Manager tools (Liam, 19/11/2026).
 * One place for a manager to look after their team: holiday requests, expense claims, competency cards and time keeping
 * (check in / out). Only shown to managers, and each manager only gets their own team's records: the Azure API decides
 * who is in the team (the Manager field on each employee in iCONSTRUCTE) and never sends anyone else's. Nothing here is
 * kept in the iCONSTRUCTE Access file; approved weeks go back to iCONSTRUCTE as job hours (Work Log).
 */
(function () {
  "use strict";
  const { $, esc, fmtDate, fmtDay, fmtTime, fmtHours, fmtMoney, fmtDistance, isoDate, parseDate, sameDay, Data, setBar, route, toast } = IC;

  const weekStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const initials = (n) => String(n || "?").split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  const onLeave = (all, email, iso) => all.find((r) => r.user === email && r.status === "approved" && r.from <= iso && iso <= r.to);

  async function load() {
    const me = Data.profile.email;
    const team = (await Data.team()).filter((p) => p.email !== me);
    const emails = new Set(team.map((p) => p.email));
    const mineOrTeam = (r) => emails.has(r.user);
    const [time, leave, expenses, cards, weeks] = await Promise.all(["time", "leave", "expenses", "cards", "timesheets"].map((k) => Data.list(k, "team")));
    return { team, time: time.filter(mineOrTeam).sort((a, b) => a.at.localeCompare(b.at)), leave: leave.filter(mineOrTeam), expenses: expenses.filter(mineOrTeam),
      cards: cards.filter((c) => mineOrTeam(c) && IC.Cards.live(c)), weeks: weeks.filter(mineOrTeam) };
  }

  // Where each person is today: on site (since, where, flagged), checked out, on holiday, not checked in; plus missed check-outs.
  function today(d, p) {
    const mine = d.time.filter((e) => e.user === p.email), ps = IC.Time.pairs(mine);
    const todays = ps.filter((x) => x.in && sameDay(x.in.at, new Date()));
    const missed = ps.filter((x) => x.in && !x.out && !sameDay(x.in.at, new Date()));
    const open = todays.find((x) => !x.out), leave = onLeave(d.leave, p.email, isoDate(new Date()));
    let state, cls;
    if (open) { state = "On site · " + (open.in.site || open.in.jobNumber || "") + " since " + fmtTime(open.in.at); cls = "on"; }
    else if (todays.length) { state = "Checked out " + fmtTime(todays[todays.length - 1].out.at) + " · " + fmtHours(todays.reduce((t, x) => t + x.ms, 0)); cls = "done"; }
    else if (leave) { state = "On holiday" + (leave.to !== leave.from ? " until " + fmtDay(leave.to) : " today"); cls = "off"; }
    else if (planned(p.email).off) { state = "Off (on the planner)"; cls = "off"; }
    else { state = "Not checked in"; cls = "none"; }
    const flags = todays.flatMap((x) => [x.in, x.out]).filter((e) => e && e.flagged);
    return { state, cls, open, missed, flags, ms: todays.reduce((t, x) => t + x.ms, 0) };
  }

  // ---------------------------------------------------------------- 9am check-in and who's on site (Liam, 20 Nov)
  // Site staff (operatives and supervisors) not checked in by 09:00 on a working day are flagged, unless on approved
  // holiday or on the planner's Off row (manifest allocations with off: true). Set the time with checkInBy in config.js.
  // Live: the Azure API runs the same check at 09:00 and sends it to the managers (push / email); here it shows when the
  // app is opened.
  const SITE_ROLE = /operative|supervisor/i;
  function checkInBy() {
    const t = String((window.SITE_CONFIG || {}).checkInBy || "09:00").split(":"), x = new Date();
    x.setHours(Number(t[0]) || 9, Number(t[1]) || 0, 0, 0);
    return x;
  }
  function planned(email) {
    const iso = isoDate(new Date()), e = String(email).toLowerCase();
    const al = ((IC.S.manifest && IC.S.manifest.allocations) || []).filter((a) => a.date === iso && String(a.email).toLowerCase() === e);
    return { off: al.some((a) => a.off), jobs: al.filter((a) => !a.off) };
  }
  function roll(d) {
    const now = new Date(), iso = isoDate(now), by = checkInBy(), working = IC.isWorkingDay(now);
    const rows = d.team.map((p) => ({ p, t: today(d, p), pl: planned(p.email), hol: onLeave(d.leave, p.email, iso), siteStaff: SITE_ROLE.test(p.role || "") }));
    const isOff = (r) => !!(r.hol || r.pl.off);
    return {
      by, late: now >= by, working, rows,
      onSite: rows.filter((r) => r.t.cls === "on"),
      out: rows.filter((r) => r.t.cls === "done"),
      off: rows.filter((r) => r.t.cls !== "on" && r.t.cls !== "done" && isOff(r)),
      missing: working ? rows.filter((r) => r.siteStaff && r.t.cls === "none" && !isOff(r)) : [],
      notIn: rows.filter((r) => !r.siteStaff && r.t.cls === "none" && !isOff(r))
    };
  }
  const plannedText = (r) => r.pl.jobs.length ? "Planned: " + r.pl.jobs.map((a) => a.jobNumber + (a.site ? " " + a.site : "")).join(", ") : "Not on today's plan";
  const hhmm = (d) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  let liveTimer = null;
  window.addEventListener("hashchange", () => { if (liveTimer && location.hash !== "#/manager/live") { clearInterval(liveTimer); liveTimer = null; } });

  async function viewLive() {
    setBar("Who's on site", "Live · updates every minute", true);
    const draw = async () => {
      const d = await load(), r = roll(d);
      // group open check-ins by site
      const sites = {};
      r.onSite.forEach((x) => { const k = x.t.open.in.site || x.t.open.in.jobNumber || "Site not given"; (sites[k] = sites[k] || []).push(x); });
      const person = (x, sub, cls) => '<a class="tile-row mt-' + cls + '" href="#/manager/person/' + encodeURIComponent(x.p.email) + '/0"><span class="avatar">' + esc(initials(x.p.name)) + "</span><span><b>" + esc(x.p.name) + '</b><span class="small">' + sub + "</span>" +
        x.t.flags.map((e) => '<span class="flag">' + (e.type === "in" ? "In" : "Out") + ": " + esc(e.locationError || ("away from site, " + fmtDistance(e.distanceM))) + (e.reason ? " · " + esc(e.reason) : "") + "</span>").join("") + "</span>›</a>";
      const elsewhere = (x) => { const j = x.t.open.in.jobNumber; return x.pl.jobs.length && j && !x.pl.jobs.some((a) => a.jobNumber === j) ? '<span class="flag">Planned on ' + esc(x.pl.jobs.map((a) => a.jobNumber).join(", ")) + "</span>" : ""; };
      const missingHead = r.late ? "Not checked in by " + hhmm(r.by) : "Not in yet (due by " + hhmm(r.by) + ")";
      if (!$("liveBox")) return;
      $("liveBox").innerHTML =
        '<div class="stats"><div><b>' + r.onSite.length + '</b><span>on site</span></div><div' + (r.late && r.missing.length ? ' class="st-bad"' : "") + "><b>" + r.missing.length + "</b><span>" + (r.late ? "not in by " + hhmm(r.by) : "not in yet") + "</span></div><div><b>" + r.off.length + "</b><span>off today</span></div><div><b>" + r.out.length + "</b><span>checked out</span></div></div>" +
        (r.missing.length ? '<div class="section-h' + (r.late ? " sh-bad" : "") + '">' + esc(missingHead) + "</div>" + r.missing.map((x) => person(x, esc(plannedText(x)), r.late ? "late" : "none")).join("") : (r.working ? '<div class="card small ok-card">Everyone due on site has checked in' + (r.late ? "" : " so far") + ".</div>" : "")) +
        Object.keys(sites).sort().map((k) => '<div class="section-h">' + esc(k) + " · " + sites[k].length + "</div>" + sites[k].map((x) => person(x, "In at " + esc(fmtTime(x.t.open.in.at)) + (x.t.open.in.jobNumber ? " · " + esc(x.t.open.in.jobNumber) : "") + elsewhere(x), "on")).join("")).join("") +
        (r.out.length ? '<div class="section-h">Checked out</div>' + r.out.map((x) => person(x, esc(x.t.state), "done")).join("") : "") +
        (r.off.length ? '<div class="section-h">Off today</div>' + r.off.map((x) => person(x, x.hol ? "On holiday" + (x.hol.to !== x.hol.from ? " until " + esc(fmtDay(x.hol.to)) : "") : "Off (on the planner)", "off")).join("") : "") +
        (r.notIn.length ? '<div class="section-h">Office and others not checked in</div>' + r.notIn.map((x) => person(x, esc(plannedText(x)), "none")).join("") : "");
    };
    $("main").innerHTML = '<div id="liveBox"><div class="empty">Loading…</div></div><button class="btn block" id="liveRefresh" style="margin-top:8px">Refresh now</button>';
    $("liveRefresh").onclick = async () => { try { await IC.Data.flush(); await IC.Data.pull(); } catch (e) { /* offline: show what we have */ } draw(); };
    await draw();
    if (liveTimer) clearInterval(liveTimer);
    liveTimer = setInterval(() => { if (location.hash === "#/manager/live") draw(); }, 60000);
  }

  // ---------------------------------------------------------------- dashboard
  async function dashboard() {
    setBar("Manager tools", "Your team", false);
    const d = await load();
    const pendLeave = d.leave.filter((r) => r.status === "pending");
    const pendExp = d.expenses.filter((e) => e.status === "pending"), toPay = d.expenses.filter((e) => e.status === "approved");
    const cardsDue = d.cards.filter((c) => { const s = IC.Cards.state(c); return s.days != null && s.days <= IC.Cards.SOON_DAYS; }).sort((a, b) => a.expiry.localeCompare(b.expiry));
    const noCscs = d.team.filter((p) => !d.cards.some((c) => c.user === p.email && (c.type === "CSCS" || c.type === "CPCS" || c.type === "NPORS")));
    const states = d.team.map((p) => Object.assign({ p }, today(d, p)));
    const onSite = states.filter((s) => s.cls === "on").length;
    const ws = weekStart(new Date()), lastWs = new Date(ws); lastWs.setDate(lastWs.getDate() - 7);
    const toApprove = d.team.filter((p) => d.time.some((e) => e.user === p.email && new Date(e.at) >= lastWs && new Date(e.at) < ws) && !d.weeks.some((w) => w.user === p.email && w.weekStart === isoDate(lastWs)));
    const offSoon = d.leave.filter((r) => r.status === "approved" && r.to >= isoDate(new Date()) && r.from <= isoDate(((x) => (x.setDate(x.getDate() + 13), x))(new Date()))).sort((a, b) => a.from.localeCompare(b.from));

    const r9 = roll(d);
    const link = (href, icon, title, sub, n) => '<a class="tile-row" href="' + href + '"><span class="ti">' + icon + "</span><span><b>" + esc(title) + '</b><span class="small">' + esc(sub) + "</span></span>" + (n ? '<span class="pill pending">' + n + "</span>" : "") + "›</a>";
    $("main").innerHTML =
      '<div class="stats"><div><b>' + onSite + "/" + d.team.length + '</b><span>on site now</span></div><div><b>' + pendLeave.length + "</b><span>holiday requests</span></div>" +
      "<div><b>" + pendExp.length + "</b><span>claims to approve</span></div><div><b>" + cardsDue.length + "</b><span>cards expiring / expired</span></div></div>" +
      (r9.late && r9.missing.length ? '<a class="todo alert-row" href="#/manager/live"><span class="ti">' + IC.ICON.clock + "</span><span><b>" + r9.missing.length + " not checked in by " + esc(hhmm(r9.by)) + '</b><span class="small">' + esc(r9.missing.map((x) => x.p.name).join(", ")) + "</span></span>›</a>" : "") +
      link("#/manager/live", IC.ICON.clock, "Who's on site (live)", r9.onSite.length + " on site" + (r9.missing.length ? " · " + r9.missing.length + (r9.late ? " not in by " : " due by ") + hhmm(r9.by) : "") + (r9.off.length ? " · " + r9.off.length + " off" : ""), r9.late ? r9.missing.length : 0) +
      '<div class="section-h">Waiting for you</div>' +
      link("#/leave/team", IC.ICON.leave, "Holiday requests", pendLeave.length ? pendLeave.map((r) => r.userName.split(" ")[0]).join(", ") : "None waiting · team calendar", pendLeave.length) +
      link("#/expenses/team", IC.ICON.money, "Expense claims", pendExp.length ? fmtMoney(pendExp.reduce((t, e) => t + e.amount, 0)) + " to approve" + (toPay.length ? " · " + fmtMoney(toPay.reduce((t, e) => t + e.amount, 0)) + " approved, to pay" : "") : (toPay.length ? fmtMoney(toPay.reduce((t, e) => t + e.amount, 0)) + " approved, to pay" : "None waiting"), pendExp.length) +
      link("#/manager/time/-1", IC.ICON.clock, "Timesheets to approve", toApprove.length ? "Week of " + fmtDay(lastWs) + ": " + toApprove.map((p) => p.name.split(" ")[0]).join(", ") : "Last week all approved", toApprove.length) +
      link("#/manager/plant", IC.ICON.check, "Plant checks", "Every machine on every job this week") +
      link("#/manager/cards", IC.ICON.card, "Competency cards", cardsDue.length || noCscs.length ? [cardsDue.length ? cardsDue.length + " expiring or expired" : "", noCscs.length ? noCscs.length + " with no CSCS / CPCS on record" : ""].filter(Boolean).join(" · ") : "All in date", cardsDue.length + noCscs.length) +
      '<div class="section-h">Today</div>' + (states.length ? states.map((s) =>
        '<a class="tile-row mt-' + s.cls + '" href="#/manager/person/' + encodeURIComponent(s.p.email) + '/0"><span class="avatar">' + esc(initials(s.p.name)) + "</span><span><b>" + esc(s.p.name) + '</b><span class="small">' + esc(s.state) + "</span>" +
        s.flags.map((e) => '<span class="flag">' + (e.type === "in" ? "In" : "Out") + ": " + esc(e.locationError || ("away from site, " + fmtDistance(e.distanceM))) + (e.reason ? " · " + esc(e.reason) : "") + "</span>").join("") +
        s.missed.map((x) => '<span class="flag">No check-out on ' + esc(fmtDay(x.in.at)) + "</span>").join("") + "</span>›</a>").join("") : '<div class="empty small">No one in your team yet. Managers are set on each employee in iCONSTRUCTE.</div>') +
      '<div class="section-h">Off in the next 2 weeks</div>' + (offSoon.length ? offSoon.map((r) => '<div class="req"><div><b>' + esc(r.userName) + '</b><div class="small">' + esc(fmtDay(r.from)) + (r.to !== r.from ? " – " + esc(fmtDay(r.to)) : "") + " · " + esc(r.type) + "</div></div></div>").join("") : '<div class="empty small">No one booked off.</div>') +
      (cardsDue.length ? '<div class="section-h">Cards expiring or expired</div>' + cardsDue.map((c) => IC.Cards.row(c, true)).join("") : "");
  }

  // ---------------------------------------------------------------- time keeping: team week, approve weeks
  async function viewTime(off) {
    const ws = weekStart(new Date()); ws.setDate(ws.getDate() + off * 7); const we = new Date(ws); we.setDate(we.getDate() + 7);
    setBar("Time keeping", "Week of " + fmtDay(ws), true);
    const d = await load(), days = [...Array(7).keys()].map((i) => { const x = new Date(ws); x.setDate(x.getDate() + i); return x; });
    const rows = d.team.map((p) => {
      const ps = IC.Time.pairs(d.time.filter((e) => e.user === p.email)).filter((x) => x.in && new Date(x.in.at) >= ws && new Date(x.in.at) < we);
      const per = days.map((day) => ps.filter((x) => sameDay(x.in.at, day)).reduce((t, x) => t + x.ms, 0));
      const flags = ps.flatMap((x) => [x.in, x.out]).filter((e) => e && e.flagged).length, missing = ps.filter((x) => !x.out && !sameDay(x.in.at, new Date())).length;
      const done = d.weeks.find((w) => w.user === p.email && w.weekStart === isoDate(ws));
      return { p, ps, per, total: per.reduce((a, b) => a + b, 0), flags, missing, done };
    });
    const finished = we <= weekStart(new Date()) || off < 0;
    const h = (ms) => (ms ? (Math.round(ms / 360000) / 10).toFixed(1) : "");
    $("main").innerHTML = '<div class="row nav-week"><a class="btn" href="#/manager/time/' + (off - 1) + '">‹ Previous</a>' + (off < 0 ? '<a class="btn" href="#/manager/time/' + (off + 1) + '">Next ›</a>' : "") + "</div>" +
      '<div class="scroll-x"><table class="tbl hrs"><thead><tr><th>Name</th>' + days.map((x) => "<th>" + x.toLocaleDateString("en-GB", { weekday: "short" }) + "</th>").join("") + "<th>Total</th></tr></thead><tbody>" +
      rows.map((r) => "<tr><td><a href=\"#/manager/person/" + encodeURIComponent(r.p.email) + "/" + off + '">' + esc(r.p.name) + "</a></td>" + r.per.map((ms) => "<td>" + h(ms) + "</td>").join("") + "<td><b>" + h(r.total) + "</b></td></tr>").join("") +
      "</tbody></table></div>" +
      '<div class="section-h">' + (finished ? "Approve the week" : "This week is still running") + "</div>" +
      rows.filter((r) => r.total || r.done).map((r) => '<div class="req"><div><b>' + esc(r.p.name) + '</b><div class="small">' + fmtHours(r.total) + (r.flags ? ' · <span class="flag">' + r.flags + " flagged</span>" : "") + (r.missing ? ' · <span class="flag">' + r.missing + " missing check-out</span>" : "") + "</div>" +
        (r.done ? '<div class="small">Approved by ' + esc(r.done.decidedBy) + " · " + esc(fmtDate(r.done.decidedAt)) + " · sent to iCONSTRUCTE as job hours</div>" : "") + "</div>" +
        '<div class="req-r">' + (r.done ? '<span class="pill approved">Approved</span>' : finished ? '<button class="btn go sm" data-ok="' + esc(r.p.email) + '"' + (r.missing ? " disabled" : "") + ">Approve</button>" : '<span class="pill">Open</span>') + "</div></div>").join("");
    document.querySelectorAll("[data-ok]").forEach((b) => (b.onclick = async () => {
      const r = rows.find((x) => x.p.email === b.dataset.ok);
      const jobs = {};
      r.ps.forEach((x) => { const k = x.in.jobFolder || ""; jobs[k] = jobs[k] || { jobFolder: k, jobNumber: x.in.jobNumber || "", site: x.in.site || "", ms: 0 }; jobs[k].ms += x.ms; });
      if (!(await IC.ask("Approve " + r.p.name + "'s week: " + fmtHours(r.total) + "? The hours go into iCONSTRUCTE against each job.", "Approve"))) return;
      await Data.save("timesheets", { user: r.p.email, userName: r.p.name, weekStart: isoDate(ws), jobs: Object.values(jobs), totalMs: r.total, status: "approved", decidedBy: Data.profile.name, decidedAt: new Date().toISOString() });
      toast("Week approved"); IC.refreshView();
    }));
  }

  // One person: today, the week's check-ins, holidays, cards.
  async function viewPerson(email, off) {
    const d = await load(), p = d.team.find((x) => x.email === email); if (!p) { location.hash = "#/manager"; return; }
    const ws = weekStart(new Date()); ws.setDate(ws.getDate() + off * 7); const we = new Date(ws); we.setDate(we.getDate() + 7);
    setBar(p.name, p.role || "", true);
    const ps = IC.Time.pairs(d.time.filter((e) => e.user === email)).filter((x) => x.in && new Date(x.in.at) >= ws && new Date(x.in.at) < we);
    const cards = d.cards.filter((c) => c.user === email), leave = d.leave.filter((r) => r.user === email && (r.status === "approved" || r.status === "pending") && r.to >= isoDate(new Date()));
    $("main").innerHTML = '<div class="card">' + esc(today(d, p).state) + "</div>" +
      '<div class="row nav-week"><a class="btn" href="#/manager/person/' + encodeURIComponent(email) + "/" + (off - 1) + '">‹ Previous</a>' + (off < 0 ? '<a class="btn" href="#/manager/person/' + encodeURIComponent(email) + "/" + (off + 1) + '">Next ›</a>' : "") + "</div>" +
      '<div class="tot-line">Week of ' + esc(fmtDay(ws)) + " <b>" + fmtHours(ps.reduce((t, x) => t + x.ms, 0)) + "</b></div>" +
      (ps.length ? ps.map((x) => '<div class="ts-row"><div><b>' + esc(x.in.site || x.in.jobNumber || "") + "</b> <span class=\"small\">" + esc(x.in.jobNumber || "") + '</span><div class="small">' + esc(fmtDay(x.in.at)) + " " + fmtTime(x.in.at) + " – " + (x.out ? fmtTime(x.out.at) + (x.out.manual ? " (entered later)" : "") : sameDay(x.in.at, new Date()) ? "on site" : "no check-out") + "</div>" +
        [x.in, x.out].filter((e) => e && e.flagged).map((e) => '<div class="flag">' + (e.type === "in" ? "In" : "Out") + ": " + esc(e.locationError || ("away from site, " + fmtDistance(e.distanceM))) + (e.reason ? " · " + esc(e.reason) : "") + "</div>").join("") +
        "</div><span>" + fmtHours(x.ms) + "</span></div>").join("") : '<div class="empty small">No check-ins this week.</div>') +
      '<div class="section-h">Holidays booked</div>' + (leave.length ? leave.map((r) => '<div class="req"><div><b>' + esc(fmtDay(r.from)) + (r.to !== r.from ? " – " + esc(fmtDay(r.to)) : "") + '</b><div class="small">' + esc(r.type) + '</div></div><div class="req-r"><span class="pill ' + r.status + '">' + esc(r.status.charAt(0).toUpperCase() + r.status.slice(1)) + "</span></div></div>").join("") : '<div class="empty small">None booked.</div>') +
      '<div class="section-h">Cards</div>' + (cards.length ? cards.map((c) => IC.Cards.row(c)).join("") : '<div class="empty small">No cards on record. Ask them to add their CSCS card in the app (Home › My cards).</div>');
  }

  // ---------------------------------------------------------------- competency cards: who holds what
  async function viewCards() {
    setBar("Competency cards", "Your team", true);
    const d = await load(), name = IC.Cards.name;
    const types = ["CSCS"].concat([...new Set(d.cards.map(name))].filter((t) => t !== "CSCS").sort());
    const cell = (c) => { if (!c) return "<td></td>"; const s = IC.Cards.state(c);
      return '<td class="cc ' + s.cls + '"><a href="#/card/' + c.id + '">' + (c.expiry ? esc(parseDate(c.expiry).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })) : "✓") + (IC.Cards.checked(c) ? "" : "*") + "</a></td>"; };
    $("main").innerHTML = '<div class="legend"><span class="approved">In date</span><span class="pending">Expires within ' + IC.Cards.SOON_DAYS + ' days</span><span class="declined">Expired</span></div>' +
      '<div class="scroll-x"><table class="tbl cards-m"><thead><tr><th>Name</th>' + types.map((t) => "<th>" + esc(t) + "</th>").join("") + "</tr></thead><tbody>" +
      d.team.map((p) => { const mine = d.cards.filter((c) => c.user === p.email);
        return "<tr><td><a href=\"#/manager/person/" + encodeURIComponent(p.email) + '/0">' + esc(p.name) + "</a></td>" + types.map((t) => { const c = mine.filter((x) => name(x) === t).sort((a, b) => (b.expiry || "").localeCompare(a.expiry || ""))[0]; return t === "CSCS" && !c ? '<td class="cc declined">none</td>' : cell(c); }).join("") + "</tr>"; }).join("") +
      "</tbody></table></div>" +
      '<button class="btn block" id="csv">Export (CSV)</button>';
    $("csv").onclick = () => {
      const q = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
      const lines = [["Name", "Email", "Card", "Number", "Category", "Expiry", "Status", "Checked by"].map(q).join(",")].concat(
        d.cards.map((c) => [c.userName, c.user, name(c), c.number, c.category, c.expiry, IC.Cards.state(c).label, IC.Cards.checked(c) ? c.decidedBy : ""].map(q).join(",")));
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv" })); a.download = "Competency cards " + isoDate(new Date()) + ".csv"; a.click();
    };
  }

  // for Home's to-do list: who's late in (empty before the check-in time or on a non-working day)
  IC.Manager = { async lateCheckIns() { const r = roll(await load()); const list = r.late ? r.missing : []; list.by = hhmm(r.by); return list; } };

  // Plant checks across the jobs (Liam, 20 Nov: managers oversee these and can complete them): every machine on hire to
  // a live job, this week's daily checks (green OK, red defect, grey none), today's state first. Tap a machine for its
  // weekly sheet, where a manager can also do the check.
  async function viewPlant() {
    IC.setBar("Plant checks", "This week", true);
    const mon = (() => { const x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; })();
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(d.getDate() + i); return d; });
    const checks = (await Data.list("forms", "team")).filter((c) => c.templateId === "plant" && c.status !== "draft" && c.values);
    const jobs = IC.viewableJobs().filter((j) => (j.plant || []).length);
    let missingToday = 0, defects = 0;
    const rows = jobs.map((j) => '<div class="section-h">' + esc(j.jobNumber + " · " + (j.site || "")) + "</div>" + j.plant.map((p) => {
      const mine = checks.filter((c) => c.jobFolder === j.folder && c.values.plantKey === p.id);
      const dayState = (d) => { const dc = mine.filter((c) => IC.sameDay(c.submittedAt || c.updatedAt, d)); return !dc.length ? "" : dc.some((c) => c.values.safe === "No" || (c.flags || []).length) ? "bad" : "ok"; };
      const today = dayState(new Date()); if (!today) missingToday++; if (today === "bad") defects++;
      return '<a class="tile-row" href="#/plant/' + encodeURIComponent(j.folder) + "/" + encodeURIComponent(p.id) + '"><span><b>' + esc(p.model || p.description || "Plant") + '</b><span class="small">' + esc([p.type, p.ref].filter(Boolean).join(" · ")) + '</span><span class="pdots">' +
        days.map((d) => '<span class="pd ' + dayState(d) + '">' + d.toLocaleDateString("en-GB", { weekday: "narrow" }) + "</span>").join("") + "</span></span>" +
        (today === "bad" ? '<span class="pill declined">Defect</span>' : today === "ok" ? '<span class="pill ok">Checked</span>' : '<span class="pill">Not checked today</span>') + "</a>";
    }).join("")).join("");
    $("main").innerHTML = '<div class="stats"><div><b>' + jobs.reduce((t, j) => t + j.plant.length, 0) + '</b><span>machines</span></div><div><b>' + missingToday + '</b><span>not checked today</span></div><div><b>' + defects + "</b><span>defects today</span></div></div>" +
      (rows || '<div class="empty small">No plant on hire to live jobs.</div>');
  }

  route("manager", async (args) => {
    if (!Data.profile || !Data.profile.isManager) { location.hash = "#/"; return; }
    if (args[0] === "live") return viewLive();
    if (args[0] === "time") return viewTime(Number(args[1] || 0));
    if (args[0] === "cards") return viewCards();
    if (args[0] === "plant") return viewPlant();
    if (args[0] === "person" && args[1]) return viewPerson(decodeURIComponent(args[1]), Number(args[2] || 0));
    return dashboard();
  });
})();
