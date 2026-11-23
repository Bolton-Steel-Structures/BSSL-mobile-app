// iCONSTRUCTE Site — settings for your Microsoft 365. Your IT provider fills these in (see SETUP.md).
window.SITE_CONFIG = {
  // Microsoft Entra ID (Azure AD) app registration
  tenantId: "YOUR-TENANT-ID",            // Directory (tenant) ID
  clientId: "YOUR-APP-CLIENT-ID",        // Application (client) ID of the "iCONSTRUCTE Site" app registration

  // The SharePoint site and document library that iCONSTRUCTE issues drawings to
  siteHost: "yourcompany.sharepoint.com",  // e.g. boltonstructures.sharepoint.com
  sitePath: "/sites/SiteDrawings",         // the site's path
  library: "Documents",                    // document library name ("Documents" is the default library)

  // Delegated Microsoft Graph permissions requested at sign-in
  scopes: ["User.Read", "Sites.ReadWrite.All"],

  // How many days a newly issued drawing is flagged "New"
  newDays: 14,

  // SharePoint library the app sends certificates to; iCONSTRUCTE files them in the job's 09 - QA folder
  returnsLibrary: "Site Returns",

  // Azure back end for check-ins, forms, holidays and expenses (see API.md)
  publicUrl: "",                         // new-starter links and QR codes point here (the app's public address); blank = the address the app is opened at
  apiBase: "/api",                        // same site when hosted on Azure Static Web Apps with its API
  apiScope: "api://YOUR-APP-CLIENT-ID/Site.ReadWrite",

  // Check in / out: flag (not block) check-ins further than this from the site
  checkInRadiusM: 500,

  // Breaks, site and workshop (Liam, 21 Nov 2026): a 15-minute brew in the morning is paid (nothing taken off); a 30-minute
  // lunch is unpaid and taken off each day's clocked time, on days longer than lunchIfOverHours (so a short day keeps all its time).
  breaks: { paidBrewMin: 15, unpaidLunchMin: 30, lunchIfOverHours: 6 },

  // Workshop clocking (Liam, 21 Nov): workshop staff can only clock in at the premises. Set lat / lng from the Google Maps
  // pin of the workshop (right-click the door > the two numbers). Clock in is refused further away than radiusM (plus the
  // phone's stated accuracy, to a limit of 100 m) or with location off; clocking out away is allowed but flagged with a reason.
  // Only the distance is kept, never the position. Pin given by Liam, 21 Nov 2026 (53.47435 N, 2.55337 W).
  workshopLocation: { lat: 53.47435, lng: -2.55337, radiusM: 500 },

  // Holidays: month the leave year starts (1 = January); warn when this many people are already off
  leaveYearStartMonth: 1,
  maxOffSameDay: 2,

  // Mileage: HMRC approved rates for cars and vans (2026/27: 55p first 10,000 business miles, then 25p)
  mileageRate: 0.55,
  mileageRateOver10k: 0.25,

  // What each role sees in the app (Liam to confirm with his tick-box schedule; change the lists, nothing else).
  // The role comes from the employee record in iCONSTRUCTE (Role: Manager / Supervisor / Operative).
  //   drawings   My jobs and drawings          rams      Read & sign the RAMS
  //   time       Check in / out, timesheet      leave     Holidays           expenses  Expenses
  //   cards      My competency cards            qa        QA (inspections, snags, handover)
  //   manager    Manager tools (team approvals, time keeping, cards)
  //   all-jobs   Projects: every live project and its packages of work (managers; no check in / out or timesheet)
  //   ws-hours   book my workshop hours to jobs    ws-hours-team  see and book the workshop team's hours    ws-payroll  weekly payroll spreadsheet
  //   workshop   Workshop: fabrication status by job (dashboard and QA list)     fab-mark  mark lines Fabricated / Welded / Checked / Loaded
  //   form:<id>  each form, e.g. form:toolbox, form:plant ("form:*" = all forms)
  //     Safety: toolbox, plant, vehicle, lifting, handover, nearmiss, ppe (PPE request), wscheck
  //     Quality: daywork, foundation, erection, bolting, welding, snag, ncr, works, completion
  roles: {
    Manager: ["drawings", "all-jobs", "leave", "expenses", "hr", "hr-admin", "cards", "qa", "manager", "week", "team-week", "model", "erect", "workshop", "fab-mark", "fab-correct", "fab-ready", "ws-hours-team", "ws-payroll", "board", "form:*"],
    Supervisor: ["drawings", "rams", "time", "leave", "expenses", "hr", "cards", "qa", "week", "crew", "model", "erect", "form:*"],
    Operative: ["drawings", "rams", "time", "leave", "expenses", "hr", "cards", "week", "model", "form:powra", "form:plant", "form:vehicle", "form:nearmiss", "form:ppe", "form:ncr"],
    // Workshop (the workshop's own staff; Liam, 21 Nov): clocking in and out, fabrication status, NCR; no site safety forms.
    //   fab-mark = mark lines Fabricated / Welded / Checked / Loaded   fab-correct = undo anyone's mark   fab-ready = told when a load is ready
    //   Directors use the Manager role above (everything on both sides).
    // Workshop Director (Liam, 23 Nov): a director of the workshop company only. Sees the workshop and its
    // staff like the Workshop Manager, and nothing of BSS: no site jobs, drawings, planner or BSS staff.
    "Workshop Director": ["workshop", "board", "manager", "fab-mark", "fab-correct", "fab-ready", "ws-hours-team", "ws-payroll", "leave", "expenses", "hr", "hr-workshop", "cards", "form:wscheck", "form:ppe", "form:ncr"],
    "Workshop Manager": ["workshop", "board", "manager", "fab-mark", "fab-correct", "fab-ready", "ws-hours-team", "ws-payroll", "leave", "expenses", "hr", "cards", "form:wscheck", "form:ppe", "form:ncr"],
    "Workshop Admin": ["workshop", "fab-ready", "ws-hours-team", "ws-payroll", "leave", "expenses", "hr", "cards", "form:ppe", "form:ncr"],
    "Workshop Supervisor": ["workshop", "board", "fab-mark", "fab-correct", "time", "ws-hours", "ws-hours-team", "leave", "expenses", "hr", "cards", "form:wscheck", "form:ppe", "form:ncr"],
    "Fabricator/Welder": ["workshop", "fab-mark", "time", "ws-hours", "leave", "expenses", "hr", "cards", "form:ppe", "form:ncr"],
    // Screens (Liam, 21 Nov): a login for the TV screens; opens straight on the wall board, nothing else.
    //   board = can open the wall board (Directors, Workshop Manager, Workshop Supervisor, Screens)
    // HR Admin (Liam, 23 Nov): the office person who runs HR; sees every employee's HR record, issues documents, sets up new starters.
    //   hr = My HR (own details, documents to sign, absence)   hr-admin = everyone's HR records (directors have it too)
    //   hr-workshop = every HR record in full, for workshop staff only (Workshop Director)
    "HR Admin": ["leave", "expenses", "hr", "hr-admin", "cards"],
    // From Liam's roles workbook (23 Nov). Change these in the app: App admin > Permissions.
    Accounts: ["leave", "expenses", "hr", "hr-admin", "manager", "form:ppe"],
    Admin: ["expenses", "hr", "manager", "form:ppe"],
    Estimators: ["leave", "expenses", "hr", "form:ppe"],
    "Project Managers": ["drawings", "all-jobs", "rams", "time", "leave", "expenses", "hr", "cards", "week", "team-week", "model", "erect", "qa", "manager", "form:*"],
    Draughtsmen: ["drawings", "all-jobs", "model", "leave", "expenses", "hr", "form:ppe"],
    "QA Manager": ["drawings", "all-jobs", "rams", "leave", "expenses", "hr", "cards", "week", "model", "erect", "qa", "form:*"],
    "Workshop Accounts": ["leave", "expenses", "hr", "form:ppe"],
    // App Admin (Liam, 23 Nov): runs the app once live: roles, permissions, people, action owners, content. Given alongside a normal role.
    "App Admin": ["app-admin"],
    Screens: ["workshop", "board", "screens"]
  },

  // true = run with built-in sample data and no sign-in (for previewing only)
  demo: true
};
