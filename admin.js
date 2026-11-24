/* iCONSTRUCTE Site: App admin (23 Nov 2026).
 * Once the app is live, Alex Morgan runs it from here with a power-user account (permission app-admin):
 *   Permissions     every role down the top, every feature down the side: tick who gets what
 *   People          each person's sign-in, BSS / workshop, up to three roles, line manager, deputy, van, clocking
 *   Desktop pages   which roles open which iCONSTRUCTE desktop pages, and who can change what there
 *   Action owners   who each kind of action goes to
 *   Changes         every save: when, who, what
 * The tables follow the owner's "Roles and access privileges" workbook; People, Desktop pages and Action owners can be
 * brought in from that workbook, and everything goes back out to Excel. Saved to the server (/api/settings), so a
 * change takes effect at people's next sign-in or refresh, with no new release of the app.
 */
(function () {
  "use strict";
  const { $, esc, fmtDay, fmtTime, can, Settings, ROLE_LABEL, Data, toast, setBar, route, CFG } = IC;

  // starting tables, from the roles workbook (23 Nov); people's names are left out of the action owners
  const DEFAULTS = {"desktop": [{"name": "Job Cards", "what": "Jobs, prices and budgets; Fab Issue, Delivery Note and Site Issue start here", "status": "Now", "roles": ["Manager", "Accounts", "Admin", "Estimators", "Project Managers", "Draughtsmen", "QA Manager"], "notes": ""}, {"name": "Quotes", "what": "Enquiries and quotes, new quotes from an email, monthly quote chase", "status": "Now", "roles": ["Manager", "Accounts", "Admin", "Estimators", "Project Managers", "Draughtsmen", "QA Manager"], "notes": ""}, {"name": "People", "what": "Customers, suppliers and contacts; preferred suppliers and categories", "status": "Now", "roles": ["Manager", "Accounts"], "notes": ""}, {"name": "Orders", "what": "Purchase orders; print and email orders", "status": "Now", "roles": ["Manager", "Accounts", "Admin", "Estimators", "Project Managers", "Draughtsmen", "QA Manager"], "notes": ""}, {"name": "Goods In", "what": "Deliveries coming in; mark received; Goods In schedule printout", "status": "Now", "roles": ["Manager", "Admin", "Project Managers", "QA Manager"], "notes": ""}, {"name": "Goods Out", "what": "Delivery notes leaving the works: board and list, dispatch, complete", "status": "Now", "roles": ["Manager", "Admin", "Project Managers", "QA Manager"], "notes": ""}, {"name": "Plant", "what": "Plant hire orders, rates and off-hires", "status": "Now", "roles": ["Manager", "Accounts", "Admin", "Project Managers"], "notes": ""}, {"name": "Actions", "what": "Everyone's to-do list: RAMS, crane plans, bolts, budgets, deliveries, attendance, NCRs, calibration", "status": "Now", "roles": ["Manager", "Accounts", "Admin", "Estimators", "Project Managers", "Draughtsmen", "QA Manager"], "notes": ""}, {"name": "Site Labour", "what": "12-week site labour planner, WhatsApp instructions, attendance, wages CSV", "status": "Now", "roles": ["Manager", "Admin", "Project Managers", "QA Manager"], "notes": ""}, {"name": "NCRs", "what": "Non-conformance reports, QP08 details, trend review", "status": "Now", "roles": ["Manager", "Accounts", "Admin", "Estimators", "Project Managers", "Draughtsmen", "QA Manager"], "notes": ""}, {"name": "Equipment register", "what": "Torque wrenches and other measuring equipment: owner, reference, calibration", "status": "Now", "roles": ["Manager", "Admin", "Project Managers", "QA Manager"], "notes": "New (built 22 Nov)."}, {"name": "Employees", "what": "Name, initials, role and work log only (personal data moves to HR on Azure)", "status": "Now", "roles": ["Manager", "Accounts"], "notes": ""}, {"name": "Admin", "what": "Company details, logo and system settings", "status": "Now", "roles": ["Manager", "Accounts"], "notes": ""}, {"name": "Drawing Office", "what": "Detailing allocation: draughtsmen and subcontract detailers", "status": "Planned", "roles": ["Manager", "Admin", "Project Managers", "Draughtsmen"], "notes": ""}, {"name": "Workshop planner", "what": "6-8 week workshop look-ahead by Fab Issue", "status": "Planned", "roles": ["Manager", "Admin", "Workshop Director", "Workshop Manager", "Workshop Admin", "Workshop Supervisor"], "notes": "Planned."}, {"name": "Invoices", "what": "Supplier invoices matched to orders, Excel file (P7)", "status": "Planned", "roles": ["Manager", "Accounts", "Admin", "Project Managers", "QA Manager"], "notes": ""}, {"name": "Workshop invoices", "what": "Supplier invoices for the workshop's own jobs", "status": "Now", "roles": ["Manager", "Workshop Director", "Workshop Manager", "Workshop Admin", "Workshop Accounts"], "notes": "In the workshop's own iCONSTRUCTE."}, {"name": "Workshop equipment", "what": "The workshop's equipment register: owner, reference, calibration", "status": "Now", "roles": ["Manager", "Workshop Director", "Workshop Manager", "Workshop Admin", "Workshop Supervisor"], "notes": "In the workshop's own iCONSTRUCTE."}, {"name": "Workshop employees", "what": "Workshop staff: name, initials, role and work log", "status": "Now", "roles": ["Manager", "Workshop Director", "Workshop Manager", "Workshop Admin", "Workshop Accounts"], "notes": "In the workshop's own iCONSTRUCTE."}, {"name": "Workshop admin", "what": "The workshop's company details, logo and settings", "status": "Now", "roles": ["Manager", "Workshop Director", "Workshop Manager", "Workshop Admin"], "notes": "In the workshop's own iCONSTRUCTE."}], "changes": [{"name": "Site labour planner", "what": "Change the planner, rows, start times and labour list", "status": "Ticks set now (Planner editors)", "roles": ["Manager", "Project Managers"], "notes": ""}, {"name": "Confirm site attendance", "what": "Books labour and travel hours to job cards", "status": "Ticks set now (Planner editors)", "roles": ["Manager", "Project Managers"], "notes": ""}, {"name": "Wages CSV / timesheet", "what": "Clock times, travel and overtime for wages", "status": "Ticks set now (Planner editors)", "roles": ["Manager", "Accounts", "Admin"], "notes": ""}, {"name": "Default action owners", "what": "Who new actions of each type go to", "status": "Open to everyone now", "roles": [], "notes": ""}, {"name": "Company details and settings", "what": "Address, logo and system settings on every printout", "status": "Open to everyone now", "roles": ["Manager"], "notes": ""}, {"name": "Complete / close job cards", "what": "Takes a job off the live lists", "status": "Open to everyone now", "roles": ["Manager", "Admin"], "notes": ""}, {"name": "Raise and email purchase orders", "what": "Commits BSS to spend", "status": "Open to everyone now", "roles": ["Manager", "Accounts", "Admin", "Estimators", "Project Managers", "Draughtsmen", "QA Manager"], "notes": ""}, {"name": "Send quote chase emails", "what": "Monthly email per customer of live quotes", "status": "Open to everyone now", "roles": ["Manager", "Estimators"], "notes": "New. To be confirmed."}, {"name": "Close NCRs", "what": "QP08 verification and close-out", "status": "Open to everyone now", "roles": ["Manager", "QA Manager"], "notes": "New."}, {"name": "Equipment register", "what": "Add equipment, record calibration", "status": "Open to everyone now", "roles": ["Manager", "Project Managers", "QA Manager"], "notes": "New."}, {"name": "Drawing office allocation", "what": "Who details which job, and when", "status": "Planned", "roles": ["Manager", "Project Managers", "Draughtsmen"], "notes": ""}, {"name": "Approve supplier invoices", "what": "Marks invoices approved and makes the Excel file", "status": "Planned (P7)", "roles": ["Manager", "Accounts", "Admin", "Estimators", "Project Managers", "QA Manager"], "notes": ""}, {"name": "See costs and budgets", "what": "Prices, budgets and spend on job cards and orders", "status": "Not built: tick if wanted", "roles": ["Manager", "Accounts", "Admin", "Estimators", "Project Managers", "Draughtsmen", "QA Manager"], "notes": ""}], "actions": [{"type": "RAMS", "when": "RAMS ticked as required on a job card", "to": "", "pm": false, "notes": ""}, {"type": "Crane plan", "when": "Crane plan ticked as required on a job card", "to": "", "pm": false, "notes": ""}, {"type": "Bolts", "when": "A Fab Issue is saved (bolts for that phase)", "to": "", "pm": true, "notes": ""}, {"type": "Transport order", "when": "External transport on a delivery note", "to": "", "pm": false, "notes": ""}, {"type": "Finisher order", "when": "Galvanising / painting needed with no order", "to": "", "pm": false, "notes": ""}, {"type": "Delivery note", "when": "A delivery note due today or tomorrow, not dispatched", "to": "", "pm": false, "notes": ""}, {"type": "Proof of delivery", "when": "Haulier delivery dispatched, signed copy not back", "to": "", "pm": false, "notes": ""}, {"type": "Plant hire rates", "when": "Plant hire saved with no rates", "to": "", "pm": false, "notes": ""}, {"type": "Plant off-hire", "when": "Plant hire end date within 2 days", "to": "", "pm": false, "notes": ""}, {"type": "Budget", "when": "New job card saved with no budgets (goes to the creator)", "to": "Estimators", "pm": true, "notes": ""}, {"type": "Site attendance", "when": "Yesterday's site attendance to confirm", "to": "", "pm": false, "notes": ""}, {"type": "Quote follow-up", "when": "Monthly: live submitted quotes to chase, one email per customer", "to": "Estimators", "pm": false, "notes": "To be confirmed."}, {"type": "NCR action", "when": "NCR raised with a corrective action due", "to": "QA Manager", "pm": true, "notes": "both"}, {"type": "NCR check", "when": "NCR action done, effectiveness check due", "to": "QA Manager", "pm": true, "notes": "both"}, {"type": "Calibration due", "when": "Equipment register item due for calibration", "to": "QA Manager", "pm": false, "notes": "New."}, {"type": "Meeting action", "when": "Added at the production meeting", "to": "whoever is actioned", "pm": false, "notes": ""}, {"type": "General", "when": "Added by hand", "to": "whoever is actioned", "pm": false, "notes": ""}]};
  const label = (r) => ROLE_LABEL[r] || r;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const TABS = [["permissions", "Permissions"], ["people", "People"], ["desktop", "Desktop pages"], ["actions", "Action owners"], ["changes", "Changes"]];

  // the features the app checks, in plain words, grouped as on the workbook
  function features() {
    const forms = IC.Forms.templates.filter((t) => !t.retired && !t.internal && !["rams", "ppe", "vehicle", "wscheck"].includes(t.id));
    return [
      ["Me", [["leave", "Holidays", "Request, balance, team calendar"], ["expenses", "Expenses", "Claims with receipts, mileage"], ["hr", "My HR", "Own details, documents to sign, absence"],
        ["cards", "My cards", "Competency cards, weld certificates"], ["form:ppe", "Request PPE", "New or replacement"], ["form:vehicle", "Daily vehicle check", "Van drivers"]]],
      ["Site", [["drawings", "Drawings for my jobs", "Current drawings, offline"], ["all-jobs", "All live projects", "Not just the jobs they're on"], ["rams", "RAMS and crane plans", "Read and sign"],
        ["time", "Check in / out on site", "Location checked, timesheet"], ["week", "This week: my days", "Where I'm working"], ["crew", "This week: who's with me", "Who is on my sites"],
        ["team-week", "This week: whole team", "Everyone's week"], ["model", "3D model", "View the job's model"], ["erect", "Mark steel erected", "Erected, bolted and checked"], ["qa", "QA by job", "Inspections, snags, certificate"]]],
      ["Forms", [["form:*", "Every form", "Ticks all the forms below"]].concat(forms.map((t) => ["form:" + t.id, t.title, t.group || ""]))],
      ["Workshop", [["workshop", "Workshop dashboard and QA lists", "Jobs, % complete, status by line"], ["fab-mark", "Mark lines", "Fabricated, welded, checked, loaded"], ["fab-correct", "Undo anyone's mark", ""],
        ["fab-ready", "Told when a load is ready", "Checked and loaded"], ["ws-hours", "Clock in / out at the workshop", "At the premises only; my hours"], ["ws-hours-team", "Workshop hours", "Who's in, team hours"],
        ["ws-payroll", "Workshop payroll sheet", ""], ["form:wscheck", "Equipment checks", "Forklift, overhead crane, Geka, compressor, bandsaws, pillar drill"], ["equip-check", "Equipment checker", "Told when a check is due"], ["equip-review", "Review equipment checks", "Register and every check"], ["weld", "My welding set", "Certificate and Monday check"], ["weld-admin", "Welding sets", "Assign, import certificates, verify the week"], ["ws-performance", "Workshop hours v allocated", "By job, activity, pauses"], ["board", "Wall board", "Open on a TV screen"]]],
      ["Management", [["manager", "Manager tools", "Approvals, alerts, PPE requests, team HR, new starters, notices"], ["hr-admin", "HR: every record", "Full records, documents, starters, leavers"],
        ["hr-workshop", "HR: workshop staff records", "Full records, workshop staff only"], ["screens", "Screens login", "TV wall board only"], ["app-admin", "App admin", "This page"]]]
    ];
  }
  const roleOrder = (roles) => { const first = ["Manager", "Workshop Director", "App Admin", "HR Admin", "Accounts", "Admin", "Estimators", "Project Managers", "Draughtsmen", "QA Manager", "Supervisor", "Operative", "Operative (welder)",
    "Workshop Manager", "Workshop Admin", "Workshop Accounts", "Workshop Supervisor", "Fabricator/Welder", "Equipment Checker", "Screens"];
    return first.filter((r) => roles[r]).concat(Object.keys(roles).filter((r) => !first.includes(r)).sort()); };

  // the working copy: edits stay here until Save
  let draft = null, base = null, dirty = 0;
  function start() {
    const s = Settings.cur || {};
    base = { roles: clone(Settings.roles()), people: clone(s.people || []), desktop: clone(s.desktop || DEFAULTS.desktop), changes: clone(s.changes || DEFAULTS.changes), actions: clone(s.actions || DEFAULTS.actions) };
    draft = clone(base); dirty = 0;
  }
  const touch = () => { dirty++; const b = $("adSave"); if (b) { b.disabled = false; b.textContent = "Save changes"; } const u = $("adUndo"); if (u) u.hidden = false; };
  window.addEventListener("beforeunload", (e) => { if (dirty && location.hash.startsWith("#/admin")) { e.preventDefault(); e.returnValue = ""; } });

  // what changed, in words, for the Changes log
  function summary() {
    const out = [];
    const roles = new Set(Object.keys(base.roles).concat(Object.keys(draft.roles)));
    roles.forEach((r) => {
      if (!base.roles[r]) { out.push("New role " + label(r)); return; }
      if (!draft.roles[r]) { out.push("Removed role " + label(r)); return; }
      const add = draft.roles[r].filter((f) => !base.roles[r].includes(f)), rem = base.roles[r].filter((f) => !draft.roles[r].includes(f));
      if (add.length || rem.length) out.push(label(r) + ": " + add.map((f) => "+" + f).concat(rem.map((f) => "−" + f)).join(" "));
    });
    const pk = (p) => (p.email || p.name || "").toLowerCase(), bp = new Map(base.people.map((p) => [pk(p), JSON.stringify(p)]));
    const added = draft.people.filter((p) => !bp.has(pk(p))).length, removed = base.people.filter((p) => !draft.people.some((q) => pk(q) === pk(p))).length;
    const changed = draft.people.filter((p) => bp.has(pk(p)) && bp.get(pk(p)) !== JSON.stringify(p)).length;
    if (added || removed || changed) out.push("People: " + [added && added + " added", changed && changed + " changed", removed && removed + " removed"].filter(Boolean).join(", "));
    if (JSON.stringify(base.desktop) !== JSON.stringify(draft.desktop) || JSON.stringify(base.changes) !== JSON.stringify(draft.changes)) out.push("Desktop pages changed");
    if (JSON.stringify(base.actions) !== JSON.stringify(draft.actions)) out.push("Action owners changed");
    return out.join("; ") || "No changes";
  }
  async function save() {
    const sum = summary();
    if (sum === "No changes") { toast("Nothing to save"); return; }
    // never save a change that takes App admin away from the person saving it (they couldn't get back in to undo it)
    const me = Data.profile, mine = draft.people.find((p) => (me.email && String(p.email || "").toLowerCase() === me.email.toLowerCase()) || String(p.name || "").toLowerCase() === String(me.name || "").toLowerCase());
    if (!mine || !mine.appAdmin || !String(mine.email || "").trim()) { IC.sheet("<h3>Not saved</h3><p>This would take App admin away from you. Keep your own row on People with your sign-in email and App admin ticked, then save.</p>"); return; }
    if (!(draft.roles["App Admin"] || []).includes("app-admin")) draft.roles["App Admin"] = ["app-admin"];
    const defaults = Settings.defaults(), roles = {};
    // keep every role in full, so a later change to the built-in defaults never changes what the owner set
    Object.keys(draft.roles).forEach((r) => (roles[r] = draft.roles[r]));
    Object.keys(defaults).forEach((r) => { if (!draft.roles[r]) roles[r] = []; });
    await Settings.save(Object.assign({}, Settings.cur, { roles, people: draft.people, desktop: draft.desktop, changes: draft.changes, actions: draft.actions }), sum);
    toast("Saved. People see it at their next refresh.");
    start(); IC.refreshView();
  }

  route("admin", async (args) => {
    if (!can("app-admin")) { location.hash = "#/"; return; }
    // computer screens only (23 Nov): the tables are too wide to edit safely on a phone
    if (!IC.wide()) { setBar("App admin", "", true); $("main").innerHTML = '<div class="empty">App admin opens on a computer. Sign in to the app in a browser on a PC or laptop (a window at least 1024 pixels wide).</div>'; return; }
    const tab = args[0] || "permissions";
    if (!draft) start();
    setBar("App admin", (Settings.cur.revision ? "Revision " + Settings.cur.revision + " · " + fmtDay(Settings.cur.updatedAt) + " by " + Settings.cur.updatedBy : "Not changed yet"), true);
    $("main").innerHTML = '<div class="admin">' +
      '<div class="admin-top"><div class="tabs">' + TABS.map(([k, t]) => '<a href="#/admin/' + k + '"' + (k === tab ? ' class="on"' : "") + ">" + t + "</a>").join("") + "</div>" +
      '<div class="admin-acts"><button class="btn primary" id="adSave"' + (dirty ? "" : " disabled") + ">" + (dirty ? "Save changes" : "Saved") + '</button><button class="btn" id="adUndo"' + (dirty ? "" : " hidden") + '>Undo changes</button>' +
      '<button class="btn" id="adExport">Export to Excel</button><label class="btn" id="adImpL">Import from Excel<input type="file" id="adImport" accept=".xlsx" hidden></label></div></div>' +
      '<div id="adBody"></div></div>';
    $("adSave").onclick = save;
    $("adUndo").onclick = async () => { if (!(await IC.ask("Undo every change since the last save?", "Undo changes"))) return; start(); IC.refreshView(); };
    $("adExport").onclick = exportXlsx;
    $("adImport").onchange = (e) => { if (e.target.files[0]) importXlsx(e.target.files[0]); e.target.value = ""; };
    ({ permissions: drawPermissions, people: drawPeople, desktop: drawDesktop, actions: drawActions, changes: drawChanges }[tab] || drawPermissions)();
  });

  // ---------------------------------------------------------------- Permissions: features × roles
  function drawPermissions() {
    const roles = roleOrder(draft.roles), fs = features();
    const head = "<tr><th class=\"ad-feat\">Feature</th>" + roles.map((r) => '<th class="ad-role"><span>' + esc(label(r)) + "</span></th>").join("") + "</tr>";
    const body = fs.map(([group, rows]) => '<tr class="ad-group"><td colspan="' + (roles.length + 1) + '">' + esc(group) + "</td></tr>" +
      rows.map(([f, t, sub]) => '<tr><td class="ad-feat"><b>' + esc(t) + "</b>" + (sub ? '<span class="small">' + esc(sub) + "</span>" : "") + "</td>" + roles.map((r) => {
        const list = draft.roles[r] || [], viaAll = f.startsWith("form:") && f !== "form:*" && list.includes("form:*");
        return '<td class="ad-cell"><input type="checkbox" data-r="' + esc(r) + '" data-f="' + esc(f) + '"' + (list.includes(f) || viaAll ? " checked" : "") + (viaAll ? ' disabled title="Every form is ticked"' : "") + "></td>";
      }).join("") + "</tr>").join("")).join("");
    $("adBody").innerHTML = '<p class="small">Tick what each role can see and do. A person with two or three roles gets everything each allows. Changes take effect when you press Save changes.</p>' +
      '<div class="scroll-x ad-wrap"><table class="tbl ad-grid">' + "<thead>" + head + "</thead><tbody>" + body + "</tbody></table></div>" +
      '<div class="row"><button class="btn" id="adAddRole">Add a role</button><button class="btn" id="adDelRole">Remove a role</button></div>';
    $("adBody").querySelectorAll("input[data-r]").forEach((c) => (c.onchange = () => {
      const r = c.dataset.r, f = c.dataset.f, list = draft.roles[r] = (draft.roles[r] || []).slice();
      if (c.checked && !list.includes(f)) list.push(f);
      if (!c.checked) draft.roles[r] = list.filter((x) => x !== f);
      touch(); if (f === "form:*") drawPermissions();
    }));
    $("adAddRole").onclick = () => {
      const sh = IC.sheet('<h3>Add a role</h3><label class="fl">Name<input id="nrName" placeholder="e.g. Site Coordinator"></label><label class="fl">Start with the permissions of<select id="nrCopy"><option value="">Nothing</option>' +
        roleOrder(draft.roles).map((r) => '<option value="' + esc(r) + '">' + esc(label(r)) + "</option>").join("") + '</select></label><button class="btn primary block" id="nrGo">Add</button><button class="btn block" id="nrX">Cancel</button>');
      $("nrX").onclick = sh.close;
      $("nrGo").onclick = () => { const n = $("nrName").value.trim(); if (!n) { toast("Give it a name"); return; }
        if (Object.keys(draft.roles).some((r) => r.toLowerCase() === n.toLowerCase())) { toast("That role already exists"); return; }
        draft.roles[n] = $("nrCopy").value ? (draft.roles[$("nrCopy").value] || []).slice() : []; touch(); sh.close(); drawPermissions(); };
    };
    $("adDelRole").onclick = () => {
      const builtIn = Object.keys(Settings.defaults()), custom = Object.keys(draft.roles).filter((r) => !builtIn.includes(r));
      if (!custom.length) { toast("Only roles added here can be removed. Untick a built-in role's features instead."); return; }
      const sh = IC.sheet('<h3>Remove a role</h3><label class="fl">Role<select id="drR">' + custom.map((r) => "<option>" + esc(r) + "</option>").join("") + '</select></label><p class="small">People who have only this role will see nothing until you give them another.</p><button class="btn primary block" id="drGo">Remove</button><button class="btn block" id="drX">Cancel</button>');
      $("drX").onclick = sh.close;
      $("drGo").onclick = () => { delete draft.roles[$("drR").value]; touch(); sh.close(); drawPermissions(); };
    };
  }

  // ---------------------------------------------------------------- People
  function drawPeople() {
    const roles = roleOrder(draft.roles), names = draft.people.map((p) => p.name).filter(Boolean).sort();
    const opt = (list, v, blank) => (blank ? '<option value="">' + blank + "</option>" : "") + list.map((x) => '<option value="' + esc(x[0]) + '"' + (x[0] === v ? " selected" : "") + ">" + esc(x[1]) + "</option>").join("");
    const roleOpts = roles.filter((r) => r !== "App Admin").map((r) => [r, label(r)]), mgrOpts = [["No approver needed", "No approver needed"]].concat(names.map((n) => [n, n]));
    const rows = draft.people.map((p, i) => '<tr data-i="' + i + '">' +
      '<td><input data-k="name" value="' + esc(p.name || "") + '"></td><td><input data-k="email" type="email" value="' + esc(p.email || "") + '" placeholder="sign-in email"></td>' +
      '<td class="ad-cell"><input type="checkbox" data-k="bss"' + (p.bss ? " checked" : "") + '></td><td class="ad-cell"><input type="checkbox" data-k="workshop"' + (p.workshop ? " checked" : "") + "></td>" +
      [0, 1, 2].map((n) => '<td><select data-k="role' + n + '">' + opt(roleOpts, (p.roles || [])[n] || "", "–") + "</select></td>").join("") +
      '<td><select data-k="manager">' + opt(mgrOpts, p.manager || "", "–") + '</select></td><td><select data-k="deputy">' + opt(mgrOpts, p.deputy || "", "–") + "</select></td>" +
      '<td class="ad-cell"><input type="checkbox" data-k="van"' + (p.van ? " checked" : "") + '></td><td><input data-k="vanReg" value="' + esc(p.vanReg || "") + '" size="9"></td>' +
      '<td class="ad-cell"><input type="checkbox" data-k="clocksIn"' + (p.clocksIn ? " checked" : "") + '></td><td class="ad-cell"><input type="checkbox" data-k="appAdmin"' + (p.appAdmin ? " checked" : "") + '></td><td><input data-k="notes" value="' + esc(p.notes || "") + '"></td>' +
      '<td><button class="btn sm" data-rm="' + i + '" title="Remove">✕</button></td></tr>').join("");
    $("adBody").innerHTML = '<p class="small">Everyone who signs in. Their roles decide what they see; the line manager approves their holidays, expenses and PPE. Import from Excel reads the People tab of the roles workbook.</p>' +
      '<div class="scroll-x ad-wrap"><table class="tbl ad-people"><thead><tr><th>Name</th><th>Sign-in email</th><th>BSS</th><th>Workshop</th><th>Role</th><th>Role 2</th><th>Role 3</th><th>Line manager</th><th>Deputy</th><th>Van</th><th>Van reg</th><th>Clocks in</th><th>App admin</th><th>Notes</th><th></th></tr></thead><tbody>' +
      rows + '</tbody></table></div><button class="btn" id="adAddP">Add a person</button><span class="small"> ' + draft.people.length + " people · " + draft.people.filter((p) => !p.email).length + " without a sign-in email</span>";
    $("adBody").querySelectorAll("tr[data-i] [data-k]").forEach((el) => (el.onchange = () => {
      const p = draft.people[Number(el.closest("tr").dataset.i)], k = el.dataset.k;
      if (k.startsWith("role")) { const n = Number(k.slice(4)); p.roles = (p.roles || []).slice(); p.roles[n] = el.value; p.roles = p.roles.map((x) => x || ""); while (p.roles.length && !p.roles[p.roles.length - 1]) p.roles.pop(); }
      else p[k] = el.type === "checkbox" ? el.checked : el.value.trim();
      touch();
    }));
    $("adBody").querySelectorAll("[data-rm]").forEach((b) => (b.onclick = async () => {
      const p = draft.people[Number(b.dataset.rm)];
      if (!(await IC.ask("Remove " + (p.name || "this row") + " from the People table? They lose access to the app at their next refresh.", "Remove"))) return;
      draft.people.splice(Number(b.dataset.rm), 1); touch(); drawPeople();
    }));
    $("adAddP").onclick = () => { draft.people.push({ name: "", email: "", bss: true, workshop: false, roles: [], manager: "", deputy: "", van: false, vanReg: "", clocksIn: false, appAdmin: false, notes: "" }); touch(); drawPeople(); };
  }

  // ---------------------------------------------------------------- Desktop pages (iCONSTRUCTE on the PC)
  function grid(list, key, title) {
    const roles = roleOrder(draft.roles).filter((r) => !["App Admin", "Screens", "HR Admin", "Operative (welder)"].includes(r));
    return '<div class="section-h">' + esc(title) + '</div><div class="scroll-x ad-wrap"><table class="tbl ad-grid"><thead><tr><th class="ad-feat">' + (key === "desktop" ? "Page" : "Can change") + "</th>" +
      roles.map((r) => '<th class="ad-role"><span>' + esc(label(r)) + "</span></th>").join("") + "<th>Notes</th></tr></thead><tbody>" +
      list.map((row, i) => '<tr><td class="ad-feat"><b>' + esc(row.name) + '</b><span class="small">' + esc(row.what + (row.status ? " · " + row.status : "")) + "</span></td>" +
        roles.map((r) => '<td class="ad-cell"><input type="checkbox" data-g="' + key + '" data-i="' + i + '" data-r="' + esc(r) + '"' + ((row.roles || []).includes(r) ? " checked" : "") + "></td>").join("") +
        '<td><input data-g="' + key + '" data-i="' + i + '" data-k="notes" value="' + esc(row.notes || "") + '"></td></tr>').join("") + "</tbody></table></div>";
  }
  function drawDesktop() {
    $("adBody").innerHTML = '<p class="small">Which roles open each page of iCONSTRUCTE on the PC, and who can change what there. Kept here so it is all in one place; the desktop program starts reading it once it gets its settings from Azure.</p>' +
      grid(draft.desktop, "desktop", "Desktop pages") + grid(draft.changes, "changes", "Who can change");
    $("adBody").querySelectorAll("[data-g]").forEach((el) => (el.onchange = () => {
      const row = draft[el.dataset.g][Number(el.dataset.i)];
      if (el.dataset.k) row[el.dataset.k] = el.value.trim();
      else { row.roles = (row.roles || []).filter((r) => r !== el.dataset.r); if (el.checked) row.roles.push(el.dataset.r); }
      touch();
    }));
  }

  // ---------------------------------------------------------------- Action owners
  function drawActions() {
    $("adBody").innerHTML = '<p class="small">Who each kind of action on the iCONSTRUCTE Actions list goes to. A person, a role, or the job\'s project manager.</p>' +
      '<div class="scroll-x ad-wrap"><table class="tbl ad-people"><thead><tr><th>Action</th><th>Raised when</th><th>Goes to</th><th>Or the job\'s PM</th><th>Notes</th></tr></thead><tbody>' +
      draft.actions.map((a, i) => '<tr data-i="' + i + '"><td><b>' + esc(a.type) + '</b></td><td class="small">' + esc(a.when) + '</td><td><input data-k="to" value="' + esc(a.to || "") + '" list="adNames"></td>' +
        '<td class="ad-cell"><input type="checkbox" data-k="pm"' + (a.pm ? " checked" : "") + '></td><td><input data-k="notes" value="' + esc(a.notes || "") + '"></td></tr>').join("") +
      '</tbody></table></div><datalist id="adNames">' + draft.people.map((p) => p.name).filter(Boolean).concat(roleOrder(draft.roles).map(label)).map((n) => '<option value="' + esc(n) + '">').join("") + "</datalist>";
    $("adBody").querySelectorAll("tr[data-i] [data-k]").forEach((el) => (el.onchange = () => { const a = draft.actions[Number(el.closest("tr").dataset.i)]; a[el.dataset.k] = el.type === "checkbox" ? el.checked : el.value.trim(); touch(); }));
  }

  // ---------------------------------------------------------------- Changes
  function drawChanges() {
    const h = (Settings.cur.history || []).slice().reverse();
    $("adBody").innerHTML = (dirty ? '<div class="note">Not saved yet: ' + esc(summary()) + "</div>" : "") +
      (h.length ? '<div class="scroll-x"><table class="tbl"><thead><tr><th>Revision</th><th>When</th><th>Who</th><th>What changed</th></tr></thead><tbody>' +
        h.map((x) => "<tr><td>" + esc(x.rev || "") + "</td><td>" + esc(fmtDay(x.at) + " " + fmtTime(x.at)) + "</td><td>" + esc(x.by || "") + "</td><td>" + esc(x.summary || "") + "</td></tr>").join("") + "</tbody></table></div>"
        : '<div class="empty small">No changes saved yet.</div>');
  }

  // ---------------------------------------------------------------- Excel out
  function exportXlsx() {
    const roles = roleOrder(draft.roles), tick = (b) => (b ? "✓" : "");
    const perm = [["Group", "Feature", "What it does"].concat(roles.map(label))];
    features().forEach(([g, rows]) => rows.forEach(([f, t, sub]) => perm.push([g, t, sub].concat(roles.map((r) => tick((draft.roles[r] || []).includes(f) || (f.startsWith("form:") && (draft.roles[r] || []).includes("form:*"))))))));
    const people = [["Name", "Sign-in email", "BSS", "Workshop", "Role", "Role 2", "Role 3", "Line manager", "Deputy approver", "Van driver", "Van reg", "Clocks in", "App admin", "Notes"]]
      .concat(draft.people.map((p) => [p.name, p.email, tick(p.bss), tick(p.workshop)].concat([0, 1, 2].map((n) => label((p.roles || [])[n] || ""))).concat([p.manager, p.deputy, tick(p.van), p.vanReg, tick(p.clocksIn), tick(p.appAdmin), p.notes])));
    const g = (list) => { const rs = roles.filter((r) => !["App Admin", "Screens", "HR Admin", "Operative (welder)"].includes(r)); return [["Page", "What it's for", "Now / planned"].concat(rs.map(label), ["Notes"])].concat(list.map((x) => [x.name, x.what, x.status].concat(rs.map((r) => tick((x.roles || []).includes(r))), [x.notes]))); };
    const acts = [["Action type", "Raised when", "Goes to", "Or the job's PM?", "Notes"]].concat(draft.actions.map((a) => [a.type, a.when, a.to, tick(a.pm), a.notes]));
    const log = [["Revision", "When", "Who", "What changed"]].concat((Settings.cur.history || []).map((x) => [x.rev || "", fmtDay(x.at) + " " + fmtTime(x.at), x.by, x.summary]));
    const blob = IC.Xlsx.build([{ name: "Permissions", rows: perm, widths: [12, 30, 34].concat(roles.map(() => 12)) }, { name: "People", rows: people, widths: [22, 32, 6, 9, 16, 16, 16, 20, 20, 8, 10, 9, 30] },
      { name: "Desktop pages", rows: g(draft.desktop), widths: [22, 40, 14] }, { name: "Who can change", rows: g(draft.changes), widths: [26, 40, 20] }, { name: "Action owners", rows: acts, widths: [18, 46, 26, 14, 30] }, { name: "Changes", rows: log, widths: [9, 18, 20, 80] }]);
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Roles and access privileges (app, rev " + (Settings.cur.revision || 0) + ").xlsx"; document.body.appendChild(a); a.click(); a.remove();
  }

  // ---------------------------------------------------------------- Excel in: People, Desktop pages, Who can change, Action owners
  // A small .xlsx reader (no library): the browser unzips with DecompressionStream; cells are read from the sheet XML.
  async function readXlsx(file) {
    const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer);
    let eocd = buf.length - 22; while (eocd > 0 && dv.getUint32(eocd, true) !== 0x06054b50) eocd--;
    if (eocd <= 0) throw new Error("Not an Excel file");
    const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
    const files = {};
    for (let i = 0; i < n; i++) {
      const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true), nameLen = dv.getUint16(p + 28, true), extra = dv.getUint16(p + 30, true), cmt = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nameLen));
      const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), data = buf.subarray(start, start + size);
      files[name] = { method, data }; p += 46 + nameLen + extra + cmt;
    }
    const text = async (name) => { const f = files[name]; if (!f) return "";
      if (f.method === 0) return new TextDecoder().decode(f.data);
      const ds = new Blob([f.data]).stream().pipeThrough(new DecompressionStream("deflate-raw")); return new Response(ds).text(); };
    const xml = (s) => new DOMParser().parseFromString(s, "application/xml");
    const shared = [...xml(await text("xl/sharedStrings.xml")).getElementsByTagName("si")].map((si) => [...si.getElementsByTagName("t")].map((t) => t.textContent).join(""));
    const wb = xml(await text("xl/workbook.xml")), rels = xml(await text("xl/_rels/workbook.xml.rels"));
    const target = {}; [...rels.getElementsByTagName("Relationship")].forEach((r) => (target[r.getAttribute("Id")] = r.getAttribute("Target")));
    const sheets = {};
    for (const sh of wb.getElementsByTagName("sheet")) {
      const rid = sh.getAttribute("r:id") || sh.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
      let t = target[rid] || ""; t = t.startsWith("/") ? t.slice(1) : "xl/" + t.replace(/^\.\//, "");
      const doc = xml(await text(t)), rows = [];
      for (const row of doc.getElementsByTagName("row")) {
        const r = [];
        for (const c of row.getElementsByTagName("c")) {
          const ref = c.getAttribute("r") || "", col = ref.replace(/\d+/g, "").split("").reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1, typ = c.getAttribute("t"), v = c.getElementsByTagName("v")[0];
          let val = v ? v.textContent : null;
          if (typ === "s") val = shared[Number(val)]; else if (typ === "b") val = val === "1"; else if (typ === "inlineStr") val = [...c.getElementsByTagName("t")].map((x) => x.textContent).join("");
          else if (val != null && typ !== "str" && !isNaN(Number(val))) val = Number(val);
          r[col] = val;
        }
        rows[Number(row.getAttribute("r")) - 1] = r;
      }
      sheets[sh.getAttribute("name")] = rows.filter(Boolean);
    }
    return sheets;
  }
  async function importXlsx(file) {
    let sheets;
    try { sheets = await readXlsx(file); } catch (e) { console.warn(e); toast("Couldn't read that file. Save it as .xlsx and try again."); return; }
    const yes = (v) => v === true || v === "✓" || String(v || "").toUpperCase() === "TRUE";
    const key = (r) => IC.roleKey(r) || (r ? String(r).trim() : "");
    const found = [];
    const pp = sheets.People;
    if (pp && pp.length > 1) {
      const h = pp[0].map((x) => String(x || "").toLowerCase());
      const ix = (re) => h.findIndex((x) => re.test(x)), roleCols = h.map((x, i) => (/^role/.test(x) ? i : -1)).filter((i) => i >= 0);
      const iName = ix(/^name/), iEmail = ix(/email/), iSite = ix(/^site$|^bss$/), iWs = ix(/^workshop$/), iMgr = ix(/line manager/), iDep = ix(/deputy/), iVan = ix(/van driver/), iReg = ix(/van reg/), iClock = ix(/clocks in/), iNotes = ix(/^notes/);
      const people = pp.slice(1).filter((r) => r && r[iName]).map((r) => {
        const old = draft.people.find((p) => (p.name || "").toLowerCase() === String(r[iName]).trim().toLowerCase()) || {};
        return { name: String(r[iName]).trim(), email: iEmail >= 0 ? String(r[iEmail] || "").trim() : old.email || "", bss: iSite >= 0 ? !!r[iSite] && r[iSite] !== false : !!old.bss, workshop: iWs >= 0 ? !!r[iWs] && r[iWs] !== false : !!old.workshop,
          roles: roleCols.map((i) => key(r[i])).filter(Boolean).slice(0, 3), manager: iMgr >= 0 ? String(r[iMgr] || "") : "", deputy: iDep >= 0 ? String(r[iDep] || "") : "", van: iVan >= 0 && yes(r[iVan]),
          vanReg: iReg >= 0 ? String(r[iReg] || "") : "", clocksIn: iClock >= 0 && yes(r[iClock]), appAdmin: !!old.appAdmin, notes: iNotes >= 0 ? String(r[iNotes] || "") : "" };
      });
      const unknown = [...new Set(people.flatMap((p) => p.roles).filter((r) => !draft.roles[r]))];
      unknown.forEach((r) => (draft.roles[r] = []));
      draft.people = people; found.push(people.length + " people" + (unknown.length ? " (new roles added with nothing ticked: " + unknown.join(", ") + ")" : ""));
    }
    const pages = (name, field) => {
      const rows = sheets[name]; if (!rows || rows.length < 2) return;
      const h = rows[0].map((x) => String(x || "")), roleIdx = h.map((x, i) => (i >= 3 && x && x !== "Notes" ? [i, key(x)] : null)).filter(Boolean), iNotes = h.indexOf("Notes");
      draft[field] = rows.slice(1).filter((r) => r && r[0]).map((r) => ({ name: String(r[0]), what: String(r[1] || ""), status: String(r[2] || ""), roles: roleIdx.filter(([i]) => yes(r[i])).map(([, k]) => k), notes: iNotes >= 0 ? String(r[iNotes] || "") : "" }));
      found.push(draft[field].length + " rows of " + name);
    };
    pages("Desktop pages", "desktop"); pages("Who can change", "changes");
    const wd = sheets["Who does what"] || sheets["Action owners"];
    if (wd && wd.length > 1) { draft.actions = wd.slice(1).filter((r) => r && r[0]).map((r) => ({ type: String(r[0]), when: String(r[1] || ""), to: String(r[2] || ""), pm: yes(r[3]), notes: String(r[4] || "") })); found.push(draft.actions.length + " action owners"); }
    if (!found.length) { toast("No People, Desktop pages or Who does what tabs found in that file"); return; }
    touch(); IC.refreshView();
    IC.sheet('<h3>Imported, not saved yet</h3><p>' + esc(found.join("; ")) + '.</p><p class="small">Check the tables, then press Save changes. Permissions are set on the Permissions tab here (the workbook\'s Site app and Workshop app tabs are not read).</p>');
  }

  IC.Admin = { exportXlsx, readXlsx };
})();
