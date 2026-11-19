/* iCONSTRUCTE Site: this week (from the site labour planner in iCONSTRUCTE, W2).
 * Liam, 19 Nov: plans change quickly, so the phone shows this week only (and next Monday from Friday), never further
 * ahead, and only where the person signed in is working. Supervisors (feature "crew") also see who is with them on their
 * sites each day. Managers (feature "team-week") also get the whole team's week, as on the desktop planner.
 * The days come from the manifest ("allocations"), which iCONSTRUCTE fills to that window only (SitePublisher.AllocationsTo).
 */
(function () {
  "use strict";
  const { $, esc, isoDate, S, can, jobByFolder, setBar, route } = IC;

  const DAY = 864e5;
  const monday = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dayName = (d) => d.toLocaleDateString("en-GB", { weekday: "short" });
  const dayNum = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const COLOURS = ["#FFE0B2", "#C8E6C9", "#BBDEFB", "#F8BBD0", "#D1C4E9", "#FFF59D", "#B2EBF2"];
  function colourFor(job, map) { if (!map[job]) map[job] = COLOURS[Object.keys(map).length % COLOURS.length]; return map[job]; }

  const all = () => (S.manifest && S.manifest.allocations) || [];
  const me = () => (S.user.emails || []).map((e) => String(e).toLowerCase());
  function nameFor(email) {
    const e = String(email).toLowerCase();
    const t = (IC.DEMO_TEAM || []).find((x) => x[0] === e);
    if (t) return t[1];
    const s = (IC.SAMPLES || []).find((x) => String(x.email).toLowerCase() === e);
    if (s) return s.name;
    return e.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const shortName = (n) => { const w = String(n).split(" "); return w.length > 1 ? w[0] + " " + w[w.length - 1][0] : n; };

  // this week, plus next Monday when it has been published (from Friday)
  function days() {
    const mon = monday(new Date()), list = Array.from({ length: 7 }, (_, i) => addDays(mon, i)), nextMon = addDays(mon, 7);
    if (all().some((a) => a.date === isoDate(nextMon))) list.push(nextMon);
    return list;
  }

  function viewWeek(args) {
    const view = args[0] === "team" && can("team-week") ? "team" : "me";
    const ds = days(), today = isoDate(new Date()), from = isoDate(ds[0]), to = isoDate(ds[ds.length - 1]);
    setBar("This week", "w/c " + dayNum(ds[0]), true);
    const inWeek = all().filter((a) => a.date >= from && a.date <= to);
    const mine = inWeek.filter((a) => me().includes(String(a.email).toLowerCase()));
    const head = can("team-week")
      ? '<div class="row" style="justify-content:center;margin-bottom:12px"><div class="seg"><button data-v="me" class="' + (view === "me" ? "on" : "") + '">Me</button><button data-v="team" class="' + (view === "team" ? "on" : "") + '">Team</button></div></div>'
      : "";
    let body;
    if (view === "me") {
      body = ds.map((d) => {
        const iso = isoDate(d), items = mine.filter((a) => a.date === iso), weekend = d.getDay() % 6 === 0, past = iso < today;
        if (!items.length && (weekend || iso > today && iso > isoDate(ds[6]))) return "";
        const h = '<div class="section-h"' + (iso === today ? ' style="color:var(--brand-orange)"' : past ? ' style="opacity:.6"' : "") + ">" + esc(dayName(d) + " " + dayNum(d)) + (iso === today ? " · today" : iso > isoDate(ds[6]) ? " · next week" : "") + "</div>";
        if (!items.length) return h + '<div class="card small" style="color:var(--sub)">Not on the plan</div>';
        return h + items.map((a) => {
          const job = jobByFolder(a.folder);
          const crew = can("crew") ? inWeek.filter((x) => x.date === iso && x.jobNumber === a.jobNumber && !me().includes(String(x.email).toLowerCase())).map((x) => nameFor(x.email)) : [];
          return '<a class="todo' + (iso === today ? "" : " info") + '"' + (past ? ' style="opacity:.6"' : "") + (job ? ' href="#/job/' + encodeURIComponent(a.folder) + '"' : "") + "><span><b>" + esc(a.jobNumber + (a.site ? " · " + a.site : "")) + '</b><br><span class="small">' + (a.start ? "Start " + esc(a.start) : "Start time TBC") + (a.workingAway ? " · working away" : "") + (a.description ? " · " + esc(a.description) : "") + "</span>" +
            (can("crew") ? '<br><span class="small">' + (crew.length ? "With you: " + esc(crew.join(", ")) : "No one else on the plan") + "</span>" : "") + "</span>" + (job ? "›" : "") + "</a>";
        }).join("");
      }).join("");
      if (!mine.length) body = '<div class="empty">Nothing on the plan for you this week.</div>';
    } else {
      const people = [...new Set(inWeek.map((a) => String(a.email).toLowerCase()))].sort((a, b) => nameFor(a).localeCompare(nameFor(b)));
      const showDays = ds.filter((d) => d.getDay() % 6 !== 0 || inWeek.some((a) => a.date === isoDate(d)));
      const colours = {};
      const cell = (email, d) => {
        const items = inWeek.filter((a) => String(a.email).toLowerCase() === email && a.date === isoDate(d));
        if (!items.length) return '<td class="wk-off"></td>';
        return "<td>" + items.map((a) => '<span class="wk-job" style="background:' + colourFor(a.jobNumber, colours) + '" title="' + esc((a.site || "") + (a.start ? " · start " + a.start : "")) + '">' + esc(a.jobNumber) + "</span>").join("") + (items.length > 1 ? '<span class="wk-clash">2 jobs</span>' : "") + "</td>";
      };
      body = people.length ? '<div class="wk-wrap"><table class="wk"><colgroup><col class="wk-namecol"></colgroup><thead><tr><th></th>' + showDays.map((d) => "<th" + (isoDate(d) === today ? ' class="wk-today"' : "") + ">" + esc(dayName(d)) + "<br><span>" + esc(String(d.getDate())) + "</span></th>").join("") + "</tr></thead><tbody>" +
        people.map((p) => '<tr><th class="wk-name">' + esc(shortName(nameFor(p))) + "</th>" + showDays.map((d) => cell(p, d)).join("") + "</tr>").join("") + "</tbody></table></div>" +
        '<div class="small" style="margin-top:10px">' + Object.keys(colours).map((j) => { const a = inWeek.find((x) => x.jobNumber === j); return '<span class="wk-job" style="background:' + colours[j] + '">' + esc(j) + "</span> " + esc(a && a.site ? a.site : ""); }).join("<br>") + "</div>"
        : '<div class="empty">No one on the plan this week.</div>';
    }
    $("main").innerHTML = head + body + '<p class="small" style="margin-top:14px;color:var(--sub)">From the site labour planner. Plans can change: this shows this week only' + (ds.length > 7 ? " and next Monday" : "") + ". Check with your supervisor if in doubt.</p>";
    document.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => (location.hash = "#/week/" + b.dataset.v)));
  }

  route("week", viewWeek);
})();
