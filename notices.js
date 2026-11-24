/* iCONSTRUCTE Site: company notices (23 Nov 2026).
 * Short one-way posts from management on everyone's Home: "Yard closed 24 Dec", "Welcome to Ben, starting Monday".
 * Posted by managers and the HR Admin, to everyone or to site, workshop or office, shown until a date. No comments or likes.
 * Company information only: no personal data (no birthdays, health, pay). Stored like other app records ("notices").
 */
(function () {
  "use strict";
  const { $, esc, fmtDate, fmtDay, isoDate, uid, Data, DEMO, LS, can, toast, setBar, route } = IC;
  const AUD = ["Everyone", "Site", "Workshop", "Office"];

  const canPost = () => can("manager") || can("hr-admin");
  // where this person works, for the audience: directors (both sides) see every notice
  const myArea = () => (can("drawings") && can("workshop") ? "All" : can("drawings") ? "Site" : can("workshop") ? "Workshop" : "Office");
  const forMe = (n) => n.audience === "Everyone" || myArea() === "All" || n.audience === myArea();
  const live = (n) => !n.removed && (!n.until || n.until >= isoDate(new Date()));
  const seen = () => new Set(LS.get("noticesSeen", []));

  async function ensureDemo() {
    if (!DEMO || LS.get("noticesSeeded", 0) === 1 && (await Data.list("notices", "team")).length) return;
    const d = (off) => { const x = new Date(); x.setDate(x.getDate() + off); return isoDate(x); };
    const at = (off) => { const x = new Date(); x.setDate(x.getDate() + off); x.setHours(8, 5, 0, 0); return x.toISOString(); };
    const put = (rec) => { const r = Object.assign({ id: uid(), user: "", userName: rec.postedBy }, rec); return IC.Store.put({ key: "notices:" + r.id, kind: "notices", rec: r }, "records"); };
    await put({ title: "Christmas shutdown", body: "The yard, workshop and office close at 12:00 on Thursday 24 December and reopen on Monday 4 January. Book the days in between as holiday in the app.", audience: "Everyone", postedBy: "Alex Morgan", postedAt: at(-1), until: d(45), pinned: true });
    await put({ title: "Welcome, Aisha", body: "Aisha Patel joins the workshop as a welder fabricator this Friday. Say hello.", audience: "Workshop", postedBy: "Paul Shaw", postedAt: at(-1), until: d(7) });
    await put({ title: "Whistleblowing: please read and sign", body: "The whistleblowing policy is now in the app under My HR. If something feels wrong, unsafe or dishonest, speak up.", audience: "Everyone", postedBy: "Alex Morgan", postedAt: at(0), until: d(14) });
    await put({ title: "Exclusion zones on Unit 4", body: "Crane lifts all week at Example Retail Park. Keep out of the marked zones and follow the lift plan.", audience: "Site", postedBy: "Sam Carter", postedAt: at(-2), until: d(5) });
    LS.set("noticesSeeded", 1);
  }

  async function list() {
    await ensureDemo();
    return (await Data.list("notices", "team")).filter((n) => live(n) && forMe(n))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.postedAt || "").localeCompare(a.postedAt || ""));
  }
  const card = (n, isNew) => '<div class="notice' + (n.pinned ? " pinned" : "") + '"><div class="notice-h"><b>' + esc(n.title) + "</b>" + (isNew ? '<span class="pill new">New</span>' : "") + "</div>" +
    '<div class="notice-b">' + esc(n.body).replace(/\n/g, "<br>") + '</div><div class="small">' + esc(n.postedBy + " · " + fmtDay(n.postedAt) + (n.audience !== "Everyone" ? " · " + n.audience : "")) + "</div></div>";

  // Home: the latest three (pinned first)
  async function homeHtml() {
    const all = await list(), s = seen();
    const top = all.slice(0, 3);
    if (!top.length && !canPost()) return "";
    return '<div class="section-h">Notices' + (all.length > 3 || canPost() ? ' <a href="#/notices" class="sh-link">' + (all.length ? "All " + all.length : "Post one") + " ›</a>" : "") + "</div>" +
      (top.length ? top.map((n) => card(n, !s.has(n.id))).join("") : '<div class="empty small">No notices. Managers can post one.</div>');
  }
  // what's been shown on Home counts as seen
  async function markSeen() { const s = seen(); (await list()).slice(0, 3).forEach((n) => s.add(n.id)); LS.set("noticesSeen", [...s].slice(-200)); }

  route("notices", async (args) => {
    if (args[0] === "new") return post();
    setBar("Notices", "From the office", true);
    const all = await list(), s = seen();
    const mine = canPost() ? (await Data.list("notices", "team")).filter((n) => !n.removed && n.postedBy === Data.profile.name) : [];
    $("main").innerHTML = (canPost() ? '<a class="btn primary block" href="#/notices/new">Post a notice</a>' : "") +
      (all.length ? all.map((n) => card(n, !s.has(n.id)) + (mine.some((m) => m.id === n.id) || can("hr-admin") ? '<button class="btn sm" data-rm="' + esc(n.id) + '">Take down</button>' : "")).join("") : '<div class="empty">No notices at the moment.</div>');
    all.forEach((n) => s.add(n.id)); LS.set("noticesSeen", [...s].slice(-200));
    document.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = async () => {
      if (!(await IC.ask("Take this notice down?", "Take down"))) return;
      const n = await Data.get("notices", b.dataset.rm); n.removed = true; await Data.save("notices", n); toast("Taken down"); IC.refreshView();
    }));
  });

  function post() {
    if (!canPost()) { location.hash = "#/notices"; return; }
    setBar("Post a notice", "Shown on Home", true);
    const until = new Date(); until.setDate(until.getDate() + 14);
    $("main").innerHTML = '<div class="card"><label class="fl">Headline<input id="nT" maxlength="60" placeholder="e.g. Yard closed Friday afternoon"></label>' +
      '<label class="fl">Message<textarea id="nB" rows="4" maxlength="500"></textarea></label>' +
      '<label class="fl">Who it\'s for<select id="nA">' + AUD.map((a) => "<option>" + a + "</option>").join("") + "</select></label>" +
      '<label class="fl">Show until<input id="nU" type="date" value="' + isoDate(until) + '"></label>' +
      '<label class="confirm"><input type="checkbox" id="nP"><span>Pin it to the top</span></label>' +
      '<p class="small">Notices are for company news. Keep personal details out: no health, pay or home matters.</p>' +
      '<button class="btn primary block" id="nGo">Post</button></div>';
    $("nGo").onclick = async () => {
      if (!$("nT").value.trim() || !$("nB").value.trim()) { toast("Add a headline and a message"); return; }
      await Data.save("notices", { title: $("nT").value.trim(), body: $("nB").value.trim(), audience: $("nA").value, until: $("nU").value, pinned: $("nP").checked, postedBy: Data.profile.name, postedAt: new Date().toISOString(), user: "" });
      toast("Posted"); location.hash = "#/notices";
    };
  }

  IC.Notices = { homeHtml, markSeen, canPost };
})();
