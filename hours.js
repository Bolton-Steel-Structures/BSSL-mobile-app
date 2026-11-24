/* iCONSTRUCTE Site: workshop hours booked to jobs (21 Nov 2026).
 * Fabricators and workshop supervisors clock in and out at the workshop (time.js), then book the hours to the workshop jobs
 * they worked on: a day at a time, job (W number) and hours, or "Not on a job" (maintenance, cleaning, training, waiting).
 * Supervisors can also book for the people they look after. The booked hours go to iCONSTRUCTE under the job and the
 * person (with Azure), and a weekly Excel file for payroll is made from the clocked and booked hours: no pay or rates.
 * Records: kind "wshours" { date, wno, hours, note, person, personName, bookedBy, status: "booked" | "removed" }.
 */
(function () {
  "use strict";
  const { $, esc, S, Data, can, setBar, sheet, toast, fmtDay, isoDate, parseDate, route } = IC;
  const NOT_ON_JOB = "_none";
  const jobs = () => (S.manifest && S.manifest.workshop) || [];
  const jobName = (wno) => (wno === NOT_ON_JOB ? "Not on a job" : wno);
  const jobSub = (wno) => { const j = jobs().find((x) => x.wno === wno); return j ? [j.client, j.site, j.phase].filter(Boolean).join(" · ") : ""; };
  const me = () => (Data.profile || {}).email || "";
  const h1 = (n) => (Math.round(n * 100) / 100).toString().replace(/\.0+$/, "");
  const fmtH = (n) => h1(n) + " h";

  // The workshop staff who clock in (book their own hours). Demo: the sample logins plus two more; live: from the API.
  function people() {
    const ws = (IC.SAMPLES || []).filter((u) => ["Workshop Supervisor", "Fabricator/Welder"].includes(u.role)).map((u) => ({ email: u.email, name: u.name }));
    if (IC.DEMO) ws.push({ email: "j.hughes@example.com", name: "Jake Hughes" }, { email: "r.patel@example.com", name: "Ravi Patel" });
    return ws;
  }
  const nameOf = (email) => (people().find((p) => p.email === email) || {}).name || (email === me() ? (Data.profile || {}).name : email);

  function weekStart(off) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + off * 7); return d; }
  const days = (ws) => Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(d.getDate() + i); return d; });

  // clocked hours per person per day, from the workshop clock-in / out records
  function clocked(time, email, day) {
    const list = time.filter((t) => t.user === email && IC.sameDay(t.at, day)).sort((a, b) => a.at.localeCompare(b.at));
    let ms = 0, open = null, inAt = null, outAt = null;
    for (const t of list) {
      if (t.type === "in") { open = t; inAt = inAt || t.at; }
      else if (t.type === "out" && open) { ms += new Date(t.at) - new Date(open.at); open = null; outAt = t.at; }
    }
    return { hours: ms / 36e5, paid: IC.paidMs(ms) / 36e5, inAt, outAt, open: !!open };
  }
  const booked = (all, email, day) => all.filter((b) => b.person === email && b.status !== "removed" && b.date === isoDate(day));

  async function load() { return { time: await Data.list("time", "team"), hrs: await Data.list("wshours", "team") }; }

  // ---------------------------------------------------------------- my hours (or a person's, for supervisors)
  async function viewWeek(args) {
    const off = Number(args[0] || 0), person = args[1] ? decodeURIComponent(args[1]) : me();
    if (person !== me() && !can("ws-hours-team")) { location.hash = "#/hours"; return; }
    const ws = weekStart(off), { time, hrs } = await load();
    setBar(person === me() ? "My hours" : nameOf(person), "Week of " + fmtDay(ws), true);
    const base = "#/hours/";
    const tot = { c: 0, b: 0 };
    const body = days(ws).map((d) => {
      const c = clocked(time, person, d), b = booked(hrs, person, d), bh = b.reduce((n, x) => n + x.hours, 0);
      tot.c += c.paid; tot.b += bh;
      if (!c.hours && !b.length && (d.getDay() === 0 || d.getDay() === 6)) return "";
      const left = Math.max(0, Math.round((c.paid - bh) * 4) / 4);
      return '<div class="ts-day"><div class="ts-d">' + esc(fmtDay(d)) + "<b>" + (c.hours ? "clocked " + fmtH(c.hours) + (c.paid !== c.hours ? " · paid " + fmtH(c.paid) : "") : c.open ? "clocked in" : "not clocked") + "</b></div>" +
        b.map((x) => '<div class="ts-row hr-row" data-id="' + esc(x.id) + '"><div><b>' + esc(jobName(x.wno)) + '</b> <span class="small">' + esc(jobSub(x.wno)) + "</span>" + (x.note ? '<div class="small">' + esc(x.note) + "</div>" : "") +
          (x.bookedBy && x.bookedBy !== x.person ? '<div class="small">Booked by ' + esc(x.bookedByName || x.bookedBy) + "</div>" : "") + "</div><span>" + fmtH(x.hours) + "</span></div>").join("") +
        '<div class="hr-foot"><span class="small">' + (b.length ? "Booked " + fmtH(bh) + (c.hours ? (left > 0 ? " · " + fmtH(left) + " still to book" : bh > c.paid + 0.25 ? " · more than paid time" : " · all booked") : "") : c.hours ? fmtH(left) + " to book" : "") + "</span>" +
        (can("ws-hours") ? '<button type="button" class="btn small-btn" data-book="' + isoDate(d) + '">Book hours</button>' : "") + "</div></div>";
    }).join("");
    $("main").innerHTML = '<div class="row nav-week"><a class="btn" href="' + base + (off - 1) + (person !== me() ? "/" + encodeURIComponent(person) : "") + '">‹ Previous</a>' + (off < 0 ? '<a class="btn" href="' + base + (off + 1) + (person !== me() ? "/" + encodeURIComponent(person) : "") + '">Next ›</a>' : "") + "</div>" +
      '<div class="tot-line">Paid <b>' + fmtH(tot.c) + "</b> · booked to jobs <b>" + fmtH(tot.b) + '</b></div><div class="small">Paid = clocked less the 30-minute unpaid lunch on a day over 6 hours. The morning brew is paid, so book it to the job you were on.</div>' + body +
      (can("ws-hours-team") ? '<a class="btn block" href="#/hours-team/' + off + '">Workshop team hours</a>' : "");
    $("main").querySelectorAll("[data-book]").forEach((b) => (b.onclick = () => bookSheet(b.dataset.book, person, () => viewWeek(args))));
    $("main").querySelectorAll(".hr-row").forEach((r) => (r.onclick = () => removeSheet(hrs.find((x) => x.id === r.dataset.id), () => viewWeek(args))));
  }

  // book hours for a day: job, hours, note. Supervisors can pick the person.
  function bookSheet(dateIso, person, done, presetJob) {
    const team = can("ws-hours-team") ? people() : [];
    const sh = sheet("<h3>Book hours</h3><p>" + esc(fmtDay(parseDate(dateIso))) + "</p>" +
      (team.length ? '<label class="fl">Person<select id="hPerson">' + team.map((p) => '<option value="' + esc(p.email) + '"' + (p.email === person ? " selected" : "") + ">" + esc(p.name) + "</option>").join("") + (team.some((p) => p.email === me()) ? "" : '<option value="' + esc(me()) + '"' + (person === me() ? " selected" : "") + ">Me</option>") + "</select></label>" : "") +
      '<label class="fl">Job<select id="hJob">' + jobs().map((j) => '<option value="' + esc(j.wno) + '"' + (j.wno === presetJob ? " selected" : "") + ">" + esc(j.wno + " · " + [j.client, j.phase].filter(Boolean).join(" · ")) + "</option>").join("") +
      '<option value="' + NOT_ON_JOB + '">Not on a job (maintenance, cleaning, training, waiting)</option></select></label>' +
      '<label class="fl">Hours<input id="hHours" type="number" inputmode="decimal" min="0.25" max="16" step="0.25" placeholder="e.g. 4.5"></label>' +
      '<label class="fl">Note (optional)<input id="hNote" type="text" placeholder="e.g. welding cleats on B101"></label>' +
      '<button class="btn primary block" id="hGo">Book</button><button class="btn block" id="hNo">Cancel</button>');
    sh.q("#hNo").onclick = () => sh.close();
    sh.q("#hGo").onclick = async () => {
      const hours = Math.round(Number(sh.q("#hHours").value) * 4) / 4, who = sh.q("#hPerson") ? sh.q("#hPerson").value : person, wno = sh.q("#hJob").value;
      if (!(hours > 0) || hours > 16) { toast("Enter the hours, in quarter hours (0.25 to 16)"); return; }
      const { time, hrs } = await load(), c = clocked(time, who, parseDate(dateIso)), already = booked(hrs, who, parseDate(dateIso)).reduce((n, x) => n + x.hours, 0);
      if (c.hours && already + hours > c.paid + 0.25 && !confirm("That books " + fmtH(already + hours) + " against " + fmtH(c.paid) + " paid time (clocked less lunch). Book it anyway?")) return;
      await Data.save("wshours", { date: dateIso, wno, hours, note: sh.q("#hNote").value.trim(), person: who, personName: nameOf(who), bookedBy: me(), bookedByName: (Data.profile || {}).name || "", status: "booked" });
      sh.close(); toast(fmtH(hours) + " booked to " + jobName(wno)); done();
    };
  }
  // take a booking back: your own, or anyone's for supervisors (kept as removed, never deleted)
  function removeSheet(rec, done) {
    if (!rec) return;
    const mineOrTeam = rec.person === me() || rec.bookedBy === me() || can("ws-hours-team");
    const sh = sheet("<h3>" + esc(jobName(rec.wno)) + " · " + fmtH(rec.hours) + "</h3><p>" + esc(fmtDay(parseDate(rec.date)) + " · " + (rec.personName || rec.person)) + "</p>" +
      (mineOrTeam && can("ws-hours") ? '<button class="btn danger block" id="hDel">Remove this booking</button>' : "") + '<button class="btn block" id="hNo">Close</button>');
    sh.q("#hNo").onclick = () => sh.close();
    if (sh.q("#hDel")) sh.q("#hDel").onclick = async () => { rec.status = "removed"; rec.removedBy = me(); rec.removedAt = new Date().toISOString(); await Data.save("wshours", rec); sh.close(); toast("Booking removed"); done(); };
  }

  // ---------------------------------------------------------------- the workshop team's week, and the payroll file
  async function viewTeam(args) {
    const off = Number(args[0] || 0), ws = weekStart(off), { time, hrs } = await load();
    // Monday to Friday, plus a weekend day when anyone clocked or booked hours on it
    const dd = days(ws).filter((d) => d.getDay() % 6 || people().some((p) => clocked(time, p.email, d).hours || booked(hrs, p.email, d).length));
    setBar("Workshop team hours", "Week of " + fmtDay(ws), true);
    const rows = people().map((p) => {
      const per = dd.map((d) => ({ c: clocked(time, p.email, d).paid, b: booked(hrs, p.email, d).reduce((n, x) => n + x.hours, 0) }));
      return { p, per, c: per.reduce((n, x) => n + x.c, 0), b: per.reduce((n, x) => n + x.b, 0) };
    });
    $("main").innerHTML = '<div class="row nav-week"><a class="btn" href="#/hours-team/' + (off - 1) + '">‹ Previous</a>' + (off < 0 ? '<a class="btn" href="#/hours-team/' + (off + 1) + '">Next ›</a>' : "") + "</div>" +
      '<div class="small">Paid (clocked less unpaid lunch) / booked to jobs, hours. Tap a person to see or book their days.</div>' +
      '<div class="wk-wrap"><table class="tbl hrs"><tr><th>Name</th>' + dd.map((d) => "<th>" + esc(fmtDay(d).split(" ").slice(0, 2).join(" ")) + "</th>").join("") + "<th>Week</th></tr>" +
      rows.map((r) => '<tr><td><a href="#/hours/' + off + "/" + encodeURIComponent(r.p.email) + '">' + esc(r.p.name) + "</a></td>" + r.per.map((x) => '<td class="' + (x.c && x.b < x.c - 0.25 ? "hr-short" : "") + '">' + (x.c || x.b ? h1(x.c) + " / " + h1(x.b) : "") + "</td>").join("") + "<td><b>" + h1(r.c) + " / " + h1(r.b) + "</b></td></tr>").join("") + "</table></div>" +
      (can("ws-payroll") ? '<button class="btn primary block" id="hXlsx">Weekly spreadsheet for payroll (Excel)</button>' : "");
    if ($("hXlsx")) $("hXlsx").onclick = () => payrollFile(ws, time, hrs);
  }

  function payrollFile(ws, time, hrs) {
    const dd = days(ws), we = isoDate(dd[6]), ukd = (d) => d.toLocaleDateString("en-GB"), t = (at) => (at ? new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "");
    const inWeek = hrs.filter((b) => b.status !== "removed" && b.date >= isoDate(ws) && b.date <= we);
    const pay = [["Name", "Hours clocked", "Unpaid lunch", "Paid hours", "Hours booked to jobs", "Paid not booked", "Days worked", "Days not clocked out"]];
    const detail = [["Date", "Name", "Clocked in", "Clocked out", "Hours clocked", "Paid hours", "Job", "Client", "Site", "Phase", "BSS job", "Hours booked", "Note", "Booked by"]];
    const byJob = {};
    for (const p of people()) {
      let c = 0, pd = 0, b = 0, worked = 0, notOut = 0;
      for (const d of dd) {
        const k = clocked(time, p.email, d), bk = booked(hrs, p.email, d), bh = bk.reduce((n, x) => n + x.hours, 0);
        c += k.hours; pd += k.paid; b += bh; if (k.hours || bh) worked++; if (k.open) notOut++;
        if (!k.hours && !bk.length) continue;
        (bk.length ? bk : [null]).forEach((x, i) => {
          const j = x ? jobs().find((y) => y.wno === x.wno) || {} : {};
          detail.push([ukd(d), p.name, i ? "" : t(k.inAt), i ? "" : t(k.outAt), i ? "" : Math.round(k.hours * 100) / 100, i ? "" : Math.round(k.paid * 100) / 100, x ? jobName(x.wno) : "", j.client || "", j.site || "", j.phase || "", j.bssJob || "", x ? x.hours : "", x ? x.note || "" : "", x ? x.bookedByName || "" : ""]);
        });
      }
      const r2 = (n) => Math.round(n * 100) / 100;
      pay.push([p.name, r2(c), r2(c - pd), r2(pd), r2(b), r2(Math.max(0, pd - b)), worked, notOut]);
    }
    inWeek.forEach((x) => { const k = x.wno; byJob[k] = byJob[k] || { h: 0, who: new Set() }; byJob[k].h += x.hours; byJob[k].who.add(x.personName || x.person); });
    const jobRows = [["Job", "Client", "Site", "Phase", "BSS job", "Hours", "People"]].concat(Object.keys(byJob).sort().map((k) => { const j = jobs().find((y) => y.wno === k) || {}; return [jobName(k), j.client || "", j.site || "", j.phase || "", j.bssJob || "", byJob[k].h, [...byJob[k].who].join(", ")]; }));
    const blob = IC.Xlsx.build([{ name: "Payroll", rows: pay, widths: [24, 14, 13, 12, 20, 15, 12, 20] }, { name: "By job", rows: jobRows, widths: [14, 24, 24, 10, 10, 8, 40] }, { name: "Detail", rows: detail, widths: [11, 20, 10, 11, 13, 11, 12, 22, 22, 8, 10, 12, 30, 18] }]);
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Workshop timesheet w-c " + isoDate(ws) + ".xlsx";
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  route("hours", (args) => viewWeek(args));
  route("hours-team", (args) => viewTeam(args));
  IC.WsHours = { bookSheet, people };
})();
