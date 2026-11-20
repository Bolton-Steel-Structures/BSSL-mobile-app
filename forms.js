/* iCONSTRUCTE Site: site safety and quality forms.
 * Templates are drafted from QFC05 Site Erection (Q05.4–Q05.12) and NSSS 7th Edition Sections 5, 6, 8 and 9.
 * Each template is plain data, so BSS's own forms can replace or extend these without changing the screens.
 */
(function () {
  "use strict";
  const { $, esc, fmtDate, fmtDay, fmtTime, isoDate, Data, myJobs, jobByFolder, jobOptions, sheet, toast, setBar, route, shrinkImage, signaturePad } = IC;

  // ---------------------------------------------------------------- NSSS permitted deviations used by the "tolerance" field
  // Values from NSSS 7th Ed 9.1 and 9.6. needs: "h" = height in m, "L" = length in m. limit() returns mm.
  const CHECKS = [
    { id: "9.1.1", label: "Foundation level (9.1.1)", lo: -15, hi: 5 },
    { id: "9.6.1", label: "Column position at base (9.6.1)", limit: () => 10 },
    { id: "9.6.2", label: "Column base level (9.6.2)", limit: () => 5 },
    { id: "9.6.5", label: "Single storey column plumb, h/300 (9.6.5)", needs: "h", limit: (h) => (h * 1000) / 300 },
    { id: "9.6.6", label: "Portal column plumb, each, h/150 (9.6.6)", needs: "h", limit: (h) => (h * 1000) / 150 },
    { id: "9.6.7", label: "Portal frame mean plumb, h/500 (9.6.7)", needs: "h", limit: (h) => (h * 1000) / 500 },
    { id: "9.6.9", label: "Multi-storey column plumb per storey, h/300 (9.6.9)", needs: "h", limit: (h) => (h * 1000) / 300 },
    { id: "9.6.15", label: "Column spacing (9.6.15)", needs: "L", limit: (L) => (L <= 5 ? 10 : 0.2 * (L + 45)) },
    { id: "9.6.16", label: "Column alignment to column line (9.6.16)", limit: () => 10 },
    { id: "9.6.18", label: "Beam level at connection (9.6.18)", limit: () => 10 },
    { id: "9.6.19", label: "Beam slope, L/500 max 10 (9.6.19)", needs: "L", limit: (L) => Math.min(10, (L * 1000) / 500) },
    { id: "9.6.21", label: "Relative level of adjacent beams (9.6.21)", limit: () => 10 },
    { id: "9.6.22", label: "Beam location at connection (9.6.22)", limit: () => 5 },
    { id: "9.6.23", label: "Beam spacing (9.6.23)", limit: () => 10 }
  ];
  function judge(row) {
    const c = CHECKS.find((x) => x.id === row.check); const dev = parseFloat(row.dev);
    if (!c || isNaN(dev)) return { text: "", ok: null };
    if (c.lo != null) return { text: c.lo + " / +" + c.hi + " mm", ok: dev >= c.lo && dev <= c.hi };
    const dim = parseFloat(row.dim); if (c.needs && !(dim > 0)) return { text: "enter " + c.needs + " (m)", ok: null };
    const lim = Math.round(c.limit(dim) * 10) / 10;
    return { text: "±" + lim + " mm", ok: Math.abs(dev) <= lim };
  }

  const YNA = ["Yes", "No", "N/A"];
  // Plant BSS hires (Liam, 20 Nov), each with its own daily check sheet. Cranes are checked by the crane company's driver.
  const PLANT_TYPES = ["Telehandler", "Cherry picker – diesel", "Cherry picker – electric", "Scissor lift – diesel", "Scissor lift – electric", "Genie SuperLift", "Mini crane"];
  const MEWP_COMMON = ["Ground and platform controls working; emergency stop at both", "Emergency lowering / auxiliary descent checked", "Tilt alarm and overload (load sensing) working",
    "Platform guardrails, gate and toe boards intact", "No hydraulic leaks; hoses and cylinders undamaged", "Tyres and wheels in good condition", "Alarms, beacon and horn working",
    "Ground conditions checked for the set-up", "Rescue plan in place and the ground person briefed"];
  const DIESEL = ["Fuel, engine oil and coolant levels OK", "Exhaust and engine bay free of damage and leaks"];
  const ELECTRIC = ["Batteries charged; charger lead and connections undamaged", "No battery acid leaks or corrosion"];
  const PLANT_CHECKS = {
    "Telehandler": ["Thorough examination (LOLER) in date for the machine and every attachment",
      "Load chart for the attachment in use is in the cab", "Load moment indicator (LMI) tested and working", "Quick-hitch / carriage locking pin secure",
      "Lifting jib: LOLER in date, SWL marked, locking pins and retaining clips fitted", "Chains: tag in date, no stretched or damaged links, hooks with safety catches",
      "Forks: no cracks or bends, locking pins fitted", "Stabilisers / outriggers working (if fitted)", "Tyres, wheels and wheel nuts in good condition",
      "No hydraulic, fuel or oil leaks; hoses undamaged", "Brakes, steering and parking brake working", "Lights, beacon, horn and reversing alarm working",
      "Seat belt, mirrors and cab glass undamaged", "Fuel, engine oil, coolant and hydraulic levels OK"],
    "Cherry picker – diesel": ["Thorough examination (LOLER) in date", "Harness and short lanyard inspected and worn, clipped to the basket anchor", "Outriggers / stabilisers working (if fitted)"].concat(MEWP_COMMON, DIESEL),
    "Cherry picker – electric": ["Thorough examination (LOLER) in date", "Harness and short lanyard inspected and worn, clipped to the basket anchor"].concat(MEWP_COMMON, ELECTRIC),
    "Scissor lift – diesel": ["Thorough examination (LOLER) in date", "Pothole protection deploys", "Extension deck locks in and out"].concat(MEWP_COMMON, DIESEL),
    "Scissor lift – electric": ["Thorough examination (LOLER) in date", "Pothole protection deploys", "Extension deck locks in and out"].concat(MEWP_COMMON, ELECTRIC),
    "Genie SuperLift": ["Thorough examination (LOLER) in date", "Set up on firm, level ground; legs / outriggers out and locked", "Castors locked", "Mast sections clean, straight and undamaged",
      "Winch cable: no kinks, fraying or crushing; at least 3 wraps on the drum", "Winch brake holds the load", "Forks / load platform secure; load within the SWL for the height",
      "Handle and ratchet working", "Load secured before lifting; nobody under the load"],
    "Mini crane": ["Thorough examination (LOLER) in date for the crane and every lifting accessory", "Set up on firm, level ground; outriggers fully out, on pads and interlocks working",
      "Level indicator shows the crane level", "Rated capacity indicator / safe load indicator tested and working", "Overhoist (anti-two-block) cut-out working",
      "Wire rope: no kinks, broken wires or crushing; spooling correctly on the drum", "Hook and safety catch undamaged; hook block turns freely",
      "Boom sections and pins undamaged", "No hydraulic, fuel or oil leaks; hoses undamaged", "Tracks and undercarriage in good condition",
      "Remote / control station and emergency stops working", "Slings, shackles and lifting accessories tagged and in date"],
    // Older checks only (no longer offered)
    "Other machine (daily check)": ["Thorough examination (LOLER) in date (if lifting)", "Tyres, tracks and wheels in good condition",
      "No hydraulic, fuel or oil leaks", "Controls and emergency stop working", "Alarms, lights and beacon working", "Guards and covers in place"]
  };
  const T = [
    // ----- SAFETY
    { id: "rams", group: "Safety", title: "RAMS & crane plan briefing", ref: "QFC05 Q05.4", perPerson: true,
      blurb: "Read the RAMS and crane plan for the job and sign that you understand them.",
      fields: [
        { type: "docs" },
        { type: "confirm", id: "understood", text: "I have read and understood the RAMS and crane plan listed above, they have been explained to me, and I will work to them. I will stop and tell my supervisor if anything changes on site.", required: true },
        { type: "signature", id: "sig", label: "Your signature", required: true }
      ] },
    { id: "toolbox", group: "Safety", title: "Toolbox talk", ref: "QFC05 Q05.7",
      blurb: "Pick the talk, deliver it, then each operative signs the register.",
      fields: [
        { type: "talk", id: "talk", label: "Talk", required: true },
        { type: "text", id: "by", label: "Delivered by", prefill: "me", required: true },
        { type: "number", id: "mins", label: "Duration", unit: "minutes" },
        { type: "text", id: "points", label: "Key points covered", multiline: true },
        { type: "people", id: "attendees", label: "Register: each operative signs", required: true },
        { type: "photos", id: "photos", label: "Photos (optional)" }
      ] },
    { id: "plant", group: "Safety", title: "Plant pre-use check", ref: "QFC05 Q05.8 · Plant register",
      blurb: "Daily check before use. Each machine has a weekly sheet anyone on the site can add to.",
      fields: [
        { type: "hidden", id: "plantKey" },
        { type: "date", id: "checkDate", label: "Date of check", prefill: "today", max: "today", back: 7, required: true, hint: "Today unless you're recording a check done earlier" },
        { type: "text", id: "plantRef", label: "Machine reference (fleet / hire no. on the machine)", required: true },
        { type: "select", id: "plantType", label: "Machine", options: PLANT_TYPES, required: true },
        { type: "text", id: "plantId", label: "Make / model", placeholder: "e.g. Genie Z45" },
        { type: "number", id: "hours", label: "Hour meter", unit: "hrs" },
        { type: "checklist", id: "checks", label: "Checks", itemsBy: "plantType", itemsFor: PLANT_CHECKS, badAnswer: "No", required: true },
        { type: "text", id: "defects", label: "Other comments", multiline: true },
        { type: "yesno", id: "safe", label: "Safe to use?", badAnswer: "No", required: true, warn: "Do not use. Tag it out of use and tell your supervisor and the hire company." },
        { type: "photos", id: "photos", label: "Photos" },
        { type: "text", id: "operator", label: "Operator", prefill: "me", required: true },
        { type: "signature", id: "sig", label: "Operator signature", required: true }
      ] },
    { id: "lifting", group: "Safety", title: "Lifting accessories check", ref: "QFC05 Q05.10 · Lifting equipment register",
      fields: [
        { type: "rows", id: "items", label: "Accessories", required: true, columns: [
          { id: "item", label: "Item", type: "select", options: ["Chain sling", "Webbing sling", "Round sling", "Shackle", "Beam clamp", "Lifting beam", "Eyebolt", "Other"] },
          { id: "idno", label: "ID no.", type: "text" }, { id: "swl", label: "SWL", type: "text" },
          { id: "cert", label: "Exam date", type: "date" }, { id: "ok", label: "Condition OK", type: "yesno", badAnswer: "No" }] },
        { type: "signature", id: "sig", label: "Checked by", required: true }
      ] },
    { id: "handover", group: "Safety", title: "Safe site handover", ref: "NSSS 8.2, 8.3 · Table 1.5(x)",
      fields: [
        { type: "checklist", id: "checks", label: "Site conditions", items: ["Access route and hardstanding suitable for deliveries and cranes", "Working area firm, level and clear of obstructions", "Foundations and holding-down bolts complete and accessible", "Underground services and overhead cables identified", "Exclusion zones and segregation agreed", "Welfare facilities available", "Inductions and permits completed", "Interfaces with other contractors agreed"], badAnswer: "No", required: true },
        { type: "text", id: "issues", label: "Other comments", multiline: true },
        { type: "yesno", id: "accepted", label: "Site accepted as safe to start erection?", badAnswer: "No", required: true, warn: "Don't start. Tell the Projects & Estimating Manager." },
        { type: "photos", id: "photos", label: "Photos" },
        { type: "text", id: "pcName", label: "Principal Contractor representative", required: true },
        { type: "signature", id: "pcSig", label: "Principal Contractor signature", required: true },
        { type: "signature", id: "sig", label: "BSS supervisor signature", required: true }
      ] },
    { id: "powra", group: "Safety", title: "Point of work risk assessment (POWRA)", ref: "H&S · RAMS",
      blurb: "Before starting the task: check the hazards where you're working, then the team signs.",
      fields: [
        { type: "text", id: "task", label: "Task", required: true },
        { type: "text", id: "where", label: "Where on site", required: true },
        { type: "checklist", id: "checks", label: "Before starting", badAnswer: "No", required: true, items: [
          "Briefed on the RAMS for this task", "Safe access and egress to the work area", "Working at height controls in place (MEWP, edge protection, harness)",
          "Lift planned, exclusion zone set and slinger / signaller in place", "Plant checked", "Weather suitable (wind, rain, ice)",
          "Other trades and the public kept clear", "Tools and equipment checked", "Correct PPE worn", "Emergency and rescue arrangements known"] },
        { type: "text", id: "other", label: "Any other hazards and how they're controlled", multiline: true },
        { type: "yesno", id: "safe", label: "Safe to start?", badAnswer: "No", required: true, warn: "Don't start. Tell your supervisor." },
        { type: "people", id: "team", label: "Team: each person signs", required: true }
      ] },
    { id: "nearmiss", group: "Safety", title: "Near miss / hazard report", ref: "H&S",
      fields: [
        { type: "text", id: "what", label: "What happened or what's the hazard?", multiline: true, required: true },
        { type: "text", id: "where", label: "Where on site?", required: true },
        { type: "yesno", id: "injury", label: "Was anyone hurt?", na: false, badAnswer: "Yes", required: true, warn: "Ring the office now. Injuries must also go in the accident book." },
        { type: "text", id: "action", label: "What was done straight away?", multiline: true },
        { type: "photos", id: "photos", label: "Photos" }
      ] },
    // ----- QUALITY
    { id: "daywork", group: "Quality", title: "Day work sheet", ref: "QFC05 Q05.6",
      fields: [
        { type: "text", id: "work", label: "Work carried out", multiline: true, required: true },
        { type: "text", id: "instructedBy", label: "Instructed by (client)", required: true },
        { type: "rows", id: "labour", label: "Labour", columns: [{ id: "name", label: "Name", type: "text" }, { id: "hours", label: "Hours", type: "number" }] },
        { type: "rows", id: "plant", label: "Plant", columns: [{ id: "plant", label: "Plant", type: "text" }, { id: "hours", label: "Hours", type: "number" }] },
        { type: "text", id: "materials", label: "Materials used", multiline: true },
        { type: "photos", id: "photos", label: "Photos" },
        { type: "text", id: "clientName", label: "Client name", required: true },
        { type: "signature", id: "clientSig", label: "Client signature", required: true },
        { type: "signature", id: "sig", label: "BSS supervisor signature", required: true }
      ] },
    { id: "foundation", group: "Quality", retired: true, title: "Foundation check before erection", ref: "NSSS 9.1, 9.2",
      fields: [
        { type: "note", text: "Any deviation outside NSSS 9.1 must be reported before erection starts (NSSS 9.2)." },
        { type: "tolerance", id: "survey", label: "Survey", only: ["9.1.1"] },
        { type: "checklist", id: "checks", label: "Checks", items: ["Holding-down bolts in position, plumb and correct projection", "Bolt sleeves / pockets clear and bolts free to move", "Grid lines and datum level marked", "Packs and shims available"], badAnswer: "No" },
        { type: "photos", id: "photos", label: "Photos" },
        { type: "signature", id: "sig", label: "Checked by", required: true }
      ] },
    { id: "erection", group: "Quality", retired: true, title: "Erection check: line, level & plumb", ref: "NSSS 8.6, 9.3, 9.6",
      fields: [
        { type: "select", id: "instrument", label: "Instrument", options: ["Total station", "Laser level", "Optical level", "Plumb line and tape", "Other"], required: true },
        { type: "text", id: "instrumentId", label: "Instrument ID and calibration date", required: true },
        { type: "number", id: "temp", label: "Air temperature", unit: "°C" },
        { type: "yesno", id: "calm", label: "Calm weather when measured? (NSSS 9.3)" },
        { type: "tolerance", id: "survey", label: "Measurements", required: true },
        { type: "photos", id: "photos", label: "Photos" },
        { type: "signature", id: "sig", label: "Checked by", required: true }
      ] },
    { id: "bolting", group: "Quality", retired: true, title: "Bolting check", ref: "NSSS 6, 8.8",
      fields: [
        { type: "rows", id: "connections", label: "Connections", required: true, columns: [
          { id: "ref", label: "Grid / connection", type: "text" }, { id: "bolt", label: "Size & grade", type: "text" },
          { id: "method", label: "Tightening", type: "select", options: ["Snug tight", "Torque", "Combined", "DTI", "HRC"] },
          { id: "ok", label: "Full set, checked", type: "yesno", badAnswer: "No" }] },
        { type: "text", id: "tool", label: "Torque wrench / tool ID and calibration date" },
        { type: "checklist", id: "checks", label: "Checks", items: ["All connections visually checked after local alignment (8.8)", "Preloaded joints: plies drawn together, gaps over 1 mm packed (6.4.1)", "Any preloaded assembly slackened after tightening has been scrapped (6.3.4)"], badAnswer: "No" },
        { type: "signature", id: "sig", label: "Checked by", required: true }
      ] },
    { id: "welding", group: "Quality", retired: true, title: "Site welding record", ref: "NSSS 5, 8.7",
      fields: [
        { type: "note", text: "The welder must hold a current qualification (WQ) for the WPS being used. Check the WPS / PQR / WQ register." },
        { type: "text", id: "welder", label: "Welder", required: true },
        { type: "text", id: "wq", label: "Welder qualification (WQ) ref", required: true },
        { type: "text", id: "wps", label: "WPS ref", required: true },
        { type: "text", id: "location", label: "Location / joint", required: true },
        { type: "yesno", id: "weather", label: "Protected from the weather (8.7)?", badAnswer: "No", required: true },
        { type: "yesno", id: "earth", label: "Earth return local to the weld (8.7)?", badAnswer: "No", required: true },
        { type: "yesno", id: "visual", label: "Visual inspection acceptable?", badAnswer: "No", required: true, warn: "Raise a non-conformance report." },
        { type: "photos", id: "photos", label: "Photos" },
        { type: "signature", id: "sig", label: "Signed", required: true }
      ] },
    { id: "snag", group: "Quality", retired: true, title: "Snagging list", ref: "QFC05 Q05.7",
      fields: [
        { type: "rows", id: "snags", label: "Snags", required: true, columns: [{ id: "where", label: "Location", type: "text" }, { id: "what", label: "Snag", type: "text" }, { id: "status", label: "Status", type: "select", options: ["Open", "Done"] }] },
        { type: "photos", id: "photos", label: "Photos" }
      ] },
    { id: "ncr", group: "Quality", title: "Non-conformance report", ref: "QP08 · QFC05 Q05.12",
      fields: [
        { type: "text", id: "what", label: "What is wrong?", multiline: true, required: true },
        { type: "text", id: "where", label: "Location / drawing ref", required: true },
        { type: "text", id: "clause", label: "NSSS clause or spec ref (if known)" },
        { type: "text", id: "containment", label: "Immediate action taken", multiline: true },
        { type: "text", id: "proposal", label: "Proposed correction", multiline: true },
        { type: "photos", id: "photos", label: "Photos" },
        { type: "signature", id: "sig", label: "Raised by", required: true }
      ] },
    { id: "works", group: "Quality", title: "Site inspection / handover", ref: "BSS Works Inspection · NSSS 8.9 · QFC05 Q05.11",
      blurb: "BSS standard Works Inspection sheet: areas inspected, snags & defects, and client sign-off for partial or full handover.",
      fields: [
        { type: "text", id: "glRef", label: "GL ref (grid lines / area inspected)", required: true },
        { type: "text", id: "stage", label: "Work stage", required: true, placeholder: "e.g. Phase 1 frame, GL A–F" },
        { type: "inspect", id: "areas", label: "Areas inspected / snags & defects noted", required: true, items: [
          "HD bolts tight", "Proprietary anchors installed", "All steelwork fitted", { t: "Columns lined, levelled & plumbed on grid", x: { label: "Checked with", options: ["Total station", "Laser level", "Laser line", "Spirit level", "Optical level", "Plumb line and tape"] } },
          "All bolts installed", "Beam connection – bolts tight", "HSFG / TCB (indicator) bolts: indicators show full tension",
          { t: "Bolts tensioned by torque", x: { label: "Torque (Nm), if required", number: true } }, "Beams level",
          "Top flanges unpainted where decking is fixed", "Finishes (paint / galv) undamaged", "All flooring installed",
          "All purlins installed", "All side rails installed", "Isolation packs installed", "PC stair free of spalled edges",
          "Steel stair fixed", "Balustrade / handrail complete", "Edge protection complete", "Metal deck complete", "Siteworks repaired",
          "Site welds: where any site welding has been done, coatings repaired (N/A if none)"] },
        { type: "text", id: "comments", label: "Comments", multiline: true },
        { type: "photos", id: "photos", label: "Photos" },
        { type: "text", id: "bssName", label: "BSSL representative (printed name)", prefill: "me", required: true },
        { type: "signature", id: "sig", label: "Signed by BSSL representative", required: true },
        { type: "select", id: "clientMode", label: "Client sign-off", options: ["Client signed on site", "Left with client (5-day acceptance)"], required: true },
        { type: "text", id: "clientName", label: "Client representative (printed name)", requiredIf: ["clientMode", "Client signed on site"] },
        { type: "signature", id: "clientSig", label: "Signed by client representative", requiredIf: ["clientMode", "Client signed on site"] },
        { type: "note", text: "This document will be presented to a suitable client representative for handing over on partial or full completion. If the client is unable to complete it with the BSSL representative, it will be left with the client and a 5 day period will be permitted before acceptance is deemed granted if not returned prior." }
      ] },
    { id: "audit", group: "Quality", title: "Site audit (during erection)", ref: "QFC05 · NSSS 8, 9",
      blurb: "A general look at progress and quality while erection is under way. Anything marked No needs an action.",
      fields: [
        { type: "text", id: "area", label: "Area / phase looked at", required: true, placeholder: "e.g. Phase 1, GL A–F" },
        { type: "select", id: "progress", label: "Progress", options: ["Ahead of programme", "On programme", "Behind programme"], required: true },
        { type: "text", id: "progressNotes", label: "Progress notes", multiline: true },
        { type: "checklist", id: "checks", label: "Quality and site", badAnswer: "No", required: true, items: [
          "Erecting to the current drawings (latest revision on site)", "Bolts in every connection as erection proceeds (no loose members left)",
          "Temporary stability: bracing / guys in place as the method statement", "Line, level and plumb checked as bays are completed",
          "Steelwork and coatings undamaged, or damage marked for repair", "Materials stored off the ground, stacked safely",
          "Exclusion zones and lifting areas controlled", "Working at height: MEWPs, edge protection and harnesses used correctly",
          "RAMS being followed; any changes briefed", "Work area tidy, waste removed"] },
        { type: "photos", id: "photos", label: "Photos" },
        { type: "text", id: "comments", label: "Other comments", multiline: true },
        { type: "signature", id: "sig", label: "Audited by", required: true }
      ] },
    { id: "supcomp", group: "Quality", title: "Supervisors Completion", ref: "BSS Works Inspection (short) · NSSS 8.9",
      blurb: "The supervisor's sign-off of the finished area. Any N becomes a snag.",
      fields: [
        { type: "text", id: "glRef", label: "GL ref (grid lines / area)", required: true },
        { type: "text", id: "stage", label: "Work stage", required: true, placeholder: "e.g. Phase 1 frame, GL A–F" },
        { type: "inspect", id: "areas", label: "Areas checked", required: true, items: [
          "All steelwork fitted",
          { t: "Columns lined, levelled & plumbed on grid", x: { label: "Checked with", options: ["Total station", "Laser level", "Laser line", "Spirit level", "Optical level", "Plumb line and tape"] } },
          "All bolts installed and tight",
          "HSFG / TCB (indicator) bolts: indicators show full tension",
          { t: "Bolts tensioned by torque", x: { label: "Torque (Nm), if required", number: true } },
          "Finishes (paint / galv) undamaged",
          "Site welds: where any site welding has been done, coatings repaired (N/A if none)",
          "Edge protection / handrail complete", "Work area cleared"] },
        { type: "photos", id: "photos", label: "Photos" },
        { type: "text", id: "comments", label: "Other comments", multiline: true },
        { type: "signature", id: "sig", label: "Supervisor signature", required: true }
      ] },
    { id: "completion", group: "Quality", title: "Completion & handover certificate", ref: "NSSS 8.9 · QFC05 Q05.11",
      fields: [
        { type: "text", id: "portion", label: "Steelwork completed (whole job or portion)", multiline: true, required: true },
        { type: "checklist", id: "checks", label: "Before handover", items: ["All connections complete", "Snagging complete", "Work area cleared", "Plant and equipment off-hired or removed"], badAnswer: "No", required: true },
        { type: "confirm", id: "bssStatement", text: "Bolton Steel Structures: an inspection has been made to ensure that all connections are completed and that the steelwork is erected in accordance with the NSSS and the contract requirements (NSSS 8.9 (i)).", required: true },
        { type: "signature", id: "sig", label: "BSS signature", required: true },
        { type: "text", id: "clientName", label: "Client name", required: true },
        { type: "text", id: "clientCompany", label: "Client company", required: true },
        { type: "confirm", id: "clientStatement", text: "Client: the structure, or the portion described, is accepted as built in accordance with the NSSS and the contract requirements (NSSS 8.9 (ii)).", required: true },
        { type: "signature", id: "clientSig", label: "Client signature", required: true }
      ] }
  ];
  const tpl = (id) => T.find((t) => t.id === id);

  // RAMS sign-off is tied to the current issue of the job's H&S documents. A new RAMS revision needs a new signature.
  const hsKey = (j) => (j.files || []).filter((f) => f.category === "H&S").map((f) => f.path + "@" + f.issued).sort().join("|");
  async function ramsStatus(j) {
    const key = hsKey(j); if (!key) return { needed: false };
    const forms = await Data.list("forms");
    const signed = forms.find((f) => f.templateId === "rams" && f.jobFolder === j.folder && f.status === "submitted" && f.docsKey === key);
    return { needed: true, signed: signed || null };
  }

  // ---------------------------------------------------------------- field widgets
  function seg(name, options, value, badAnswer) {
    return '<div class="seg" data-seg="' + esc(name) + '">' + options.map((o) => '<button type="button" class="' + (o === value ? "on" + (o === badAnswer ? " bad" : "") : "") + '" data-v="' + esc(o) + '">' + esc(o) + "</button>").join("") + "</div>";
  }
  function bindSeg(root, badAnswer, onChange) {
    root.querySelectorAll(".seg").forEach((s) => s.querySelectorAll("button").forEach((b) => (b.onclick = () => {
      s.querySelectorAll("button").forEach((x) => (x.className = "")); b.className = "on" + (b.dataset.v === badAnswer ? " bad" : "");
      s.dataset.value = b.dataset.v; if (onChange) onChange(s.dataset.seg, b.dataset.v);
    })));
    root.querySelectorAll(".seg").forEach((s) => { const on = s.querySelector("button.on"); if (on) s.dataset.value = on.dataset.v; });
  }

  async function photoStrip(ids) {
    const urls = await Promise.all((ids || []).map((id) => Data.blobUrl(id)));
    return urls.filter(Boolean).map((u) => '<img src="' + u + '" alt="">').join("");
  }

  // Build one field. Returns { el, get(), check() } where check() returns an error message or "".
  function field(f, val, ctx) {
    const el = document.createElement("div"); el.className = "ff ff-" + f.type;
    const label = f.label ? '<div class="ff-l">' + esc(f.label) + (f.required ? ' <span class="req-star">*</span>' : "") + (f.unit ? ' <span class="small">(' + esc(f.unit) + ")</span>" : "") + "</div>" : "";
    const need = (ok) => (f.required && !ok ? (f.label || "This") + " is needed" : "");
    switch (f.type) {
      case "hidden": { const hv = val != null ? val : (ctx.prefill || {})[f.id] || ""; el.hidden = true; return { el, get: () => hv, check: () => "" }; }
      case "h": el.innerHTML = '<div class="section-h">' + esc(f.label) + "</div>"; return { el, get: () => undefined, check: () => "" };
      case "note": el.innerHTML = '<div class="note">' + esc(f.text) + "</div>"; return { el, get: () => undefined, check: () => "" };
      case "docs": {
        const hs = ((ctx.job && ctx.job.files) || []).filter((x) => x.category === "H&S");
        el.innerHTML = '<div class="ff-l">Documents</div>' + (hs.length ? hs.map((x) => '<a class="doc-link" href="#/view/' + encodeURIComponent(ctx.job.folder) + "/" + encodeURIComponent(x.path) + '">' + esc(x.name) + ' <span class="small">issued ' + esc(fmtDate(x.issued)) + "</span></a>").join("") : '<div class="small">No RAMS issued for this job yet.</div>');
        return { el, get: () => undefined, check: () => (hs.length ? "" : "No RAMS have been issued for this job") };
      }
      case "text": case "number": case "date": case "time": {
        const pre = (ctx.prefill || {})[f.id];
        const v = val != null ? val : pre != null ? pre : f.prefill === "me" ? (Data.profile && Data.profile.name) || "" : f.prefill === "today" ? isoDate(new Date()) : "";
        // date limits: not in the future (max "today"), and no more than f.back days ago
        const dMax = f.type === "date" && f.max === "today" ? isoDate(new Date()) : "", dMin = f.type === "date" && f.back ? isoDate(addD(new Date(), -f.back)) : "";
        el.innerHTML = label + (f.multiline ? '<textarea rows="3">' + esc(v) + "</textarea>" : '<input type="' + (f.type === "text" ? "text" : f.type) + '"' + (f.type === "number" ? ' inputmode="decimal" step="any"' : "") + (dMax ? ' max="' + dMax + '"' : "") + (dMin ? ' min="' + dMin + '"' : "") + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") + ' value="' + esc(v) + '">') + (f.hint ? '<div class="small">' + esc(f.hint) + "</div>" : "");
        const inp = el.querySelector("input,textarea");
        return { el, get: () => inp.value.trim(), check: () => { const x = inp.value.trim(), n = need(x); if (n || !x || f.type !== "date") return n; if (dMax && x > dMax) return f.label + " can't be in the future"; if (dMin && x < dMin) return f.label + " must be within the last " + f.back + " days"; return ""; } };
      }
      case "select": {
        if (val == null && ctx.prefill && ctx.prefill[f.id] != null) val = ctx.prefill[f.id];
        el.innerHTML = label + '<select><option value="">Choose…</option>' + f.options.map((o) => "<option" + (o === val ? " selected" : "") + ">" + esc(o) + "</option>").join("") + "</select>";
        const s = el.querySelector("select"); s.onchange = () => document.dispatchEvent(new CustomEvent("ic-field", { detail: { id: f.id, value: s.value } }));
        return { el, get: () => s.value, check: () => need(s.value) };
      }
      case "yesno": {
        const opts = f.na === false ? ["Yes", "No"] : YNA;
        const act0 = (ctx.values || {})[f.id + "Action"] || "";
        el.innerHTML = label + seg(f.id, opts, val, f.badAnswer) + (f.warn ? '<div class="warnbox" hidden>' + esc(f.warn) + "</div>" : "") +
          (f.badAnswer ? '<input type="text" class="act" placeholder="Action needed" value="' + esc(act0) + '"' + (val === f.badAnswer ? "" : " hidden") + ">" : "");
        const w = el.querySelector(".warnbox"), act = el.querySelector(".act");
        bindSeg(el, f.badAnswer, (k, v) => { if (w) w.hidden = v !== f.badAnswer; if (act) act.hidden = v !== f.badAnswer; });
        if (w) w.hidden = val !== f.badAnswer;
        const s = el.querySelector(".seg");
        return { el, get: () => s.dataset.value || "", extra: () => (act ? { [f.id + "Action"]: s.dataset.value === f.badAnswer ? act.value.trim() : "" } : {}),
          check: () => need(s.dataset.value) || (act && s.dataset.value === f.badAnswer && !act.value.trim() ? (f.label || "This") + ": say what action is needed" : "") };
      }
      case "checklist": {
        if (f.itemsBy) {
          // items follow another field (the machine type): rebuilt when it changes
          const holder = document.createElement("div"); holder.className = "ff ff-checklist";
          let inner = null, cur = (ctx.values || {})[f.itemsBy] || (ctx.prefill || {})[f.itemsBy] || "";
          const draw = () => { const items = f.itemsFor[cur] || []; holder.innerHTML = ""; if (!items.length) { inner = null; holder.innerHTML = '<div class="small">' + esc(f.label) + ": pick the machine first.</div>"; return; } inner = field(Object.assign({}, f, { itemsBy: null, items }), cur === ((ctx.values || {})[f.itemsBy] || "") ? val : null, ctx); holder.appendChild(inner.el); };
          draw();
          document.addEventListener("ic-field", (e) => { if (e.detail.id === f.itemsBy && e.detail.value !== cur && holder.isConnected) { cur = e.detail.value; draw(); } });
          return { el: holder, get: () => (inner ? inner.get() : {}), extra: () => (inner && inner.extra ? inner.extra() : {}), check: () => (inner ? inner.check() : f.required ? "Pick the machine" : "") };
        }
        const v = val || {};
        const acts0 = (ctx.values || {})[f.id + "Actions"] || {};
        el.innerHTML = label + f.items.map((it, i) => '<div class="cl-item" data-i="' + i + '"><div class="cl-row"><div class="cl-t">' + esc(it) + "</div>" + seg(String(i), YNA, v[it], f.badAnswer) + "</div>" +
          (f.badAnswer ? '<input type="text" class="act" placeholder="Action needed" value="' + esc(acts0[it] || "") + '"' + (v[it] === f.badAnswer ? "" : " hidden") + ">" : "") + "</div>").join("") +
          '<button type="button" class="link" data-all>Mark all Yes</button>';
        bindSeg(el, f.badAnswer, (k, a) => { const box = el.querySelector('.cl-item[data-i="' + k + '"] .act'); if (box) box.hidden = a !== f.badAnswer; });
        el.querySelector("[data-all]").onclick = () => el.querySelectorAll(".seg").forEach((s) => { const b = s.querySelector('[data-v="Yes"]'); if (b && !s.dataset.value) b.click(); });
        const get = () => { const o = {}; el.querySelectorAll(".seg").forEach((s) => (o[f.items[+s.dataset.seg]] = s.dataset.value || "")); return o; };
        const acts = () => { const o = {}; el.querySelectorAll(".cl-item").forEach((r) => { const it = f.items[+r.dataset.i], a = r.querySelector(".seg").dataset.value, box = r.querySelector(".act"); if (box && a === f.badAnswer) o[it] = box.value.trim(); }); return o; };
        return { el, get, extra: () => (f.badAnswer ? { [f.id + "Actions"]: acts() } : {}),
          check: () => { if (f.required && Object.values(get()).some((x) => !x)) return "Answer every check in " + f.label; const miss = Object.entries(acts()).find(([, t]) => !t); return miss ? "Say what action is needed: " + miss[0] : ""; } };
      }
      case "inspect": {
        // one row per area: Y / N / N/A, comment (needed for N), date cleared once a snag is put right
        const v = val || {};
        const itemText = (it) => (typeof it === "string" ? it : it.t);
        const xField = (it, r) => { if (typeof it === "string" || !it.x) return ""; const x = it.x;
          return '<label class="ins-x"><span class="small">' + esc(x.label) + "</span>" + (x.options ? '<select data-k="x"><option value=""></option>' + x.options.map((o) => "<option" + (o === r.x ? " selected" : "") + ">" + esc(o) + "</option>").join("") + "</select>" : '<input type="number" inputmode="decimal" step="any" data-k="x" value="' + esc(r.x || "") + '">') + "</label>"; };
        el.innerHTML = label + f.items.map((it0, i) => { const it = itemText(it0), r = v[it] || {};
          return '<div class="ins-row" data-i="' + i + '"><div class="cl-row"><div class="cl-t">' + esc(it) + "</div>" + seg(String(i), YNA.map((x) => (x === "Yes" ? "Y" : x === "No" ? "N" : x)), r.a, "N") + "</div>" +
            xField(it0, r) +
            '<div class="ins-more"' + (r.a === "N" || r.c ? "" : " hidden") + '><input type="text" data-k="c" placeholder="Snag / defect and action needed" value="' + esc(r.c || "") + '">' +
            '<label class="ins-clr">Already cleared on <input type="date" data-k="d" value="' + esc(r.d || "") + '"></label></div>' +
            '<div class="ins-ph"><div class="thumbs" data-th></div><label class="btn sm ins-cam"><input type="file" accept="image/*" capture="environment" multiple hidden>Photo</label></div></div>'; }).join("") +
          '<button type="button" class="link" data-all>Mark all unanswered Y</button>';
        bindSeg(el, "N", (k, a) => { const row = el.querySelector('.ins-row[data-i="' + k + '"]'); row.querySelector(".ins-more").hidden = a !== "N" && !row.querySelector('[data-k="c"]').value; });
        // photos for each area
        const pics = f.items.map((it) => ((v[itemText(it)] || {}).p || []).slice());
        const drawPics = async (i) => { const th = el.querySelector('.ins-row[data-i="' + i + '"] [data-th]'); th.innerHTML = await photoStrip(pics[i]);
          th.querySelectorAll("img").forEach((img, n) => (img.onclick = async () => { if (await IC.ask("Remove this photo?", "Remove")) { pics[i].splice(n, 1); drawPics(i); } })); };
        el.querySelectorAll(".ins-row").forEach((row) => { const i = +row.dataset.i; drawPics(i);
          row.querySelector(".ins-cam input").onchange = async (e) => { for (const file of e.target.files) pics[i].push(await Data.putPhoto(file, ctx.job)); e.target.value = ""; drawPics(i); }; });
        el.querySelector("[data-all]").onclick = () => el.querySelectorAll(".seg").forEach((sg) => { const b = sg.querySelector('[data-v="Y"]'); if (b && !sg.dataset.value) b.click(); });
        const get = () => { const o = {}; el.querySelectorAll(".ins-row").forEach((row) => { const i = +row.dataset.i, it = itemText(f.items[i]), prev = v[it] || {}, xe = row.querySelector('[data-k="x"]'); o[it] = { a: row.querySelector(".seg").dataset.value || "", c: row.querySelector('[data-k="c"]').value.trim(), d: row.querySelector('[data-k="d"]').value, p: pics[i], snagId: prev.snagId }; if (xe && xe.value) o[it].x = xe.value; }); return o; };
        return { el, get, check: () => { const o = get(); if (f.required && Object.values(o).some((r) => !r.a)) return "Mark every area Y, N or N/A"; const bad = Object.entries(o).find(([, r]) => r.a === "N" && !r.c); return bad ? "Say what the snag is and the action needed: " + bad[0] : ""; } };
      }
      case "talk": {
        const talks = (IC.S.manifest && IC.S.manifest.toolboxTalks) || [], cur = val || IC.LS.get("talkPrefill", null) || {};
        IC.LS.del("talkPrefill");
        el.innerHTML = label + (cur.title && !cur.other ? '<div class="talk-chosen"><b>' + esc(cur.title) + '</b><button type="button" class="link" data-change>Change</button></div>' : "") +
          '<div class="talk-pick"' + (cur.title && !cur.other ? " hidden" : "") + ">" + (talks.length ? '<input type="search" class="talk-q" placeholder="Search talks">' + '<div class="talks">' + talks.map((t, i) =>
          '<label class="talk-row"><input type="radio" name="talk-' + f.id + '" value="' + i + '"' + (cur.title === t.title ? " checked" : "") + "><span>" + esc(t.title) + "</span>" +
          "</label>").join("") + "</div>" : '<div class="small">No talks from the office yet.</div>') +
          '<label class="talk-row"><input type="radio" name="talk-' + f.id + '" value="other"' + (cur.other ? " checked" : "") + '><span>Other topic</span></label><input type="text" class="talk-other" placeholder="Topic" value="' + esc(cur.other ? cur.title : "") + '"' + (cur.other ? "" : " hidden") + "></div>";
        const other = el.querySelector(".talk-other"), q = el.querySelector(".talk-q"), ch = el.querySelector("[data-change]");
        if (ch) ch.onclick = () => { el.querySelector(".talk-chosen").remove(); el.querySelector(".talk-pick").hidden = false; };
        el.querySelectorAll('input[type="radio"]').forEach((r) => (r.onchange = () => { other.hidden = r.value !== "other" || !r.checked; }));
        if (q) q.oninput = () => { const t = q.value.toLowerCase(); el.querySelectorAll(".talks .talk-row").forEach((row) => (row.hidden = !row.textContent.toLowerCase().includes(t))); };
        const get = () => { const r = el.querySelector('input[type="radio"]:checked'); if (!r) return null; if (r.value === "other") return other.value.trim() ? { title: other.value.trim(), other: true } : null; const t = talks[+r.value]; return { title: t.title, path: t.path || "" }; };
        return { el, get, check: () => (f.required && !get() ? "Pick the talk (or Other topic and type it)" : "") };
      }
      case "confirm": {
        el.innerHTML = '<label class="confirm"><input type="checkbox"' + (val ? " checked" : "") + "><span>" + esc(f.text) + "</span></label>";
        const c = el.querySelector("input"); return { el, get: () => c.checked, check: () => (f.required && !c.checked ? "Tick to confirm the statement" : "") };
      }
      case "signature": {
        const pad = signaturePad(f.label + (f.required ? " *" : "")); let existing = val || null;
        el.appendChild(pad.el);
        if (existing) Data.blobUrl(existing).then((u) => { if (u) { pad.el.insertAdjacentHTML("beforeend", '<div class="small">Signed. Sign again to replace.</div>'); } });
        return { el, get: async () => (pad.isEmpty() ? existing : await Data.putBlob(await pad.toBlob())), check: () => (f.required && pad.isEmpty() && !existing ? (f.label || "Signature") + " is needed" : "") };
      }
      case "photos": {
        let ids = (val || []).slice();
        el.innerHTML = label + '<div class="thumbs"></div><label class="btn"><input type="file" accept="image/*" capture="environment" multiple hidden>Add photo</label>';
        const th = el.querySelector(".thumbs");
        const draw = async () => { th.innerHTML = await photoStrip(ids); th.querySelectorAll("img").forEach((img, i) => (img.onclick = async () => { if (await IC.ask("Remove this photo?", "Remove")) { ids.splice(i, 1); draw(); } })); };
        el.querySelector("input").onchange = async (e) => { for (const file of e.target.files) ids.push(await Data.putPhoto(file, ctx.job)); e.target.value = ""; draw(); };
        draw();
        return { el, get: () => ids, check: () => need(ids.length) };
      }
      case "people": {
        const people = []; // { name, pad, sig }
        el.innerHTML = label + '<div class="ppl"></div><button type="button" class="btn" data-add>Add person</button>';
        const box = el.querySelector(".ppl");
        const add = (p) => {
          const row = document.createElement("div"); row.className = "ppl-row";
          row.innerHTML = '<div class="row"><input type="text" placeholder="Name" value="' + esc(p ? p.name : "") + '"><button type="button" class="link">Remove</button></div>';
          const pad = signaturePad("Signature"); row.appendChild(pad.el); box.appendChild(row);
          const rec = { row, pad, sig: p ? p.sig : null, inp: row.querySelector("input") }; people.push(rec);
          row.querySelector(".link").onclick = () => { row.remove(); people.splice(people.indexOf(rec), 1); };
        };
        (val || []).forEach(add); if (!val || !val.length) add();
        el.querySelector("[data-add]").onclick = () => add();
        return { el,
          get: async () => { const out = []; for (const p of people) { const name = p.inp.value.trim(); if (!name) continue; out.push({ name, sig: p.pad.isEmpty() ? p.sig : await Data.putBlob(await p.pad.toBlob()) }); } return out; },
          check: () => { const named = people.filter((p) => p.inp.value.trim()); if (f.required && !named.length) return "Add at least one attendee"; const unsigned = named.find((p) => p.pad.isEmpty() && !p.sig); return unsigned ? unsigned.inp.value.trim() + " hasn't signed" : ""; } };
      }
      case "rows": {
        const rows = (val || []).slice(); if (!rows.length) rows.push({});
        el.innerHTML = label + '<div class="rows"></div><button type="button" class="btn" data-add>Add row</button>';
        const box = el.querySelector(".rows");
        const cell = (c, v, i) => {
          if (c.type === "select") return '<select data-c="' + c.id + '"><option value="">' + esc(c.label) + "…</option>" + c.options.map((o) => "<option" + (o === v ? " selected" : "") + ">" + esc(o) + "</option>").join("") + "</select>";
          if (c.type === "yesno") return '<div class="cell-yn"><span class="small">' + esc(c.label) + "</span>" + seg(c.id, ["Yes", "No"], v, c.badAnswer) + "</div>";
          return '<input data-c="' + c.id + '" type="' + (c.type === "number" ? "number" : c.type === "date" ? "date" : "text") + '" placeholder="' + esc(c.label) + '" value="' + esc(v || "") + '"' + (c.type === "number" ? ' inputmode="decimal" step="any"' : "") + ">";
        };
        const draw = () => {
          box.innerHTML = rows.map((r, i) => '<div class="rw" data-i="' + i + '"><div class="rw-n">' + (i + 1) + '</div><div class="rw-c">' + f.columns.map((c) => cell(c, r[c.id], i)).join("") + '</div><button type="button" class="link" data-del="' + i + '">✕</button></div>').join("");
          box.querySelectorAll(".rw").forEach((rw) => bindSeg(rw, "No"));
          box.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => { collect(); rows.splice(+b.dataset.del, 1); if (!rows.length) rows.push({}); draw(); }));
        };
        const collect = () => box.querySelectorAll(".rw").forEach((rw) => {
          const r = rows[+rw.dataset.i] = {};
          rw.querySelectorAll("[data-c]").forEach((x) => (r[x.dataset.c] = x.value.trim()));
          rw.querySelectorAll(".seg").forEach((s) => (r[s.dataset.seg] = s.dataset.value || ""));
        });
        el.querySelector("[data-add]").onclick = () => { collect(); rows.push({}); draw(); };
        draw();
        const get = () => { collect(); return rows.filter((r) => Object.values(r).some(Boolean)); };
        return { el, get, check: () => (f.required && !get().length ? "Add at least one row to " + f.label : "") };
      }
      case "tolerance": {
        const list = f.only ? CHECKS.filter((c) => f.only.includes(c.id)) : CHECKS;
        const rows = (val || []).slice(); if (!rows.length) rows.push({ check: list.length === 1 ? list[0].id : "" });
        el.innerHTML = label + '<div class="small">Enter the measured deviation in mm (+ or −). The NSSS limit and result are worked out for you.</div><div class="tol"></div><button type="button" class="btn" data-add>Add measurement</button>';
        const box = el.querySelector(".tol");
        const draw = () => {
          box.innerHTML = rows.map((r, i) => { const c = CHECKS.find((x) => x.id === r.check); const j = judge(r);
            return '<div class="tl" data-i="' + i + '"><div class="row"><input data-k="loc" placeholder="Grid / member" value="' + esc(r.loc || "") + '"><button type="button" class="link" data-del="' + i + '">✕</button></div>' +
              '<select data-k="check"><option value="">What are you checking?</option>' + list.map((x) => '<option value="' + x.id + '"' + (x.id === r.check ? " selected" : "") + ">" + esc(x.label) + "</option>").join("") + "</select>" +
              '<div class="row">' + (c && c.needs ? '<input data-k="dim" type="number" inputmode="decimal" step="any" placeholder="' + c.needs + ' (m)" value="' + esc(r.dim || "") + '">' : "") +
              '<input data-k="dev" type="number" inputmode="decimal" step="any" placeholder="Deviation (mm)" value="' + esc(r.dev || "") + '"></div>' +
              '<div class="tl-res ' + (j.ok === true ? "ok" : j.ok === false ? "bad" : "") + '">' + (j.text ? "Permitted " + esc(j.text) + (j.ok === true ? " · Within tolerance" : j.ok === false ? " · OUT OF TOLERANCE" : "") : "") + "</div></div>";
          }).join("");
          box.querySelectorAll("[data-k]").forEach((x) => (x.oninput = x.onchange = () => { collect(); if (x.dataset.k === "check") draw(); else { const i = +x.closest(".tl").dataset.i, j = judge(rows[i]); const res = x.closest(".tl").querySelector(".tl-res"); res.className = "tl-res " + (j.ok === true ? "ok" : j.ok === false ? "bad" : ""); res.textContent = j.text ? "Permitted " + j.text + (j.ok === true ? " · Within tolerance" : j.ok === false ? " · OUT OF TOLERANCE" : "") : ""; } }));
          box.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => { collect(); rows.splice(+b.dataset.del, 1); if (!rows.length) rows.push({}); draw(); }));
        };
        const collect = () => box.querySelectorAll(".tl").forEach((t) => { const r = rows[+t.dataset.i]; t.querySelectorAll("[data-k]").forEach((x) => (r[x.dataset.k] = x.value.trim())); });
        el.querySelector("[data-add]").onclick = () => { collect(); const prev = rows[rows.length - 1] || {}; rows.push({ check: prev.check, dim: prev.dim }); draw(); };
        draw();
        const get = () => { collect(); return rows.filter((r) => r.check && r.dev !== "" && r.dev != null).map((r) => Object.assign({}, r, { permitted: judge(r).text, ok: judge(r).ok })); };
        return { el, get, check: () => (f.required && !get().length ? "Add at least one measurement" : "") };
      }
    }
    el.textContent = "Unknown field " + f.type; return { el, get: () => undefined, check: () => "" };
  }

  // ---------------------------------------------------------------- screens
  // Forms that live on the QA page (Liam, 20 Nov: no doubling up between QA and Forms). People without QA (operatives)
  // still raise an NCR from Forms.
  const QA_FORMS = ["handover", "audit", "works", "supcomp", "ncr", "completion"];

  async function viewList() {
    setBar("Forms", IC.can("qa") ? "Safety and day work" : "Safety and reporting", false);
    const mine = (await Data.list("forms")).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    const drafts = mine.filter((f) => f.status === "draft"), done = mine.filter((f) => f.status !== "draft").slice(0, 15);
    const allowedT = T.filter((t) => t.id !== "rams" && !t.retired && IC.can("form:" + t.id) && !(IC.can("qa") && QA_FORMS.includes(t.id)));
    const group = (g) => !allowedT.some((t) => t.group === g) ? "" : '<div class="section-h">' + g + "</div>" + allowedT.filter((t) => t.group === g).map((t) =>
      '<a class="tile-row" href="' + (t.id === "toolbox" ? "#/toolbox" : t.id === "plant" ? "#/plant" : "#/form-new/" + t.id) + '"><span class="ti ' + g.toLowerCase() + '">' + (g === "Safety" ? IC.ICON.hs : IC.ICON.check) + '</span><span><b>' + esc(t.title) + '</b><span class="small">' + esc(t.ref) + "</span></span></a>").join("");
    const row = (f) => { const t = tpl(f.templateId) || { title: f.templateId };
      return '<a class="tile-row" href="#/form/' + f.id + '"><span class="ti">' + IC.ICON.file + "</span><span><b>" + esc(t.title) + '</b><span class="small">' + esc((f.jobNumber || "No job") + " · " + fmtDay(f.updatedAt) + " " + fmtTime(f.updatedAt)) + "</span></span>" +
        (f.status === "draft" ? '<span class="pill warn">Draft</span>' : f.flags && f.flags.length ? '<span class="pill new">Issue</span>' : '<span class="pill ok">Sent</span>') + "</a>"; };
    $("main").innerHTML = (drafts.length ? '<div class="section-h">Drafts</div>' + drafts.map(row).join("") : "") + group("Safety") + group("Quality").replace('<div class="section-h">Quality</div>', '<div class="section-h">' + (IC.can("qa") ? "Day work" : "Quality") + "</div>") +
      (done.length ? '<div class="section-h">Recently completed</div>' + done.map(row).join("") : "");
  }
  IC.route("forms", viewList);

  async function viewForm(templateId, existing, prefillJob) {
    const t = tpl(templateId); if (!t) { location.hash = "#/forms"; return; }
    const rec = existing || { templateId, status: "draft", values: {} };
    const prefill = existing ? {} : IC.LS.get(templateId + "Prefill", null) || {};
    if (!existing) IC.LS.del(templateId + "Prefill");
    let folder = rec.jobFolder || prefillJob || IC.LS.get("lastJob", "") || "";
    if (!jobByFolder(folder)) folder = (IC.viewableJobs()[0] || {}).folder || "";
    setBar(t.title, t.ref, true);
    $("main").innerHTML = '<form class="frm" novalidate><label class="fl">Job<select id="fJob">' + jobOptions(folder, t.id !== "rams") + '</select></label><div class="small" id="fWhen">' + esc(fmtDay(rec.createdAt || new Date()) + " · " + ((Data.profile && Data.profile.name) || "")) + '</div><div id="fFields"></div>' +
      '<div class="err" id="fErr" hidden></div><div class="row sticky-actions"><button type="button" class="btn" id="fDraft">Save draft</button><button type="submit" class="btn primary" id="fSend">Submit</button></div></form>';
    let widgets = [];
    const build = () => {
      const job = jobByFolder($("fJob").value);
      const box = $("fFields"); box.innerHTML = ""; widgets = [];
      for (const f of t.fields) { const w = field(f, rec.values[f.id], { job, values: rec.values, prefill }); w.f = f; widgets.push(w); box.appendChild(w.el); }
    };
    build();
    $("fJob").onchange = () => { if (t.id === "rams") build(); };
    const collect = async () => { const v = {}; for (const w of widgets) if (w.f.id) { v[w.f.id] = await w.get(); if (w.extra) Object.assign(v, await w.extra()); } return v; };
    const save = async (status) => {
      const job = jobByFolder($("fJob").value);
      rec.values = await collect(); rec.status = status; rec.jobFolder = job ? job.folder : ""; rec.jobNumber = job ? job.jobNumber : ""; rec.site = job ? job.site || job.customer : "";
      rec.templateTitle = t.title; rec.ref = t.ref;
      if (t.id === "rams" && job) {
        rec.docsKey = hsKey(job);
        // record exactly which documents (and which issue) were signed for
        rec.values.docs = (job.files || []).filter((x) => x.category === "H&S").map((x) => ({ name: x.name, issued: x.issued, issuedBy: x.issuedBy || "" }));
      }
      rec.flags = flagsFor(t, rec.values);
      if (status === "submitted") rec.submittedAt = new Date().toISOString();
      return Data.save("forms", rec);
    };
    $("fDraft").onclick = async () => { await save("draft"); toast("Draft saved on this phone"); location.hash = "#/forms"; };
    document.querySelector(".frm").onsubmit = async (e) => {
      e.preventDefault();
      const valueOf = (id) => { const w = widgets.find((x) => x.f.id === id); return w ? w.el.querySelector("select,input,textarea") && w.el.querySelector("select,input,textarea").value : ""; };
      const errs = widgets.map((w) => {
        if (w.f.requiredIf) { const want = valueOf(w.f.requiredIf[0]) === w.f.requiredIf[1]; w.f.required = want; if (!want) return ""; }
        return w.check();
      }).filter(Boolean);
      if (!$("fJob").value && t.id === "rams") errs.unshift("Choose the job");
      const box = $("fErr");
      if (errs.length) { box.hidden = false; box.innerHTML = "<b>Please finish:</b><br>" + errs.map(esc).join("<br>"); box.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      box.hidden = true; $("fSend").disabled = true;
      const saved = await save("submitted");
      toast(t.title + " submitted");
      if (t.id === "plant" && saved.values && saved.values.plantRef) { IC.toast("Check saved on the weekly sheet"); location.hash = "#/plant/" + encodeURIComponent(saved.jobFolder || "") + "/" + encodeURIComponent(saved.values.plantKey || saved.values.plantRef); return; }
      if (t.id === "works" || t.id === "supcomp") { await IC.QA.afterInspection(saved); location.hash = "#/form/" + saved.id; return; }
      const out = (saved.flags || []).filter((x) => x.ncr);
      if (out.length && t.id !== "ncr") {
        const sh = sheet("<h3>" + out.length + " item(s) out of tolerance</h3><p>NSSS 9.4: the Engineer must be told about deviations greater than permitted. Raise a non-conformance report now?</p>" +
          '<button class="btn primary block" id="ncrGo">Raise NCR</button><button class="btn block" id="ncrNo">Not now</button>');
        $("ncrGo").onclick = () => { sh.close(); IC.LS.set("ncrPrefill", { jobFolder: saved.jobFolder, what: out.map((x) => x.text).join("\n"), where: out.map((x) => x.where).filter(Boolean).join(", "), clause: out.map((x) => x.clause).filter(Boolean).join(", ") }); location.hash = "#/form-new/ncr"; };
        $("ncrNo").onclick = () => { sh.close(); history.back(); };
        return;
      }
      history.back();
    };
  }

  // Things the office should look at: failed checks, out-of-tolerance readings, "not safe" answers.
  function flagsFor(t, v) {
    const out = [];
    for (const f of t.fields) {
      const val = v[f.id];
      if (f.type === "yesno" && f.badAnswer && val === f.badAnswer) out.push({ text: f.label + ": " + val + (v[f.id + "Action"] ? " (action: " + v[f.id + "Action"] + ")" : "") });
      if (f.type === "checklist" && val) Object.entries(val).forEach(([k, a]) => { const act = (v[f.id + "Actions"] || {})[k]; if (a === f.badAnswer) out.push({ text: k + ": " + a + (act ? " (action: " + act + ")" : "") }); });
      if (f.type === "rows" && val) f.columns.filter((c) => c.badAnswer).forEach((c) => val.forEach((r) => { if (r[c.id] === c.badAnswer) out.push({ text: (r[f.columns[0].id] || "Row") + " – " + c.label + ": " + r[c.id] }); }));
      if (f.type === "inspect" && val) Object.entries(val).forEach(([k, r]) => { if (r.a === "N" && !r.d) out.push({ snag: true, text: "Snag – " + k + ": " + r.c }); });
      if (f.type === "tolerance" && val) val.filter((r) => r.ok === false).forEach((r) => { const c = CHECKS.find((x) => x.id === r.check); out.push({ ncr: true, where: r.loc, clause: "NSSS " + r.check, text: (r.loc ? r.loc + ": " : "") + (c ? c.label : r.check) + " measured " + r.dev + " mm, permitted " + r.permitted }); });
    }
    return out;
  }

  async function viewDone(id) {
    const rec = await Data.get("forms", id); if (!rec) { location.hash = "#/forms"; return; }
    if (rec.status === "draft") { viewForm(rec.templateId, rec); return; }
    const t = tpl(rec.templateId) || { title: rec.templateTitle, fields: [] };
    setBar(t.title, (rec.jobNumber || "") + " · " + fmtDate(rec.submittedAt || rec.updatedAt), true);
    const parts = [];
    if (rec.templateId === "rams" && rec.values.docs && rec.values.docs.length) {
      parts.push('<div class="done-f"><div class="ff-l">Documents signed for</div>' + rec.values.docs.map((d) => "<div>" + esc(d.name) + ' <span class="small">issued ' + esc(fmtDate(d.issued)) + "</span></div>").join("") + "</div>");
    }
    for (const f of t.fields) {
      const v = rec.values[f.id]; if (!f.id || v == null || v === "" || (Array.isArray(v) && !v.length)) continue;
      let body = "";
      if (f.type === "signature") { const u = await Data.blobUrl(v); body = u ? '<img class="sig-img" src="' + u + '" alt="signature">' : "Signed"; }
      else if (f.type === "photos") body = '<div class="thumbs">' + (await photoStrip(v)) + "</div>";
      else if (f.type === "confirm") body = v ? "✓ " + esc(f.text) : "Not confirmed";
      else if (f.type === "checklist") { const acts = rec.values[f.id + "Actions"] || {}; body = Object.entries(v).map(([k, a]) => '<div class="cl-done ' + (a === f.badAnswer ? "bad" : "") + '"><span>' + esc(k) + (acts[k] ? '<span class="small act-done">Action: ' + esc(acts[k]) + "</span>" : "") + "</span><b>" + esc(a) + "</b></div>").join(""); }
      else if (f.type === "yesno") body = esc(v) + (rec.values[f.id + "Action"] ? '<div class="small act-done">Action: ' + esc(rec.values[f.id + "Action"]) + "</div>" : "");
      else if (f.type === "date") body = esc(fmtDay(IC.parseDate(v)))
      else if (f.type === "talk") body = esc(v.title) + (v.other ? ' <span class="small">(other topic)</span>' : "");
      else if (f.type === "people") body = (await Promise.all(v.map(async (p) => { const u = p.sig ? await Data.blobUrl(p.sig) : ""; return '<div class="ppl-done">' + esc(p.name) + (u ? '<img class="sig-img sm" src="' + u + '">' : "") + "</div>"; }))).join("");
      else if (f.type === "rows") body = '<table class="tbl"><tr>' + f.columns.map((c) => "<th>" + esc(c.label) + "</th>").join("") + "</tr>" + v.map((r) => "<tr>" + f.columns.map((c) => '<td class="' + (c.badAnswer && r[c.id] === c.badAnswer ? "bad" : "") + '">' + esc(r[c.id] || "") + "</td>").join("") + "</tr>").join("") + "</table>";
      else if (f.type === "inspect") {
        const snags = await Data.list("snags", "team");
        body = '<table class="tbl"><tr><th>Area inspected</th><th>Accept</th><th>Comments / snags / defects</th><th>Cleared</th></tr>';
        for (const it0 of f.items) {
          const it = typeof it0 === "string" ? it0 : it0.t, r = v[it] || {}, sn = r.snagId ? snags.find((x) => x.id === r.snagId) : null;
          const cleared = r.d ? fmtDate(r.d) : sn && sn.status === "closed" ? fmtDate(sn.closeOut.closedAt) : r.a === "N" ? "Open" : "";
          body += '<tr class="' + (r.a === "N" && cleared === "Open" ? "bad" : "") + '"><td>' + esc(it) + "</td><td>" + esc(r.a || "") + "</td><td>" + (r.x ? '<span class="small">' + esc((it0.x || {}).label || "") + ": " + esc(r.x) + "</span> " : "") + esc(r.c || "") +
            ((r.p || []).length ? '<div class="thumbs sm">' + (await photoStrip(r.p)) + "</div>" : "") + "</td><td>" + esc(cleared) + "</td></tr>";
        }
        body += "</table>";
      }
      else if (f.type === "tolerance") body = '<table class="tbl"><tr><th>Location</th><th>Check</th><th>Δ mm</th><th>Permitted</th></tr>' + v.map((r) => '<tr class="' + (r.ok === false ? "bad" : "") + '"><td>' + esc(r.loc || "") + "</td><td>" + esc(r.check) + (r.dim ? " (" + esc(r.dim) + " m)" : "") + "</td><td>" + esc(r.dev) + "</td><td>" + esc(r.permitted) + (r.ok === false ? " ✕" : " ✓") + "</td></tr>").join("") + "</table>";
      else body = esc(v).replace(/\n/g, "<br>");
      parts.push('<div class="done-f"><div class="ff-l">' + esc(f.label || "") + "</div>" + body + "</div>");
    }
    let extra = "";
    if (rec.templateId === "works") {
      if (rec.values.clientMode && rec.values.clientMode.indexOf("Left with client") === 0) {
        const d = new Date(rec.submittedAt || rec.updatedAt); d.setDate(d.getDate() + 5);
        extra += '<div class="note"><b>Left with client.</b> Acceptance is deemed granted on ' + esc(fmtDate(d)) + " unless the sheet is returned before then.</div>";
      }
      extra += await IC.QA.inspectionStatusHtml(rec);
    }
    $("main").innerHTML = extra + (rec.flags && rec.flags.length ? '<div class="warnbox"><b>Flagged for the office</b><br>' + rec.flags.map((x) => esc(x.text)).join("<br>") + "</div>" : "") +
      '<div class="small">' + esc((rec.userName || "") + " · submitted " + fmtDay(rec.submittedAt || rec.updatedAt) + " " + fmtTime(rec.submittedAt || rec.updatedAt)) + "</div>" + parts.join("") +
      (rec.history && rec.history.length ? '<div class="small">' + rec.history.map((h) => esc(fmtDay(h.at) + " · " + (h.by || "") + " · " + h.note)).join("<br>") + "</div>" : "");
    // email / share the completed form as a PDF (Liam, 20 Nov)
    $("main").insertAdjacentHTML("beforeend", '<button class="btn block" id="fShare" style="margin-top:12px">Email or share as PDF</button>');
    $("fShare").onclick = async () => { const b = $("fShare"); b.disabled = true; b.textContent = "Making the PDF…"; try { await IC.FormPdf.share(rec); } catch (e) { console.error(e); toast("Couldn't make the PDF"); } b.disabled = false; b.textContent = "Email or share as PDF"; };
    IC.QA.bindStatus(rec);
  }

  // Plant (Liam, 20 Nov): each job has a Plant section listing the plant hired to it in iCONSTRUCTE; tap the machine
  // you're operating and do the day's pre-use check. Checks gather into one weekly sheet per machine (Mon–Sun) that
  // anyone on the site can add to (a Genie Z45 may be checked by five operators in a week). Each daily check is its own
  // record, so two phones never overwrite each other. A machine that isn't on a hire in iCONSTRUCTE can still be checked
  // by typing its reference ("Other machine").
  const monOf = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const normRef = (r) => String(r || "").trim().toUpperCase().replace(/\s+/g, " ");
  const keyOf = (c) => c.values.plantKey || "REF:" + normRef(c.values.plantRef);
  // the day a check counts for: the date of check (can be set back up to 7 days), else when it was submitted
  const checkDay = (c) => (c.values.checkDate ? IC.parseDate(c.values.checkDate) : new Date(c.submittedAt || c.updatedAt));
  const lateEntry = (c) => c.values.checkDate && c.submittedAt && c.values.checkDate !== isoDate(new Date(c.submittedAt));
  IC.plantCheckDay = checkDay;
  async function plantChecks(folder) { return (await Data.list("forms", "team")).filter((f) => f.templateId === "plant" && f.status !== "draft" && f.jobFolder === folder && f.values && (f.values.plantKey || f.values.plantRef)); }
  // machines on a job: its hired plant, plus any other machine checked there in the last 4 weeks
  async function machinesFor(folder) {
    const j = jobByFolder(folder), list = ((j && j.plant) || []).map((p) => ({ key: p.id, title: p.model || p.description || "Plant " + p.no, sub: [p.type, p.ref ? "ref " + p.ref : "", p.attachments, p.supplier, p.offHire ? "off hire " + fmtDate(p.offHire) : ""].filter(Boolean).join(" · "), hired: p }));
    const since = addD(monOf(new Date()), -28), checks = await plantChecks(folder);
    checks.forEach((c) => { const k = keyOf(c); if (!list.some((m) => m.key === k) && checkDay(c) >= since) list.push({ key: k, title: c.values.plantRef, sub: [c.values.plantType, c.values.plantId].filter(Boolean).join(" · ") }); });
    return { j, list, checks };
  }
  async function plantFolder(args) {
    let folder = args[0] ? decodeURIComponent(args[0]) : "";
    if (!folder) { const today = isoDate(new Date()), a = IC.myWeek().find((x) => x.date === today && !x.off && x.folder); folder = (a && a.folder) || IC.LS.get("lastJob", "") || ((IC.viewableJobs()[0] || {}).folder || ""); }
    return folder;
  }
  IC.route("plant", async (args) => {
    const folder = await plantFolder(args);
    if (args[1]) return plantSheet(folder, decodeURIComponent(args[1]), args[2] ? +args[2] : 0);
    const { j, list, checks } = await machinesFor(folder);
    setBar("Plant", j ? j.jobNumber + " · " + (j.site || "") : "", true);
    const mon = monOf(new Date()), days = Array.from({ length: 7 }, (_, i) => addD(mon, i));
    const dot = (k, d) => { const day = checks.filter((c) => keyOf(c) === k && IC.sameDay(checkDay(c), d)); return '<span class="pd ' + (!day.length ? "" : day.some((c) => c.values.safe === "No" || (c.flags || []).length) ? "bad" : "ok") + '">' + d.toLocaleDateString("en-GB", { weekday: "narrow" }) + "</span>"; };
    $("main").innerHTML = (IC.viewableJobs().length > 1 ? '<label class="fl">Job<select id="pJob">' + jobOptions(folder, false) + "</select></label>" : "") +
      (list.length ? list.map((m) => '<a class="tile-row" href="#/plant/' + encodeURIComponent(folder) + "/" + encodeURIComponent(m.key) + '"><span class="ti safety">' + IC.ICON.hs + "</span><span><b>" + esc(m.title) + '</b><span class="small">' + esc(m.sub) + '</span><span class="pdots">' + days.map((d) => dot(m.key, d)).join("") + "</span></span>›</a>").join("") : '<div class="empty small">No plant on hire to this job.</div>') +
      '<button class="btn block" id="pAdd" style="margin-top:10px">Other machine</button>';
    if ($("pJob")) $("pJob").onchange = (e) => (location.hash = "#/plant/" + encodeURIComponent(e.target.value));
    $("pAdd").onclick = () => {
      const sh = sheet('<h3>Which machine?</h3><label class="fl">Machine reference (on the machine)<input type="text" id="pRef" placeholder="e.g. GZ45-0123" autocomplete="off"></label><button class="btn primary block" data-go>Next</button><button class="btn block" data-x>Cancel</button>');
      const go = () => { const ref = sh.q("#pRef").value.trim(); if (!ref) return; sh.close(); location.hash = "#/plant/" + encodeURIComponent(folder) + "/" + encodeURIComponent("REF:" + normRef(ref)); };
      sh.q("[data-go]").onclick = go; sh.q("#pRef").onkeydown = (e) => { if (e.key === "Enter") go(); }; sh.q("[data-x]").onclick = sh.close; sh.q("#pRef").focus();
    };
  });
  async function plantSheet(folder, key, weekOff) {
    const { j, list, checks } = await machinesFor(folder), m = list.find((x) => x.key === key) || { key, title: key.replace(/^REF:/, ""), sub: "" };
    const mon = addD(monOf(new Date()), weekOff * 7), days = Array.from({ length: 7 }, (_, i) => addD(mon, i));
    const all = checks.filter((c) => keyOf(c) === key).sort((a, b) => checkDay(b) - checkDay(a) || (b.submittedAt || "").localeCompare(a.submittedAt || "")), latest = all[0];
    setBar(m.title, [latest && latest.values.plantRef !== m.title ? latest.values.plantRef : "", j ? j.jobNumber : ""].filter(Boolean).join(" · "), true);
    const week = all.filter((c) => { const d = checkDay(c); return d >= mon && d < addD(mon, 7); });
    const doneToday = week.some((c) => IC.sameDay(checkDay(c), new Date()));
    const today0 = IC.parseDate(isoDate(new Date())), oldest = addD(today0, -7);
    const base = "#/plant/" + encodeURIComponent(folder) + "/" + encodeURIComponent(key) + "/";
    $("main").innerHTML = (m.sub ? '<div class="small" style="margin-bottom:8px">' + esc(m.sub) + "</div>" : "") +
      '<div class="row nav-week"><a class="btn" href="' + base + (weekOff - 1) + '">‹ Previous</a>' + (weekOff < 0 ? '<a class="btn" href="' + base + (weekOff + 1) + '">Next ›</a>' : "") + "</div>" +
      '<div class="section-h">Week of ' + esc(fmtDay(mon)) + "</div>" +
      days.map((d) => { const dc = week.filter((c) => IC.sameDay(checkDay(c), d)), canLate = d < today0 && d >= oldest;
        return '<div class="pday"><b>' + esc(fmtDay(d)) + "</b>" + (dc.length ? dc.map((c) => { const bad = c.values.safe === "No" || (c.flags || []).length;
          return '<a class="tile-row" href="#/form/' + c.id + '"><span><b>' + esc(c.values.operator || c.userName || "") + '</b><span class="small">' + esc([lateEntry(c) ? "" : fmtTime(c.submittedAt || c.updatedAt), c.values.hours ? c.values.hours + " hrs" : ""].filter(Boolean).join(" · ")) + "</span></span>" + (bad ? '<span class="pill declined">Defect</span>' : '<span class="pill ok">OK</span>') + "</a>"; }).join("") : '<div class="small">Not checked' + (canLate ? ' · <a href="#" data-late="' + isoDate(d) + '">Record a check for this day</a>' : "") + "</div>") + "</div>"; }).join("") +
      (weekOff === 0 ? '<button class="btn primary block" id="pCheck">' + (doneToday ? "Add another check today" : "Check this machine today") + "</button>" : "");
    const startCheck = (date) => {
      const hired = m.hired || {}, d = (hired.description || "") + " " + (hired.model || "");
      // iCONSTRUCTE records "Cherry picker" / "Scissor lift" only: diesel or electric is picked here on the first check and remembered for the week.
      const typeGuess = hired.type && PLANT_TYPES.includes(hired.type) ? hired.type : /mini ?crane|spider crane|maeda|jekko|unic/i.test(d) ? "Mini crane" : /superlift/i.test(d) ? "Genie SuperLift" : /telehandler|manitou|jcb 5/i.test(d) ? "Telehandler" : null;
      IC.LS.set("plantPrefill", { plantKey: key.indexOf("REF:") === 0 ? "" : key, plantRef: latest ? latest.values.plantRef : hired.ref || (key.indexOf("REF:") === 0 ? key.slice(4) : ""), plantType: latest ? latest.values.plantType : typeGuess, plantId: latest ? latest.values.plantId : hired.model || hired.description || "", checkDate: date || isoDate(new Date()) });
      location.hash = "#/form-new/plant/" + encodeURIComponent(folder);
    };
    if ($("pCheck")) $("pCheck").onclick = () => startCheck();
    $("main").querySelectorAll("[data-late]").forEach((a) => (a.onclick = (e) => { e.preventDefault(); startCheck(a.dataset.late); }));
  }

  // Toolbox talks (Liam, 20 Nov): the talks the office has published, to read and deliver; then the register that each
  // operative signs (supervisors and managers run it on their phone or tablet).
  IC.route("toolbox", (args) => {
    const folder = args[0] ? decodeURIComponent(args[0]) : "", talks = (IC.S.manifest && IC.S.manifest.toolboxTalks) || [];
    setBar("Toolbox talks", talks.length + " available", true);
    $("main").innerHTML = '<input type="search" class="talk-q" id="tq" placeholder="Search talks">' +
      (talks.length ? talks.map((t, i) => '<div class="tile-row talk-item"><span class="ti safety">' + IC.ICON.hs + '</span><span><b>' + esc(t.title) + "</b>" + (t.issued ? '<span class="small">Updated ' + esc(fmtDate(t.issued)) + "</span>" : "") + "</span>" +
        (t.path ? '<a class="btn sm" href="#/view/_toolbox/' + encodeURIComponent(t.path) + '">Read</a>' : "") + '<button class="btn sm primary" data-use="' + i + '">Deliver</button></div>').join("")
        : '<div class="empty small">No toolbox talks from the office yet.</div>') +
      '<div class="section-h">Something else</div><button class="btn block" data-use="other">Another topic</button>';
    $("tq").oninput = (e) => { const q = e.target.value.toLowerCase(); document.querySelectorAll(".talk-item").forEach((r) => (r.hidden = !r.textContent.toLowerCase().includes(q))); };
    document.querySelectorAll("[data-use]").forEach((b) => (b.onclick = () => {
      const t = talks[+b.dataset.use];
      IC.LS.set("talkPrefill", b.dataset.use === "other" ? { other: true, title: "" } : { title: t.title, path: t.path || "" });
      location.hash = "#/form-new/toolbox" + (folder ? "/" + encodeURIComponent(folder) : "");
    }));
  });

  IC.route("form-new", (args) => {
    const id = args[0];
    if ((tpl(id) || {}).retired) { IC.toast("That check is now part of the site inspection / handover in QA"); location.hash = "#/qa" + (args[1] ? "/" + args[1] : ""); return; }
    if (id === "ncr") { const p = IC.LS.get("ncrPrefill", null); IC.LS.del("ncrPrefill"); if (p) return viewForm("ncr", { templateId: "ncr", status: "draft", values: { what: p.what, where: p.where, clause: p.clause }, jobFolder: p.jobFolder }); }
    return viewForm(id, null, args[1] ? decodeURIComponent(args[1]) : "");
  });
  IC.route("form", (args) => viewDone(args[0]));

  IC.Forms = { templates: T, tpl, ramsStatus, hsKey, photoStrip, flagsFor, field, QA_FORMS };
})();
