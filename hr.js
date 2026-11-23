/* iCONSTRUCTE Site: HR (Liam, 23 Nov 2026).
 * Personal data lives here and in the HR store on Azure, never in the iCONSTRUCTE Access file:
 *   hrpeople  one record per employee: contact details, emergency contact, payroll starter details, right to work, PPE sizes
 *   hrdocs    the document library: company policies (for everyone, site, workshop or office) and personal documents (contract …)
 *   hrsigns   "read and understood" signatures, per document version
 *   absence   sickness and other absence, recorded by a manager
 *   invites   new-starter invitations: a one-off link / QR code the new starter opens on their own phone, before they have an account
 *   inducts   the company induction checklist, done with the new starter on their first day
 * Who sees what (enforced by the API, see API.md): everyone sees their own; line managers see their team's emergency contacts,
 * documents signed, training, holidays, absence and induction; only HR admins (permission hr-admin) see addresses, NI numbers,
 * right-to-work documents, contracts and absence notes. Outside demo mode HR records are fetched live and never cached on the phone.
 */
(function () {
  "use strict";
  const { $, esc, fmtDate, fmtDay, isoDate, parseDate, uid, Data, Api, CFG, DEMO, LS, SAMPLES, can, sheet, toast, setBar, route, shrinkImage, signaturePad } = IC;

  const AREAS = ["Site", "Workshop", "Office"];
  const ABSENCE = ["Sickness", "Medical appointment", "Compassionate", "Unpaid leave", "Unauthorised", "Other"];
  const LEAVER = ["Resigned", "End of contract", "Dismissed", "Retired", "Other"];
  const STARTER = [["A", "This is my first job since 6 April and I haven't been getting taxable Jobseeker's Allowance, Employment and Support Allowance, taxable Incapacity Benefit, a State Pension or an occupational pension."],
    ["B", "This is now my only job, but since 6 April I've had another job, or received taxable Jobseeker's Allowance, Employment and Support Allowance or taxable Incapacity Benefit. I don't get a State Pension or an occupational pension."],
    ["C", "As well as this job, I have another job or I get a State Pension or an occupational pension."]];
  const LOANS = ["None", "Plan 1", "Plan 2", "Plan 4", "Plan 5", "Postgraduate loan", "Not sure"];
  const RTW = ["British or Irish passport", "Share code from the Home Office", "UK birth certificate and NI number letter", "Other"];
  const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
  // Company induction, first day (Liam, 23 Nov). The common items, then site or workshop items by the new starter's area.
  const INDUCT = {
    common: ["Welcome, who's who and who to ask", "Health and safety policy explained", "Fire procedure and assembly point", "First aid, first aiders and reporting accidents and near misses",
      "Welfare: toilets, canteen, drying room", "PPE issued and how to ask for more (app: Request PPE)", "Drugs and alcohol policy", "Mobile phones and driving",
      "Holidays and sickness: how to book and how to report (app)", "Hours, breaks, pay day", "App set up and signed in on their phone"],
    Site: ["Cards and tickets checked (originals seen)", "Site rules, permits and exclusion zones", "Working at height: MEWPs, harnesses and lanyards", "Lifting operations, slinging and signals",
      "RAMS, POWRA and toolbox talks", "Daily plant and vehicle checks"],
    Workshop: ["Workshop tour: walkways and no-go areas", "Overhead crane and lifting in the workshop", "Machines: only trained and authorised people (saw, drill line)",
      "Welding: fume extraction, screens and burns", "Hot work and gas cylinders", "Noise, vibration (HAVS) and manual handling", "Forklift: authorised drivers only", "Housekeeping and stacking steel"],
    Office: ["Office tour", "Display screen equipment (DSE) set-up check"]
  };

  const isAdmin = () => can("hr-admin");
  // hr-workshop (Workshop Director, Liam 23 Nov): every HR record, in full, but for workshop staff only. The company
  // document library stays with the HR Admin.
  const wsHr = () => !can("hr-admin") && can("hr-workshop");
  const isFull = () => isAdmin() || wsHr();
  const scopeLabel = () => (isAdmin() ? "Everyone" : wsHr() ? "Workshop staff" : "Your team");
  const isMgr = () => can("hr-admin") || can("manager");
  const today = () => isoDate(new Date());
  const name = (p) => (p ? p.preferredName && p.preferredName !== p.firstName ? p.preferredName + " " + p.lastName : p.userName || [p.firstName, p.lastName].filter(Boolean).join(" ") : "");
  const kv = (rows) => '<div class="kv">' + rows.filter((r) => r && r[1] != null && r[1] !== "").map((r) => "<div><span>" + esc(r[0]) + "</span><b>" + esc(r[1]) + "</b></div>").join("") + "</div>";
  const field = (id, label, val, type, extra) => '<label class="fl">' + esc(label) + '<input id="' + id + '" type="' + (type || "text") + '" value="' + esc(val || "") + '"' + (extra || "") + "></label>";
  const select = (id, label, opts, val, blank) => '<label class="fl">' + esc(label) + '<select id="' + id + '">' + (blank !== false ? '<option value="">Choose…</option>' : "") +
    opts.map((o) => { const v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (v === val ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select></label>";
  const val = (id) => ($(id) ? $(id).value.trim() : "");
  const randomToken = () => { const b = new Uint8Array(12); crypto.getRandomValues(b); return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join(""); };

  // ---------------------------------------------------------------- the HR store
  // Demo: on this phone, like everything else. Live: straight from the HR API (online only, nothing kept on the phone).
  const H = {
    async list(kind) {
      await ensureDemo();
      if (DEMO) return Data.list(kind, "team");
      if (!navigator.onLine) throw new Error("HR needs signal: personal records aren't kept on the phone.");
      return Api.call("GET", "/hr/" + kind);
    },
    async get(kind, id) { return (await this.list(kind)).find((r) => r.id === id) || null; },
    async save(kind, rec) {
      rec.id = rec.id || uid(); rec.updatedAt = new Date().toISOString(); rec.createdAt = rec.createdAt || rec.updatedAt;
      if (DEMO) { await IC.Store.put({ key: kind + ":" + rec.id, kind, rec }, "records"); Data.changed(); return rec; }
      return Api.call("POST", "/hr/" + kind, rec);
    },
    async putFile(file) { const b = file.type && file.type.startsWith("image/") ? await shrinkImage(file, 1800, 0.8) : file; return DEMO ? Data.putBlob(b) : (await Api.call("POST", "/hr/files", b, true)).id; },
    async fileUrl(id) { return DEMO ? Data.blobUrl(id) : URL.createObjectURL(await Api.call("GET", "/hr/files/" + id)); }
  };

  // ---------------------------------------------------------------- rules used across the screens
  const docsFor = (docs, p) => docs.filter((d) => d.status !== "retired" && (d.user ? d.user === p.user : d.audience === "Everyone" || d.audience === p.area));
  const signedBy = (signs, who, d) => signs.find((s) => s.user === who && s.docId === d.id && s.version === d.version);
  const signKey = (p) => p.user || "invite:" + p.inviteId; // before their account exists, a new starter's signatures are held against the invite
  const toSign = (docs, signs, p) => docsFor(docs, p).filter((d) => d.requiresSign && !signedBy(signs, signKey(p), d));
  const absenceDays = (a) => (a.days != null ? a.days : IC.workingDays(a.from, a.to || a.from, a.halfStart, a.halfEnd));
  const last12 = (list) => { const from = new Date(); from.setFullYear(from.getFullYear() - 1); return list.filter((a) => parseDate(a.from) >= from); };
  const STATUS = { onboarding: ["Starting", "pending"], active: ["Current", "approved"], leaver: ["Left", "declined"] };

  async function people() {
    const all = await H.list("hrpeople");
    if (isAdmin()) return all;
    if (wsHr()) return all.filter((p) => p.area === "Workshop" && p.user !== Data.profile.email);
    const ts = await Data.teamSet(), me = Data.profile.email;
    return all.filter((p) => (p.user ? p.user !== me && ts.has(p.user) : p.manager === Data.profile.name)); // new starters: by line manager
  }
  async function invites() { const all = await H.list("invites"), me = Data.profile.name; return isAdmin() ? all : wsHr() ? all.filter((i) => i.area === "Workshop") : all.filter((i) => i.manager === me || i.createdBy === me); }
  async function myRecord() { return (await H.list("hrpeople")).find((p) => p.user === Data.profile.email) || null; }

  // For Home: documents waiting for my signature, and (HR admins) new starters ready to activate.
  async function homeCounts() {
    if (!can("hr")) return { sign: 0, ready: 0 };
    try {
      const me = await myRecord(); const docs = await H.list("hrdocs"), signs = await H.list("hrsigns");
      const sign = me ? toSign(docs, signs, me).length : 0;
      const ready = isFull() ? (await people()).filter((p) => p.status === "onboarding" && p.onboardedAt).length : 0;
      return { sign, ready };
    } catch (e) { return { sign: 0, ready: 0 }; }
  }

  // ---------------------------------------------------------------- my HR
  route("hr", async (args) => {
    const a = args[0] || (isMgr() ? "" : "me");
    if (a === "me") return viewMe();
    if (a === "doc") return viewDoc(args[1]);
    if (a === "details") return editDetails(args[1], true);
    if (!isMgr()) { location.hash = "#/hr/me"; return; }
    if (a === "") return viewHub();
    if (a === "people") return viewPeople(args[1] || "current");
    if (a === "person") return viewPerson(args[1]);
    if (a === "edit") return editDetails(args[1], false);
    if (a === "docs") return isAdmin() ? viewDocs() : (location.hash = "#/hr");
    if (a === "doc-new") return isAdmin() || (wsHr() && args[2]) ? docForm(args[1] || "", args[2] || "") : (location.hash = "#/hr");
    if (a === "starters") return viewStarters();
    if (a === "invite-new") return inviteForm();
    if (a === "invite") return viewInvite(args[1]);
    if (a === "absence") return viewAbsence();
    if (a === "absence-new") return absenceForm(args[1] || "");
    if (a === "induct") return viewInduct(args[1]);
    location.hash = "#/hr";
  });

  async function viewMe() {
    setBar("My HR", "Your details and documents", true);
    const me = await myRecord();
    if (!me) { $("main").innerHTML = '<div class="empty">The office hasn\'t set up your HR record yet.</div>'; return; }
    const docs = await H.list("hrdocs"), signs = await H.list("hrsigns"), mine = docsFor(docs, me), due = toSign(docs, signs, me);
    const abs = last12((await H.list("absence")).filter((a) => a.user === me.user));
    const em = me.emergency || {};
    $("main").innerHTML =
      (due.length ? '<div class="section-h">To read and sign</div>' + due.map((d) => docRow(d, '<span class="pill pending">Sign</span>')).join("") : "") +
      '<div class="section-h">My details</div>' + kv([["Name", name(me)], ["Mobile", me.mobile], ["Email", me.personalEmail], ["Address", addr(me)],
        ["Emergency contact", em.name ? em.name + (em.relation ? " (" + em.relation + ")" : "") + " · " + (em.phone || "") : "None given"], ["Started", me.startDate ? fmtDate(me.startDate) : ""]]) +
      '<a class="btn block" href="#/hr/details/' + esc(me.id) + '">Update my details</a>' +
      '<div class="section-h">My documents</div>' + (mine.length ? mine.map((d) => docRow(d, d.requiresSign ? (signedBy(signs, me.user, d) ? '<span class="pill approved">Signed</span>' : '<span class="pill pending">Sign</span>') : "")).join("") : '<div class="empty small">No documents yet.</div>') +
      '<div class="section-h">Absence, last 12 months</div>' + (abs.length ? abs.map((x) => absRow(x, false)).join("") + '<div class="small">' + abs.reduce((t, x) => t + absenceDays(x), 0) + " working days in " + abs.length + " absence" + (abs.length > 1 ? "s" : "") + "</div>" : '<div class="empty small">None recorded.</div>') +
      '<div class="tiles">' + (can("leave") ? '<a class="tile" href="#/leave">' + IC.ICON.leave + "<b>Holidays</b><span>Book and see what's left</span></a>" : "") +
      (can("cards") ? '<a class="tile" href="#/cards">' + IC.ICON.card + "<b>My cards</b><span>Training and tickets</span></a>" : "") +
      (can("form:ppe") ? '<a class="tile" href="#/form-new/ppe">' + IC.ICON.ppe + "<b>Request PPE</b><span>New or replacement</span></a>" : "") + "</div>";
  }
  const addr = (p) => [p.address1, p.address2, p.town, p.postcode].filter(Boolean).join(", ");
  const docRow = (d, right) => '<a class="tile-row" href="#/hr/doc/' + esc(d.id) + '"><span><b>' + esc(d.title) + '</b><span class="small">' + esc((d.user ? "Personal · " : "") + d.category + " · version " + d.version) + "</span></span>" + (right || "›") + "</a>";
  const absRow = (a, who) => '<div class="req"><div><b>' + esc((who ? a.userName + " · " : "") + a.type) + '</b><div class="small">' + esc(fmtDay(a.from) + (a.to && a.to !== a.from ? " – " + fmtDay(a.to) : "") + " · " + absenceDays(a) + " day" + (absenceDays(a) === 1 ? "" : "s")) +
    (a.type === "Sickness" ? esc(" · " + (a.fitNote ? "fit note" : "self-certified") + (a.rtw ? " · return-to-work done" : " · return-to-work to do")) : "") + "</div>" +
    (a.note && (isFull() || a.user === Data.profile.email) ? '<div class="small">“' + esc(a.note) + "”</div>" : "") + "</div></div>";

  // ---------------------------------------------------------------- personal details (the person themselves, or an HR admin)
  async function editDetails(id, self) {
    const p = await H.get("hrpeople", id);
    if (!p || (self && p.user !== Data.profile.email) || (!self && !(isAdmin() || (wsHr() && p.area === "Workshop")))) { location.hash = "#/hr"; return; }
    setBar(self ? "Update my details" : "Edit details", name(p), true);
    const em = p.emergency || {}, em2 = p.emergency2 || {};
    $("main").innerHTML = '<div class="card">' +
      (self ? "" : field("dFirst", "First name", p.firstName) + field("dLast", "Last name", p.lastName) + field("dDob", "Date of birth", p.dob, "date") + field("dNi", "National Insurance number", p.ni)) +
      field("dPref", "Name you go by", p.preferredName) + field("dMob", "Mobile", p.mobile, "tel") + field("dEmail", "Personal email", p.personalEmail, "email") +
      field("dA1", "Address", p.address1) + field("dA2", "Address line 2", p.address2) + field("dTown", "Town", p.town) + field("dPc", "Postcode", p.postcode) +
      '<div class="section-h">Emergency contact</div>' + field("eName", "Name", em.name) + field("eRel", "Relationship", em.relation) + field("ePh", "Phone", em.phone, "tel") +
      '<div class="section-h">Second emergency contact (optional)</div>' + field("e2Name", "Name", em2.name) + field("e2Rel", "Relationship", em2.relation) + field("e2Ph", "Phone", em2.phone, "tel") +
      (self ? '<p class="small">To change your name, date of birth, NI number or bank details, speak to the office.</p>' : "") +
      '<button class="btn primary block" id="dSave">Save</button></div>';
    $("dSave").onclick = async () => {
      if (!val("eName") || !val("ePh")) { toast("Add an emergency contact"); return; }
      if (!self) Object.assign(p, { firstName: val("dFirst"), lastName: val("dLast"), dob: val("dDob"), ni: val("dNi").toUpperCase() });
      Object.assign(p, { preferredName: val("dPref"), mobile: val("dMob"), personalEmail: val("dEmail"), address1: val("dA1"), address2: val("dA2"), town: val("dTown"), postcode: val("dPc").toUpperCase(),
        emergency: { name: val("eName"), relation: val("eRel"), phone: val("ePh") }, emergency2: val("e2Name") ? { name: val("e2Name"), relation: val("e2Rel"), phone: val("e2Ph") } : null });
      p.userName = name(p); await H.save("hrpeople", p); toast("Saved"); history.back();
    };
  }

  // ---------------------------------------------------------------- documents: read and sign
  async function viewDoc(id) {
    const d = await H.get("hrdocs", id); if (!d) { location.hash = "#/hr/me"; return; }
    setBar(d.title, d.category + " · version " + d.version, true);
    const signs = await H.list("hrsigns"), me = await myRecord(), mine = me && docsFor([d], me).length;
    const signed = me && signedBy(signs, me.user, d);
    let html = (d.body ? '<div class="card doc-body">' + d.body.split(/\n{2,}/).map((t) => "<p>" + esc(t) + "</p>").join("") + "</div>" : "") +
      (d.file ? '<button class="btn block" id="dOpen">Open the document</button>' : "") +
      (d.changeNote ? '<div class="note">What changed: ' + esc(d.changeNote) + "</div>" : "");
    if (mine && d.requiresSign) html += signed ? '<div class="note">You signed this version on ' + esc(fmtDay(signed.signedAt)) + ".</div>"
      : '<div class="card"><label class="confirm"><input type="checkbox" id="dRead"><span>I have read and understood this document</span></label><div id="dSig"></div><button class="btn primary block" id="dSign">Sign</button></div>';
    if (isAdmin() && !d.user) {
      const staff = (await H.list("hrpeople")).filter((p) => p.status !== "leaver" && p.user && docsFor([d], p).length);
      const done = staff.filter((p) => signedBy(signs, signKey(p), d)), todo = staff.filter((p) => !signedBy(signs, signKey(p), d));
      html += d.requiresSign ? '<div class="section-h">Signed ' + done.length + " of " + staff.length + "</div>" +
        (todo.length ? '<div class="flag">Not signed yet: ' + esc(todo.map(name).join(", ")) + "</div>" : '<div class="small ok-t">Everyone has signed this version.</div>') : "";
      html += '<a class="btn block" href="#/hr/doc-new/' + esc(d.id) + '">Issue a new version</a><button class="btn block" id="dRetire">Withdraw this document</button>';
    }
    $("main").innerHTML = html;
    if ($("dOpen")) $("dOpen").onclick = async () => window.open(await H.fileUrl(d.file), "_blank");
    if ($("dSig")) {
      const pad = signaturePad("Your signature"); $("dSig").appendChild(pad.el);
      $("dSign").onclick = async () => {
        if (!$("dRead").checked) { toast("Tick to confirm you've read it"); return; }
        if (pad.isEmpty()) { toast("Sign in the box"); return; }
        const sig = await H.putFile(await pad.toBlob());
        await H.save("hrsigns", { user: me.user, userName: name(me), docId: d.id, title: d.title, version: d.version, signedAt: new Date().toISOString(), sig });
        toast("Signed"); IC.refreshView();
      };
    }
    if ($("dRetire")) $("dRetire").onclick = async () => { if (!(await IC.ask("Withdraw " + d.title + "? Nobody will be asked to sign it again; past signatures are kept.", "Withdraw"))) return; d.status = "retired"; await H.save("hrdocs", d); location.hash = "#/hr/docs"; };
  }

  // Company documents (HR admin): what's issued and how many have signed
  async function viewDocs() {
    setBar("Documents", "Policies, handbook, induction pack", true);
    const docs = (await H.list("hrdocs")).filter((d) => !d.user && d.status !== "retired"), signs = await H.list("hrsigns");
    const staff = (await H.list("hrpeople")).filter((p) => p.status !== "leaver" && p.user);
    $("main").innerHTML = '<a class="btn primary block" href="#/hr/doc-new">Add a document</a>' +
      ["Policy", "Handbook", "Induction", "Form", "Other"].map((cat) => { const list = docs.filter((d) => d.category === cat); if (!list.length) return "";
        return '<div class="section-h">' + cat + (cat === "Policy" ? " documents" : "") + "</div>" + list.map((d) => {
          const who = staff.filter((p) => docsFor([d], p).length), n = who.filter((p) => signedBy(signs, signKey(p), d)).length;
          return docRow(Object.assign({}, d, { category: d.audience + (d.induction ? " · induction pack" : "") }), d.requiresSign ? '<span class="pill ' + (n === who.length ? "approved" : "pending") + '">' + n + "/" + who.length + " signed</span>" : "");
        }).join(""); }).join("");
  }

  // Add a company document or a personal one (contract …), or issue a new version (everyone signs again)
  async function docForm(docId, personId) {
    const old = docId ? await H.get("hrdocs", docId) : null, person = personId ? await H.get("hrpeople", personId) : null;
    setBar(old ? "New version" : person ? "Add a document" : "Add a company document", old ? old.title : person ? name(person) : "", true);
    $("main").innerHTML = '<div class="card">' + field("fTitle", "Title", old ? old.title : person ? "Contract of employment" : "") +
      select("fCat", "Type", person ? ["Contract", "Letter", "Appraisal", "Disciplinary", "Certificate", "Other"] : ["Policy", "Handbook", "Induction", "Form", "Other"], old ? old.category : person ? "Contract" : "Policy", false) +
      (person ? "" : select("fAud", "Who it's for", ["Everyone", "Site", "Workshop", "Office"], old ? old.audience : "Everyone", false)) +
      field("fVer", "Version", old ? (isNaN(Number(old.version)) ? "" : String(Number(old.version) + 1)) : "1") +
      (old ? field("fChange", "What changed (shown to staff)", "") : "") +
      '<label class="fl">Text (optional, shown in the app)<textarea id="fBody" rows="6">' + esc(old ? old.body || "" : "") + "</textarea></label>" +
      '<label class="fl">File (PDF or photo)<input id="fFile" type="file" accept="application/pdf,image/*"></label>' +
      '<label class="confirm"><input type="checkbox" id="fSign"' + (!old || old.requiresSign ? " checked" : "") + "><span>" + (person ? "They must sign to say they've received it" : "Staff must read and sign it") + "</span></label>" +
      (person ? "" : '<label class="confirm"><input type="checkbox" id="fInd"' + (old && old.induction ? " checked" : "") + "><span>Part of the new-starter induction pack</span></label>") +
      '<button class="btn primary block" id="fSave">' + (old ? "Issue new version" : "Save") + "</button></div>";
    $("fSave").onclick = async () => {
      const file = $("fFile").files[0];
      if (!val("fTitle")) { toast("Give it a title"); return; }
      if (!file && !val("fBody") && !(old && old.file)) { toast("Add the text or a file"); return; }
      const rec = old ? Object.assign({}, old, { createdAt: undefined }) : { status: "live" };
      if (old) { old.status = "retired"; old.replacedBy = "v" + val("fVer"); }
      Object.assign(rec, { title: val("fTitle"), category: val("fCat"), audience: person ? "" : val("fAud"), version: val("fVer") || "1", body: val("fBody"),
        changeNote: old ? val("fChange") : "", requiresSign: $("fSign").checked, induction: !person && $("fInd").checked, user: person ? person.user || "" : "", personId: person ? person.id : "",
        file: file ? await H.putFile(file) : old ? old.file : "", issuedBy: Data.profile.name, issuedAt: new Date().toISOString(), status: "live" });
      delete rec.id;
      if (old) { await H.save("hrdocs", old); rec.previous = old.id; }
      const saved = await H.save("hrdocs", rec);
      toast(old ? "New version issued: staff will be asked to sign it" : "Saved");
      location.hash = person ? "#/hr/person/" + person.id : "#/hr/doc/" + saved.id;
    };
  }

  // ---------------------------------------------------------------- HR hub (HR admin and line managers)
  async function viewHub() {
    setBar(isFull() ? "HR" : "Team HR", scopeLabel(), true);
    const ps = await people(), cur = ps.filter((p) => p.status === "active"), starting = ps.filter((p) => p.status === "onboarding");
    const docs = await H.list("hrdocs"), signs = await H.list("hrsigns");
    const unsigned = cur.filter((p) => toSign(docs, signs, p).length);
    const abs = last12(await H.list("absence")).filter((a) => ps.some((p) => p.user === a.user));
    const month = abs.filter((a) => parseDate(a.from) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const inv = (await invites()).filter((i) => i.status === "sent" || i.status === "started");
    const noInduct = cur.filter((p) => !p.inductedAt && p.startDate && parseDate(p.startDate) >= new Date(Date.now() - 90 * 864e5));
    const link = (href, icon, title, sub, n) => '<a class="tile-row" href="' + href + '"><span class="ti">' + icon + "</span><span><b>" + esc(title) + '</b><span class="small">' + esc(sub) + "</span></span>" + (n ? '<span class="pill pending">' + n + "</span>" : "›") + "</a>";
    $("main").innerHTML = '<div class="stats"><div><b>' + cur.length + "</b><span>staff</span></div><div><b>" + starting.length + "</b><span>starting</span></div><div" + (unsigned.length ? ' class="st-bad"' : "") + "><b>" + unsigned.length + "</b><span>with documents to sign</span></div><div><b>" + month.length + "</b><span>absences this month</span></div></div>" +
      link("#/hr/starters", IC.ICON.ppe, "New starters", inv.length + " invited, " + starting.length + " starting" + (starting.filter((p) => p.onboardedAt).length ? " · " + starting.filter((p) => p.onboardedAt).length + " ready" : ""), starting.filter((p) => p.onboardedAt).length) +
      link("#/hr/people", IC.ICON.team, "People", "Details, documents, training, absence") +
      (isAdmin() ? link("#/hr/docs", IC.ICON.check, "Documents", "Policies, handbook, induction pack · " + unsigned.length + " people with documents to sign") : "") +
      link("#/hr/absence", IC.ICON.leave, "Absence", abs.length + " in the last 12 months") +
      (can("manager") ? link("#/manager/cards", IC.ICON.card, "Training matrix", "Cards and tickets, expiry dates") : "") +
      (noInduct.length ? '<div class="flag">Company induction not recorded: ' + esc(noInduct.map(name).join(", ")) + "</div>" : "");
  }

  async function viewPeople(tab) {
    setBar("People", scopeLabel(), true);
    const ps = await people(), docs = await H.list("hrdocs"), signs = await H.list("hrsigns"), cards = await Data.list("cards", "team");
    const want = { current: "active", starting: "onboarding", left: "leaver" }[tab] || "active";
    const list = ps.filter((p) => p.status === want).sort((a, b) => name(a).localeCompare(name(b)));
    const flagsOf = (p) => { const n = toSign(docs, signs, p).length, exp = cards.filter((c) => c.user === p.user && IC.Cards.live(c) && IC.Cards.state(c).cls !== "approved" && IC.Cards.state(c).days != null).length; return { n, exp }; };
    const tabs = '<div class="tabs">' + [["current", "Current"], ["starting", "Starting"], ["left", "Left"]].map(([k, t]) => '<a href="#/hr/people/' + k + '"' + (k === tab ? ' class="on"' : "") + ">" + t + " (" + ps.filter((p) => p.status === { current: "active", starting: "onboarding", left: "leaver" }[k]).length + ")</a>").join("") + "</div>";
    if (window.matchMedia("(min-width: 1024px)").matches) {
      // computer screen: one row per person, every flag in its own column
      const yes = (b, t) => (b ? '<span class="pill pending">' + esc(t) + "</span>" : '<span class="small">–</span>');
      $("main").innerHTML = tabs + (list.length ? '<div class="scroll-x"><table class="tbl hr-tbl"><thead><tr><th>Name</th><th>Role</th><th>Area</th><th>Manager</th><th>Started</th><th>Documents to sign</th><th>Cards expiring</th><th>Emergency contact</th><th>Induction</th>' + (tab === "left" ? "<th>Left</th>" : "") + "</tr></thead><tbody>" +
        list.map((p) => { const f = flagsOf(p), em = p.emergency || {};
          return '<tr data-href="#/hr/person/' + esc(p.id) + '"><td><a href="#/hr/person/' + esc(p.id) + '"><b>' + esc(name(p)) + "</b></a></td><td>" + esc(p.role || "") + "</td><td>" + esc(p.area || "") + "</td><td>" + esc(p.manager || "") + "</td><td>" + esc(p.startDate ? fmtDate(p.startDate) : "") + "</td>" +
            "<td>" + yes(f.n, f.n + " to sign") + "</td><td>" + yes(f.exp, f.exp + " expiring") + "</td><td>" + (em.name ? esc(em.name + (em.phone ? " · " + em.phone : "")) : '<span class="pill declined">Missing</span>') + "</td>" +
            "<td>" + (p.inductedAt ? esc(fmtDate(p.inductedAt)) : p.status === "onboarding" ? (p.onboardedAt ? '<span class="pill approved">Form done</span>' : '<span class="pill">Invited</span>') : '<span class="pill pending">Not recorded</span>') + "</td>" +
            (tab === "left" ? "<td>" + esc(fmtDate(p.leftDate) + " · " + (p.leftReason || "")) + "</td>" : "") + "</tr>"; }).join("") + "</tbody></table></div>" : '<div class="empty small">Nobody here.</div>');
      document.querySelectorAll("tr[data-href]").forEach((r) => (r.onclick = (e) => { if (e.target.tagName !== "A") location.hash = r.dataset.href; }));
      return;
    }
    $("main").innerHTML = tabs +
      (list.length ? list.map((p) => {
        const n = toSign(docs, signs, p).length, exp = cards.filter((c) => c.user === p.user && IC.Cards.live(c) && IC.Cards.state(c).cls !== "approved" && IC.Cards.state(c).days != null).length;
        const flags = [n ? n + " to sign" : "", exp ? exp + " card" + (exp > 1 ? "s" : "") + " expiring" : "", p.status === "onboarding" ? (p.onboardedAt ? "ready to start " + fmtDay(p.startDate) : "invited") : "", p.status === "leaver" ? "left " + fmtDate(p.leftDate) : ""].filter(Boolean);
        return '<a class="tile-row" href="#/hr/person/' + esc(p.id) + '"><span><b>' + esc(name(p)) + '</b><span class="small">' + esc([p.role, p.area].filter(Boolean).join(" · ")) + "</span></span>" +
          (flags.length ? '<span class="pill ' + (p.status === "active" ? "pending" : "") + '">' + esc(flags.join(" · ")) + "</span>" : "›") + "</a>";
      }).join("") : '<div class="empty small">Nobody here.</div>');
  }

  async function viewPerson(id) {
    const p = (await people()).find((x) => x.id === id); if (!p) { location.hash = "#/hr/people"; return; }
    setBar(name(p), [p.role, p.area].filter(Boolean).join(" · "), true);
    const docs = await H.list("hrdocs"), signs = await H.list("hrsigns"), mine = docsFor(docs, p);
    const cards = p.user ? (await Data.list("cards", "team")).filter((c) => c.user === p.user && IC.Cards.live(c)) : [];
    const abs = last12((await H.list("absence")).filter((a) => a.user === p.user && p.user));
    const ind = (await H.list("inducts")).filter((x) => x.personId === p.id).sort((a, b) => (b.doneAt || "").localeCompare(a.doneAt || ""))[0];
    const leave = p.user ? (await Data.list("leave", "team")).filter((r) => r.user === p.user && r.type === "Annual leave" && (r.status === "approved" || r.status === "pending")) : [];
    const ly = IC.Leave.leaveYear(), inYear = leave.filter((r) => parseDate(r.from) >= ly.start && parseDate(r.from) <= ly.end);
    const taken = inYear.filter((r) => r.status === "approved").reduce((t, r) => t + IC.Leave.daysOf(r), 0), booked = inYear.filter((r) => r.status === "pending").reduce((t, r) => t + IC.Leave.daysOf(r), 0);
    const em = p.emergency || {}, em2 = p.emergency2 || {}, rtw = p.rtw || {}, ppe = p.ppeSizes || {};
    let html = kv([["Status", STATUS[p.status][0]], ["Role", p.role], ["Area", p.area], ["Start date", p.startDate ? fmtDate(p.startDate) : ""], ["Manager", p.manager], ["App sign-in", p.user || "Not set up yet"], p.status === "leaver" ? ["Left", fmtDate(p.leftDate) + " · " + (p.leftReason || "")] : null]);
    if (p.status === "onboarding") {
      html += '<div class="section-h">Starting</div>' + (p.onboardedAt ? '<div class="note">Onboarding form done ' + esc(fmtDay(p.onboardedAt)) + ". Bring on the first day: the original right-to-work document and their cards.</div>" : '<div class="note">Invited; they haven\'t finished the onboarding form yet.</div>');
      if (isFull()) html += '<div class="card"><b>Set up their app account</b><p class="small">Create their Microsoft account first (Microsoft 365 admin centre, no licence needed for the app), then enter it here. Their documents, signatures and cards move across.</p>' +
        field("aEmail", "Work sign-in", p.user || "", "email", ' placeholder="first.last@boltonstructures.com"') + select("aRole", "App role", Object.keys(CFG.roles).filter((r) => r !== "Screens"), p.appRole || p.role, true) +
        field("aAllow", "Holiday allowance (days a year)", p.leaveAllowance || 22, "number") + '<button class="btn primary block" id="aGo">Activate</button></div>';
    }
    html += '<div class="cols2"><div>';
    html += '<div class="section-h">Emergency contact</div>' + (em.name ? kv([[em.relation || "Contact", em.name], ["Phone", em.phone], em2.name ? [em2.relation || "Second contact", em2.name + " · " + (em2.phone || "")] : null]) + (em.phone ? '<a class="btn block" href="tel:' + esc(em.phone.replace(/\s/g, "")) + '">Ring ' + esc(em.name.split(" ")[0]) + "</a>" : "") : '<div class="flag">No emergency contact on record.</div>');
    if (isFull()) {
      html += '<div class="section-h">Personal details</div>' + kv([["Full name", [p.firstName, p.lastName].join(" ")], ["Date of birth", p.dob ? fmtDate(p.dob) : ""], ["Mobile", p.mobile], ["Personal email", p.personalEmail], ["Address", addr(p)], ["NI number", p.ni],
        ["Starter statement", p.starter], ["Student loan", p.studentLoan]]) + '<a class="btn block" href="#/hr/edit/' + esc(p.id) + '">Edit details</a>' +
        '<div class="section-h">Right to work</div>' + kv([["Document", rtw.type || "Not given"], ["Share code", rtw.shareCode], ["Original seen", rtw.checkedBy ? rtw.checkedBy + " · " + fmtDate(rtw.checkedOn) : "Not yet"], ["Check again by", rtw.recheck ? fmtDate(rtw.recheck) : ""]]) +
        (rtw.photos && rtw.photos.length ? '<div class="thumbs" id="rtwTh"></div>' : "") +
        (!rtw.checkedBy ? '<button class="btn block" id="rtwOk">I\'ve seen the original</button>' : "");
    }
    if (ppe.boots || ppe.hivis) html += '<div class="section-h">PPE sizes</div>' + kv([["Boots", ppe.boots], ["Hi-vis / jacket", ppe.hivis], ["Trousers", ppe.trousers], ["Gloves", ppe.gloves]]);
    html += '</div><div>';
    html += '<div class="section-h">Documents</div>' + (mine.length ? mine.map((d) => docRow(d, d.requiresSign ? (signedBy(signs, signKey(p), d) ? '<span class="pill approved">Signed ' + esc(fmtDate(signedBy(signs, signKey(p), d).signedAt)) + "</span>" : '<span class="pill pending">Not signed</span>') : "")).join("") : '<div class="empty small">None.</div>') +
      (isFull() ? '<a class="btn block" href="#/hr/doc-new//' + esc(p.id) + '">Add a personal document (contract, letter …)</a>' : "");
    html += '<div class="section-h">Company induction</div>' + (ind ? '<a class="tile-row" href="#/hr/induct/' + esc(p.id) + '"><span><b>Done ' + esc(fmtDay(ind.doneAt)) + '</b><span class="small">By ' + esc(ind.byName) + "</span></span>›</a>" : '<a class="btn block" href="#/hr/induct/' + esc(p.id) + '">Do the company induction</a>');
    html += '<div class="section-h">Training and cards</div>' + (cards.length ? cards.map((c) => IC.Cards.row(c)).join("") : '<div class="empty small">No cards on record.</div>') +
      (p.onboardCards && p.onboardCards.length && p.status === "onboarding" ? '<div class="small">' + p.onboardCards.length + " card(s) from the onboarding form; they move to the app when the account is activated.</div>" : "");
    if (p.user) html += '<div class="section-h">Holidays this year</div>' + kv([["Allowance", (p.leaveAllowance || "") + " days"], ["Taken", taken + " days"], ["Booked, waiting", booked + " days"], ["Left", (p.leaveAllowance || 0) - taken - booked + " days"]]);
    html += '<div class="section-h">Absence, last 12 months</div>' + (abs.length ? abs.map((x) => absRow(x, false)).join("") + '<div class="small">' + abs.reduce((t, x) => t + absenceDays(x), 0) + " working days in " + abs.length + " absence" + (abs.length > 1 ? "s" : "") + "</div>" : '<div class="empty small">None recorded.</div>') +
      (p.user ? '<a class="btn block" href="#/hr/absence-new/' + esc(p.id) + '">Record an absence</a>' + (can("manager") ? '<a class="btn block" href="#/manager/person/' + encodeURIComponent(p.user) + '/0">Check-ins and timesheet</a>' : "") : "");
    html += "</div></div>";
    if (isFull() && p.status === "active") html += '<button class="btn block" id="leaver">Mark as a leaver</button>';
    $("main").innerHTML = html;

    if ($("rtwTh")) { const urls = await Promise.all(rtw.photos.map((x) => H.fileUrl(x))); $("rtwTh").innerHTML = urls.map((u) => '<img src="' + u + '" alt="">').join(""); $("rtwTh").querySelectorAll("img").forEach((im, i) => (im.onclick = () => window.open(urls[i], "_blank"))); }
    if ($("rtwOk")) $("rtwOk").onclick = () => {
      const sh = sheet('<h3>Right to work: original seen</h3><p class="small">Check the original with the person present, then keep the copy here. If their permission is time-limited, set the date to check again.</p>' + field("rcDate", "Check again by (time-limited permission only)", "", "date") +
        '<button class="btn primary block" id="rcGo">Record check</button><button class="btn block" id="rcX">Cancel</button>');
      $("rcX").onclick = sh.close;
      $("rcGo").onclick = async () => { p.rtw = Object.assign({}, rtw, { checkedBy: Data.profile.name, checkedOn: today(), recheck: val("rcDate") }); await H.save("hrpeople", p); sh.close(); toast("Recorded"); IC.refreshView(); };
    };
    if ($("aGo")) $("aGo").onclick = () => activate(p);
    if ($("leaver")) $("leaver").onclick = () => {
      const sh = sheet("<h3>Mark " + esc(name(p)) + " as a leaver</h3>" + field("lvDate", "Last day", today(), "date") + select("lvWhy", "Reason", LEAVER, "", true) +
        '<p class="small">Turn off their Microsoft account on their last day; the app stops working for them straight away. Their records are kept for the retention period in the privacy notice.</p>' +
        '<button class="btn primary block" id="lvGo">Mark as leaver</button><button class="btn block" id="lvX">Cancel</button>');
      $("lvX").onclick = sh.close;
      $("lvGo").onclick = async () => { if (!val("lvWhy")) { toast("Choose a reason"); return; } Object.assign(p, { status: "leaver", leftDate: val("lvDate"), leftReason: val("lvWhy") }); await H.save("hrpeople", p); sh.close(); toast("Marked as a leaver"); IC.refreshView(); };
    };
  }

  // New starter → current: link their Microsoft sign-in; signatures and cards from the onboarding form move to it
  async function activate(p) {
    const email = val("aEmail").toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast("Enter their work sign-in email"); return; }
    if (!val("aRole")) { toast("Choose their app role"); return; }
    const was = p.user || "invite:" + p.inviteId;
    for (const s of (await H.list("hrsigns")).filter((s) => s.user === was)) { s.user = email; await H.save("hrsigns", s); }
    for (const c of p.onboardCards || []) await Data.save("cards", Object.assign({}, c, { user: email, userName: name(p), status: "current" }));
    Object.assign(p, { user: email, appRole: val("aRole"), role: val("aRole"), leaveAllowance: Number(val("aAllow")) || 22, status: "active", activatedBy: Data.profile.name, activatedAt: new Date().toISOString(), onboardCards: [] });
    await H.save("hrpeople", p);
    const inv = p.inviteId && (await H.get("invites", p.inviteId)); if (inv) { inv.status = "activated"; await H.save("invites", inv); }
    toast(name(p) + " is set up. Add them to Employees in iCONSTRUCTE too (name, initials, role)."); IC.refreshView();
  }

  // ---------------------------------------------------------------- absence
  async function viewAbsence() {
    setBar("Absence", "Last 12 months", true);
    const ps = await people(), abs = last12(await H.list("absence")).filter((a) => ps.some((p) => p.user === a.user)).sort((a, b) => b.from.localeCompare(a.from));
    const by = {}; abs.forEach((a) => { const k = a.userName; by[k] = by[k] || { n: 0, d: 0, sick: 0 }; by[k].n++; by[k].d += absenceDays(a); if (a.type === "Sickness") by[k].sick++; });
    const rtwDue = abs.filter((a) => a.type === "Sickness" && !a.rtw);
    $("main").innerHTML = '<a class="btn primary block" href="#/hr/absence-new">Record an absence</a>' +
      (rtwDue.length ? '<div class="flag">Return-to-work chat not recorded: ' + esc(rtwDue.map((a) => a.userName + " (" + fmtDay(a.from) + ")").join(", ")) + "</div>" : "") +
      (Object.keys(by).length ? '<div class="section-h">By person</div><div class="scroll-x"><table class="tbl"><thead><tr><th>Name</th><th>Absences</th><th>Days</th><th>Sickness spells</th></tr></thead><tbody>' +
        Object.keys(by).sort().map((k) => "<tr><td>" + esc(k) + "</td><td>" + by[k].n + "</td><td>" + by[k].d + "</td><td>" + by[k].sick + "</td></tr>").join("") + "</tbody></table></div>" : "") +
      '<div class="section-h">All absences</div>' + (abs.length ? abs.map((a) => absRow(a, true) + (a.type === "Sickness" && !a.rtw ? '<button class="btn sm" data-rtw="' + esc(a.id) + '">Return-to-work done</button>' : "")).join("") : '<div class="empty small">None recorded.</div>');
    document.querySelectorAll("[data-rtw]").forEach((b) => (b.onclick = async () => { const a = await H.get("absence", b.dataset.rtw); a.rtw = { by: Data.profile.name, on: today() }; await H.save("absence", a); toast("Recorded"); IC.refreshView(); }));
  }

  async function absenceForm(personId) {
    setBar("Record an absence", "", true);
    const ps = (await people()).filter((p) => p.status === "active" && p.user).sort((a, b) => name(a).localeCompare(name(b)));
    let fit = null;
    $("main").innerHTML = '<div class="card">' + select("abWho", "Who", ps.map((p) => [p.id, name(p)]), personId, true) + select("abType", "Type", ABSENCE, "", true) +
      field("abFrom", "First day off", today(), "date") + field("abTo", "Last day off (blank if still off)", "", "date") +
      '<label class="confirm"><input type="checkbox" id="abHalf"><span>Half day</span></label>' +
      '<div id="abSick" hidden><label class="confirm"><input type="checkbox" id="abFit"><span>Fit note received (needed after 7 days off)</span></label><input id="abFitPh" type="file" accept="image/*,application/pdf" hidden>' +
      '<label class="confirm"><input type="checkbox" id="abRtw"><span>Return-to-work chat done</span></label></div>' +
      '<label class="fl">Note (only HR and the person see this; keep medical detail out)<textarea id="abNote" rows="2"></textarea></label>' +
      '<button class="btn primary block" id="abSave">Save</button></div>';
    $("abType").onchange = () => ($("abSick").hidden = val("abType") !== "Sickness");
    $("abFit").onchange = () => { $("abFitPh").hidden = !$("abFit").checked; };
    $("abFitPh").onchange = async (e) => { if (e.target.files[0]) fit = await H.putFile(e.target.files[0]); };
    $("abSave").onclick = async () => {
      const p = ps.find((x) => x.id === val("abWho"));
      if (!p || !val("abType") || !val("abFrom")) { toast("Choose who, the type and the first day"); return; }
      const to = val("abTo") || val("abFrom"); if (to < val("abFrom")) { toast("The last day is before the first"); return; }
      await H.save("absence", { user: p.user, userName: name(p), type: val("abType"), from: val("abFrom"), to, open: !val("abTo"), halfStart: $("abHalf").checked, days: $("abHalf").checked ? 0.5 : undefined,
        fitNote: val("abType") === "Sickness" && $("abFit").checked, fitNoteFile: fit, rtw: val("abType") === "Sickness" && $("abRtw").checked ? { by: Data.profile.name, on: today() } : null, note: val("abNote"), recordedBy: Data.profile.name });
      toast("Absence recorded"); history.back();
    };
  }

  // ---------------------------------------------------------------- company induction (first day)
  async function viewInduct(id) {
    const p = (await people()).find((x) => x.id === id); if (!p) { location.hash = "#/hr/people"; return; }
    const items = INDUCT.common.concat(INDUCT[p.area] || []), done = (await H.list("inducts")).filter((x) => x.personId === p.id).sort((a, b) => (b.doneAt || "").localeCompare(a.doneAt || ""))[0];
    setBar("Company induction", name(p) + " · " + (p.area || ""), true);
    if (done) {
      const urls = await Promise.all([done.sigStarter, done.sigBy].map((x) => (x ? H.fileUrl(x) : "")));
      $("main").innerHTML = '<div class="note">Done ' + esc(fmtDay(done.doneAt)) + " by " + esc(done.byName) + ".</div>" + done.items.map((t) => '<div class="cl-row">✓ ' + esc(t) + "</div>").join("") +
        (done.notes ? '<div class="small">Notes: ' + esc(done.notes) + "</div>" : "") + '<div class="section-h">Signatures</div><div class="thumbs">' + urls.filter(Boolean).map((u) => '<img class="sig-img" src="' + u + '" alt="">').join("") + "</div>";
      return;
    }
    $("main").innerHTML = '<p class="small">Go through each item with ' + esc(name(p).split(" ")[0]) + " and tick it. Both of you sign at the end.</p>" +
      items.map((t, i) => '<label class="confirm"><input type="checkbox" data-i="' + i + '"><span>' + esc(t) + "</span></label>").join("") +
      '<label class="fl">Notes<textarea id="inNotes" rows="2"></textarea></label><div id="inSig1"></div><div id="inSig2"></div><button class="btn primary block" id="inSave">Save induction</button>';
    const s1 = signaturePad(name(p) + " (new starter)"), s2 = signaturePad(Data.profile.name + " (giving the induction)"); $("inSig1").appendChild(s1.el); $("inSig2").appendChild(s2.el);
    $("inSave").onclick = async () => {
      const ticked = [...document.querySelectorAll("[data-i]")].filter((c) => c.checked).map((c) => items[Number(c.dataset.i)]);
      if (ticked.length < items.length && !(await IC.ask((items.length - ticked.length) + " item(s) not ticked. Save anyway?", "Save"))) return;
      if (s1.isEmpty() || s2.isEmpty()) { toast("Both of you sign"); return; }
      await H.save("inducts", { personId: p.id, user: p.user, userName: name(p), items: ticked, missed: items.filter((t) => !ticked.includes(t)), notes: val("inNotes"), byName: Data.profile.name, doneAt: new Date().toISOString(),
        sigStarter: await H.putFile(await s1.toBlob()), sigBy: await H.putFile(await s2.toBlob()) });
      p.inductedAt = new Date().toISOString(); await H.save("hrpeople", p);
      toast("Induction saved"); location.hash = "#/hr/person/" + p.id;
    };
  }

  // ---------------------------------------------------------------- new starters: invite link and QR code
  async function viewStarters() {
    setBar("New starters", "Invite, onboard, induct", true);
    const inv = (await invites()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    const st = { sent: ["Invited", "pending"], started: ["Filling it in", "pending"], completed: ["Ready to start", "approved"], activated: ["Started", "approved"], cancelled: ["Cancelled", "cancelled"] };
    const open = inv.filter((i) => i.status !== "activated" && i.status !== "cancelled"), past = inv.filter((i) => !open.includes(i)).slice(0, 15);
    const row = (i) => '<a class="tile-row" href="#/hr/invite/' + esc(i.id) + '"><span><b>' + esc(i.name) + '</b><span class="small">' + esc(i.area + " · starts " + fmtDay(i.startDate)) + '</span></span><span class="pill ' + st[i.status][1] + '">' + st[i.status][0] + "</span></a>";
    $("main").innerHTML = '<a class="btn primary block" href="#/hr/invite-new">Invite a new starter</a>' +
      '<p class="small">They get a link (or scan a QR code) to fill in their details, right to work, cards and PPE sizes, and read and sign the induction pack on their own phone before day one. No account needed until they start.</p>' +
      '<div class="section-h">On the way</div>' + (open.length ? open.map(row).join("") : '<div class="empty small">Nobody invited.</div>') +
      (past.length ? '<div class="section-h">Earlier</div>' + past.map(row).join("") : "");
  }

  async function inviteForm() {
    setBar("Invite a new starter", "", true);
    const mgrs = SAMPLES.filter((s) => can("manager", s)).map((s) => s.name);
    $("main").innerHTML = '<div class="card">' + field("iName", "Their name", "") + field("iMob", "Their mobile", "", "tel") + field("iEmail", "Their personal email (optional)", "", "email") +
      select("iArea", "Where they'll work", AREAS, "Site", false) + field("iRole", "Job title", "") + field("iStart", "Start date", "", "date") +
      field("iReport", "Report to (first day)", "") + select("iMgr", "Line manager", mgrs, Data.profile.name, true) +
      '<label class="fl">First-day message (optional)<textarea id="iMsg" rows="2" placeholder="e.g. Meet Ian at the yard, 07:15. Bring your boots and CSCS card."></textarea></label>' +
      '<button class="btn primary block" id="iGo">Create invite</button></div>';
    $("iGo").onclick = async () => {
      if (!val("iName") || !val("iStart")) { toast("Add their name and start date"); return; }
      const exp = new Date(); exp.setDate(exp.getDate() + 30);
      const inv = await H.save("invites", { token: randomToken(), name: val("iName"), mobile: val("iMob"), personalEmail: val("iEmail"), area: val("iArea"), role: val("iRole"), startDate: val("iStart"),
        reportTo: val("iReport"), manager: val("iMgr"), message: val("iMsg"), status: "sent", createdBy: Data.profile.name, expires: isoDate(exp) });
      location.hash = "#/hr/invite/" + inv.id;
    };
  }

  // The link: the app address + #/join/<token>. In demo the invite's basic details ride along in the link, so it opens on another phone too.
  function inviteLink(inv) {
    const base = (CFG.publicUrl || location.origin + location.pathname).replace(/#.*$/, "");
    const demo = DEMO ? "/" + btoa(unescape(encodeURIComponent(JSON.stringify({ i: inv.id, n: inv.name, a: inv.area, r: inv.role, s: inv.startDate, t: inv.reportTo, m: inv.message })))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_") : "";
    return base + "#/join/" + inv.token + demo;
  }
  function qrSvg(text) { const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); }

  async function viewInvite(id) {
    const inv = (await invites()).find((i) => i.id === id); if (!inv) { location.hash = "#/hr/starters"; return; }
    setBar(inv.name, inv.area + " · starts " + fmtDay(inv.startDate), true);
    const url = inviteLink(inv), first = inv.name.split(" ")[0];
    const text = "Hi " + first + ", welcome to Bolton Steel Structures. Before your first day (" + fmtDay(inv.startDate) + "), please fill in your starter details and read the induction pack here: " + url;
    const mob = (inv.mobile || "").replace(/\s/g, "").replace(/^0/, "44");
    const p = (await H.list("hrpeople")).find((x) => x.inviteId === inv.id);
    $("main").innerHTML = kv([["Status", { sent: "Invited, not opened", started: "Filling it in", completed: "Done, ready to start", activated: "Started", cancelled: "Cancelled" }[inv.status]], ["Mobile", inv.mobile], ["Line manager", inv.manager], ["Link works until", fmtDate(inv.expires)]]) +
      (inv.status === "sent" || inv.status === "started" ? '<div class="qr-box" id="qr">' + qrSvg(url) + '<div class="small">Scan with the phone camera</div></div>' +
        (mob ? '<a class="btn primary block" target="_blank" rel="noopener" href="https://wa.me/' + esc(mob) + "?text=" + encodeURIComponent(text) + '">Send on WhatsApp</a><a class="btn block" href="sms:' + esc(inv.mobile.replace(/\s/g, "")) + "?&body=" + encodeURIComponent(text) + '">Send as a text</a>' : "") +
        '<button class="btn block" id="cp">Copy the link</button><button class="btn block" id="pr">Print the QR code</button><button class="btn block" id="cx">Cancel the invite</button>' : "") +
      (p ? '<a class="btn primary block" href="#/hr/person/' + esc(p.id) + '">Open their HR record</a>' : "");
    if ($("cp")) $("cp").onclick = async () => { try { await navigator.clipboard.writeText(url); toast("Link copied"); } catch (e) { sheet('<h3>Link</h3><textarea rows="5" readonly>' + esc(url) + "</textarea>"); } };
    if ($("pr")) $("pr").onclick = () => {
      const w = window.open("", "_blank"); if (!w) { toast("Allow pop-ups to print"); return; }
      w.document.write("<!DOCTYPE html><html><head><title>New starter: " + esc(inv.name) + '</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:40px}svg{width:320px;height:320px}</style></head><body><img src="' + new URL("icons/bss-logo.jpg", location.href).href + '" style="height:70px"><h1>Welcome, ' + esc(first) + "</h1><p>Scan this with your phone camera to fill in your starter details and read the induction pack before " + esc(fmtDay(inv.startDate)) + ".</p>" + qrSvg(url) + "<p style=\"font-size:12px;color:#666\">This code is just for you. It stops working on " + esc(fmtDate(inv.expires)) + ".</p></body></html>");
      w.document.close(); setTimeout(() => w.print(), 300);
    };
    if ($("cx")) $("cx").onclick = async () => { if (!(await IC.ask("Cancel " + first + "'s invite? The link stops working.", "Cancel invite", "Keep it"))) return; inv.status = "cancelled"; await H.save("invites", inv); IC.refreshView(); };
  }

  // ---------------------------------------------------------------- the new starter's side: #/join/<token> (no sign-in)
  async function join(args) {
    const token = args[0] || "";
    $("nav").hidden = true; ["btnRefresh", "btnMenu", "btnBack"].forEach((b) => $(b) && ($(b).hidden = true));
    setBar("Bolton Steel Structures", "New starter", false);
    let inv = null, docs = [];
    try {
      if (DEMO) {
        await ensureDemo();
        inv = (await Data.list("invites", "team")).find((i) => i.token === token) || null;
        if (!inv && args[1]) { try { const j = JSON.parse(decodeURIComponent(escape(atob(args[1].replace(/-/g, "+").replace(/_/g, "/"))))); inv = { id: j.i, token, name: j.n, area: j.a, role: j.r, startDate: j.s, reportTo: j.t, message: j.m, status: "sent", expires: "9999-12-31" }; } catch (e) { /* bad link */ } }
        docs = (await Data.list("hrdocs", "team")).filter((d) => d.induction && d.status !== "retired" && !d.user && inv && (d.audience === "Everyone" || d.audience === inv.area));
      } else {
        const r = await fetch(CFG.apiBase + "/onboard/" + encodeURIComponent(token)); if (r.ok) { const j = await r.json(); inv = j.invite; docs = j.docs; }
      }
    } catch (e) { console.warn(e); }
    if (!inv || inv.status === "cancelled" || inv.status === "activated" || inv.expires < today()) {
      $("main").innerHTML = '<div class="signin"><span class="logo-wrap"><img class="logo bss" src="icons/bss-logo.jpg" alt="Bolton Steel Structures Ltd"></span><p>This link has expired or has already been used. Please ring the office.</p></div>'; return;
    }
    if (inv.status === "completed") { $("main").innerHTML = doneHtml(inv); return; }
    const key = "join:" + token, st = Object.assign({ step: 0, d: {}, cards: [], signed: {} }, LS.get(key, {}));
    const keep = () => LS.set(key, st);
    const first = inv.name.split(" ")[0];
    const STEPS = ["Welcome", "About you", "Emergency contact", "Tax and right to work", "Cards and tickets", "PPE sizes", "Read and sign"];

    const draw = () => {
      const s = st.step, d = st.d;
      const head = s ? '<div class="small">Step ' + s + " of " + (STEPS.length - 1) + " · " + STEPS[s] + '</div><div class="progress"><div style="width:' + Math.round((s / (STEPS.length - 1)) * 100) + '%"></div></div>' : "";
      const nav = '<div class="row">' + (s ? '<button class="btn" id="jBack">Back</button>' : "") + '<button class="btn primary" id="jNext">' + (s === STEPS.length - 1 ? "Send to Bolton Steel Structures" : s ? "Next" : "Start") + "</button></div>";
      let body = "";
      if (s === 0) body = '<img class="join-logo" src="icons/bss-logo.jpg" alt="Bolton Steel Structures Ltd"><h2>Welcome, ' + esc(first) + "</h2>" +
        "<p>You start on <b>" + esc(fmtDay(inv.startDate)) + "</b>" + (inv.role ? " as " + esc(inv.role) : "") + (inv.area ? " (" + esc(inv.area.toLowerCase()) + ")" : "") + ".</p>" +
        "<p>Before then, please fill this in on your phone. It takes about 15 minutes. Have these to hand:</p><ul><li>your National Insurance number</li><li>your passport, or your Home Office share code</li><li>your CSCS card and any other cards or tickets</li><li>an emergency contact's name and number</li></ul>" +
        '<p class="small">What you put here goes to Bolton Steel Structures\' HR records only, kept securely and used for your employment (see the staff privacy notice in the induction pack). You can stop and come back to this link later; your answers are kept on this phone until you send them.</p>';
      if (s === 1) body = field("jFirst", "First name (as on your passport)", d.firstName) + field("jLast", "Last name", d.lastName) + field("jPref", "Name you go by (if different)", d.preferredName) +
        field("jDob", "Date of birth", d.dob, "date") + field("jMob", "Mobile", d.mobile || inv.mobile, "tel") + field("jEmail", "Email", d.personalEmail || inv.personalEmail, "email") +
        field("jA1", "Address", d.address1) + field("jA2", "Address line 2", d.address2) + field("jTown", "Town", d.town) + field("jPc", "Postcode", d.postcode) + field("jNi", "National Insurance number", d.ni, "text", ' placeholder="QQ 12 34 56 C"');
      if (s === 2) body = "<p>Who should we ring if you're hurt or taken ill at work?</p>" + field("jEn", "Name", (d.emergency || {}).name) + field("jEr", "Relationship (e.g. partner, mum)", (d.emergency || {}).relation) + field("jEp", "Phone", (d.emergency || {}).phone, "tel") +
        '<div class="section-h">Second contact (optional)</div>' + field("jE2n", "Name", (d.emergency2 || {}).name) + field("jE2r", "Relationship", (d.emergency2 || {}).relation) + field("jE2p", "Phone", (d.emergency2 || {}).phone, "tel");
      if (s === 3) body = '<div class="section-h">Tax (HMRC starter checklist)</div><p class="small">Choose the one that\'s true for you. If you have a P45 from your last job, bring it on your first day.</p>' +
        STARTER.map(([k, t]) => '<label class="confirm"><input type="radio" name="jSt" value="' + k + '"' + (d.starter === k ? " checked" : "") + "><span><b>" + k + ".</b> " + esc(t) + "</span></label>").join("") +
        select("jLoan", "Student or postgraduate loan", LOANS, d.studentLoan, true) +
        '<div class="section-h">Right to work in the UK</div><p class="small">We have to check this before you start. Bring the original on your first day.</p>' + select("jRtw", "What will you show us?", RTW, (d.rtw || {}).type, true) +
        '<div id="jShare"' + ((d.rtw || {}).type === RTW[1] ? "" : " hidden") + ">" + field("jCode", "Share code (from gov.uk/prove-right-to-work)", (d.rtw || {}).shareCode) + "</div>" +
        '<label class="fl">Photo of the document (photo page of your passport)<input id="jRtwPh" type="file" accept="image/*" multiple></label><div class="thumbs" id="jRtwTh"></div>' +
        '<p class="small">Bank details: the office will ask you for these separately, not through this form.</p>';
      if (s === 4) body = "<p>Add each card or ticket you hold, e.g. CSCS, CPCS, IPAF, PASMA, first aid, welding tickets. Skip this if you haven't got any.</p>" +
        st.cards.map((c, i) => '<div class="req"><div><b>' + esc(c.type) + '</b><div class="small">' + esc([c.number, c.expiry ? "expires " + fmtDate(c.expiry) : ""].filter(Boolean).join(" · ")) + '</div></div><div class="req-r"><button class="btn sm" data-rm="' + i + '">Remove</button></div></div>').join("") +
        '<div class="card">' + select("jcType", "Card", IC.Cards.TYPES, "", true) + field("jcNum", "Card number", "") + field("jcExp", "Expiry date", "", "date") +
        '<label class="fl">Photos (front and back)<input id="jcPh" type="file" accept="image/*" multiple></label><button class="btn block" id="jcAdd">Add this card</button></div>';
      if (s === 5) body = "<p>So we can have your PPE ready.</p>" + field("jBoots", "Boot size (UK)", (d.ppe || {}).boots, "text", ' inputmode="decimal"') + select("jHv", "Hi-vis vest / jacket", SIZES, (d.ppe || {}).hivis, true) +
        field("jTr", "Trousers (waist / leg)", (d.ppe || {}).trousers) + select("jGl", "Gloves", ["S", "M", "L", "XL", "2XL"], (d.ppe || {}).gloves, true);
      if (s === 6) body = "<p>Please read each of these, tick it, then sign once at the bottom.</p>" + docs.map((x) => '<details class="card doc-body"><summary><b>' + esc(x.title) + "</b> " + (st.signed[x.id] ? "✓" : "") + "</summary>" +
        (x.body || "").split(/\n{2,}/).map((t) => "<p>" + esc(t) + "</p>").join("") + (x.file ? '<p class="small">The full document will be in the app once your account is set up.</p>' : "") +
        '<label class="confirm"><input type="checkbox" data-doc="' + esc(x.id) + '"' + (st.signed[x.id] ? " checked" : "") + "><span>I have read and understood this</span></label></details>").join("") + '<div id="jSig"></div>';
      $("main").innerHTML = head + '<div class="card">' + body + "</div>" + nav;
      wireStep(s);
    };

    let pad = null;
    const wireStep = (s) => {
      if ($("jBack")) $("jBack").onclick = () => { collect(s); st.step--; keep(); draw(); $("main").scrollTop = 0; };
      $("jNext").onclick = async () => {
        collect(s); const err = check(s); if (err) { toast(err); return; }
        if (s === STEPS.length - 1) return submit();
        st.step++; keep(); draw(); $("main").scrollTop = 0;
        if (DEMO && inv.status === "sent") { const rec = (await Data.list("invites", "team")).find((i) => i.token === token); if (rec) { rec.status = "started"; await H.save("invites", rec); } }
      };
      if (s === 3) {
        $("jRtw").onchange = () => ($("jShare").hidden = val("jRtw") !== RTW[1]);
        const th = async () => { const urls = await Promise.all(((st.d.rtw || {}).photos || []).map((x) => H.fileUrl(x))); $("jRtwTh").innerHTML = urls.map((u) => '<img src="' + u + '" alt="">').join(""); };
        $("jRtwPh").onchange = async (e) => { st.d.rtw = st.d.rtw || {}; st.d.rtw.photos = st.d.rtw.photos || []; for (const f of e.target.files) st.d.rtw.photos.push(await H.putFile(f)); e.target.value = ""; keep(); th(); };
        th();
      }
      if (s === 4) {
        document.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = () => { st.cards.splice(Number(b.dataset.rm), 1); keep(); draw(); }));
        $("jcAdd").onclick = async () => {
          if (!val("jcType")) { toast("Choose the card"); return; }
          const photos = []; for (const f of $("jcPh").files) photos.push(await H.putFile(f));
          st.cards.push({ type: val("jcType"), number: val("jcNum"), expiry: val("jcExp"), photos }); keep(); draw();
        };
      }
      if (s === 6) { pad = signaturePad("Your signature"); $("jSig").appendChild(pad.el); document.querySelectorAll("[data-doc]").forEach((c) => (c.onchange = () => { st.signed[c.dataset.doc] = c.checked; keep(); })); }
    };
    const collect = (s) => {
      const d = st.d;
      if (s === 1) Object.assign(d, { firstName: val("jFirst"), lastName: val("jLast"), preferredName: val("jPref"), dob: val("jDob"), mobile: val("jMob"), personalEmail: val("jEmail"), address1: val("jA1"), address2: val("jA2"), town: val("jTown"), postcode: val("jPc").toUpperCase(), ni: val("jNi").toUpperCase() });
      if (s === 2) Object.assign(d, { emergency: { name: val("jEn"), relation: val("jEr"), phone: val("jEp") }, emergency2: val("jE2n") ? { name: val("jE2n"), relation: val("jE2r"), phone: val("jE2p") } : null });
      if (s === 3) { const r = document.querySelector('input[name="jSt"]:checked'); d.starter = r ? r.value : ""; d.studentLoan = val("jLoan"); d.rtw = Object.assign(d.rtw || {}, { type: val("jRtw"), shareCode: val("jCode") }); }
      if (s === 5) d.ppe = { boots: val("jBoots"), hivis: val("jHv"), trousers: val("jTr"), gloves: val("jGl") };
      keep();
    };
    const check = (s) => {
      const d = st.d;
      if (s === 1) { if (!d.firstName || !d.lastName) return "Add your name"; if (!d.dob) return "Add your date of birth"; if (!d.mobile) return "Add your mobile"; if (!d.address1 || !d.postcode) return "Add your address and postcode";
        if (d.ni && !/^[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]$/i.test(d.ni)) return "That NI number doesn't look right (two letters, six numbers, one letter)"; }
      if (s === 2 && (!d.emergency.name || !d.emergency.phone)) return "Add an emergency contact's name and phone";
      if (s === 3) { if (!d.starter) return "Choose A, B or C for tax"; if (!d.rtw.type) return "Choose what you'll show for right to work"; if (d.rtw.type === RTW[1] && !d.rtw.shareCode) return "Add your share code"; }
      if (s === 6) { if (docs.some((x) => !st.signed[x.id])) return "Tick each document to say you've read it"; if (!pad || pad.isEmpty()) return "Sign in the box"; }
      return "";
    };
    const submit = async () => {
      $("jNext").disabled = true;
      const sig = await H.putFile(await pad.toBlob()), d = st.d, at = new Date().toISOString();
      const person = { inviteId: inv.id, user: "", status: "onboarding", area: inv.area, role: inv.role, startDate: inv.startDate, manager: inv.manager || "", firstName: d.firstName, lastName: d.lastName, preferredName: d.preferredName,
        dob: d.dob, mobile: d.mobile, personalEmail: d.personalEmail, address1: d.address1, address2: d.address2, town: d.town, postcode: d.postcode, ni: d.ni, emergency: d.emergency, emergency2: d.emergency2,
        starter: d.starter, studentLoan: d.studentLoan, rtw: d.rtw, ppeSizes: d.ppe, onboardCards: st.cards.map((c) => ({ type: c.type, number: c.number, expiry: c.expiry, photos: c.photos })), onboardedAt: at };
      person.userName = name(person);
      const signs = docs.map((x) => ({ user: "invite:" + inv.id, userName: person.userName, docId: x.id, title: x.title, version: x.version, signedAt: at, sig }));
      try {
        if (DEMO) {
          const existing = (await Data.list("hrpeople", "team")).find((p) => p.inviteId === inv.id);
          await H.save("hrpeople", Object.assign(existing || {}, person));
          for (const s of signs) await H.save("hrsigns", s);
          const rec = (await Data.list("invites", "team")).find((i) => i.token === token) || Object.assign({}, inv);
          rec.status = "completed"; rec.completedAt = at; await H.save("invites", rec);
        } else {
          const r = await fetch(CFG.apiBase + "/onboard/" + encodeURIComponent(token), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ person, signs }) });
          if (!r.ok) throw new Error("send failed " + r.status);
        }
      } catch (e) { console.warn(e); $("jNext").disabled = false; toast("Couldn't send. Check your signal and try again."); return; }
      LS.set(key, null);
      $("main").innerHTML = doneHtml(inv);
    };
    draw();
  }
  const doneHtml = (inv) => '<div class="card"><img class="join-logo" src="icons/bss-logo.jpg" alt="Bolton Steel Structures Ltd"><h2>Thanks, ' + esc(inv.name.split(" ")[0]) + "</h2>" +
    "<p>That's all sent. See you on <b>" + esc(fmtDay(inv.startDate)) + "</b>" + (inv.reportTo ? ". Report to " + esc(inv.reportTo) : "") + ".</p>" + (inv.message ? '<div class="note">' + esc(inv.message) + "</div>" : "") +
    "<p>On your first day, bring:</p><ul><li>the original of your right-to-work document</li><li>your CSCS card and other cards</li><li>your P45, if you have one</li></ul><p>We'll set up the iCONSTRUCTE Site app on your phone and go through the company induction with you.</p></div>";

  // ---------------------------------------------------------------- demo data (sample text only)
  let demoReady = null;
  function ensureDemo() { if (!DEMO) return Promise.resolve(); return (demoReady = demoReady || seed()); }
  async function seed() {
    const have = (await IC.Store.all("records")).some((r) => r.kind === "hrdocs");
    if (have) { demoReady = null; return; }
    const put = (kind, rec) => IC.Store.put({ key: kind + ":" + rec.id, kind, rec: Object.assign({ createdAt: new Date().toISOString() }, rec) }, "records");
    const d = (off) => { const x = new Date(); x.setDate(x.getDate() + off); return isoDate(x); };
    // BSS's own documents (Liam, 23 Nov): titles, revisions and a summary in the app; the full files go into the HR store on Azure
    // (not bundled here: the trial site is public). Handbook, privacy notice and site / workshop rules still to come.
    const FULL = "The full document is held by the office and will open here once HR is on Azure.";
    const SAMPLE = "Sample text for the demo: waiting for Bolton Steel Structures' own document.";
    const docs = [
      ["hs", "Health and safety policy", "Policy", "Everyone", "Jul 2026", true, "Revised 6 July 2026 by Nick Maddison, Health & Safety Director (BSA / SKEB competence controls expanded; Client's Engineer design responsibility clarified). Earlier reviews: 27 January 2026 (John Wride, annual review) and 3 December 2025 (Liam Pilkington, Building Safety Act 2022 added).\n\nPart 1 is the statement of intent, the management safety structure and the strategy. Part 2 sets out who is responsible for what, including every employee and anyone driving on company business. Part 3 is the arrangements: risk assessment, training, first aid, accident reporting, fire and evacuation, CDM, working at height, lifting, PPE, welding and burning, drugs and alcohol, the Building Safety Act and more.\n\nEvery employee must take care of themselves and others, report accidents, damage and hazards, follow the agreed safe systems and wear the right PPE, and tell us straight away if asked to do work or use equipment they're not familiar with.\n\nDriving on company business: report vehicle defects and never drive a defective vehicle; never drive under the influence of alcohol or drugs (including prescription medicines that affect driving); no mobile phones while driving unless completely hands-free; plan the route and take breaks.\n\nDrugs and alcohol: no work under the influence. The company aims to prevent substance misuse, spot problems early and, where appropriate, offer help such as counselling or time off for treatment.\n\n" + FULL],
      ["wb", "Wellbeing policy", "Policy", "Everyone", "Jan 2026", true, "Reviewed 27 January 2026 (John Wride); statement of intent signed by Nick Maddison, Managing Director. Applies to everyone working for Bolton Steel Structures, including part-time, temporary and contract workers.\n\nIt covers physical health (safety, ergonomics, hygiene, subsidised gym membership and the on-site gym), mental health (stress, awareness, confidential support) and social wellbeing (teamwork, recognition, diversity and inclusion).\n\nYour part: follow the safety rules, use your PPE, report hazards and concerns to your supervisor straight away, take part in training, look after your health and ask for support when you need it. Questions go to the Managing Director.\n\n" + FULL],
      ["is", "Information security policy", "Policy", "Everyone", "1.0", true, "Version 1.0, 27 January 2026 (marked Draft; next review 27 January 2027). Owner: Managing Director.\n\nHow we identify, secure, use and dispose of information and equipment: access control and passwords, acceptable use, remote access, mobile devices (phones, laptops, USB sticks), encryption and reporting security breaches. Never share your login or email password with anyone. Breaking the policy can lead to disciplinary action.\n\n" + FULL],
      ["wh", "Whistleblowing", "Policy", "Everyone", "Mar 2026", true, "Whistleblowing means raising a concern about unsafe, illegal, dishonest or unethical behaviour at work that could put people, the company or the public at risk. It helps prevent accidents and harm, protects colleagues and the business, and deals with problems before they become serious.\n\nExamples: unsafe work or serious breaches of site rules; faulty plant, lifting or access equipment; falsified inspections, permits, records or training documents; bullying or pressure not to report; theft, fraud, bribery or deliberate damage; environmental breaches.\n\nHow to raise a concern: tell your supervisor, manager or another senior person you trust; give clear facts (what, where, when, who); if you can't raise it locally, take it to company management; in an emergency, stop work and make the area safe.\n\nYour protection: concerns raised in good faith are taken seriously and you won't be victimised for reporting a genuine concern. Reports are handled as confidentially as possible. Malicious or knowingly false allegations are not acceptable.\n\nIf something feels wrong, unsafe or dishonest, speak up. Staying silent can put people at risk.\n\n(From the Whistleblowing toolbox talk, March 2026.)"],
      ["hb", "Employee handbook", "Handbook", "Everyone", "1", true, "Hours, pay, holidays, sickness reporting, conduct, grievance and disciplinary procedures.\n\n" + SAMPLE],
      ["pn", "Staff privacy notice", "Policy", "Everyone", "1", true, "What personal information we keep about you, why, who can see it, how long we keep it and your rights under UK GDPR.\n\n" + SAMPLE],
      ["sr", "Site rules", "Induction", "Site", "1", true, "Sign in at the gate, attend the site induction, wear full PPE, follow the RAMS and the lift plan, and keep out of exclusion zones.\n\n" + SAMPLE],
      ["wr", "Workshop rules", "Induction", "Workshop", "1", true, "Walkways clear, only trained people on machines, screens up when welding, forklift and crane by authorised people only.\n\n" + SAMPLE]
    ];
    for (const [id, title, category, audience, version, induction, body] of docs) await put("hrdocs", { id: "doc-" + id, title, category, audience, version, induction, requiresSign: true, status: "live", body, issuedBy: "Liam Pilkington", issuedAt: d(-200) });
    const area = { "HR Admin": "Office", Manager: "Office", Supervisor: "Site", Operative: "Site", "Operative (welder)": "Site", "Workshop Director": "Workshop", "Workshop Manager": "Workshop", "Workshop Supervisor": "Workshop", "Fabricator/Welder": "Workshop" };
    const staff = SAMPLES.filter((s) => s.role !== "Screens").map((s) => [s.email, s.name, s.role, s.leaveAllowance]).concat(IC.DEMO_TEAM.slice(2).map((t) => [t[0], t[1], t[2], 22]));
    const kin = [["Kate", "Partner"], ["Sarah", "Mum"], ["John", "Dad"], ["Emma", "Partner"], ["Paul", "Brother"], ["Lisa", "Partner"], ["Gary", "Dad"], ["Joanne", "Mum"], ["Steve", "Brother"], ["Claire", "Partner"]];
    let i = 0;
    for (const [email, full, role, allow] of staff) {
      const [firstName, ...rest] = full.split(" "), n = i++;
      await put("hrpeople", { id: "p-" + n, user: email, userName: full, firstName, lastName: rest.join(" "), status: "active", role, area: area[role] || "Site", startDate: d(-400 - n * 90), leaveAllowance: allow || 22,
        manager: area[role] === "Workshop" ? "Paul Shaw" : "Liam Pilkington", dob: (1975 + n * 3) + "-0" + (1 + (n % 9)) + "-1" + n, mobile: "07700 900" + String(100 + n * 7), personalEmail: firstName.toLowerCase() + "@example.com",
        address1: n + 1 + " Example Street", town: "Bolton", postcode: "BL1 1AA", ni: "QQ 12 34 5" + n + " C", starter: "A", studentLoan: "None",
        emergency: n === 4 ? null : { name: kin[n % kin.length][0] + " " + rest.join(" "), relation: kin[n % kin.length][1], phone: "07700 900" + String(500 + n * 11) },
        rtw: { type: RTW[0], checkedBy: "Liam Pilkington", checkedOn: d(-400 - n * 90) }, ppeSizes: { boots: String(8 + (n % 4)), hivis: SIZES[n % 4 + 1], gloves: "L" }, inductedAt: d(-399 - n * 90) });
      // everyone signed the induction pack; two people haven't signed the new phones policy, one has the handbook outstanding
      const p = { user: email, area: area[role] || "Site" };
      for (const [id, , , audience, version] of docs) {
        if (!(audience === "Everyone" || audience === p.area)) continue;
        if ((id === "wh" && (n === 2 || n === 7)) || (id === "is" && n === 9)) continue;
        await put("hrsigns", { id: "s-" + n + "-" + id, user: email, userName: full, docId: "doc-" + id, version, signedAt: d(-30 - n) });
      }
    }
    const who = (k) => staff.find((s) => s[1].startsWith(k));
    const absn = (k, type, from, to, extra) => put("absence", Object.assign({ id: uid(), user: who(k)[0], userName: who(k)[1], type, from: d(from), to: d(to), recordedBy: "Liam Pilkington" }, extra || {}));
    await absn("Sam", "Sickness", -20, -19, { rtw: null });
    await absn("Mark", "Sickness", -75, -75, { rtw: { by: "Ian Jones", on: d(-74) } });
    await absn("Chris", "Medical appointment", -12, -12, { halfStart: true, days: 0.5 });
    const exp = d(30);
    await put("invites", { id: "inv-1", token: randomToken(), name: "Jordan Price", mobile: "07700 900321", area: "Site", role: "Steel erector", startDate: d(7), reportTo: "Ian Jones at the yard, 07:15", manager: "Liam Pilkington", status: "sent", createdBy: "Liam Pilkington", expires: exp });
    await put("invites", { id: "inv-2", token: randomToken(), name: "Aisha Patel", mobile: "07700 900654", area: "Workshop", role: "Welder fabricator", startDate: d(4), reportTo: "Chris Dale, workshop office, 07:00", manager: "Paul Shaw", status: "completed", createdBy: "Paul Shaw", expires: exp, completedAt: d(-1) });
    await put("hrpeople", { id: "p-aisha", inviteId: "inv-2", user: "", userName: "Aisha Patel", firstName: "Aisha", lastName: "Patel", status: "onboarding", area: "Workshop", role: "Welder fabricator", startDate: d(4), manager: "Paul Shaw",
      dob: "1996-04-12", mobile: "07700 900654", personalEmail: "aisha@example.com", address1: "22 Example Road", town: "Bolton", postcode: "BL3 2AA", ni: "QQ 65 43 21 A", starter: "B", studentLoan: "Plan 2",
      emergency: { name: "Imran Patel", relation: "Brother", phone: "07700 900777" }, rtw: { type: RTW[1], shareCode: "W12 345 678" }, ppeSizes: { boots: "6", hivis: "S", gloves: "M" },
      onboardCards: [{ type: "Welder qualification (BS EN ISO 9606-1)", number: "WQ-9921", expiry: d(300), photos: [] }], onboardedAt: d(-1) });
    for (const id of ["hs", "wb", "is", "wh", "hb", "pn", "wr"]) await put("hrsigns", { id: "s-aisha-" + id, user: "invite:inv-2", userName: "Aisha Patel", docId: "doc-" + id, version: docs.find((x) => x[0] === id)[4], signedAt: d(-1) });
    demoReady = null;
  }

  // ---------------------------------------------------------------- first sign-in: welcome (23 Nov)
  // Shown once, the first time someone opens the app; Home sends them here until they press "Take me to Home".
  route("welcome", async () => {
    setBar("Welcome", "", false);
    const p = Data.profile || {}, first = String(p.name || "").split(" ")[0];
    let me = null, due = 0;
    try { me = await myRecord(); if (me) due = toSign(await H.list("hrdocs"), await H.list("hrsigns"), me).length; } catch (e) { /* HR offline */ }
    const standalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const step = (done, title, sub, href) => '<' + (href ? 'a href="' + href + '"' : "div") + ' class="todo' + (done ? " info" : "") + '"><span class="ti">' + (done ? IC.ICON.check : IC.ICON.hr) + "</span><span><b>" + esc(title) + '</b><span class="small">' + esc(sub) + "</span></span>" + (href ? "›" : "") + "</" + (href ? "a" : "div") + ">";
    const em = me && me.emergency && me.emergency.name && me.mobile;
    $("main").innerHTML = '<div class="card"><img class="join-logo" src="icons/bss-logo.jpg" alt="Bolton Steel Structures Ltd"><h2>Welcome, ' + esc(first) + "</h2>" +
      "<p>This is Bolton Steel Structures' app: your holidays, expenses, HR documents and cards, and your jobs or workshop work, in one place.</p>" +
      "<p>Three things to do first:</p></div>" +
      step(em, em ? "Your details are in" : "Check your details and emergency contact", em ? "You can change them any time in My HR" : "So we can reach someone if you're hurt at work", me ? "#/hr/details/" + me.id : "") +
      step(!due, due ? "Read and sign " + due + " document" + (due > 1 ? "s" : "") : "Documents signed", due ? "Company policies, in My HR" : "Nothing waiting", due ? "#/hr/me" : "") +
      step(standalone, standalone ? "The app is on your home screen" : "Put the app on your home screen", standalone ? "Open it from there each day" : ios ? "In Safari: tap Share, then Add to Home Screen" : "In Chrome: tap the ⋮ menu, then Add to Home screen (or Install app)", "") +
      (can("time") ? '<p class="small">When you check in on site, your phone will ask to share your location. Say yes: it is only taken at check-in and check-out.</p>' : "") +
      '<button class="btn primary block" id="wGo">Take me to Home</button>';
    $("wGo").onclick = () => { LS.set("welcomed:" + p.email, true); location.hash = "#/"; };
  });

  IC.HR = { join, homeCounts, ensureDemo, isAdmin, me: () => myRecord() };
})();
