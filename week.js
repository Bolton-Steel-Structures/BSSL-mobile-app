/* iCONSTRUCTE Site: week plan (from the site labour planner in iCONSTRUCTE, W2).
 * "Me": where the planner has me each day this week (or next), with the start time and a link to the job's drawings.
 * "Team" (Managers and Supervisors, feature "team-week"): everyone on the plan, a row each, a day per column, the job in
 * each cell. The plan comes in the site manifest ("allocations", the next 14 days), published by iCONSTRUCTE.
 */
(function () {
  "use strict";
  const { $, esc, isoDate, parseDate, S, can, myWeek, jobByFolder, setBar, route } = IC;

  const DAY = 864e5;
  const monday = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const dayName = (d) => d.toLocaleDateString("en-GB", { weekday: "short" });
  const dayNum = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  // a colour per job, so the same job reads the same across the week
  const COLOURS = ["#FFE0B2", "#C8E6C9", "#BBDEFB", "#F8BBD0", "#D1C4E9", "#FFF59D", "#B2EBF2"];
  function colourFor(job, map) { if (!map[job]) map[job] = COLOURS[Object.keys(map).length % COLOURS.length]; return map[job]; }

  function allAllocations() { return (S.manifest && S.manifest.allocations) || []; }

  function nameFor(email) {
    const e = String(email).toLowerCase();
    const team = (IC.DEMO_TEAM || []).find((t) => t[0] === e);
    if (team) return team[1];
    const s = (IC.SAMPLES || []).find((x) => String(x.email).toLowerCase() === e);
    if (s) return s.name;
    return e.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const shortName = (n) => { const w = String(n).split(" "); return w.length > 1 ? w[0] + " " + w[w.length - 1][0] : n; };

  function viewWeek(args) {
    const off = Number(args[0] || 0) || 0, view = args[1] === "team" && can("team-week") ? "team" : "me";
    const mon = new Date(monday(new Date()).getTime() + off * 7 * DAY);
    const days = Array.from({ length: 7 }, (_, i) => new Date(mon.getTime() + i * DAY));
    const from = isoDate(days[0]), to = isoDate(days[6]), today = isoDate(new Date());
    setBar("Week plan", "w/c " + dayNum(mon), true);
    const nav = '<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<a class="chip" href="#/week/' + (off - 1) + "/" + view + '">‹ Prev</a>' +
      (can("team-week") ? '<div class="seg"><button data-v="me" class="' + (view === "me" ? "on" : "") + '">Me</button><button data-v="team" class="' + (view === "team" ? "on" : "") + '">Team</button></div>' : "<b>" + esc(dayNum(days[0]) + " – " + dayNum(days[6])) + "</b>") +
      '<a class="chip" href="#/week/' + (off + 1) + "/" + view + '">Next ›</a></div>';
    const inWeek = allAllocations().filter((a) => a.date >= from && a.date <= to);
    let body = "";
    if (view === "me") {
      const mine = myWeek().filter((a) => a.date >= from && a.date <= to);
      // myWeek() only has today onwards: earlier days this week come from the full list
      const mineAll = inWeek.filter((a) => (S.user.emails || []).includes(String(a.email).toLowerCase()));
      const list = mineAll.length >= mine.length ? mineAll : mine;
      body = days.map((d) => {
        const iso = isoDate(d), items = list.filter((a) => a.date === iso), weekend = d.getDay() % 6 === 0;
        if (!items.length && weekend) return "";
        const head = '<div class="section-h"' + (iso === today ? ' style="color:var(--brand-orange)"' : "") + ">" + esc(dayName(d) + " " + dayNum(d)) + (iso === today ? " · today" : "") + "</div>";
        if (!items.length) return head + '<div class="card small" style="color:var(--sub)">Not on the plan</div>';
        return head + items.map((a) => {
          const job = jobByFolder(a.folder);
          return '<a class="todo' + (iso === today ? "" : " info") + '"' + (job ? ' href="#/job/' + encodeURIComponent(a.folder) + '"' : "") + "><span><b>" + esc(a.jobNumber + (a.site ? " · " + a.site : "")) + '</b><br><span class="small">' + (a.start ? "Start " + esc(a.start) : "Start time TBC") + (a.workingAway ? " · working away" : "") + (a.description ? " · " + esc(a.description) : "") + "</span></span>" + (job ? "›" : "") + "</a>";
        }).join("");
      }).join("");
      if (!list.length) body = '<div class="empty">Nothing on the plan for you this week.</div>';
    } else {
      const people = [...new Set(inWeek.map((a) => String(a.email).toLowerCase()))].sort((a, b) => nameFor(a).localeCompare(nameFor(b)));
      const showDays = days.filter((d) => d.getDay() % 6 !== 0 || inWeek.some((a) => a.date === isoDate(d)));
      const colours = {};
      const cell = (email, d) => {
        const items = inWeek.filter((a) => String(a.email).toLowerCase() === email && a.date === isoDate(d));
        if (!items.length) return '<td class="wk-off"></td>';
        return '<td>' + items.map((a) => '<span class="wk-job" style="background:' + colourFor(a.jobNumber, colours) + '" title="' + esc((a.site || "") + (a.start ? " · start " + a.start : "")) + '">' + esc(a.jobNumber) + "</span>").join("") + (items.length > 1 ? '<span class="wk-clash">2 jobs</span>' : "") + "</td>";
      };
      body = people.length ? '<div class="wk-wrap"><table class="wk"><colgroup><col class="wk-namecol"></colgroup><thead><tr><th></th>' + showDays.map((d) => "<th" + (isoDate(d) === today ? ' class="wk-today"' : "") + ">" + esc(dayName(d)) + "<br><span>" + esc(String(d.getDate())) + "</span></th>").join("") + "</tr></thead><tbody>" +
        people.map((p) => '<tr><th class="wk-name">' + esc(shortName(nameFor(p))) + "</th>" + showDays.map((d) => cell(p, d)).join("") + "</tr>").join("") + "</tbody></table></div>" +
        '<div class="small" style="margin-top:10px">' + Object.keys(colours).map((j) => {
          const a = inWeek.find((x) => x.jobNumber === j);
          return '<span class="wk-job" style="background:' + colours[j] + '">' + esc(j) + "</span> " + esc(a && a.site ? a.site : "");
        }).join("<br>") + "</div>"
        : '<div class="empty">No one on the plan this week.</div>';
    }
    $("main").innerHTML = nav + body + '<p class="small" style="margin-top:14px;color:var(--sub)">From the site labour planner in iCONSTRUCTE. Changes show next time the app refreshes.</p>';
    document.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => (location.hash = "#/week/" + off + "/" + b.dataset.v)));
  }

  route("week", viewWeek);
})();
