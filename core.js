/* iCONSTRUCTE Site: shared core.
 * Helpers, sign-in, the on-device store, the data layer (demo or Azure API), and small UI helpers used by every section.
 * Sections (time.js, forms.js, leave.js, expenses.js) register their routes with IC.route(); app.js starts the app.
 */
(function () {
  "use strict";
  const CFG = Object.assign({
    scopes: ["User.Read", "Sites.ReadWrite.All"], newDays: 14, demo: false, library: "Documents", returnsLibrary: "Site Returns",
    apiBase: "/api", apiScope: "", checkInRadiusM: 500, mileageRate: 0.55, mileageRateOver10k: 0.25,
    leaveYearStartMonth: 1, maxOffSameDay: 2, bankHolidayRegion: "england-and-wales"
  }, window.SITE_CONFIG || {});
  const DEMO = CFG.demo || /[?&]demo=1\b/.test(location.search);
  const GRAPH = "https://graph.microsoft.com/v1.0";

  // ---------------------------------------------------------------- helpers
  const LS = {
    get(k, d) { try { const v = localStorage.getItem("icsite." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("icsite." + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem("icsite." + k); } catch (e) { /* ignore */ } }
  };
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const fmtDate = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
  const fmtDay = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); };
  const fmtTime = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); };
  const fmtMoney = (n) => "£" + (Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fmtHours = (ms) => { const m = Math.max(0, Math.round(ms / 60000)); return Math.floor(m / 60) + "h " + pad(m % 60) + "m"; };
  const isoDate = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const parseDate = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const sameDay = (a, b) => isoDate(new Date(a)) === isoDate(new Date(b));

  // Distance in metres between two lat/lng points.
  function distanceM(a, b) {
    const R = 6371000, r = Math.PI / 180;
    const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const fmtDistance = (m) => (m < 1000 ? Math.round(m) + " m" : (m / 1000).toFixed(m < 10000 ? 1 : 0) + " km");

  // ---------------------------------------------------------------- on-device store (IndexedDB)
  // files: offline drawings · records: time/forms/leave/expenses cache · blobs: photos, receipts, signatures · outbox: waiting to send
  const STORES = ["files", "records", "blobs", "outbox"];
  const Store = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        const r = indexedDB.open("icsite", 2);
        r.onupgradeneeded = () => STORES.forEach((n) => { if (!r.result.objectStoreNames.contains(n)) r.result.createObjectStore(n, { keyPath: "key" }); });
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      });
    },
    async tx(store, mode, fn) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const t = db.transaction(store, mode); const out = fn(t.objectStore(store));
        t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error);
      });
    },
    get(key, store = "files") { return this.tx(store, "readonly", (s) => s.get(key)).catch(() => null); },
    // : the records store is read once and kept until something is written to it (Home used to read every
    // record on the phone many times per screen: once per job, per document, per register)
    snap: {},
    forget(store) { delete this.snap[store]; },
    put(rec, store = "files") { this.forget(store); return this.tx(store, "readwrite", (s) => s.put(rec)).finally(() => this.forget(store)); },
    del(key, store = "files") { this.forget(store); return this.tx(store, "readwrite", (s) => s.delete(key)).finally(() => this.forget(store)); },
    keys(store = "files") { return this.tx(store, "readonly", (s) => s.getAllKeys()).catch(() => []); },
    all(store) {
      if (store !== "records") return this.tx(store, "readonly", (s) => s.getAll()).catch(() => []);
      if (!this.snap[store]) { const p = this.tx(store, "readonly", (s) => s.getAll()).catch(() => []); this.snap[store] = p; p.then((v) => { if (!Array.isArray(v) && this.snap[store] === p) this.forget(store); }); }
      return this.snap[store];
    },
    clear(store) { this.forget(store); return this.tx(store, "readwrite", (s) => s.clear()).catch(() => null).finally(() => this.forget(store)); }
  };

  // ---------------------------------------------------------------- sign-in and SharePoint (drawings)
  const Graph = {
    msal: null, account: null, driveId: LS.get("driveId", null),
    async init() {
      this.msal = new msal.PublicClientApplication({
        auth: { clientId: CFG.clientId, authority: "https://login.microsoftonline.com/" + CFG.tenantId, redirectUri: location.origin + location.pathname },
        cache: { cacheLocation: "localStorage" }
      });
      await this.msal.initialize();
      const r = await this.msal.handleRedirectPromise().catch((e) => { console.warn(e); return null; });
      this.account = (r && r.account) || this.msal.getAllAccounts()[0] || null;
      if (this.account) this.msal.setActiveAccount(this.account);
      return !!this.account;
    },
    signIn() { return this.msal.loginRedirect({ scopes: CFG.scopes.concat(CFG.apiScope ? [CFG.apiScope] : []), prompt: "select_account" }); },
    signOut() { LS.del("manifest"); LS.del("driveId"); return this.msal.logoutRedirect({ account: this.account }); },
    async token(scopes) {
      scopes = scopes || CFG.scopes;
      try { return (await this.msal.acquireTokenSilent({ scopes, account: this.account })).accessToken; }
      catch (e) { if (e instanceof msal.InteractionRequiredAuthError) { await this.msal.acquireTokenRedirect({ scopes, account: this.account }); } throw e; }
    },
    async get(path) {
      const r = await fetch(GRAPH + path, { headers: { Authorization: "Bearer " + (await this.token()) } });
      if (!r.ok) { const err = new Error("Graph " + r.status + " for " + path); err.status = r.status; throw err; }
      return r.json();
    },
    async user() {
      const me = await this.get("/me?$select=displayName,mail,userPrincipalName");
      return { name: me.displayName || this.account.name, emails: [me.mail, me.userPrincipalName, this.account.username].filter(Boolean).map((e) => e.toLowerCase()) };
    },
    async drive() {
      if (this.driveId) return this.driveId;
      const site = await this.get("/sites/" + CFG.siteHost + ":" + CFG.sitePath);
      const drives = (await this.get("/sites/" + site.id + "/drives")).value || [];
      const want = (CFG.library || "").toLowerCase();
      const d = drives.find((x) => (x.name || "").toLowerCase() === want) || drives.find((x) => (x.name || "").toLowerCase() === "shared documents") || drives[0];
      if (!d) throw new Error("Site Drawings library not found");
      this.driveId = d.id; LS.set("driveId", d.id); return d.id;
    },
    async itemUrl(path) {
      const enc = path.split("/").map(encodeURIComponent).join("/");
      const it = await this.get("/drives/" + (await this.drive()) + "/root:/" + enc + "?$select=id,name,@microsoft.graph.downloadUrl");
      return it["@microsoft.graph.downloadUrl"];
    },
    async manifest() { const r = await fetch(await this.itemUrl("site-manifest.json"), { cache: "no-store" }); if (!r.ok) throw new Error("manifest " + r.status); return r.json(); },
    // "Site Returns" library: certificates and records going back to the office (iCONSTRUCTE files them in the job folder)
    returnsDriveId: LS.get("returnsDriveId", null),
    async returnsDrive() {
      if (this.returnsDriveId) return this.returnsDriveId;
      const site = await this.get("/sites/" + CFG.siteHost + ":" + CFG.sitePath);
      const drives = (await this.get("/sites/" + site.id + "/drives")).value || [];
      const d = drives.find((x) => (x.name || "").toLowerCase() === (CFG.returnsLibrary || "").toLowerCase());
      if (!d) throw new Error("The \"" + CFG.returnsLibrary + "\" library hasn't been set up in SharePoint");
      this.returnsDriveId = d.id; LS.set("returnsDriveId", d.id); return d.id;
    },
    async upload(path, blob) {
      const drive = await this.returnsDrive(), enc = path.split("/").map(encodeURIComponent).join("/"), token = await this.token();
      if (blob.size <= 3.5 * 1024 * 1024) {
        const r = await fetch(GRAPH + "/drives/" + drive + "/root:/" + enc + ":/content?@microsoft.graph.conflictBehavior=rename", { method: "PUT", headers: { Authorization: "Bearer " + token, "Content-Type": blob.type || "application/octet-stream" }, body: blob });
        if (!r.ok) throw new Error("upload " + r.status);
        return;
      }
      const ses = await fetch(GRAPH + "/drives/" + drive + "/root:/" + enc + ":/createUploadSession", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } }) });
      if (!ses.ok) throw new Error("upload session " + ses.status);
      const url = (await ses.json()).uploadUrl, chunk = 5 * 320 * 1024;
      for (let start = 0; start < blob.size; start += chunk) {
        const end = Math.min(blob.size, start + chunk);
        const r = await fetch(url, { method: "PUT", headers: { "Content-Range": "bytes " + start + "-" + (end - 1) + "/" + blob.size }, body: blob.slice(start, end) });
        if (!r.ok) throw new Error("upload part " + r.status);
      }
    },
    async blob(path) { const r = await fetch(await this.itemUrl(path)); if (!r.ok) throw new Error("download " + r.status); return r.blob(); }
  };

  const sample = () => SAMPLES.find((x) => x.id === LS.get("demoUser", "")) || null;
  const DemoSrc = {
    async init() { return LS.get("demoSignedIn", false) && !!sample(); },
    signIn(id) { LS.set("demoUser", id || "operative"); LS.set("demoSignedIn", true); location.reload(); },
    signOut() { LS.set("demoSignedIn", false); LS.del("manifest"); LS.del("profile"); LS.del("user"); location.reload(); },
    async user() { const u = sample() || SAMPLES[2]; return { name: u.name, emails: [u.email] }; },
    async manifest() {
      const r = await fetch("demo/site-manifest.json", { cache: "no-store" }), m = await r.json();
      // demo week plan for the sample logins and team (the real one comes from the planner, W2)
      if (!m.allocations) {
        const P = {
          "jordan.lee@example.com": ["2514/021", "2514/021", "2514/021", "2522/004", "2522/004", "2522/004", "2522/004", "2522/004", "2514/021", "2514/021"],
          "sam.carter@example.com": ["2522/004", "2522/004", "2522/004", "2522/004", "2514/021", "2514/021", "2514/021", "2530/011", "2530/011", "2530/011"],
          "alex.morgan@example.com": ["2530/011", "2514/021", "", "2522/004", "", "2530/011", "", "2514/021", "", ""],
          "s.khan@example.com": ["2522/004", "2522/004", "2522/004", "2522/004", "2522/004", "2522/004", "2522/004", "", "", ""],
          "m.wilson@example.com": ["2514/021", "2514/021", "2530/011", "2530/011", "2514/021", "2514/021", "2514/021", "2514/021", "2522/004", "2522/004"]
        };
        const jobs = Object.fromEntries((m.jobs || []).map((j) => [j.jobNumber, j]));
        // as iCONSTRUCTE publishes it: this week (Mon–Fri), plus next Monday from Friday (SitePublisher.AllocationsTo)
        const days = [], d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        const span = [5, 6, 0].includes(new Date().getDay()) ? 6 : 5;
        for (; days.length < span; d.setDate(d.getDate() + 1)) if (d.getDay() % 6) days.push(isoDate(d));
        m.allocations = [];
        // the planner's Off row: Lee is off all week (as typed on the bottom row in iCONSTRUCTE)
        days.forEach((day) => m.allocations.push({ email: "l.hart@example.com", date: day, off: true }));
        Object.entries(P).forEach(([email, list]) => list.forEach((jn, i) => { const j = jobs[jn]; if (j) m.allocations.push({ email, date: days[i], jobNumber: jn, folder: j.folder, site: j.site, description: j.description, start: jn === "2530/011" ? "08:00" : "07:30", workingAway: jn === "2522/004" }); }));
      }
      const mj = (m.jobs || []).find((j) => j.jobNumber === "2514/021");
      // demo crane hires on 2514/021: today, and a second visit in two days' time
      const dd = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return isoDate(x); };
      if (mj && !mj.cranes) mj.cranes = [{ description: "50t mobile crane", supplier: "Example Crane Hire", onHire: dd(0), offHire: dd(0) }, { description: "50t mobile crane", supplier: "Example Crane Hire", onHire: dd(2), offHire: dd(2) }];
      return m;
    },
    async blob(path) { const r = await fetch("demo/files/" + path.split("/").map(encodeURIComponent).join("/")); if (!r.ok) throw new Error("download " + r.status); return r.blob(); }
  };
  const Src = DEMO ? DemoSrc : Graph;

  // ---------------------------------------------------------------- roles: what each person sees (config.js roles)
  const DEFAULT_ROLES = {
    Manager: ["drawings", "all-jobs", "leave", "expenses", "hr", "hr-admin", "cards", "qa", "manager", "week", "team-week", "model", "erect", "workshop", "fab-mark", "fab-correct", "fab-ready", "ws-hours-team", "ws-payroll", "board", "form:*"],
    Supervisor: ["drawings", "rams", "time", "leave", "expenses", "hr", "cards", "qa", "week", "crew", "model", "erect", "form:*"],
    Operative: ["drawings", "rams", "time", "leave", "expenses", "hr", "cards", "week", "model", "form:powra", "form:plant", "form:vehicle", "form:nearmiss", "form:ppe", "form:ncr"],
    // Workshop (the workshop's own staff; 21 Nov): clocking in and out, fabrication status, NCR; no site safety forms.
    //   fab-mark = mark lines Fabricated / Welded / Checked / Loaded   fab-correct = undo anyone's mark   fab-ready = told when a load is ready
    //   Directors use the Manager role above (everything on both sides).
    // Workshop Director (23 Nov): a director of the workshop company only. Sees the workshop and its
    // staff like the Workshop Manager, and nothing of BSS: no site jobs, drawings, planner or BSS staff.
    "Workshop Director": ["workshop", "board", "manager", "fab-mark", "fab-correct", "fab-ready", "ws-hours-team", "ws-payroll", "leave", "expenses", "hr", "hr-workshop", "cards", "form:wscheck", "form:ppe", "form:ncr"],
    "Workshop Manager": ["workshop", "board", "manager", "fab-mark", "fab-correct", "fab-ready", "ws-hours-team", "ws-payroll", "leave", "expenses", "hr", "cards", "form:wscheck", "form:ppe", "form:ncr"],
    "Workshop Admin": ["workshop", "fab-ready", "ws-hours-team", "ws-payroll", "leave", "expenses", "hr", "cards", "form:ppe", "form:ncr"],
    "Workshop Supervisor": ["workshop", "board", "fab-mark", "fab-correct", "time", "ws-hours", "ws-hours-team", "leave", "expenses", "hr", "cards", "form:wscheck", "form:ppe", "form:ncr"],
    "Fabricator/Welder": ["workshop", "fab-mark", "time", "ws-hours", "leave", "expenses", "hr", "cards", "form:ppe", "form:ncr"],
    // Screens (21 Nov): a login for the TV screens; opens straight on the wall board, nothing else.
    //   board = can open the wall board (Directors, Workshop Manager, Workshop Supervisor, Screens)
    // HR Admin (23 Nov): the office person who runs HR; sees every employee's HR record, issues documents, sets up new starters.
    //   hr = My HR (own details, documents to sign, absence)   hr-admin = everyone's HR records (directors have it too)
    //   hr-workshop = every HR record in full, for workshop staff only (Workshop Director)
    "HR Admin": ["leave", "expenses", "hr", "hr-admin", "cards"],
    // From the roles workbook (23 Nov). Change these in the app: App admin > Permissions.
    Accounts: ["leave", "expenses", "hr", "hr-admin", "manager", "form:ppe"],
    Admin: ["expenses", "hr", "manager", "form:ppe"],
    Estimators: ["leave", "expenses", "hr", "form:ppe"],
    "Project Managers": ["drawings", "all-jobs", "rams", "time", "leave", "expenses", "hr", "cards", "week", "team-week", "model", "erect", "qa", "manager", "form:*"],
    Draughtsmen: ["drawings", "all-jobs", "model", "leave", "expenses", "hr", "form:ppe"],
    "QA Manager": ["drawings", "all-jobs", "rams", "leave", "expenses", "hr", "cards", "week", "model", "erect", "qa", "form:*"],
    "Workshop Accounts": ["leave", "expenses", "hr", "form:ppe"],
    // App Admin (23 Nov): runs the app once live: roles, permissions, people, action owners, content. Given alongside a normal role.
    "App Admin": ["app-admin"],
    Screens: ["workshop", "board", "screens"]
  };
  // config.js roles are laid over the defaults: a role changed there replaces the default, a new one is added
  let ROLES = Object.assign({}, DEFAULT_ROLES, CFG.roles || {});
  // the workbook's names for two of the built-in roles
  const ROLE_ALIAS = { directors: "Manager", director: "Manager", operatives: "Operative" };
  const ROLE_LABEL = { Manager: "Directors", Operative: "Operatives" };
  // : a role the app doesn't recognise gets nothing (it used to become an Operative, with drawings and RAMS)
  // A person can hold up to three roles (23 Nov: people with more than one job); they get everything each allows.
  function roleKey(r) {
    const k = String(r || "").trim().toLowerCase();
    if (!k) return "";
    if (ROLE_ALIAS[k]) return ROLE_ALIAS[k];
    return Object.keys(ROLES).find((x) => x.toLowerCase() === k) || "";
  }
  function rolesOf(p) {
    const list = (p && Array.isArray(p.roles) && p.roles.length ? p.roles : [p && p.role]).map(roleKey).filter(Boolean);
    if (!list.length && p && p.isManager && ROLES.Manager) list.push("Manager");
    return [...new Set(list)];
  }
  function roleOf(p) { return rolesOf(p)[0] || ""; }
  // can("qa"), can("form:plant") … for the signed-in person (or a given profile)
  function can(feature, profile) {
    const p = profile || Data.profile;
    return rolesOf(p).some((r) => { const list = ROLES[r] || []; return list.includes(feature) || (feature.startsWith("form:") && list.includes("form:*")); });
  }

  // ---------------------------------------------------------------- app settings (App admin, 23 Nov)
  // Roles and permissions, people (roles, line manager, van, clocking), desktop page access and action owners, changed in
  // the app by the App Admin and kept on the server (/api/settings), not in a release. Every save is logged.
  const Settings = {
    cur: {},
    async load() {
      let s = null;
      if (DEMO) { const r = await Store.get("settings:app", "records"); s = r && r.rec; }
      else {
        if (navigator.onLine) { try { s = await Api.call("GET", "/settings"); LS.set("settings", s); } catch (e) { console.warn("settings", e); } }
        if (!s) s = LS.get("settings", null);
      }
      this.apply(s || {});
      return this.cur;
    },
    apply(s) { this.cur = s || {}; ROLES = Object.assign({}, DEFAULT_ROLES, CFG.roles || {}, this.cur.roles || {}); },
    roles() { return ROLES; },
    defaults() { return Object.assign({}, DEFAULT_ROLES, CFG.roles || {}); },
    person(email) { const e = String(email || "").toLowerCase(); return e ? (this.cur.people || []).find((p) => String(p.email || "").toLowerCase() === e) || null : null; },
    async save(next, summary) {
      const s = Object.assign({}, next);
      s.revision = (this.cur.revision || 0) + 1; s.updatedAt = new Date().toISOString(); s.updatedBy = Data.profile ? Data.profile.name : "";
      s.history = (this.cur.history || []).concat([{ at: s.updatedAt, by: s.updatedBy, rev: s.revision, summary }]).slice(-300);
      if (DEMO) await Store.put({ key: "settings:app", kind: "settings", rec: s }, "records");
      else { await Api.call("POST", "/settings", s); LS.set("settings", s); }
      this.apply(s);
      return s;
    }
  };

  // ---------------------------------------------------------------- data layer
  // Records are kept on the device first, then sent. With no signal they wait in the outbox and go when signal returns.
  // Kinds: time, forms, leave, expenses, snags, cards (competency cards), timesheets (weeks approved by a manager).
  // In demo mode everything stays on this device.
  const KINDS = ["time", "forms", "leave", "expenses", "snags", "cards", "timesheets", "notices"];
  const TEAM_KINDS = ["leave", "expenses", "time", "cards", "timesheets"]; // a manager also gets their team's records
  const Api = {
    async call(method, path, body, raw) {
      const headers = { Authorization: "Bearer " + (await Graph.token([CFG.apiScope])) };
      if (body && !raw) headers["Content-Type"] = "application/json";
      const r = await fetch(CFG.apiBase + path, { method, headers, body: body ? (raw ? body : JSON.stringify(body)) : undefined });
      if (!r.ok) { const e = new Error("API " + r.status + " " + path); e.status = r.status; throw e; }
      const t = r.headers.get("content-type") || "";
      return t.includes("json") ? r.json() : t ? r.blob() : null;
    }
  };

  const Data = {
    profile: LS.get("profile", null),
    pending: 0,
    listeners: [],
    onChange(fn) { this.listeners.push(fn); },
    changed() { this.listeners.forEach((fn) => { try { fn(); } catch (e) { console.warn(e); } }); },

    async loadProfile(user) {
      if (DEMO) {
        const u = sample() || SAMPLES[2];
        this.profile = { name: u.name, email: u.email, role: u.role, leaveAllowance: u.leaveAllowance };
      } else {
        try { this.profile = await Api.call("GET", "/me"); } catch (e) { console.warn(e); this.profile = this.profile || { name: user.name, email: user.emails[0], leaveAllowance: 0, isManager: false }; }
      }
      // Manager tools follow the role's permissions (config.js roles), whatever the API says
      this.profile.isManager = can("manager", this.profile);
      if (DEMO) await Demo.seed();
      // App admin settings: the roles table, and this person's roles from the People table (live: the server does this for /me)
      await Settings.load();
      if (DEMO && !Settings.cur.people) await Settings.save(Object.assign({}, Settings.cur, { people: Demo.people() }), "Sample people for the demo");
      const sp = Settings.person(this.profile.email);
      if (sp && sp.roles && sp.roles.filter(Boolean).length) this.profile.roles = sp.roles.filter(Boolean);
      if (sp && sp.appAdmin) this.profile.roles = (this.profile.roles || [this.profile.role]).concat(["App Admin"]);
      this.profile.isManager = can("manager", this.profile);
      LS.set("profile", this.profile);
      return this.profile;
    },

    async list(kind, scope) {
      const all = (await Store.all("records")).filter((r) => r.kind === kind).map((r) => Object.assign({}, r.rec)); // copies: the read is shared
      const me = this.profile && this.profile.email;
      return scope === "team" ? all : all.filter((r) => !r.user || r.user === me);
    },
    async get(kind, id) { const r = await Store.get(kind + ":" + id, "records"); return r ? r.rec : null; },

    // Manager tools: the people this manager looks after (from the Manager field on each employee in iCONSTRUCTE).
    // the manager's own team (and themselves): team screens only show these people's records
    async teamSet() { return new Set((await this.team()).map((p) => p.email).concat(this.profile ? [this.profile.email] : [])); },

    async team() {
      if (!this.profile || !this.profile.isManager) return [];
      if (DEMO) {
        // the Workshop Manager's team is the workshop; directors (Manager role) have both
        const r = roleOf(this.profile), list = r.startsWith("Workshop") ? Demo.wsTeam : r === "Manager" ? Demo.team.concat(Demo.wsTeam) : Demo.team;
        return list.map(([email, name, role]) => ({ email, name, role }));
      }
      if (navigator.onLine) { try { const t = await Api.call("GET", "/team"); LS.set("team", t); return t; } catch (e) { console.warn("team", e); } }
      return LS.get("team", []);
    },

    // Fetch the latest from Azure into the device cache (no-op in demo).
    async pull() {
      if (DEMO || !navigator.onLine) return;
      for (const kind of KINDS) {
        const scopes = kind === "notices" ? ["all"] : kind === "snags" || kind === "forms" ? ["jobs"] : this.profile && this.profile.isManager && TEAM_KINDS.includes(kind) ? ["mine", "team"] : ["mine"];
        for (const scope of scopes) {
          try {
            const rows = await Api.call("GET", "/" + kind + "?scope=" + scope);
            for (const rec of rows) { const cur = await Store.get(kind + ":" + rec.id, "records"); if (!cur || !cur.unsent) await Store.put({ key: kind + ":" + rec.id, kind, rec }, "records"); }
          } catch (e) { console.warn("pull", kind, e); }
        }
      }
      this.changed();
    },

    async save(kind, rec) {
      rec.id = rec.id || uid();
      rec.user = rec.user || (this.profile && this.profile.email);
      rec.userName = rec.userName || (this.profile && this.profile.name);
      rec.updatedAt = new Date().toISOString();
      rec.createdAt = rec.createdAt || rec.updatedAt;
      await Store.put({ key: kind + ":" + rec.id, kind, rec, unsent: !DEMO }, "records");
      if (!DEMO) await Store.put({ key: uid(), op: "save", kind, id: rec.id, at: rec.updatedAt }, "outbox");
      this.changed(); this.flush();
      return rec;
    },

    async decide(kind, id, status, note) {
      const rec = await this.get(kind, id); if (!rec) return null;
      rec.status = status; rec.decisionNote = note || ""; rec.decidedBy = this.profile.name; rec.decidedAt = new Date().toISOString();
      await Store.put({ key: kind + ":" + id, kind, rec, unsent: !DEMO }, "records");
      if (!DEMO) await Store.put({ key: uid(), op: "decide", kind, id, status, note: note || "" }, "outbox");
      this.changed(); this.flush();
      return rec;
    },

    // Photos, receipts and signatures: kept on the device, uploaded with the record.
    async putBlob(blob, meta) { const id = uid(); await Store.put({ key: id, blob, type: blob.type, meta: meta || null, unsent: !DEMO }, "blobs"); return id; },
    async blobMeta(id) { const b = await Store.get(id, "blobs"); return b ? b.meta || null : null; },
    async putPhoto(file, job) { const r = await stampPhoto(file, job); return this.putBlob(r.blob, r.meta); },
    async blobUrl(id) {
      let b = await Store.get(id, "blobs");
      if (!b && !DEMO && navigator.onLine) { try { const blob = await Api.call("GET", "/files/" + id); b = { key: id, blob }; await Store.put(b, "blobs"); } catch (e) { return ""; } }
      return b ? URL.createObjectURL(b.blob) : "";
    },

    // Files for the office (e.g. completion certificates): kept on the phone and sent to the Site Returns library
    // when there's signal. In demo mode they stay on the phone and can be downloaded.
    async queueUpload(path, blob, meta) {
      const id = uid();
      await Store.put({ key: "up:" + id, op: "upload", path, blob, meta: meta || {}, at: new Date().toISOString(), sent: false }, "outbox");
      if (!DEMO) this.flushUploads();
      this.changed();
      return id;
    },
    async uploads() { return (await Store.all("outbox")).filter((x) => x.op === "upload"); },
    async flushUploads() {
      if (DEMO || !navigator.onLine) return;
      for (const up of (await this.uploads()).filter((u) => !u.sent)) {
        try { await Graph.upload(up.path, up.blob); up.sent = true; up.sentAt = new Date().toISOString(); await Store.put(up, "outbox"); }
        catch (e) { console.warn("upload failed, will retry", e); up.error = e.message; await Store.put(up, "outbox"); }
      }
      this.changed();
    },

    flushing: false,
    async flush() {
      this.flushUploads();
      if (DEMO) { this.pending = 0; return; }
      const box = (await Store.all("outbox")).filter((x) => x.op !== "upload"); this.pending = box.length + (await this.uploads()).filter((u) => !u.sent).length;
      if (this.flushing || !box.length || !navigator.onLine) { this.changed(); return; }
      this.flushing = true;
      try {
        for (const blob of (await Store.all("blobs")).filter((b) => b.unsent)) {
          await Api.call("PUT", "/files/" + blob.key, blob.blob, true); blob.unsent = false; await Store.put(blob, "blobs");
        }
        for (const item of box.sort((a, b) => (a.at || "").localeCompare(b.at || ""))) {
          const cur = await Store.get(item.kind + ":" + item.id, "records");
          if (item.op === "save" && cur) { const saved = await Api.call("POST", "/" + item.kind, cur.rec); await Store.put({ key: cur.key, kind: item.kind, rec: saved || cur.rec }, "records"); }
          if (item.op === "decide") await Api.call("POST", "/" + item.kind + "/" + item.id + "/decision", { status: item.status, note: item.note });
          await Store.del(item.key, "outbox");
        }
      } catch (e) { console.warn("send failed, will retry", e); }
      finally { this.flushing = false; this.pending = (await Store.all("outbox")).filter((x) => x.op !== "upload" || !x.sent).length; this.changed(); }
    },

    async clearAll() { for (const s of ["records", "blobs", "outbox"]) await Store.clear(s); }
  };

  // ---------------------------------------------------------------- demo data (sample team, so approvals and the team calendar have something in them)
  // Sample logins (demo only): one of each role, so each can be tried. Alex Morgan manages the sample team.
  const SAMPLES = [
    { id: "manager", name: "Alex Morgan", email: "alex.morgan@example.com", role: "Manager", leaveAllowance: 25 },
    { id: "supervisor", name: "Sam Carter", email: "sam.carter@example.com", role: "Supervisor", leaveAllowance: 25 },
    { id: "operative", name: "Jordan Lee", email: "jordan.lee@example.com", role: "Operative", leaveAllowance: 22 },
    // two workshop logins, so "checked by someone other than the welder" can be tried
    { id: "wsmanager", name: "Paul Shaw", email: "p.shaw@example.com", role: "Workshop Manager", leaveAllowance: 25 },
    { id: "wssupervisor", name: "Chris Dale", email: "c.dale@example.com", role: "Workshop Supervisor", leaveAllowance: 22 },
    { id: "fabricator", name: "Tom Reid", email: "t.reid@example.com", role: "Fabricator/Welder", leaveAllowance: 22 },
    { id: "wsdirector", name: "Gary Holt", email: "g.holt@example.com", role: "Workshop Director", leaveAllowance: 25 }, // workshop company director only (23 Nov)
    { id: "hradmin", name: "Kate Bennett", email: "k.bennett@example.com", role: "HR Admin", leaveAllowance: 25 }, // office / HR (23 Nov)
    { id: "screens", name: "Workshop screen", email: "screens@example.com", role: "Screens", leaveAllowance: 0 }
  ];
  const Demo = {
    // the manager's team (everyone except the owner), with two extra sample people so the team screens have something in them
    team: [["sam.carter@example.com", "Sam Carter", "Supervisor"], ["jordan.lee@example.com", "Jordan Lee", "Operative"],
      ["s.khan@example.com", "Sam Khan", "Operative"], ["m.wilson@example.com", "Mark Wilson", "Operative (welder)"], ["l.hart@example.com", "Lee Hart", "Operative"]],
    // the workshop (the Workshop Manager's team)
    wsTeam: [["c.dale@example.com", "Chris Dale", "Workshop Supervisor"], ["t.reid@example.com", "Tom Reid", "Fabricator/Welder"]],
    // the App admin People table for the demo (the sample logins and the extra team members)
    people() {
      const ws = (r) => /^Workshop|Fabricator/.test(r);
      const all = SAMPLES.filter((x) => x.role !== "Screens").map((x) => [x.email, x.name, x.role]).concat(this.team.slice(2), this.wsTeam.filter((t) => !SAMPLES.some((x) => x.email === t[0])));
      const vans = { "sam.carter@example.com": "BX21 KLM", "jordan.lee@example.com": "BV19 FHP" };
      return all.map(([email, name, role]) => ({ name, email, bss: !ws(role) || role === "Workshop Director" ? !ws(role) : false, workshop: ws(role) || role === "Manager",
        roles: [role], appAdmin: role === "Manager", manager: role === "Manager" || role === "Workshop Director" ? "No approver needed" : ws(role) ? "Paul Shaw" : "Alex Morgan",
        deputy: "", van: !!vans[email], vanReg: vans[email] || "", clocksIn: /Operative|Supervisor|Fabricator/.test(role) && role !== "Workshop Manager", notes: "" }));
    },
    async seed() {
      if (LS.get("demoSeeded", 0) === 9) return;
      await Data.clearAll();
      const now = new Date(), d = (off) => { const x = new Date(now); x.setDate(x.getDate() + off); return isoDate(x); };
      const put = (kind, rec) => Store.put({ key: kind + ":" + rec.id, kind, rec }, "records");
      const liam = [SAMPLES[0].email, SAMPLES[0].name], [ian, dan, sam, mark] = this.team;
      // holidays
      const leave = [
        [dan, d(9), d(13), "Annual leave", "pending", "Family holiday"],
        [ian, d(10), d(11), "Annual leave", "pending", ""],
        [sam, d(3), d(3), "Annual leave", "approved", "Dentist (half day pm)"],
        [mark, d(24), d(28), "Annual leave", "approved", ""],
        [dan, d(-20), d(-18), "Annual leave", "approved", ""],
        [liam, d(30), d(34), "Annual leave", "approved", ""]
      ];
      for (const [p, from, to, type, status, note] of leave) await put("leave", { id: uid(), user: p[0], userName: p[1], from, to, type, status, note, days: null, createdAt: now.toISOString() });
      // expenses
      await put("expenses", { id: uid(), user: dan[0], userName: dan[1], date: d(-2), category: "Subsistence / meals", amount: 18.4, vat: 3.07, jobFolder: "2514-021", jobNumber: "2514/021", note: "Overnight meal allowance", status: "pending", createdAt: now.toISOString() });
      await put("expenses", { id: uid(), user: ian[0], userName: ian[1], date: d(-4), category: "Mileage (own vehicle)", miles: 64, amount: 35.2, from: "Yard, Bolton", to: "Site", jobFolder: "2522-004", jobNumber: "2522/004", note: "Own van to site and back", status: "pending", createdAt: now.toISOString() });
      await put("expenses", { id: uid(), user: dan[0], userName: dan[1], date: d(-9), category: "Parking", amount: 6.5, vat: 1.08, jobFolder: "2514-021", jobNumber: "2514/021", note: "", status: "approved", decidedBy: "Alex Morgan", createdAt: now.toISOString() });
      // check-ins: last week and this week, someone on site now, one flagged, one missed check-out
      const at = (back, h, m) => { const x = new Date(now); x.setDate(x.getDate() - back); x.setHours(h, m, 0, 0); return x; };
      const job = { jobFolder: "2514-021", jobNumber: "2514/021", site: "Example Retail Park" }, job2 = { jobFolder: "2522-004", jobNumber: "2522/004", site: "Riverside Depot" };
      const shift = async (p, back, j, inH, inM, outH, outM, extra) => {
        const day = at(back, 0, 0); if (day.getDay() === 0 || day.getDay() === 6) return;
        await put("time", Object.assign({ id: uid(), user: p[0], userName: p[1], type: "in", at: at(back, inH, inM).toISOString(), distanceM: 35, flagged: false, accuracy: 10 }, j, extra && extra.in));
        if (outH != null) await put("time", Object.assign({ id: uid(), user: p[0], userName: p[1], type: "out", at: at(back, outH, outM).toISOString(), distanceM: 40, flagged: false, accuracy: 12 }, j, extra && extra.out));
      };
      for (let back = 1; back <= 11; back++) {
        await shift(ian, back, back % 2 ? job : job2, 7, 20, 16, 15);
        await shift(dan, back, job, 7, 35, 16, 25);
        await shift(sam, back, job2, 7, 40, 16, 30);
        await shift(mark, back, job, 7, 15, back === 2 ? null : 15, 45);
      }
      await shift(ian, 0, job, 7, 18, null);
      await shift(dan, 0, job, 7, 52, null, null, { in: { distanceM: 1240, flagged: true, reason: "Collecting bolts from the yard first" } });
      await shift(mark, 0, job, 7, 12, null);
      // the workshop: clocked at the premises; one flagged clock-out, one holiday request, one equipment defect
      // daily vehicle checks (22 Nov): two vans driven most days; one check found a defect yesterday
      const vans = [[this.team.find((x) => /Supervisor/.test(x[2])) || this.team[0], "BX21 KLM", 48210], [this.team.find((x) => /^Operative$/.test(x[2])) || this.team[1], "BV19 FHP", 72545]];
      for (const [who, reg, miles] of vans) for (let back = 1, first = true; back <= 8; back++) {
        const day = at(back, 7, 10); if (day.getDay() === 0 || day.getDay() === 6) continue;
        const defect = first && reg === "BV19 FHP"; first = false;
        await put("forms", { id: uid(), templateId: "vehicle", templateTitle: "Daily vehicle check", status: "submitted", user: who[0], userName: who[1], jobFolder: "", jobNumber: "", noJob: true, createdAt: day.toISOString(), submittedAt: day.toISOString(),
          values: { checkDate: isoDate(day), reg, mileage: String(miles - back * 60), checks: defect ? { "Tyres: tread, no cuts or bulges, inflated": "No" } : {}, checksActions: defect ? { "Tyres: tread, no cuts or bulges, inflated": "Nearside rear tyre has a bulge; booked in for a new tyre" } : {}, safe: defect ? "No" : "Yes", operator: who[1] },
          flags: defect ? [{ text: "Tyres: tread, no cuts or bulges, inflated: No (action: Nearside rear tyre has a bulge; booked in for a new tyre)" }, { text: "Safe to drive?: No" }] : [] });
      }
      const [chris, tom] = this.wsTeam, wsj = { jobFolder: "", jobNumber: "", site: "Workshop" };
      for (let back = 1; back <= 6; back++) { await shift(chris, back, wsj, 7, 25, 16, 5, back === 1 ? { out: { distanceM: 3400, flagged: true, reason: "Clocked out after dropping steel at the galvaniser" } } : null); await shift(tom, back, wsj, 7, 28, 16, 2); }
      await put("leave", { id: uid(), user: tom[0], userName: tom[1], from: d(6), to: d(7), type: "Annual leave", status: "pending", note: "", days: null, createdAt: now.toISOString() });
      await put("forms", { id: uid(), templateId: "wscheck", templateTitle: "Workshop equipment check", status: "submitted", user: chris[0], userName: chris[1], jobFolder: "", jobNumber: "", createdAt: at(1, 7, 40).toISOString(), submittedAt: at(1, 7, 45).toISOString(),
        values: { checkDate: d(-1), equipType: "Forklift", equipRef: "Forklift 1", checks: { "Forks, carriage and chains undamaged": "No" }, checksActions: { "Forks, carriage and chains undamaged": "Chain stretched; hire company called" }, safe: "No", operator: chris[1] },
        flags: [{ text: "Forks, carriage and chains undamaged: No (action: Chain stretched; hire company called)" }, { text: "Safe to use?: No" }] });
      // PPE requests (22 Nov): Sam waiting, Lee's ordered, Tom (workshop) waiting
      const ppe = (p, ago, items, reason, status, extra) => put("forms", Object.assign({ id: uid(), templateId: "ppe", templateTitle: "Request PPE", status, user: p[0], userName: p[1], jobFolder: "", jobNumber: "", noJob: false,
        createdAt: at(ago, 7, 10).toISOString(), submittedAt: at(ago, 7, 12).toISOString(), values: { items, reason, safeNow: "Yes", details: "" } }, extra || {}));
      await ppe(sam, 0, [{ item: "Safety boots", size: "10", qty: 1 }, { item: "Gloves", size: "L", qty: 2 }], "Worn out", "submitted");
      await ppe(this.team[4], 2, [{ item: "Hi-vis jacket", size: "XL", qty: 1 }], "Damaged", "ordered", { decidedBy: "Alex Morgan", decidedAt: at(1, 9, 0).toISOString(), decisionNote: "Due Wednesday" });
      await ppe(this.wsTeam[1], 1, [{ item: "Welding gloves", size: "", qty: 1 }], "Worn out", "submitted");
      // competency cards: one expired, two expiring, one person with no CSCS on record
      const card = (p, type, number, category, off, verified) => put("cards", { id: uid(), user: p[0], userName: p[1], type, number, category, expiry: d(off), photos: [], status: verified ? "verified" : "current", decidedBy: verified ? "Alex Morgan" : undefined, decidedAt: verified ? now.toISOString() : undefined, createdAt: now.toISOString() });
      await card(liam, "CSCS", "00412345", "Manager (black)", 400, true);
      await card(ian, "CSCS", "00290014", "Supervisor (gold)", 300, true);
      await card(ian, "SMSTS", "SM-55120", "", 45, true);
      await card(ian, "First aid at work", "FAW-2291", "", 120, false);
      await card(dan, "CSCS", "00398811", "Skilled worker (blue)", -10, true);
      await card(dan, "IPAF", "IP-77231", "3a / 3b", 30, false);
      await card(sam, "CSCS", "00377120", "Skilled worker (blue)", 520, true);
      await card(sam, "CPCS", "CP-118842", "A60 telehandler", 700, true);
      await card(mark, "Welder qualification (BS EN ISO 9606-1)", "WQ-0417", "135 P FW 1.1 S t10 PB ml", 90, true);
      LS.set("demoSeeded", 9);
    }
  };
  // ---------------------------------------------------------------- UI helpers
  const routes = {};
  function route(name, fn) { routes[name] = fn; }

  function status(msg) { const el = $("status"); el.hidden = !msg; el.textContent = msg || ""; }

  function setBar(title, sub, back) {
    $("barTitle").textContent = title; $("barSub").textContent = sub || "";
    $("btnBack").hidden = !back; $("barMark").hidden = !!back;
  }

  function sheet(html, onClose) {
    const el = $("sheet"); el.hidden = false; el.innerHTML = '<div class="sheet-panel">' + html + "</div>";
    const close = () => { el.hidden = true; el.innerHTML = ""; if (onClose) onClose(); };
    el.onclick = (e) => { if (e.target === el) close(); };
    return { el, close, q: (sel) => el.querySelector(sel) };
  }

  // In-app yes/no question (browser pop-ups are unreliable in home-screen apps). Resolves true or false.
  function ask(msg, yes, no) {
    return new Promise((res) => {
      const sh = sheet("<h3>" + esc(msg) + '</h3><button class="btn primary block" data-y>' + esc(yes || "Yes") + '</button><button class="btn block" data-n>' + esc(no || "Cancel") + "</button>", () => res(false));
      sh.q("[data-y]").onclick = () => { sh.el.hidden = true; sh.el.innerHTML = ""; res(true); };
      sh.q("[data-n]").onclick = () => sh.close();
    });
  }

  function toast(msg) {
    let t = document.querySelector(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // Shrink a camera photo before storing it (keeps phones and the database light). Returns a JPEG Blob.
  function shrinkImage(file, maxSide = 1600, quality = 0.72) {
    return new Promise((res) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob((b) => res(b || file), "image/jpeg", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); res(file); };
      img.src = url;
    });
  }

  // ---------------------------------------------------------------- photo time stamp and location (QA evidence)
  // Reads the date taken and GPS position saved in a JPEG by the camera (EXIF), if there are any.
  async function exifInfo(file) {
    try {
      const buf = await file.slice(0, 256 * 1024).arrayBuffer(), dv = new DataView(buf);
      if (dv.getUint16(0) !== 0xFFD8) return {};
      let off = 2;
      while (off + 4 < dv.byteLength) {
        const marker = dv.getUint16(off), len = dv.getUint16(off + 2);
        if (marker === 0xFFE1 && dv.getUint32(off + 4) === 0x45786966) return parseTiff(dv, off + 10);
        if ((marker & 0xFF00) !== 0xFF00) break;
        off += 2 + len;
      }
    } catch (e) { /* not a JPEG with EXIF */ }
    return {};
  }
  function parseTiff(dv, t) {
    const le = dv.getUint16(t) === 0x4949, u16 = (o) => dv.getUint16(t + o, le), u32 = (o) => dv.getUint32(t + o, le);
    const ifd = (o) => { const n = u16(o), out = {}; for (let i = 0; i < n; i++) { const e = o + 2 + i * 12; out[u16(e)] = { type: u16(e + 2), count: u32(e + 4), at: e + 8 }; } return out; };
    const ascii = (e) => { const o = e.count > 4 ? u32(e.at) : e.at; let str = ""; for (let i = 0; i < e.count - 1; i++) str += String.fromCharCode(dv.getUint8(t + o + i)); return str; };
    const rat3 = (e) => { const o = u32(e.at); const r = (i) => u32(o + i * 8) / (u32(o + i * 8 + 4) || 1); return r(0) + r(1) / 60 + r(2) / 3600; };
    const out = {}, i0 = ifd(u32(4));
    if (i0[0x8769]) { const ex = ifd(u32(i0[0x8769].at)); const d = ex[0x9003] || ex[0x9004]; if (d) { const m = ascii(d).match(/(\d+):(\d+):(\d+) (\d+):(\d+):(\d+)/); if (m) out.takenAt = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]).toISOString(); } }
    if (!out.takenAt && i0[0x0132]) { const m = ascii(i0[0x0132]).match(/(\d+):(\d+):(\d+) (\d+):(\d+):(\d+)/); if (m) out.takenAt = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]).toISOString(); }
    if (i0[0x8825]) {
      const g = ifd(u32(i0[0x8825].at));
      if (g[2] && g[4]) {
        let lat = rat3(g[2]), lng = rat3(g[4]);
        if (g[1] && String.fromCharCode(dv.getUint8(t + g[1].at)) === "S") lat = -lat;
        if (g[3] && String.fromCharCode(dv.getUint8(t + g[3].at)) === "W") lng = -lng;
        if (isFinite(lat) && isFinite(lng) && (lat || lng)) out.gps = { lat, lng };
      }
    }
    return out;
  }
  let lastFix = null;
  async function photoFix() {
    if (lastFix && Date.now() - lastFix.at < 120000) return lastFix;
    const p = await locate(8000);
    if (!p.error) lastFix = Object.assign({ at: Date.now() }, p);
    return p;
  }
  const fmtStamp = (d) => pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());

  // Shrinks a QA photo and burns in a stamp: date and time, GPS position, job and distance from site.
  // Returns { blob, meta } where meta = { takenAt, lat, lng, accuracy, source, distanceM, job }.
  async function stampPhoto(file, job) {
    const ex = await exifInfo(file);
    const pick = !!(ex.takenAt && Math.abs(Date.now() - new Date(ex.takenAt)) > 10 * 60000); // from the gallery, not just taken
    let lat = null, lng = null, accuracy = null, source = "phone at capture";
    if (ex.gps) { lat = ex.gps.lat; lng = ex.gps.lng; source = "photo GPS"; }
    else if (!pick) { const f = await photoFix(); if (!f.error) { lat = f.lat; lng = f.lng; accuracy = f.accuracy; } else source = f.error; }
    else source = "not recorded in photo";
    const takenAt = ex.takenAt && pick ? ex.takenAt : new Date().toISOString();
    const site = job && job.lat != null ? { lat: job.lat, lng: job.lng } : null;
    const dist = lat != null && site ? Math.round(distanceM({ lat, lng }, site)) : null;
    const meta = { takenAt, lat, lng, accuracy, source, distanceM: dist, job: job ? job.jobNumber : "" };
    const blob = await new Promise((res) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext("2d"); g.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        const fs = Math.max(13, Math.round(c.width * 0.024)), lh = Math.round(fs * 1.35);
        const line1 = fmtStamp(new Date(takenAt)) + (lat != null ? "   " + lat.toFixed(5) + ", " + lng.toFixed(5) + (accuracy ? " (±" + accuracy + " m)" : "") : "   location unavailable");
        const line2 = [job ? job.jobNumber + " " + (job.site || "") : "", dist != null ? fmtDistance(dist) + " from site" : ""].filter(Boolean).join("  ·  ");
        const lines = [line1, line2].filter(Boolean), bandH = lines.length * lh + Math.round(fs * 0.7);
        g.fillStyle = "rgba(0,0,0,0.55)"; g.fillRect(0, c.height - bandH, c.width, bandH);
        g.fillStyle = "#F39200"; g.fillRect(0, c.height - bandH, Math.max(4, Math.round(fs * 0.3)), bandH);
        g.fillStyle = "#fff"; g.font = "600 " + fs + "px -apple-system, Segoe UI, Roboto, sans-serif"; g.textBaseline = "top";
        lines.forEach((t, i) => g.fillText(t, Math.round(fs * 0.9), c.height - bandH + Math.round(fs * 0.35) + i * lh));
        c.toBlob((b) => res(b || file), "image/jpeg", 0.8);
      };
      img.onerror = () => { URL.revokeObjectURL(url); res(file); };
      img.src = url;
    });
    return { blob, meta };
  }

  // Signature pad. Returns { el, isEmpty(), toBlob() }.
  function signaturePad(label) {
    const wrap = document.createElement("div"); wrap.className = "sig";
    wrap.innerHTML = '<div class="sig-h"><span>' + esc(label || "Sign here") + '</span><button type="button" class="link">Clear</button></div><canvas></canvas>';
    const c = wrap.querySelector("canvas"); let ctx, drawn = false, last = null;
    const size = () => { const r = c.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; if (!r.width) return; c.width = r.width * dpr; c.height = r.height * dpr; ctx = c.getContext("2d"); ctx.scale(dpr, dpr); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#111"; };
    const pt = (e) => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    c.addEventListener("pointerdown", (e) => { if (!ctx) size(); c.setPointerCapture(e.pointerId); last = pt(e); drawn = true; e.preventDefault(); });
    c.addEventListener("pointermove", (e) => { if (!last) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; e.preventDefault(); });
    c.addEventListener("pointerup", () => (last = null)); c.addEventListener("pointercancel", () => (last = null));
    wrap.querySelector("button").onclick = () => { size(); drawn = false; };
    requestAnimationFrame(size);
    return { el: wrap, isEmpty: () => !drawn, toBlob: () => new Promise((res) => c.toBlob(res, "image/png")) };
  }

  // Current position, with a time limit. Resolves { lat, lng, accuracy } or { error }.
  function locate(timeoutMs = 15000) {
    return new Promise((res) => {
      if (!navigator.geolocation) { res({ error: "This device can't share its location." }); return; }
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
        (e) => res({ error: e.code === 1 ? "Location is turned off for this app. Allow location in your phone's settings." : "Couldn't get a location fix." }),
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 });
    });
  }

  // Paid time for one person's day from the time clocked (config breaks): the morning brew is paid, the lunch is not.
  function paidMs(dayMs) {
    const b = CFG.breaks || { unpaidLunchMin: 30, lunchIfOverHours: 6 };
    return dayMs > (b.lunchIfOverHours || 6) * 36e5 ? Math.max(0, dayMs - (b.unpaidLunchMin || 0) * 6e4) : dayMs;
  }

  // England & Wales bank holidays: live list from GOV.UK, with a built-in fallback.
  const BH_FALLBACK = ["2026-01-01", "2026-04-03", "2026-04-06", "2026-05-04", "2026-05-25", "2026-08-31", "2026-12-25", "2026-12-28",
    "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03", "2027-05-31", "2027-08-30", "2027-12-27", "2027-12-28"];
  let bankHolidays = new Set(LS.get("bankHolidays", BH_FALLBACK));
  async function loadBankHolidays() {
    try {
      const r = await fetch("https://www.gov.uk/bank-holidays.json"); if (!r.ok) return;
      const j = await r.json(); const list = ((j[CFG.bankHolidayRegion] || {}).events || []).map((e) => e.date);
      if (list.length) { bankHolidays = new Set(list); LS.set("bankHolidays", list); }
    } catch (e) { /* offline: keep stored list */ }
  }
  const isBankHoliday = (d) => bankHolidays.has(typeof d === "string" ? d : isoDate(d));
  const isWorkingDay = (d) => d.getDay() !== 0 && d.getDay() !== 6 && !isBankHoliday(d);
  function workingDays(from, to, halfStart, halfEnd) {
    let n = 0; const d = parseDate(from), end = parseDate(to);
    for (; d <= end; d.setDate(d.getDate() + 1)) if (isWorkingDay(d)) n++;
    if (n && halfStart) n -= 0.5; if (n && halfEnd && to !== from) n -= 0.5;
    return Math.max(0, n);
  }

  // App state shared by sections
  const S = { user: LS.get("user", null), manifest: LS.get("manifest", null) };
  function myJobs() {
    if (!S.manifest || !S.user) return [];
    const mine = new Set(S.user.emails);
    return (S.manifest.jobs || []).filter((j) => (j.operatives || []).some((e) => mine.has(String(e).toLowerCase())));
  }
  // jobs this person can open: their own, or every live job for roles with "all-jobs" (managers browsing projects)
  function viewableJobs() { return S.manifest && S.user && can("all-jobs") ? (S.manifest.jobs || []) : myJobs(); }
  const jobByFolder = (folder) => viewableJobs().find((j) => j.folder === folder);
  // Site labour planner allocations for me (manifest "allocations", next 14 days; W2)
  function myWeek() {
    if (!S.manifest || !S.user) return [];
    const mine = new Set(S.user.emails), today = isoDate(new Date());
    return (S.manifest.allocations || []).filter((a) => mine.has(String(a.email).toLowerCase()) && a.date >= today).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }

  // Cranes on a job on a given day (21 Nov): crane hires are sent with each job (dates only, no check sheet) so the
  // site can see there's a crane on site that day. On hire up to and including the off-hire date; no off-hire date = ongoing.
  function cranesOn(job, iso) {
    return ((job && job.cranes) || []).filter((c) => c.onHire && c.onHire <= iso && (!c.offHire || c.offHire >= iso));
  }

  function jobOptions(selected, allowNone) {
    return (allowNone ? '<option value="">No job / yard</option>' : "") +
      viewableJobs().map((j) => '<option value="' + esc(j.folder) + '"' + (j.folder === selected ? " selected" : "") + ">" + esc(j.jobNumber + " · " + (j.site || j.customer || "")) + "</option>").join("");
  }

  window.IC = {
    wide: () => window.matchMedia("(min-width: 1024px)").matches, // a computer screen: desktop-only screens (App admin)
    CFG, DEMO, LS, SAMPLES, can, roleOf, rolesOf, roleKey, ROLE_LABEL, Settings, paidMs, $, esc, pad, fmtDate, fmtDay, fmtTime, fmtMoney, fmtHours, isoDate, parseDate, uid, sameDay, distanceM, fmtDistance,
    Store, Src, Graph, Api, Data, routes, route, status, setBar, sheet, ask, toast, shrinkImage, stampPhoto, fmtStamp, signaturePad, locate,
    loadBankHolidays, isBankHoliday, isWorkingDay, workingDays, S, myJobs, myWeek, jobByFolder, viewableJobs, jobOptions, cranesOn, DEMO_TEAM: Demo.team
  };
})();
