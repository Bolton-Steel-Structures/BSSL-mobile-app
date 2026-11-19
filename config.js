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
  apiBase: "/api",                        // same site when hosted on Azure Static Web Apps with its API
  apiScope: "api://YOUR-APP-CLIENT-ID/Site.ReadWrite",

  // Check in / out: flag (not block) check-ins further than this from the site
  checkInRadiusM: 500,

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
  //   form:<id>  each form, e.g. form:toolbox, form:plant ("form:*" = all forms)
  //     Safety: toolbox, plant, lifting, handover, nearmiss
  //     Quality: daywork, foundation, erection, bolting, welding, snag, ncr, works, completion
  roles: {
    Manager: ["drawings", "rams", "time", "leave", "expenses", "cards", "qa", "manager", "form:*"],
    Supervisor: ["drawings", "rams", "time", "leave", "expenses", "cards", "qa", "form:*"],
    Operative: ["drawings", "rams", "time", "leave", "expenses", "cards", "form:nearmiss", "form:ncr"]
  },

  // true = run with built-in sample data and no sign-in (for previewing only)
  demo: true
};
