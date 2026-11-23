/* iCONSTRUCTE Site: holiday requests, with a team calendar for managers.
 * Working days exclude weekends and England & Wales bank holidays (live list from GOV.UK).
 */
(function () {
  "use strict";
  const { CFG, $, esc, fmtDate, fmtDay, isoDate, parseDate, Data, sheet, toast, setBar, route, workingDays, isBankHoliday } = IC;
  const TYPES = ["Annual leave", "Unpaid leave", "Other"];

  function leaveYear(ref) {
    const d = ref || new Date(), m0 = CFG.leaveYearStartMonth - 1;
    const start = new Date(d.getFullYear() - (d.getMonth() < m0 ? 1 : 0), m0, 1), end = new Date(start.getFullYear() + 1, m0, 0);
    return { start, end, label: start.getMonth() === 0 ? String(start.getFullYear()) : start.getFullYear() + "/" + String(end.getFullYear()).slice(2) };
  }
  const daysOf = (r) => (r.days != null ? r.days : workingDays(r.from, r.to, r.halfStart, r.halfEnd));
  const covers = (r, iso) => r.from <= iso && iso <= r.to;
  const live = (r) => r.status === "pending" || r.status === "approved";
  const initials = (n) => String(n || "?").split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();

  function monthGrid(y, m, info) {
    const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    let h = '<div class="cal"><div class="cal-h">' + ["M", "T", "W", "T", "F", "S", "S"].map((x) => "<span>" + x + "</span>").join("") + '</div><div class="cal-g">';
    for (let i = 0; i < lead; i++) h += '<span class="cal-d pad"></span>';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d), iso = isoDate(dt), x = info(iso, dt) || {};
      h += '<button type="button" class="cal-d ' + (x.cls || "") + (iso === isoDate(new Date()) ? " today" : "") + (dt.getDay() === 0 || dt.getDay() === 6 ? " we" : "") + '" data-d="' + iso + '"><span class="n">' + d + "</span>" + (x.html || "") + "</button>";
    }
    return h + "</div></div>";
  }
  const monthName = (y, m) => new Date(y, m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  async function summary() {
    const ly = leaveYear(), mine = (await Data.list("leave")).filter((r) => r.type === "Annual leave" && live(r) && parseDate(r.from) >= ly.start && parseDate(r.from) <= ly.end);
    const taken = mine.filter((r) => r.status === "approved").reduce((t, r) => t + daysOf(r), 0), pend = mine.filter((r) => r.status === "pending").reduce((t, r) => t + daysOf(r), 0);
    const allow = (Data.profile && Data.profile.leaveAllowance) || 0;
    return { ly, allow, taken, pend, left: allow - taken - pend };
  }

  // ---------------------------------------------------------------- my holidays
  route("leave", async (args) => {
    const team = args[0] === "team" && Data.profile && Data.profile.isManager;
    if (team) return viewTeam(Number(args[1] || 0));
    const off = Number(args[1] || 0);
    setBar("Holidays", "Leave year " + leaveYear().label, false);
    const s = await summary(), mine = (await Data.list("leave")).sort((a, b) => b.from.localeCompare(a.from));
    const now = new Date(), y = now.getFullYear(), m = now.getMonth() + off, ref = new Date(y, m, 1);
    $("main").innerHTML = (Data.profile.isManager ? '<div class="tabs"><a class="on" href="#/leave">Mine</a><a href="#/leave/team">Team</a></div>' : "") +
      '<div class="stats"><div><b>' + s.left + "</b><span>days left</span></div><div><b>" + s.taken + "</b><span>approved</span></div><div><b>" + s.pend + "</b><span>waiting</span></div><div><b>" + s.allow + "</b><span>allowance</span></div></div>" +
      '<a class="btn primary block" href="#/leave-new">Request holiday</a>' +
      '<div class="cal-nav"><a class="link" href="#/leave/me/' + (off - 1) + '">‹</a><b>' + monthName(ref.getFullYear(), ref.getMonth()) + '</b><a class="link" href="#/leave/me/' + (off + 1) + '">›</a></div>' +
      monthGrid(ref.getFullYear(), ref.getMonth(), (iso) => { const r = mine.find((x) => live(x) && covers(x, iso)); return r ? { cls: r.status } : isBankHoliday(iso) ? { cls: "bh" } : null; }) +
      '<div class="legend"><span class="approved">Approved</span><span class="pending">Waiting</span><span class="bh">Bank holiday</span></div>' +
      '<div class="section-h">My requests</div>' + (mine.length ? mine.map((r) =>
        '<div class="req"><div><b>' + esc(fmtDay(r.from)) + (r.to !== r.from ? " – " + esc(fmtDay(r.to)) : "") + "</b> <span class=\"small\">" + daysOf(r) + " day" + (daysOf(r) === 1 ? "" : "s") + " · " + esc(r.type) + "</span>" +
        (r.note ? '<div class="small">' + esc(r.note) + "</div>" : "") + (r.decisionNote ? '<div class="small">Manager: ' + esc(r.decisionNote) + "</div>" : "") + "</div>" +
        '<div class="req-r"><span class="pill ' + r.status + '">' + esc(cap(r.status)) + "</span>" + (r.status === "pending" && r.from >= isoDate(new Date()) ? '<button class="link" data-cancel="' + r.id + '">Cancel</button>' : "") + "</div></div>").join("") : '<div class="empty small">No requests yet.</div>');
    document.querySelectorAll("[data-cancel]").forEach((b) => (b.onclick = async () => { const r = await Data.get("leave", b.dataset.cancel); r.status = "cancelled"; await Data.save("leave", r); toast("Request cancelled"); IC.refreshView(); }));
  });
  const cap = (s) => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);

  route("leave-new", async () => {
    setBar("Request holiday", "", true);
    const s = await summary(), t = isoDate(new Date());
    $("main").innerHTML = '<form class="frm" novalidate>' +
      '<label class="fl">Type<select id="lType">' + TYPES.map((x) => "<option>" + x + "</option>").join("") + "</select></label>" +
      '<div class="row"><label class="fl">First day<input type="date" id="lFrom" min="' + t + '" value="' + t + '"></label><label class="fl">Last day<input type="date" id="lTo" min="' + t + '" value="' + t + '"></label></div>' +
      '<label class="confirm"><input type="checkbox" id="lHalfS"><span>First day is a half day (afternoon off)</span></label>' +
      '<label class="confirm"><input type="checkbox" id="lHalfE"><span>Last day is a half day (morning off)</span></label>' +
      '<label class="fl">Note for your manager (optional)<textarea id="lNote" rows="2"></textarea></label>' +
      '<div class="calc" id="lCalc"></div><div class="err" id="lErr" hidden></div>' +
      '<button type="submit" class="btn primary block">Send request</button></form>';
    const calc = () => {
      if ($("lTo").value < $("lFrom").value) $("lTo").value = $("lFrom").value;
      $("lHalfE").closest("label").hidden = $("lTo").value === $("lFrom").value;
      const n = workingDays($("lFrom").value, $("lTo").value, $("lHalfS").checked, $("lHalfE").checked && $("lTo").value !== $("lFrom").value);
      const annual = $("lType").value === "Annual leave";
      $("lCalc").innerHTML = "<b>" + n + " working day" + (n === 1 ? "" : "s") + "</b>" + (annual ? " · " + (s.left - n) + " left after this" : "") + '<div class="small">Weekends and bank holidays aren\'t counted.</div>';
      return n;
    };
    ["lType", "lFrom", "lTo", "lHalfS", "lHalfE"].forEach((id) => ($(id).onchange = calc)); calc();
    document.querySelector(".frm").onsubmit = async (e) => {
      e.preventDefault(); const n = calc(), err = $("lErr");
      if (!n) { err.hidden = false; err.textContent = "Those dates don't include any working days."; return; }
      if ($("lType").value === "Annual leave" && s.left - n < 0 && !(await IC.ask("This is more than your remaining allowance. Send anyway?", "Send anyway"))) return;
      await Data.save("leave", { type: $("lType").value, from: $("lFrom").value, to: $("lTo").value, halfStart: $("lHalfS").checked, halfEnd: $("lHalfE").checked && $("lTo").value !== $("lFrom").value, days: n, note: $("lNote").value.trim(), status: "pending" });
      toast("Request sent to your manager"); location.hash = "#/leave";
    };
  });

  // ---------------------------------------------------------------- team view (managers)
  async function viewTeam(off) {
    setBar("Holidays", "Team", false);
    const ts = await Data.teamSet(), all = (await Data.list("leave", "team")).filter((r) => live(r) && ts.has(r.user));
    const pending = all.filter((r) => r.status === "pending" && r.user !== Data.profile.email).sort((a, b) => a.from.localeCompare(b.from));
    const now = new Date(), ref = new Date(now.getFullYear(), now.getMonth() + off, 1);
    const offOn = (iso, except) => all.filter((r) => r !== except && covers(r, iso) && !(parseDate(iso).getDay() % 6 === 0));
    const clashes = (r) => { const names = new Set(); let worst = 0; for (let d = parseDate(r.from); d <= parseDate(r.to); d.setDate(d.getDate() + 1)) { const o = offOn(isoDate(d), r); o.forEach((x) => names.add(x.userName)); worst = Math.max(worst, o.length); } return { names: [...names], worst }; };
    $("main").innerHTML = '<div class="tabs"><a href="#/leave">Mine</a><a class="on" href="#/leave/team">Team</a></div>' +
      '<div class="section-h">Waiting for approval (' + pending.length + ")</div>" + (pending.length ? pending.map((r) => { const c = clashes(r);
        return '<div class="req appr"><div><b>' + esc(r.userName) + '</b><div>' + esc(fmtDay(r.from)) + (r.to !== r.from ? " – " + esc(fmtDay(r.to)) : "") + ' <span class="small">' + daysOf(r) + " day" + (daysOf(r) === 1 ? "" : "s") + " · " + esc(r.type) + "</span></div>" +
          (r.note ? '<div class="small">“' + esc(r.note) + "”</div>" : "") +
          (c.names.length ? '<div class="' + (c.worst + 1 > CFG.maxOffSameDay ? "flag" : "small") + '">Also off: ' + esc(c.names.join(", ")) + (c.worst + 1 > CFG.maxOffSameDay ? " · " + (c.worst + 1) + " people off on the busiest day" : "") + "</div>" : '<div class="small ok-t">No clashes</div>') +
          '</div><div class="req-r"><button class="btn sm go" data-ok="' + r.id + '">Approve</button><button class="btn sm" data-no="' + r.id + '">Decline</button></div></div>'; }).join("") : '<div class="empty small">Nothing waiting.</div>') +
      '<div class="cal-nav"><a class="link" href="#/leave/team/' + (off - 1) + '">‹</a><b>' + monthName(ref.getFullYear(), ref.getMonth()) + '</b><a class="link" href="#/leave/team/' + (off + 1) + '">›</a></div>' +
      monthGrid(ref.getFullYear(), ref.getMonth(), (iso, dt) => { if (dt.getDay() % 6 === 0) return null; const o = offOn(iso); if (isBankHoliday(iso)) return { cls: "bh" };
        if (!o.length) return null; return { cls: o.some((r) => r.status === "pending") ? "pending" : "approved", html: '<span class="who-off">' + o.slice(0, 3).map((r) => initials(r.userName)).join(" ") + (o.length > 3 ? "+" : "") + "</span>" + (o.length >= CFG.maxOffSameDay ? '<span class="busy"></span>' : "") }; }) +
      '<div class="legend"><span class="approved">Approved</span><span class="pending">Includes waiting</span><span class="bh">Bank holiday</span></div><p class="small" hidden>.</p>';
    document.querySelectorAll(".cal-d[data-d]").forEach((b) => (b.onclick = () => { const o = offOn(b.dataset.d); if (!o.length) return; const sh = sheet("<h3>" + esc(fmtDay(b.dataset.d)) + "</h3>" + o.map((r) => "<p><b>" + esc(r.userName) + "</b> · " + esc(r.type) + " · " + esc(cap(r.status)) + "</p>").join("") + '<button class="btn block" id="x">Close</button>'); $("x").onclick = sh.close; }));
    document.querySelectorAll("[data-ok]").forEach((b) => (b.onclick = async () => { await Data.decide("leave", b.dataset.ok, "approved"); toast("Approved"); IC.refreshView(); }));
    document.querySelectorAll("[data-no]").forEach((b) => (b.onclick = () => {
      const sh = sheet('<h3>Decline request</h3><label class="fl">Reason (shown to them)<textarea id="why" rows="2"></textarea></label><button class="btn primary block" id="go">Decline</button><button class="btn block" id="x">Cancel</button>');
      $("x").onclick = sh.close; $("go").onclick = async () => { await Data.decide("leave", b.dataset.no, "declined", $("why").value.trim()); sh.close(); toast("Declined"); IC.refreshView(); };
    }));
  }

  IC.Leave = { summary, leaveYear, daysOf, pendingForManager: async () => { const ts = await Data.teamSet(); return (await Data.list("leave", "team")).filter((r) => r.status === "pending" && r.user !== Data.profile.email && ts.has(r.user)).length; } };
})();
