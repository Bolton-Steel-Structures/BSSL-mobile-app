# iCONSTRUCTE development roadmap

*Bolton Steel Structures / Gripil · started 17 Nov 2026 · keep this as the single list of what's done, what's next and what's parked.*

## How we work (every change, every time)

1. **Ask.** One change request at a time, written in one line in the change log at the bottom.
2. **Build.** The change is made and committed to the source code. No new exe is created yet.
3. **Release when told.** When Liam says "build it", the next version is packaged with release notes listing every change since the last one.
4. **Test on the test copy first.** Use the test database (Desktop\iConstruct Test), never live, and work through the test checklist for that release.
5. **Sign off.** Liam confirms "passed", or lists what failed. Failures go back to step 2.
6. **Go live:**
   - back up the live database first;
   - copy the new exe and config;
   - check that one person can open it;
   - then tell everyone.
7. **Record it.** Update this document: the version, the date, and what went live.
8. **Health check (critique), every 5 changes or before any 1.8.x release, whichever comes first.**
   - An independent review, by a reviewer that hasn't seen the work being built, so the work isn't marking itself.
   - Checks:
     - built correctly (works as asked, NSSS / QFC respected);
     - efficient (no slow screens, no repeated database calls);
     - **no double-ups** (two pieces of code, tables or screens doing the same job).
   - Findings go in the change log as "Health check" lines; fixes go through steps 1–5 like any change.
   - Already noted for the first check:
     - two separate "open an Outlook draft" routines (orders / plant, and Fab Issue) should become one;
     - job folder look-ups repeated across Email Order, Plant Hire, Fab Issue and Site Issue.

**Rules:**
- Nothing changes the live database's structure without a backup and a written note of what changes.
- **A test copy always has its own documents folder** (config `DocStorageLocation`; the install sets it). A copy of the live database otherwise files into the live document folders (B018, 19 Nov).
- Only one version is in test at a time.

---

## Where we are today

*Updated 19 Nov 2026, 17:40.*

| Area | Status |
|---|---|
| **Desktop 1.8: test build 11** (19 Nov 11:25): everything to date, i.e. modern look, Goods In, Email Order / own PDFs (Crystal removed), Fab Issue + register, bolts at every Fab Issue, Actions list (replaces H&S), execution class, standard notes per line type, quote from email, Google Maps site link, Health check 1 fixes, test documents folder (B018) | **In test** on the isolated test bed. Not live. |
| **1.8 test build 14** (20 Nov 17:00): build 13 plus Site Labour planner (W2) with Off row, labour list, WhatsApp instructions, planner editors, Confirm site attendance and wages CSV (W2b, HC3 batch H fixes), Actions urgency, Goods Out board, one date per stop, vehicle type, B023, new supplier categories | **In test** (build 14 sent 20 Nov 17:00). |
| **1.8 test build 13** (19 Nov 19:00): build 12 (delivery notes and Goods Out stages 1–2, Budget prompt, spelling search and spell check, built-in logo, B019 / B020) plus B021 (Goods Out table), B022, Manually Input load, quote site → job card, site address required on new job cards, preferred suppliers ★ and supplier Category column | Replaced by build 14. |
| Quote from email | **Confirmed working** by Liam (19 Nov). |
| Health check | **HC1**: 14 findings, all closed. **HC2** (19 Nov): HC2.1 / 2.2 closed by process; HC2.3 / 2.19 still recommended; batches E–G awaiting go-ahead. |
| Bugs | B001–B018 fixed; B016 confirmed closed; none open (see BUGLOG). |
| Delivery notes and Goods Out (2.6) | **Spec agreed, samples received. Next big build; required before go-live.** |
| Roll-out package (1.4a) | **Specified**; needs the live program folder path. |
| Site app (drawings, check in / out, forms, QA, holidays, expenses, cards) | **Built as a demo**; preview link confirmed working (19 Nov); public trial copy in `BSSL-mobile-app`. Needs SharePoint (Stage 3) and Azure (Stage 4). |
| **Manager tools** (site app) and roles | **Built as a demo**; waiting for Liam's tick-box role schedule and Azure. |
| Staff personal data in Access (2.1 / HC2.18), hard-coded database driver (HC2.12) | **Not started.** |
| QFC process review (QFC01–06) | **Not started**; QFC04 first. See "Process review". |
| Overview and AI handover brief | **Done**: `docs/iCONSTRUCTE-OVERVIEW.md` (project doc `claude/iCONSTRUCTE-OVERVIEW.md`). |
| Delivery calendar weekly spreadsheet (Friday task) | **Paused** (replaced by Goods In). |
| ISO 9001 customer retention tables | **Done** (spreadsheets delivered). |
| Webfleet link, Emergent / rebuild, move off Access | **Discussed only.** |

### Waiting on Liam
- [x] Sample **QA list** and **bolt list** (received 19 Nov; see `docs/QMS-DOCUMENT-REVIEW.md`).
- [x] **Delivery note templates**, finishers and site (received 19 Nov).
- [x] **Health check 1**: go-ahead given 19 Nov for HC1.4 and batches B and C (all before the next build).
- [x] **Print Order**: decided 19 Nov: Print, Save and Email all add the standard notes (as built).
- [x] **QFC review**: QFC04 first (19 Nov).
- [x] **Job folders** (19 Nov): delivery notes in `05 - Delivery Notes`, QA docs in `09 - QA Docs`, all safety docs in `10 - H&S`, Fab Issue sheets in `03 - Assembley Drawings` (in a `Fab Issues` subfolder). No new folders.
- [x] **QMS document fixes (Rev C)**: parked 19 Nov (see "Parked").
- [x] **Approved suppliers**: kept on BSS's own spreadsheet for now; integration later (2.13).
- [ ] **Roles workbook** ("iCONSTRUCTE roles and screens", 20 Nov): ticks for pages per role, who can change what, site app features per role, each person's role / approving manager / deputy / van driver, and the default owner for each action type. This replaces the separate "tick-box role schedule", "who does what" and "van and drivers" questions.
- [ ] **W3 Drawing office**: the current allocation spreadsheet, the stages used, the draughtsmen and subcontract detailers, the usual fabrication lead time.
- [ ] **P7 invoice matching**: payment reference, net or gross and tolerance, part invoices, accounts package, and sample invoice PDFs (one scanned).
- [x] **5.8 3D model**: sample IFC received 19 Nov (test viewer built).
- [ ] **5.8**: an IFC from a numbered, issued model (the sample was preliminary), with Assemblies On, assembly marks, phases set, and the reference slab left out.
- [x] **Health check 3 batch H**: directed 19 Nov (one person confirms; job cards stay open after completion; Other with a note) and done.
- [ ] **Health check 3**: go-ahead on batches I, J and K.
- [ ] **Health check 2**: go-ahead on batches D (drawings on site, recommended before the next build), E, F and G.
- [ ] **Site app infrastructure** (Stages 3–4; Liam, 18 Nov). Set up the accounts below, signed up with **liam@boltonstructures.com** (Liam, 18 Nov). Add a second admin on Microsoft 365 / Azure so access never depends on one login; Gripil is added as a member / contributor. Names follow the GitHub organisation (`Bolton-Steel-Structures`, repo `iconstruct`):
  - **Owner:** `liam@boltonstructures.com` (MFA on). Second admin: another director or a break-glass account `admin@boltonstructures.com`.
  - **Microsoft 365 / Entra:**
    - SharePoint site **Site Drawings** (`/sites/SiteDrawings`), libraries **Documents** and **Site Returns**;
    - security group **Site Operatives**;
    - app registration **iCONSTRUCTE Site**;
    - (later, for the bots) a send-as mailbox `iconstructe-bot@boltonstructures.com`.
  - **Azure** (subscription **BSS iCONSTRUCTE**, region UK South, signed in as liam@boltonstructures.com):
    - resource group `rg-bss-iconstructe-uks`;
    - Static Web App `swa-bss-iconstructe-site` (the app);
    - Function App `func-bss-iconstructe-api` (the API);
    - Azure SQL server `sql-bss-iconstructe` / database `sqldb-iconstructe`;
    - storage account `stbssiconstructe` (photos, competency cards).
  - **Web address:** `site.boltonstructures.com` pointing at the Static Web App (DNS record with whoever hosts the domain).
  - **GitHub:** already done (`github.com/Bolton-Steel-Structures/iconstruct`); the site app gets its own private repo `Bolton-Steel-Structures/iconstruct-site`, deployed to Azure automatically on each push.
  - **Not needed:** Apple / Google developer accounts (the app installs from the browser, no app store).
  - **Later only:** Webfleet API user `bss-iconstructe-api`, under liam@boltonstructures.com (what3words no longer needed: site location is a Google Maps link, 19 Nov).
- [x] **ITP** WM-14-8 master (received 19 Nov).
- [x] **Reference documents**: received 19 Nov: folder screenshot, ISO 9001 / FPC / welding certificates, BS EN 1090-2, Welding Quality Manual (the FPC manual), QP01, QP05, QP06, QP08, POWRA, plant inspection and MEWP forms. Findings in `docs/QMS-DOCUMENT-REVIEW.md` (project doc `claude/QMS-DOCUMENT-REVIEW.md`). **Parked 19 Nov (come back to):** see "Parked" below. Original list:
  - BS EN 1090-1 FPC manual and the QP procedures the QFCs refer to (QP01–QP08);
  - UKCA / BS EN 1090 and BS EN ISO 3834 certificates (**certified to EXC4**, Liam 18 Nov; certificate still useful for scope);
  - **screenshot of the real job folder names** on the server (2.11; needed for HC1.7 and delivery notes);
  - who does what: the 4 PMs, transport / finisher orders, delivery notes, materials buying (P4 default owners);
  - forms: NCR, goods-in / traceability record, inspection and test plan, current site forms (MEWP check, bolt torque, line/level/plumb, permits), approved supplier list;
  - standards: BS EN 1090-2:2018 (Sections 5 and 12 most useful), BCSA Model Specification for structural bolting / holding-down bolts;
  - live `iCONSTRUCTE.exe.config` (0.4), van registration and drivers.

**Source code** is backed up privately on GitHub (Bolton-Steel-Structures/iconstruct) and every change is pushed there. The live database backup (0.3) isn't needed until go-live, which is a while off; it's a condition of step 1.4.

---

## Stage 0: Make it safe (do first)

- [x] **0.1** *(Done 18 Nov 2026: github.com/Bolton-Steel-Structures/iconstruct, private, full history.)* Put the source code in a **private Gripil GitHub repository**. Liam creates the empty repository; Claude pushes the code and history. *Done when: the repository shows all the commits.*
- [x] **0.2** *(Done, Liam 19 Nov.)* Save the source zips already sent (1.7.5 to 1.8.0) to a Gripil folder on the server. *Done when: they're saved there.*
- [ ] **0.3** *(Before go-live, not urgent now — the new system isn't live yet.)* Confirm a nightly backup of `\\bolt-dc\IconstructE\IconstructE\database` exists and **test one restore** to the test folder. *Done when: a restored copy opens in iCONSTRUCTE.*
- [x] **0.4** *(Done 19 Nov: saved as `docs/live/iCONSTRUCTE.exe.config.live-2026-11-19`.)* Live config holds only `DBLocation` = `\\bolt-dc\IconstructE\IconstructE\database` and a .NET 4.0 runtime line; every other setting runs on its default. At go-live the 1.8 settings are added to it from `iCONSTRUCTE.exe.config.ADDITIONS.xml`, and the runtime line updated to .NET 4.8.

## Stage 1: Finish and launch desktop 1.8

- [ ] **1.1** Liam finishes testing 1.8.0 using the test checklist (below). He lists anything wrong.
- [ ] **1.2** Liam says "build 1.8.1". Claude packages all built changes plus any 1.8.0 fixes, with release notes.
- [ ] **1.3** Test 1.8.1 on the test copy using the same checklist, plus the 1.8.1 items.
- [ ] **1.4** Go live (only once 0.3 is done): back up the live database, install on the cloud server, add the config settings, then check with one user.
  - **Go-live data clean-up and checks** (Liam, 18 Nov: done on the live database at go-live, not on the test copy, which is a throwaway copy):
    - **close every order still open from before 1 January 2025** at the values shown (status Complete). They are **left undelivered** (no received date); Liam, 18 Nov: no detriment to us. Goods In already ignores orders raised before 1 Jan 2025 (setting `GoodsInFromDate`), so they don't show red or overdue;
    - run the go-live checks on the live data: new tables create themselves on first open, the H&S ticks carry over, Goods In shows sensible red / overdue counts, a sample of jobs, orders and plant open correctly;
    - the clean-up runs as a one-off script with a count shown before anything changes, straight after the backup.
- [ ] **1.4a Roll-out package** (Liam, 19 Nov: the test bed is isolated; at roll-out everything is packaged back up to run in the original live folders). Built when Liam says go, as a separate package from the test builds:
  - **Prerequisite: .NET Framework 4.8 on every machine and server that runs iCONSTRUCTE** (Liam, 20 Nov: a different server asked for it when opening test build 14; 1.7.5 only needed 4.0). Check with `reg query "HKLM\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" /v Release` (528040 or higher = 4.8); IT installs where missing (admin rights, restart). Windows 10 (2019 on) / 11 / Server 2022 have it; Server 2016 / 2019 don't by default.
  - **Program:** iCONSTRUCTE.exe, the 5 System.*.dll files and OrderStandardNotes.txt into the live program folder (the folder the live config sits in; path to confirm).
  - **Live config:** the 1.8 lines added (.NET 4.8 runtime, the binding redirect, optional settings as wanted). **No `DocStorageLocation`**: live keeps the document folder stored in the database (`\\bolt-dc\IconstructE\IconstructE\database\iConstructE Docs`); the live installer removes the line if it is ever there. Nothing in the program refers to the test bed (checked 19 Nov); the test paths live only in the test installer.
  - **Live Templates:** the cleaned quote.xlsx and quote.docx copied into the live `iConstructE Docs\Templates` (old .xls / .doc left in place).
  - **Database:** backup first (0.3); the 21 tables 1.8 adds create themselves on first use (AddedTables list); then the go-live clean-up script (pre-2025 open orders closed, count shown first). Nothing is copied from the test database.
  - **Live installer ("Install LIVE.bat"):** asks for a typed confirmation; stops if anyone has the database open (lock file); copies the current exe and config to a dated `Rollback` folder first; installs; starts iCONSTRUCTE for the one-user check.
  - **Rollback:** put the Rollback exe and config back. The added tables are ignored by 1.7.5, so the database doesn't need restoring unless the clean-up script went wrong.
  - **First day:** each person answers "who are you" once on the Actions page; Default Owners set; existing RAMS / crane plan ticks appear as actions.
  - **Test bed:** left as it is (own database and Docs folder) for trying later changes, or retired.
- [ ] **1.5** One week of live use, then collect feedback for 1.8.2.

**1.8 test checklist** (tick each one on the test copy):

*Start-up and look*
- [ ] Opens without a version error, and opens quicker than 1.7.5.
- [ ] Tabs: Stock and Diary are gone; Goods In (was Deliveries) and Actions (replaces H&S, next test build) are there.

*Orders*
- [ ] A new steel, connections or bolts order line can't be saved without a delivery date.
- [ ] Standard notes in Comments match the order's line types (test build 12): steel → material requirements (BS EN 1090-2, 3.1 certs, EXC2); bolts → bolt assembly requirements; galvanising / painting / cold rolled → their own block. An order with none of these gets no notes; a mixed order gets each block once.
- [ ] **Email Order:**
  - creates a PDF in the job's `08 - Purchase Orders` folder, with the supplier name in the file name;
  - opens an Outlook draft with no recipient;
  - after the order is changed, emailing again saves "rev 1".

*Workshop door (test build 12)*
- [ ] New / edited order with delivery address **Office** (our workshop): a "Workshop door" box appears (Door 1, 2, 3 or Not applicable) and must be chosen before saving.
- [ ] Viewing the order shows "DELIVER TO WORKSHOP DOOR n" under the delivery address.
- [ ] Print Order and Email Order: the PDF shows "DELIVER TO WORKSHOP DOOR n" as an orange banner in the Deliver To box and at the top of the notes. **Check where it appears on the printed order and say if it should move.**
- [ ] The order email says "Please deliver to our workshop DOOR n" and the subject ends "- deliver to Door n".
- [ ] Deliveries calendar shows the door next to the PO number.

*Goods In (the Deliveries tab, renamed)*
- [ ] The tab reads **Goods In** (test build 12). Everything else works as before.
- [ ] Every order shows red.
- [ ] Mark Received turns it green.
- [ ] The overdue and no-date lists are correct.
- [ ] (test build 12) Orders raised before 1 Jan 2025 don't appear in Goods In at all (setting `GoodsInFromDate`).

*Job cards and H&S*
- [ ] RAMS and Crane plan ticks save.
- [ ] (test build 12) Change a job's project manager and site location, and an order's workshop door; save, close and reopen: each change is kept (now saved as one step, HC1.4).
- [ ] (test build 12) Drop an email on a new quote: the box says "Reading the email …" and you can keep typing; the details fill in a moment later (only empty boxes). Pressing Save while it's still reading asks you to wait.
- [ ] (test build 12) Site Issue on a big job: the window opens straight away and the file list appears when the folders have been read.
- [ ] (test build 12) Job Cards Search all fields: results update quickly as you type. Plant filter-all box now also updates as you type. After saving a job card or pressing Refresh, the list shows the change.
- [ ] (test build 12) Colours: pages and pop-ups have the same light grey background (Fab Issue included); Goods In, H&S, Site Issue and Fab Issue greens / reds / ambers match.
- [ ] (test build 12) Admin: change the company phone number (or logo) and save, then preview a Fab Issue or email a plant hire without restarting: the PDF shows the change.
- [ ] (test build 12) Site location: paste the site's Google Maps link (from a browser, or a phone share link), Save; **Open map** opens that link. No "Use site postcode" button; nothing freezes.
- [ ] Ticked jobs appear on the Actions page as RAMS / Crane plan actions (Type > "H&S" shows only those).
- [ ] Mark Done turns them green.
- [ ] Completing the job closes them (not needed: job no longer live).

*Look-ups*
- [ ] Typing in the customer, supplier and site boxes finds matches.

*Site Issue* (only once Stage 3 is set up)
- [ ] Issuing a drawing copies it into the site folder.

*Quotes from email (test build 12)*
- [ ] **One-off before testing:** open `Templates\quote.xls` in Excel and *Save As* `quote.xlsx` (Excel Workbook) in the same Templates folder. Leave the old .xls there.
- [ ] New quote: the letter (`Qxxxxx.docx`) has the quote number, date, client name and address, "Dear" contact, "Re" project name, and the creator's name and job title. Price, scope and weeks are still highlighted.
- [ ] New quote: the estimate sheet (`Qxxxxx.xlsx`) shows the estimate no, date, client, project title, location and description. The Summary tab date shows as a full date (e.g. "Thursday, November 19, 2026") and doesn't change the next day (test build 12).
- [x] Drag an email from Outlook onto the New quote window: the customer, contact, project, site and required-by date are filled in, with a summary of what was found. Project name and description are the email title (no message text, no "[EXTERNAL]" / "You don't often get email" banners). *(Confirmed by Liam 19 Nov: "the import of quote email now looks OK".)*
- [ ] An email from a company not in iCONSTRUCTE: "Add … as a new customer" opens with the company name, address, postcode, phone and website read from the signature, plus the contact; Add creates both and selects them on the quote.
- [ ] New quote opens with Customer, Contact and Created by blank (not "44 Consult") and Priority 2. Clearing a look-up box leaves it blank.
- [x] Location is a town only (no street): from the email, the email title, the site postcode, or the title block of an attached PDF drawing; the summary says where it came from. *(Confirmed 19 Nov: B016 Salford fix.)*
- [ ] A forwarded enquiry (FW: from a colleague) picks out the client, not the colleague. The colleague becomes "Created by".
- [ ] A new person at a known company: "Add … as a contact" adds them with their email and phone numbers.
- [ ] After saving, the email and its attachments (not signature logos) are in the quote's Documents tab.
- [ ] Dropping an email onto the Quotes list opens a new quote already filled in.
- [ ] Cancelling a new quote after dropping an email uses no quote number.

*Job Cards*
- [ ] No Project Manager column on the list, but typing a project manager's name in Search all fields still finds their jobs.
- [ ] Job card (test build 12): no "Job price" title; the price table runs from the top of the right-hand side and shows every row without scrolling (up to 25). Budget buttons and the H&S RAMS / Crane plan ticks share one card under it, next to Total.
- [ ] Site window (Sites > open a site): Open Document Folder sits in the white footer (Print Site Details removed with Crystal, 2.14) below the Details and Site Budget cards, not on top of them. Other pop-ups whose cards ran into the buttons get the same extra room.

*Fab Issue (test build 12)*
- [ ] Job card: a **Fab Issue** button, now *before* Site Issue on the bottom row (needs the job card saved).
- [ ] Fab Issue window restyled: white header with Steelwork / Metalwork switch and issue badge, details card, section list on the left (with counts), clean tables, footer showing "Ready to issue" or how many incoming materials are left.
- [ ] Choose Steelwork or Metalwork; the tables match that sheet. Job no, project, item(s) and required-on-site come from the job card.
- [ ] Suppliers, BSSL order numbers, scope and delivery dates are filled from the job's orders (sheet suppliers matched by name; others added in the right table; galvaniser/painter against the matching finish).
- [ ] Drawings tab lists the job's 03 assembly drawings folder; "Tick latest revision of each" works; double-click opens a drawing.
- [ ] Preview PDF; Save & Email saves "Fab Issue {job} - {type} - Issue NN Rev X.pdf" in the job's `03 - Assembley Drawings\Fab Issues` folder (next test build; that folder doesn't show in the Drawings tab or Site Issue), records the issue, and opens Outlook with the sheet and ticked drawings attached.
- [ ] "Start from" an earlier issue reloads it as the next revision (same issue number), with the same drawings ticked.
- [ ] No Proc. or Ref (BSL) columns. Material / Scope is a drop-down: materials = stock bars, primed stock bars, cut only, cut & primed, cut & drilled, cut drilled & primed; fittings = complete with holes, blanks for BSSL to drill; "Other (type in)…" asks for your own wording. Bought-in (and site materials) scope comes from the order description.
- [ ] Finishes: tick **Use** on the finish needed; it prints even with no finisher, order or dates yet.
- [ ] It can't be saved or emailed until every incoming material row in use has its delivery (Material / Scope), Del Date and BSSL Order Nr (and Deliver To for site materials); missing cells turn red and are listed.
- [ ] Email recipients: Steelwork to production@ cc nick@ and dave@; Metalwork to Metalwork@ cc nick@.
- [ ] Bolt suppliers (BAPP, any "Bolts" order lines) and unrelated orders (transport, cranes, consumables) don't appear.
- [ ] Issue numbers: a new sheet takes the next number after the highest issued; the number can be edited; each issue is kept.
- [ ] (test build 12) Job card: **Execution class** (EXC1–EXC4, default EXC2) beside Job size; saves with the job card; typing "EXC3" in Search all fields finds EXC3 jobs.
- [ ] (test build 12) Fab Issue: execution class pill in the header (red "EXC3 job" / "EXC4 job"); PDF job details show the class, EXC3 / EXC4 sheets carry a red warning band, and the email says so.
- [ ] (test build 12) Order notes show the job's class ("Execution Class EXC3 to BS EN 1090-2"); on EXC3 / EXC4 jobs they add the piece-traceability line. Notes already on an order aren't rewritten if the class changes later.
- [ ] (test build 12) Saving an issue / revision that has already been sent offers only "save as the next revision" or Cancel; the earlier PDF is never overwritten.
- [ ] (test build 12) Type a revision of "P01" (or "1") on an issue, send it, then Start from it: the next revision is "P02" (or "2"), not "A".
- [ ] **Issue register** tab: every issue for the job (issue/rev, sheet, date, by, drawings); double-click opens the sheet; "Print register (PDF)" saves "Fab Issue Register {job}.pdf" in `03 - Assembley Drawings\Fab Issues`.
- [ ] Paint / Galv: specs read "Galvanised (85 microns)", "B&P …" (no Widnes / Pillar Wedge, no SMT); Finisher is a supplier drop-down (or Other); picking one ticks Use and fills Finishes, order number and date from that supplier's order on the job; Finishes can be typed.
- [ ] Fab Issue and Site Issue never list drawings in superseded folders (00-SS, or any folder starting "00" or named SS / Superseded).

*Plant (test build 12)*
- [ ] A new plant hire saves without any Owned / Hired choice; that row has gone from the screen.
- [ ] Supplier box: typing part of a name (e.g. "hire") lists every supplier containing it; arrows + Enter, Tab or a click picks one. The same works in the other customer / supplier / site / contact boxes.
- [ ] **Email Plant Hire:** saves "Plant Hire {number} - {supplier}.pdf" (titled Plant Hire Order) in the job's `08 - Purchase Orders` folder and opens an Outlook draft with it attached; after changing the hire, emailing again saves "rev 1". The PDF is now iCONSTRUCTE's own Plant Hire Order (letterhead, hire company, deliver to, plant, dates, agreed rates; no internal costs), not the Crystal "Plant Details" print, which crashed when emailed in test build 5.
- [ ] A plant hire can be saved and emailed with the rates and expected costs blank or 0. The PDF says rates "To be confirmed" and asks the hire company for them. On the Plant list the hire shows pale yellow (hover for the reason) until a rate is entered; invoiced hires are never yellow.
- [ ] If anything goes wrong, iCONSTRUCTE shows a message and keeps running; the details are in DocStorage\Errors\yyyy_MM.txt.

*Re-test after the shared routines (next test build; HC1.5–HC1.7 rewired these, nothing should look different)*
- [ ] Email Order: first time saves the PDF in 08; email again unchanged re-uses it; change the order and email again saves "rev 1". Outlook draft opens with the PDF attached and the text above your signature.
- [ ] Email Plant Hire: same three checks.
- [ ] Fab Issue Save & Email: draft opens with To / CC filled, the sheet and drawings attached.
- [ ] Open three or four drafts one after another (orders, plant, Fab Issue), then close Outlook: it closes normally (no Outlook left running in Task Manager once iCONSTRUCTE is closed).
- [ ] Actions page > right-click > Open H&S folder opens the job's 10 - H&S folder; Site Issue still lists drawings from 01 and 03 and H&S documents from 10; job card Documents opens the job folder.
- [ ] A job with no folder yet: Email Order or Fab Issue creates the job's standard folders.

*Printing without Crystal (next test build, 2.14)*
- [ ] On a PC **without** the Crystal runtime: iCONSTRUCTE starts and every Print button works (no "CrystalDecisions" message anywhere).
- [ ] **Print Order** opens the Purchase Order PDF: letterhead and logo, order no., date, job, site, ordered by, supplier address, deliver-to (door banner when a door is set), items, total excl. VAT, standard notes. A long order carries onto page 2 with the column headings repeated and "page 1 of 2".
- [ ] **Email Order** attaches the same Purchase Order (check one against the other); change the order and email again saves "rev 1", marked "(amended)".
- [ ] **Print Plant Hire** on a plant hire opens the Plant Hire Order (same as the emailed one); an unsaved hire asks you to save first.
- [ ] **Goods In > Print Schedule:** default range today to +6 days; overdue (not received) first, then each day with door, PO, supplier, job, what's coming; received orders and prices not shown; "UNCONTROLLED COPY" and the print time on every page. Try a 2-week range and untick overdue.
- [ ] List **Print** buttons (Job Cards, Quotes, Orders, Plant, People, Employees, NCRs): the PDF matches the list on screen (same rows, order and columns). Job card Spend Breakdown prints (orders, plant, labour, stock orders) show the total; Employee > Print shows the work log.
- [ ] Gone: Print Person Details, Print Site Details, Site Reports menu, job card Print Budget and Print Delivery Note, Print Stock Order, single NCR Print.

*Actions list (next test build, P4)*
- [ ] First time you open **Actions**: it asks who you are (your Windows login linked to your name, once). "You: … (change)" on the page changes it.
- [ ] **Show: My actions / On my jobs / Everyone**, Type (incl. "H&S (RAMS + crane plan)"), PM, Search, Overdue only, Show closed all filter the list. Red = overdue, amber = due within 3 days, green = done, grey = not needed.
- [ ] Existing RAMS / crane plan ticks have become actions (open ones open; ones already complete show as done with Show closed). Tick RAMS on a job card and save: an open RAMS action appears for the job's PM, due a week before the required date. Untick and save: it closes as not needed.
- [ ] **Add Action**: job (or none), type, phase / Fab Issue, what needs doing, due date, owner (blank = default owner for the type, else the job's PM).
- [ ] **Mark Done** (note optional), **Not Needed** (reason required), **Re-open**, **Reassign** (to someone, with a note), **Edit / History** (every change listed with who and when). Several can be selected at once.
- [ ] Marking a RAMS / crane plan action done ticks it complete on the job; Not needed unticks "required"; Re-open ticks it again.
- [ ] A new plant hire with no rates: a "Plant hire rates" action appears (due 2 days after it was raised); enter a rate and it closes itself. A hire whose off-hire date is within 2 days gets a "Plant off-hire" action; completing the hire closes it.
- [ ] **Default Owners**: set e.g. Transport order → a person; a new action of that type goes to them.
- [ ] Job card: **Actions (n)** button opens that job's actions (add, done, reassign there too).
- [ ] Double-click opens the plant hire (plant actions) or the job card. **Print** prints the list as shown.
- [ ] **Urgency (1 / 2 / 3)** (Liam, 20 Nov): an **Urgency** column first on the Actions page ("1 Urgent", "2 Soon", "3 Can wait"); open actions are listed most urgent first, then by due date; urgent ones in bold. **Automatic from the due date** unless set by hand: due within a week (or overdue) = 1, within two weeks = 2, later = 3. RAMS actions fall due a week before the job, so a job in 2 weeks shows 1, in 3 weeks 2, in 4 weeks 3; it moves up by itself as the date gets closer. **Set by hand:** Add / Edit has an Urgency choice (Automatic, 1, 2, 3), or select several, right-click > Urgency. A hand-set urgency stays until changed back to Automatic; the change is in the history. **Urgency filter:** Any / 1 only / 1 and 2. Hover shows whether it was set by hand or from the due date. (New column Urgency on the Actions table, added automatically.)
- [ ] **New job card with no budgets:** create a job card and save. A "No budgets on job …" question appears. **Yes:** a "Budget" action appears on *your* Actions list (due in 2 working days); enter a budget on the price table (double-click a row, or Import Budget) and the action closes itself ("Budget entered (£…)"). **No:** a closed "not needed" Budget action is recorded on the job. Editing an existing job card never asks. Marking a Budget action done by hand needs a note.

*Spelling (test build 12)*
- [ ] **Job Cards search, close spellings:** type a word spelt wrong (e.g. "mezzaine", "galvanized", "lindaptor"): if nothing matches exactly, the jobs with the close spelling are listed and the total line says "No exact match: showing close spellings". It also works the other way: a word spelt right finds jobs where it was typed wrong. Words with numbers (job numbers, sizes) still have to match exactly.
- [ ] **Spell check on save:** type a misspelt word in a job card's Description or Additional comments (or a quote's Project name or Description) and save. A "Check spelling" window lists it with suggestions. **Save** applies the ticked changes, **Save as typed** keeps the text, **Cancel** goes back without saving. Tick **Add** for a name or trade word that's right: it goes on the BSS word list (`Settings\SpellingWords.txt` in the documents folder, shared) and is never flagged again.
- [ ] **People tab, Search all fields** (was Name, starts-with only): type "material" and every company with "material" anywhere is listed (name, supplier type, address, postcode, phone, website, comments, or a contact's name, job title or email). Several words narrow it down ("steel bolton"). Updates as you type; close spellings are tried when nothing matches exactly (the Filter title says so). The Type drop-down still applies.
- [ ] Words in capitals (UB, PFC, RHS, NSSS), words with numbers and common steel terms (galvanised, purlins, cleats, Lindapter, Kingspan …) are never flagged. Text you didn't type (filled from an email, or unchanged since opening) isn't checked. UK spelling if Windows has English (UK) installed.

*Delivery notes, stage 1 (next test build, 2.6)*
- [ ] Job card: a **Delivery Note** button after Fab Issue (needs the job card saved).
- [ ] **Load tab:** lists every QA list CSV in the job's 03 folder ("QA" in the file name; not superseded) with phase, pieces, kg, saved date and **Sent (DN0n) / Not sent yet**. Ticking a list puts **every line** on the load; totals show pieces, max length, m² and kg (check against the list's Totals row). Double-click opens the list.
- [ ] **Route:** Stop 1 defaults to the customer site (address and site contact filled in). Change **Deliver to** to Finisher, BSS works, Customer address or Other; a finisher fills its address, contact, **our order number to them on this job** (red warning if there isn't one) and the galvanising / painting spec from the templates (links to swap the spec; text can be edited).
- [ ] Tick **Onward transport after this stop?** on stop 1: stop 2 appears below. Untick: the later stops go (asks first). Up to 6 stops.
- [ ] **Transport per stop:** Our van (driver from the employee list, reg) or External transport: haulier (Transport suppliers first) and **Vehicle: Van, Rigid, Hiab, Artic or Other** (Other opens a box to type the specialist transport, e.g. low loader). The note's Transport line reads e.g. "ABC Haulage, Hiab". One **Date** per stop (collected and delivered the same day; the rare Friday collection for Saturday delivery goes in the time slot, e.g. "Collect Fri, deliver Sat AM").
- [ ] **Van payload:** a load over 1,600 kg on an Our van stop shows red at the bottom; saving asks **Go back and split** / **Switch to External** / **Carry on anyway** (reason required, printed on the note).
- [ ] **Preview** opens each leg's note (numbers shown as they will be). **Save** makes one note per stop, numbered 2627/004-DN01, DN02 …, saved as "2627-004-DN01.pdf" in **05 - Delivery Notes**; later legs say "Leg 2 of 2 (onward from DN01)" and collect from the previous stop; each leg's Deliver To shows "THEN ON TO: …" when there's a next stop.
- [ ] **Save & Print** opens every leg's PDF; **Save & Email** opens an Outlook draft for leg 1 to the destination contact with the PDF attached.
- [ ] The note (revised 19 Nov after Liam's review): **BSS logo** at the top with the company address from Admin → Company Details; header (Job, Project, Customer, Order Nr, Transport, Date and time slot, Leg); Collect From / Deliver To; on a multi-stop route a **Route** row (every stop numbered, this leg's collect stop pale orange and deliver stop orange, a line saying what's next); Description; **load summary by section size** (pieces, longest, area, weight, heaviest item in that section; total row; not every mark); handling notes (NSSS 8.1.4 / 8.1.5 / 10.5.11) and signature boxes (loaded by, driver, received by, condition on receipt).
- [ ] Every printout (orders, plant hire, Goods In schedule, delivery notes) shows the BSS logo even when the documents folder has no Logo file (built into the program).
- [ ] **Before testing printouts:** Admin → Company Details on the test copy reads **Bolton Steel Structures Ltd, Unit 1b, Pocket Nook Lane, Lowton, WA3 1AW** (Liam, 19 Nov) with the phone and email; every printout's letterhead and the delivery note's "collect from" come from there. Check the live database's Company Details too before go-live.
- [ ] **Register tab:** every note for the job (red = raised, not yet dispatched); Open / Print, Email, Open Del Notes (the job's 05 folder). A missing PDF is made again from the record.
- [ ] A QA list already sent asks before going on another note.
- [ ] **No QA list?** "Manually Input…" (Load tab) opens a grid: mark (optional), section / description, qty, length, kg each or total (the other is worked out), area, finish. The typed lines go on the load with any ticked lists, show in the totals and the van check, and print in the section summary; the note lists "Manual input" as the source. The button shows how many lines are input; press it again to change them. (Liam, 19 Nov)
- [ ] Load tab button "Open Folder" (was "Open 03 folder") opens the job's 03 folder.

*Goods Out, stage 2 (next test build, 2.6)*
- [ ] A **Goods Out** tab beside Goods In lists every live delivery note (all jobs): note, job, project, leg, going to, transport, due, pieces, kg, **Location**, status. Search, Going to, Due this week and Show completed filter it.
- [ ] Colours: **red** = raised, not dispatched (tooltip says if overdue); **grey "Waiting"** = a later leg held until the leg before is complete; **green** = dispatched.
- [ ] **Dispatch** (one or several): turns green, Location "In transit to …". A held leg won't dispatch (says why). An over-weight van note asks again, showing the reason given.
- [ ] **Complete (delivered):** asks "received complete and undamaged" or "shortage / damage" (details required; reminds you to raise an NCR); optionally attach the signed note or a photo, filed in 05 as "2627-004-DN01 signed.pdf". The note leaves the live list (Show completed brings it back) and the next leg's Location becomes "At {that stop}" and it can be dispatched.
- [ ] **Attach signed copy** works before or after completing. **Undo** puts a dispatched note back, or re-opens a completed one (not if the next leg has left). **Open note** / double-click opens the PDF; **Open job card**.
- [ ] **Board view (default; Liam 19 Nov):** one row per route, columns **BSS works / Finishers / Site / Other**, one tile per stop under its column (two finishers sit side by side). Start tile red until dispatched, then green; a stop part-way red, then **amber** while the steel is on its way or there being worked on, then green once dispatched onwards; the final stop red, then amber once dispatched (awaiting sign-off), then green when completed. The route cell shows job, notes (DN01-DN03), project, "Next: dispatch DN02" and the load. Select a route and **Dispatch / Complete** act on its next leg (no note to pick); **Undo** on the last leg that moved; double-click a tile to open that stop's note. "List" switches back to the note-by-note list.
- [ ] Actions: a note due today or tomorrow and not dispatched gets a **Delivery note** action (closes when dispatched); a note sent by an **external haulier** gets a **Proof of delivery** action once dispatched (closes when completed). Both need a note to close by hand.
- [ ] The job card's Delivery Note register shows dispatched notes green and completed ones grey.

*Quote site address → job card (Liam 19 Nov: no job cards without an address)*
- [ ] Quote window: a **Site** box under Location (the customer's sites) with its address shown underneath; **Add Site** (moved beside it, now also on a new quote) creates the site with its address, named after the project, and selects it. Saving the quote keeps the site (table QuoteSite; the address stays on the site record, not copied).
- [ ] Job card: picking the quote selects the quote's site (asks first if a different site is already chosen).
- [ ] Saving a **new** job card whose site has no address (first line or postcode) is stopped with "Site address needed"; an existing one warns and lets you carry on.

*Preferred suppliers and supplier category (Liam 19 Nov)*
- [ ] People list: a **★** column after the icon; click it on a supplier to star / unstar it as preferred (customers can't be starred). A **Category** column after Type shows the supplier's category (supplier type). Both sort by clicking the heading; "preferred" in Search all fields finds starred suppliers.
- [ ] Supplier drop-downs list **preferred suppliers first, marked ★**, then everyone else A–Z: order supplier, plant hire supplier, stock item supplier; delivery note finisher and haulier lists and the Fab Issue finisher list also put preferred first (without the ★ in the name).

*Supplier categories (Liam 19 Nov)*
- [ ] Open any supplier: Supplier type now also offers **Stockholder, Profiler, Cold Rolled, Finisher, Transport, Bolts / Fixings, Technical, Consumables** (added to the SupplierType table automatically the first time the list is read; Labour, Plant, Materials and Subcontractor unchanged). Set the category on your main suppliers; it shows in the People list's Category column.
- [ ] Delivery Note: the finisher list puts **Finisher** suppliers first (those on the job's orders at the top); the haulier list puts **Transport** suppliers first.

*Site labour planner (W2, next test build)*
- [ ] A **Site Labour** tab: jobs down the side (live job cards), days across for 12 weeks from this week (weekends and bank holidays narrow and grey, today orange, the month on Mondays); the arrows / This week move the window. Find job filters the rows.
- [ ] Type in a cell: initials (JS, MB), a number for labour still to find (2), both (JS 2), or SUB / SUB: Acme. Colours: **green** named, **amber** still to find, **red** the same person on two jobs that day (hover says which), **blue** subcontract; initials not on the labour list show in red text. Totals at the top: named, to find, subcontract per day.
- [ ] Every change saves straight away (another PC sees it on Refresh / re-opening the tab). Delete clears; **Ctrl+C / Ctrl+V** copy and paste ranges (also from Excel); **Ctrl+R** fills a selection from its left cell (weekdays only); right-click: fill to the end of the week / 1 / 2 / 4 weeks, clear, send instructions, open job card.
- [ ] Rows: **Move up / Move down** (the order is shared), **Remove / restore** (Show removed brings them back), **Add job…** (any job card, e.g. not live yet), **Start time…** (and working away) per job; double-click the job to open its job card.
- [ ] **Labour list…**: filled the first time from the current operatives (initials from their names, a second letter where two clash); add subcontractors / agency; mobiles; Active; "Add operatives from employees" for new starters.
- [ ] **Send instructions…**: select an operative's days on a job (or a range across rows) and press it: one message per person per job, editable, with Collect on the way and Notes (carried to the next person), site, address, map link, site contact, start time, the days, and a reminder to sign the RAMS / check in on the site app. **Open in WhatsApp** opens their chat with the message typed (press Send there); **Copy** for a group or no mobile; each one is recorded and the cells get a **✓**.
- [ ] Site app: naming someone on a job adds them to that job's operatives (they see its drawings and RAMS; never removed by the planner), and **Update site app** (also done quietly after changes) puts the next 14 days in the manifest: the site app's Home shows **My week** (today first, tap to open the job). Needs the site app folder set up (Stage 3); the planner works without it.

*Site attendance and wages CSV (W2b, next test build)*
- [ ] The morning after people are on the planner, an Actions item **"Confirm site attendance for {day}"** appears (owner: default owner for Site attendance, else unassigned).
- [ ] Site Labour > **Confirm attendance…**: the previous working day by default (pick another day at the top); everyone on the planner that day, Attended ticked, Hours 10 local / 12 away. Untick anyone who didn't attend (a note is required). **Confirm and book** adds a labour line to each job card (on-site rate × hours, comment "Site attendance confirmed by …") and the action closes. Confirmed rows show as booked; confirming again never books twice. People not linked to an employee are listed in red and not booked.
- [ ] Labour list: **Book hours to (employee)** column: operatives are linked already; link subcontract / agency people to their employee record so their days book too. (SUB cells with no name aren't booked.)
- [ ] **Timesheet…** (was Wages CSV, HC3.20): pick a week; it saves "Timesheet w-c yyyy-mm-dd.xlsx" in the Timesheets folder with sheets **Payroll** (name, hours, days on site, days not confirmed; total), **By job** and **Detail**; no pay details. Opens in Excel and on a phone.
- [ ] **Unlock to edit** (HC3.9): the planner is view-only until you press Unlock; a second PC then shows "Being edited by …" and can't change it (Take over asks first). Lock when finished.
- [ ] **Confirmed days lock** (HC3.5): after confirming a day, its cells are grey italic and can't be typed over. Right-click > Confirm or reverse attendance for this day > select the person > Reverse booking (reason): the labour line goes from the job card and the cell can be changed.
- [ ] **Unverified labour** (HC3.6): leave a day unconfirmed; opening Site Labour lists it and offers to confirm it.
- [ ] **Two jobs one day** (HC3.4): put the same initials on two jobs the same day; Confirm attendance shows 5 + 5 hours with a Check note; making it 10 + 10 asks first.
- [ ] **Bank holidays** (HC3.17): open Site Labour > Bank holidays…: 2026 and 2027 are already there (filled automatically); change a name, Save; bank holidays show as BH on the planner; a Monday bank holiday: the next day's attendance action is for the Friday before.
- [ ] **Off row** (Liam, 20 Nov: as on the spreadsheet): a permanent **OFF** row at the bottom of the planner (grey) for anyone off that day (holiday, sick, training, not working): type their initials as on any row. It can't be moved, removed or opened as a job; someone typed on Off and on a job the same day shows red (clash); it gets no WhatsApp instructions, attendance or labour booking, isn't counted in the daily totals, and goes to the site app as "Off" (My week, This week) so the 9am check-in alert leaves them out.
- [ ] **Planner editors** (Liam, 19 Nov: only managers with the privilege change the planner; one of four people, usually with the PMs present): **Planner editors…** ticks who may change the planner, confirm attendance and save the wages CSV (table StaffPrivileges, feature SiteLabour; the start of the role ticks). Everyone else sees the planner read-only ("View only" on the info line). Nobody ticked = everyone can edit, so the test copy works until the ticks are set.
- [ ] **Site app this week only** (Liam, 19 Nov: plans change quickly and could send operatives to the wrong place): iCONSTRUCTE publishes the planner to the end of this week (next Monday too from Friday), not 14 days. Each person sees only their own days ("This week"); **supervisors** also see who is with them on their sites each day; **managers** also get the team grid. No looking ahead.
- [ ] Instructions with no start time set say "Start time to be confirmed"; the site app's My week says "Start time TBC".
- [ ] Site app **Week plan** (built 19 Nov, sample data in demo): Home tile and "Week plan ›" from My week. **Me** shows each day Mon–Fri (weekends only if planned) with the job, start time and working away, tap to open the job; **Team** (Managers and Supervisors, role feature `team-week`) shows everyone on the plan, a row each, a coloured job number per day, with a key; Prev / Next week. Reads the manifest allocations (14 days ahead), so it covers this week and next; earlier weeks show what is still in the manifest.

- [ ] **Commercial only job cards and the Job ticks card** (Liam, 20 Nov): new job card tick **Commercial only (no site labour)** for job cards raised for the money side only: daywork, or post-contract drawing comparisons against the tender where it's easier to add the **extra over** figures than amend the project budgets (Liam, 20 Nov). Tick it and save: the job **no longer appears on Site Labour** (Refresh). **No RAMS or crane plan:** ticking it unticks and greys out RAMS required and Crane plan required (open RAMS / crane plan actions close as not needed on saving). **No budget question:** a new Commercial only card skips the "No budgets" question and always gets a **Budget** action for the person who raised it, "Price commercial job card … (with the QS) and enter the extra-over figures as its budget", due in **10 working days** (the PM may log the variation now and price it later with the QS; closes itself once a budget is entered). The site address comes from the existing site as normal. It still shows if someone adds it there by hand (Add job…) or people are already on it from today on, so nothing planned disappears; attendance still reads it. **Job ticks card:** RAMS required, Crane plan required and Commercial only now sit together in one "Job ticks" card beside a narrower Budget card (Breakdown and Import Budget one above the other); **Drawings** (W3) joins them when built. Billed to client stays beside Invoice number. (Table JobCardFlags, added automatically.)

*Bolts at Fab Issue (test build 10, P2)*
- [ ] Save (or Save & Email) a Fab Issue: a "Bolts for this phase" window opens before the Fab Issue email.
- [ ] It lists bolt lists from the job's 03 folder (any file with "bolt" in its name, not superseded), newest first; the newest not yet dealt with is picked; ones used on earlier issues show their status in grey.
- [ ] Needed-by date = the job's required-on-site date. Inside 4 working days it suggests Whites; otherwise BAPP. Either or both can be ticked.
- [ ] **Send for quote**: Outlook enquiry with the bolt list attached, to the supplier contact emails (BAPP / Whites), PM copied if you aren't the PM. A Bolts action appears on Actions (owner: the job's PM), due 2 working days later.
- [ ] **Not needed**: needs a reason; recorded as a closed Bolts action. **Later** (or closing the window): an open Bolts action due a week before the needed-by date.
- [ ] A revision of the same issue doesn't ask again, unless it was left for Later (then it asks again and settles the earlier action).
- [ ] Raise an order with a Bolts line on the job: the oldest open Bolts action closes itself ("Bolts order PO … raised"). A second Bolts order closes the next phase's action, never the same one twice.
- [ ] No bolt list in 03: Send is greyed out; Later or Not needed still work.

*1.8.1 only*
- [ ] The Plant search finds words in the description.
- [ ] Screens open noticeably faster.

## Stage 2: Housekeeping and security (small, one at a time)

- [ ] **2.1** **Staff personal data:**
  - National Insurance numbers, bank details and medical notes sit unprotected in the database. Decide: move them out to payroll/HR, or lock them down.
  - Then put a password on the database.
- [ ] **2.2** IT tasks:
  - weekly compact and repair of the database;
  - antivirus exclusions for `.accdb` and `.laccdb` files on the server.
- [ ] **2.3** Quotes tab: load the last 12 months by default instead of every quote (faster).
- [ ] **2.4** Check every other "Filter all" box for the same gap the Plant search had.
- [ ] **2.5** Stop the order screen loading the customer list twice.
- [ ] **2.6 REQUIRED before go-live: Delivery notes for steelwork leaving the workshop** (QFC04 Q04.9 / Q04.10). **Build started 19 Nov: stages 1 and 2 built** (Delivery Note window, route stop by stop, QA lists as the load, van check, one note per leg, PDF in 05, register; Goods Out tab with dispatch, held legs, Location, complete with receipt check and signed copy, Delivery note / Proof of delivery actions). **Still to build (stage 3):** raise the transport purchase order from external legs and email the haulier the order + notes; driver's app (5.6) later. The old job card delivery address and Print Delivery Note were taken off on 18 Nov; this replaces them. Desktop part here; the driver's app part is **5.6**.
  - **Where it starts:** a **Delivery Note** button on the job card (next to Fab Issue / Site Issue). Notes can be raised ahead of the load leaving.
  - **New Goods Out tab** (beside Goods In; outgoing steel only, so the two lists never mix):
    - **live** delivery notes only, one row per note: note number, job, project, destination, transport, due date, pieces / weight, **Location**;
    - **red** = raised, not yet dispatched; open it and press **Dispatch** and it turns **green**;
    - **Location** shows where the steel is: "BSS workshop" until dispatched, then "In transit to …", then the destination (e.g. "At galvaniser — {name}", "On site — {site}");
    - **Complete** removes the note from the live list (it stays in the job's register and folder); a "show completed" tick brings them back;
    - filters: job, destination type, due this week.
  - **Onward transport: a route built stop by stop** (on every note, whatever the first stop):
    - the note opens with **Stop 1** (destination + transport) and an **Onward transport? Yes / No** box under it, defaulting to No;
    - answering **Yes** adds **Stop 2** directly below, with its own destination, transport and its own Yes / No box; and so on;
    - the stop whose box is **No** is the **final destination**;
    - normally up to 2 intermediate stops before the final destination; more can be added if ever needed;
    - any stop can be **BSS works** (e.g. back to our workshop for fitting / inspection between finishes) as well as a finisher, customer site, customer address or other;
    - example, the coming job: workshop → galvaniser → painter → BSS works → site = DN01 to DN04;
    - saving creates **one note per leg**, numbered in order (DN01, DN02 …), each with the same load list, the previous stop as "collect from" and "Onward from DN0n" printed on it;
    - all legs show **red** on Goods Out. Each later leg is **held**: it can't be dispatched until the leg before it is complete. Its Location reads "Waiting — DN01 to {stop 1}", then "At {stop 1}";
    - once the previous leg is complete, the next can be dispatched; it then turns green and its Location follows the steel;
    - changing a leg's load list before it leaves updates the later legs too (it asks first); stops can be added or removed later on legs that haven't left yet.
  - **Destination**, as QFC04 page 3:
    - *Finisher* (galvaniser / painter): suggested from the job's Fab Issue finishers and their orders;
    - *BSS works* (back to our workshop between stops);
    - *Customer site* (erection): the job's site address and site contact;
    - *Customer address* (supply only): the customer's address and contact;
    - *Other* (typed in).
  - **Transport, chosen for each leg: Our van / External transport**
    - **Our van:**
      - pick the driver and vehicle;
      - on **Dispatch**, the note is pushed to the driver's app (5.6) for photos and signature.
      - Until 5.6 is live, it prints for the driver to take, and the signed copy is attached on return.
      - **Weight limit: our van carries 1,600 kg max** (a setting, `VanPayloadKg`, so it can change if the vehicle does):
        - whenever the load list total for an Our van leg is over 1,600 kg (when attaching a QA list, or switching a leg to Our van), a **"Too heavy for our van"** warning shows the load weight and how much it's over;
        - you then choose what to do:
          - **Split the load** into two (or more) notes, each under the limit (by moving whole QA lists to a second note, or splitting a QA list);
          - **Switch this leg to External transport**;
          - **Carry on anyway**, which needs a reason; the reason is recorded on the note and in the register;
        - the leg shows a red "Over weight" flag on Goods Out until it's resolved, and **Dispatch** asks again before it goes.
      - No length check: the van takes 6 m comfortably and the office knows its limits (Liam, 18 Nov).
    - **External transport:**
      - pick the haulier (supplier);
      - **Raise transport order** creates a normal iCONSTRUCTE purchase order (type Transport, on the job) from the leg:
        - collect from / deliver to, date and time slot, pieces, max length and weight (so they send the right trailer);
        - the delivery note number(s) it covers;
      - one order can cover several legs with the same haulier;
      - **Email haulier** opens an Outlook draft to the haulier with the **transport order PDF and a copy of each delivery note** for their legs attached;
      - the transport order number is printed on the delivery note;
      - the order shows in the job's spend like any other order (no double entry).
  - **Finisher's order number:**
    - when a leg goes to a painter or galvaniser, the note prints **our purchase order number for the finisher's works**;
    - it is picked from the job's orders with that supplier (the same order the Fab Issue sheet uses), or typed if not raised yet;
    - the note warns if there's no order for that finisher on the job.
  - **Load list = whole QA list(s), no ticking** (Liam, 18 Nov: everything on a QA list normally goes together):
    - **Attach QA list** picks one or more QA lists from the job's 03 folder; **every item on them goes on the note** automatically;
    - where a load needs different finishes, the QA list is split into separate lists (one per finish) before attaching, rather than picking items on the note;
    - each line shows erection mark, description / profile, qty, length, surface area, weight and finish;
    - load totals: piece count, maximum length, surface area and weight;
    - the job's QA lists show as **Sent (DN0n)** or **Not sent yet**, so the balance still to go is visible at list level;
    - the odd exception (an item held back) can be removed from the note with a reason, but that's not the normal way of working.
  - **Header** from the job card: job no, project, customer, order no, site, delivery date and time slot, site contact and phone.
  - **Standard notes:**
    - handle and stack so as to avoid damage (NSSS 8.1.4, and 10.5.11 for coated steelwork);
    - bolts and small fittings bagged, labelled and kept dry;
    - any damage or shortage to be noted on the note at delivery (NSSS 8.1.5).
  - **Signature boxes:** loaded / checked by (BSS), driver, received by (print name, signature, date and time), condition on receipt.
  - **Output:**
    - own PDF (no Crystal), "2627/012-DN01" style, saved in the job's `05 - Delivery Notes` folder;
    - **Print** and **Email** (Outlook draft to the customer or finisher contact, with the PDF attached);
    - recorded in a per-job delivery note register (new tables DeliveryNotes and DeliveryNoteItems, auto-created like FabIssues).
  - **Proof of delivery for hauliers:** "Attach signed copy" files the returned signed note or photo and marks the note Delivered.
  - **Decided (18 Nov):**
    - notes are archived in the job's `05 - Delivery Notes` folder (changed from 10 on 19 Nov: 10 is H&S);
    - numbered with the **full job number** (project / item of work, as iCONSTRUCTE makes it: 4-digit site/project ref + 3-digit item) then a running DN number for that job, e.g. **2627/012-DN01, 2627/012-DN02**; the count restarts for each item of work. File names use a dash for the slash (`2627-012-DN01.pdf`), as Fab Issue does;
    - each note shows the **piece count, maximum length, surface area (m²), weight and finishes** (per line and totalled for the load; maximum length helps the haulier pick the trailer).
  - **Spec agreed by Liam 18 Nov 2026.** **Received 19 Nov:** sample QA list, bolt list and BSS's delivery note templates (finisher and site). **Ready to build** (top of the build list for go-live).
  - **QMS:**
    - QFC04 Rev C: Q04.9 and Q04.10 become "raise delivery note and load list in iCONSTRUCTE; signed proof of delivery filed to the job";
    - QFC06 Rev C: add "Delivery Note / Load List (signed)" to the QFC04 records.

- [x] **2.9 Execution class per job** *(built 18 Nov, for next test build; delivery notes pick it up when 2.6 is built)*. BSS is certified to **EXC4** (Liam, 18 Nov), but that's the highest class BSS may work to, not the class of each job: the job's class comes from the Project Specification, and NSSS is written for EXC2 unless the spec says otherwise (NSSS Table 1.1 (vi)/(vii), Annex E for EXC3).
  - **Execution Class** drop-down on the job card (EXC1–EXC4, default EXC2), searchable on Job Cards;
  - printed on orders (the material notes say "Execution Class EXCn" from the job instead of the fixed EXC2 line), the Fab Issue sheet and delivery notes;
  - EXC3 / EXC4 jobs: material notes add full traceability of every piece to its 3.1 certificate (BS EN 1090-2 5.2), and the Fab Issue shows an "EXC3 / EXC4" warning so the workshop applies the tighter welding / inspection requirements.
- [ ] **2.10 (proposed) ITP that fills itself in** (Liam, 18 Nov: give customers an ITP built from steps already taken; it may also show where QA can be tightened). **BSS ITP WM-14-8 master received 19 Nov**; ready to design.
  - One ITP per job (per phase where there are several), laid out like BSS's own; each line = an activity, its reference (BS EN 1090-2 / NSSS / QFC step), who checks it, hold / witness / review points, and the **record** that proves it.
  - Lines tick themselves when iCONSTRUCTE already holds the evidence: order placed with the right standard notes, 3.1 certificates received (Goods In), drawings issued (Fab Issue rev), fab complete / final check (W1, Q04.8), finisher certificate back, delivery note signed (2.6 / 5.6), site QA forms and completion certificate (site app); each linked to the file.
  - Anything not evidenced shows as open, so gaps are visible before the customer sees them; **Print ITP** makes the customer copy (PDF to the job's QA folder).
  - The gap review against BS EN 1090-2 / NSSS for each line is the "sure up our QA" part: lines with no record behind them become proposed new checks.
- [x] **2.11 Job folder structure** *(decided 19 Nov; keep today's 01–12 folders)*: delivery notes `05 - Delivery Notes`; QA docs `09 - QA Docs`; all safety docs `10 - H&S`; Fab Issue sheets and register `03 - Assembley Drawings\Fab Issues` (built 19 Nov; that subfolder is never listed as drawings in Fab Issue or Site Issue). Site QA returns now file into the job's own `09` folder (B012 fixed). Earlier Fab Issues stay where they were saved.
- [ ] **2.12 (to come back to) NCRs to match QP08** (Liam, 19 Nov). QP08 says every step is recorded in iCONSTRUCTE, but the NCR screen (table NonConformance, 221 records) only holds subject, description, corrective action taken, cost and closed date. Extend it to the QP08 / Welding Quality Manual section 15 steps:
  - problem and scope (processes / products affected);
  - containment / remedial action;
  - cause;
  - disposition: rework, use as is (WC concurrence recorded), scrap, return to supplier, concession (customer consent);
  - corrective action, who, by when;
  - effectiveness check (who, date, result);
  - links to the job, order / supplier, delivery note or Fab Issue that raised it;
  - annual trend review (PEM, manual 15) as a simple report.
  Raised from: delivery shortages / damage (2.6, 5.6), site snags, goods-in rejections. See `docs/QMS-DOCUMENT-REVIEW.md`.
- [ ] **2.13 (later) Approved suppliers in iCONSTRUCTE** (Liam, 19 Nov). Today the approved supplier list (QP05) is managed on a separate spreadsheet. Later: bring it into iCONSTRUCTE (approved, scope, certificates such as NHSS 3 / ISO 9001, review date) and warn when ordering from an unapproved supplier. Needs the spreadsheet when we come to it.
- [x] **2.14 Crystal Reports removed** *(done 19 Nov, for the next test build)*. Every printout is now iCONSTRUCTE's own PDF (no add-ons), opened in the PC's PDF viewer to read or print.
  - **Why:** no Crystal runtime on every PC (the "Could not load CrystalDecisions" error goes for good); reports no longer connect to the Access file themselves, so HC2.14 (re-pointing 29 reports at the SQL move) is gone; one BSS look on every printout.
  - **Purchase orders:** iCONSTRUCTE's own Purchase Order (letterhead, order no., date, job, site, ordered by; supplier and deliver-to boxes with the workshop door banner; items with qty, unit, total and required date, carried over pages with the header repeated; total excl. VAT; the standard notes / comments; "please quote our order number"; page x of y). **Print Order** opens it; **Email Order** saves the same document in `08 - Purchase Orders` (revisions as before).
  - **Plant hire orders:** already our own PDF; **Print Plant** (now "Print Plant Hire") opens the same Plant Hire Order that Email Plant Hire sends.
  - **New: Goods In schedule** (Goods In tab > **Print Schedule**): pick a range (default today + 6 days); anything overdue first, then day by day (weekends only if something is booked): door, PO, supplier, job, what's coming. No prices. **"UNCONTROLLED COPY – for information only"** with the print date and time at the top and on every page.
  - **List Print buttons kept, not removed:** one "print this list" routine replaced the Crystal list reports, so Print on the Job Cards, Quotes, Orders, Plant, People, Employees, NCR lists, the job card spend breakdown (orders, plant, labour, stock orders, with the total) and the employee work log prints exactly what is on screen (filters, sort order and visible columns). It cost little and keeps buttons people may use.
  - **Taken off:** Print Person Details, Print Site Details and the Site "Reports" menu (All Site Jobs, Site Budget), Print Budget and Print Delivery Note on the job card (delivery notes come back as 2.6), Print Stock Order, NCR Print (single NCR).
  - **Removed from the code and install:** the report viewer, the 34 report files and the Crystal references. The Crystal runtime can be uninstalled from PCs once 1.8 is live.
  - **Site address / overview for deliveries:** covered by the delivery notes (2.6).
- [ ] **2.7** Tidy the quote letter template: it has two hidden text boxes holding the old Darwen address and "Botlon Steel Structures". Remove them in Word.
- [ ] **2.8** QFC01 Revision C: in step Q01.1, change "Record Enquiry" to "Record Enquiry in iCONSTRUCTE (new quote from the enquiry email; the email is filed in the quote folder)". In Q01.4/Q01.5, note that the estimate sheet and quote letter are pre-filled from the quote record.

## Stage 2B: Task bots and procurement (agreed in principle 18 Nov 2026)

### iCONSTRUCTE Bot
A small separate program on the server, run by Windows Task Scheduler (e.g. 07:00 daily). It reads the same database and sends emails / Outlook drafts. It runs once, on one machine, and doesn't need anyone to have iCONSTRUCTE open. Each bot has an on/off setting and a recipients list. It needs the HC1.5 shared Outlook routine first.

- [ ] **B1** Overdue Goods In: orders past their delivery date and not received, by job and supplier, with a "chase supplier" draft (QFC03).
- [ ] **B2** Plant hire rates still "to be confirmed" after 2 days: a chase draft to the hire company.
- [ ] **B3** Plant hires past their end date: an off-hire reminder.
- [ ] **B4** Quote follow-up at 7 / 14 / 28 days with no decision, recorded in the existing Chase table (QFC01).
- [ ] **B5** Fab Issue not sent for jobs required on site within 3 weeks (QFC04).
- [ ] **B6** Goods Out:
  - notes due tomorrow and not dispatched;
  - notes held at a finisher longer than expected;
  - over-weight van loads not resolved.
- [ ] **B7** RAMS / crane plan outstanding for jobs starting within 2 weeks (QFC05).
- [ ] **B8** Competency cards expiring in 60 / 30 days (once 5.7 is live).
- [ ] **B9** Monday digest email: the week ahead, i.e. deliveries in / out, jobs starting, overdue items, quotes awaiting a decision (optional; the meeting itself uses the live list, P5).
- [ ] **B10** **"Your actions"** email per project manager each morning (from the Actions list, P4): overdue first, then due this week. This covers procurement, bolts, RAMS / crane plans and any meeting actions.

### Procurement checklist (the failsafe for bolts and anything else that gets missed)
- [ ] **P1** **Procurement** list per job **and per phase** (new table). Liam, 18 Nov: jobs often have several phases (steel procured, fabricated, painted and erected in stages); phase 1 being done must never tick off phase 5.
  - **Each Fab Issue is a phase.** Its issue number (Issue 01, 02 …) is the phase key, and every procurement line belongs to one Fab Issue.
  - Each line is a category (steel, fittings, **bolts**, paint / galv, transport, cranes / plant, site materials, other), with:
    - a status: **Not needed (with reason) / Required, not ordered / Ordered (PO linked) / Received**;
    - the phase's required-on-site date as the need-by date;
    - an order-by date;
    - the job's **project manager** as owner (from the job card).
  - **Lines create themselves from events**, so nothing relies on memory:
    - **each Fab Issue sent** → that phase's Bolts, Paint / Galv (from the finishes ticked) and bought-in items become *Required*;
    - delivery note with external transport → Transport for that phase;
    - crane plan ticked → Cranes / Plant.
  - **Raising an order** against a phase's line moves it to *Ordered*, with the PO number linked. **Goods In "Mark Received"** moves it to *Received*. No double entry.
  - **Failsafes:**
    - (a) a line can only be cleared by ordering it or marking it *Not needed* with a reason (e.g. "bolts free-issued by client");
    - (b) the prompt appears on **every** Fab Issue, for that phase only;
    - (c) dispatching that phase's delivery notes, or closing the job, warns while its required lines are unordered;
    - (d) bot B10 emails the **project manager** each morning with their unordered lines past their order-by date;
    - (e) a red / amber / green badge per phase on the job card, and per job on the Job Cards list.
- [x] **P2 Bolts at every Fab Issue** *(built 19 Nov, test build 10; on the Actions list rather than waiting for P1)*: saving a Fab Issue asks Send for quote / Not needed (reason) / Later, records a Bolts action per phase (Fab Issue number), and a Bolts order on the job closes it. Original spec (the first use of P1): Liam, 18 Nov: the aim is to make sure the step happens, not to schedule bolts in iCONSTRUCTE.
  - **One Fab Issue = one phase** (anything from 1 beam to 25 t).
  - **Bolt list:** always its own list in the job's 03 folder. On each Fab Issue you pick **this phase's bolt list** (the newest not-yet-enquired one is suggested; ones already dealt with show greyed with their status).
  - **Save & Email** then asks:
    - **Send bolt list for quote**;
    - **Bolts not needed for this phase** (reason);
    - **Later**, which keeps it *Required*, chased daily by B10 to the job's project manager.
  - **Send bolt list for quote** opens an Outlook enquiry email:
    - the bolt list attached, plus the job, phase and the date the bolts are needed by;
    - addressed to **BAPP** (normal: 2–3 working days) or **Whites** (around 100 bolts or fewer, or short notice). The suggestion follows the need-by date, and you can tick one or both before sending.
  - **Status for each phase:**
    - *Required*;
    - *Quote requested* (date and supplier(s));
    - *Ordered*, once a Bolts order is raised on the job (the order just references the bolt list name and revision; no bolt-by-bolt lines);
    - *Received* (Goods In).
  - A quote requested but not ordered after 2 working days is chased too.
  - **Owner:** the job's project manager. If someone else issues the Fab Issue, the PM is copied.
- [ ] **P6 Procurement enquiries: quote requests to preferred suppliers, and the prices compared** (Liam, 19 Nov; to be worked through together). A **Request Quotes** pop-up (job card, and offered after a Fab Issue) that drafts the enquiry emails, so every request goes out complete, to the right suppliers and at the job's Execution Class (QFC03 purchasing; BS EN 1090-2 / NSSS requirements stated up front, as the order notes already do).
  - **What's being asked for** (drop-down / ticks, more than one per enquiry): structural steel sections; profiled fittings (plates / flats / profiles); bolts; cold rolled members; painting; galvanising; plant hire; transport.
  - **Who to:** each item maps to a supplier category: sections → **Stockholder**; fittings → **Profiler**; bolts → **Bolts / Fixings**; cold rolled → **Cold Rolled** (own category, decided 19 Nov); painting / galvanising → **Finisher**; plant hire → **Plant**; transport → **Transport**. **Normally 3 suppliers** (Liam): the top 3 ★ preferred in that category are ticked; change, add or remove before drafting.
  - **Attachments from the job's 03 folder** (decided 19 Nov):
    - **sections:** the **members list** (Tekla "MEMBERS LIST", e.g. "2627-004 - L1 Angle Bracing - Members - Rev A.csv") **plus the NC1 files and part drawings** for the marks on it;
    - **plates / profiles:** the **fittings list** (Tekla "FLATS AND PLATES LIST", e.g. "2627-004 - L1 - Fittings - Rev A.csv") **plus the NC1 files and fitting drawings** for its marks;
    - bolts: the bolt list (as the P2 bolts prompt); finishes: the QA list; the pop-up shows each file to untick before drafting. Superseded (00-SS) never included.
  - **No load summary in the email body** (Liam, 19 Nov): the lists are attached and speak for themselves. (The lists are still read in the background for the quote comparison's £ / tonne; checked on Liam's samples: members 1,175 kg, fittings 931 kg, matching the lists' totals.)
  - **The email:** Liam supplies the template wording per item (to be adapted before sending); each draft fills in job, project, site town, required-by date, delivery address / workshop door, the **Execution Class** requirements (from the same blocks as the order standard notes, OrderStandardNotes.txt, so enquiry and order never disagree; EXC3 / EXC4 traceability), what to quote (price, lead time, carriage, validity, 3.1 / DoP / galv certificates) and a **"Your request"** box typed into the pop-up and placed in the draft.
  - **One email per enquiry, suppliers in BCC** (Liam, 19 Nov): a single Outlook draft with the chosen suppliers' contact emails in **BCC** (so no supplier sees the others), our own address in To, the lists attached; checked and sent by the person.
  - **Record and chase:** each enquiry is logged against the job (items, suppliers, files sent, who, when) and raises a **Quote follow-up** action (e.g. 3 working days) that closes when the prices are in or an order for that item type is raised. The P2 bolts prompt becomes one use of this pop-up, not a second routine.
  - **Returned prices analysed (quote comparison):**
    - each enquiry gets a **Quotes** grid: one column per supplier asked; rows for price, carriage, lead time / delivery date, validity, certificates included, notes; the supplier's quote PDF / email attached to it (filed in the job's 04 - Procurement Quotes);
    - worked out from the lists: **£ per tonne** (price ÷ list weight) and, for fittings, **£ per piece**; total including carriage; days to delivery against the date needed;
    - **lowest total** highlighted green; a supplier whose lead time misses the needed-by date flagged red; a quote past its validity flagged;
    - **Accept** a quote: marks the winner (reason if not the cheapest), raises the **purchase order** pre-filled (supplier, line type, description from the summary, total, delivery date, standard notes) and closes the follow-up; the others marked "not used";
    - over time: £/t by supplier and category across jobs (who's sharpest for sections vs fittings), feeding the ★ preferred choice and estimating;
    - first version: prices typed in from the reply (a few fields per supplier); reading the figures out of the supplier's PDF automatically can follow once the layouts are known.
  - **Ties in with:** P1 procurement checklist (enquiry → "Quote requested", accepted → "Ordered"); 2.13 approved suppliers (warn if not approved for that category, QP05); QFC03 Rev C wording.
  - **Waiting on Liam:** the template emails per item; confirm the file names for NC1 files and part / fitting drawings in 03 (are they named by mark, e.g. "M1003.nc1", "F1051.pdf"?) so the right ones are picked for each list.
- [ ] **P7 Supplier invoice matching** (Liam, 20 Nov: paste incoming invoices in; where the purchase order and value match, close the invoice off in iCONSTRUCTE as approved; compile an Excel file of PO number, supplier, value and payment reference; anything without a PO number or with a value that doesn't match goes on the same file with the reason it wasn't passed). QFC03 (purchasing and goods receipt), QP05 (verification on receipt).
  - **Invoices tab** (beside Goods In): drag in invoice PDFs, or the emails they arrive on, one or a batch (as quote emails are dropped today).
  - **Read from each invoice:** supplier, invoice number and date, our PO number, net / VAT / gross. Shown for a quick check before anything is approved (first version); suppliers' layouts vary and some invoices are scanned, so reading is proved on real invoices first.
  - **Checks:** PO number present and found; supplier matches the PO; value matches (rule to confirm); **goods received** in Goods In (three-way match: order, goods received, invoice: never approve goods not received); invoice number not already used for that supplier (no paying twice).
  - **Passed:** the order lines are marked Invoiced with the invoice number (fields already on each order line; plant hire invoices go on the existing plant invoice records). **Failed:** left open with the reason.
  - **Excel file (.xlsx)** per run: PO number, supplier, invoice number, date, invoice value, PO value, difference, payment reference, result (**Approved**, or the reason: no PO number / PO not found / supplier doesn't match the PO / value over or under the PO by £x / goods not received / already invoiced). Layout matched to the accounts package's import if wanted.
  - **A bot later, not at first:** run by hand from the tab until reading is reliable on BSS's suppliers' invoices; then the same code can run as a bot (B-series) reading a shared accounts inbox overnight, with the Excel file ready each morning.
  - **Waiting on Liam:** (1) what the payment reference is (supplier's invoice number, accounts system reference, or ours); (2) value match on net (POs are ex VAT) or gross, exact or within a tolerance (e.g. carriage added); (3) part invoices against one PO: check against what's been received so far?; (4) accounts package (Sage / Xero / other) and whether the Excel file is imported into it; (5) a handful of real supplier invoice PDFs, including a scanned one, to build and test the reading.
- [ ] **P3 (idea, not agreed) Phase board.** A read-only board per job (or across all jobs) with one card per phase moving through columns: *Fab issued → Procurement complete → In fabrication → Fab complete → At finisher → Delivered → Erected*.
  - **Only worth building if every column comes from data iCONSTRUCTE already records** (Fab Issue, procurement lines, Goods Out, site app). No manual dragging, or it becomes a second record that drifts from reality (a double-up).
  - **Gap it exposes:** iCONSTRUCTE has no "fabrication complete / final check passed" record per phase (QFC04 Q04.8). That would be worth adding anyway.
  - Decide after P1 / P2 and delivery notes are in use.

- [x] **P4 Actions list: one place for everything someone still has to do** (Liam, 18 Nov). **First version built 19 Nov (test build 12):** Actions page (replaces H&S), tables Actions / ActionHistory / ActionOwners / EmployeeLogins (auto-created), Mine / On my jobs / Everyone, PM / type / search / overdue / closed filters, Add / Done / Not needed / Re-open / Reassign with history, default owner per type, Windows login linked to an employee, job card "Actions (n)" button, print. Raised and closed automatically today: RAMS and crane plan (from the job card ticks; existing ticks migrated), plant hire rates to confirm, plant off-hire due, bolts per Fab Issue, and **Budget** (new job card saved with no budgets: the creator is asked, and the action closes itself once a budget is entered; added 19 Nov). **Still to come:** the daily "Your actions" email (B10, needs the bot), actions raised by bolts / transport / finisher orders / delivery notes / proof of delivery as those features are built (the types already exist for adding by hand), quote follow-up (B4), "on your jobs, owned by others" section of the email. It **replaces the H&S tab** and is **where P1's procurement lines live**: one table, not three lists that disagree.
  - **One new table, `Actions`:**
    - job, phase (Fab Issue no., optional), type, description;
    - **owner** (defaults to the job's project manager), due date;
    - status (**Open / Done / Not needed** with reason);
    - where it came from (e.g. "Fab Issue 03"), created by and when, closed by and when;
    - a link to the order / document that closed it.
  - **Rule: any prompt not completed there and then becomes an action.** Examples:
    - bolts "Later" or quote not yet ordered;
    - RAMS / crane plan ticked as required;
    - transport order not raised for an external leg;
    - finisher order missing;
    - over-weight van load;
    - haulier proof of delivery not back;
    - plant off-hire due;
    - quote follow-up.
  - **Actions close themselves when the evidence appears:**
    - a Bolts order raised for that phase;
    - RAMS / crane plan marked complete;
    - transport order raised;
    - signed delivery note attached.
  - "Done" by hand is allowed where iCONSTRUCTE can't see the evidence, but it needs a short note.
  - **Manual actions** can be added too (e.g. from the production meeting), with owner and due date.
  - **Reallocating actions** (Liam, 18 Nov: PMs oversee the whole job, but other staff do specific parts such as transport orders, finisher orders and delivery notes):
    - any action can be **reassigned** to another employee (with an optional note); the history of who it moved from / to is kept;
    - **default owner per action type** (a small settings table), e.g. transport order → transport person, finisher order → buyer, delivery note → despatch person, bolts → the job's PM. New actions go straight to the right person;
    - Actions tab filters: **Mine** (assigned to me) and **On my jobs** (everything on jobs I'm PM for, whoever owns it), so the PM keeps oversight;
    - the morning email goes to the owner; the PM's own email has a short "on your jobs, owned by others, overdue" section.
  - **Actions tab:**
    - filter by **project manager** (defaults to the person logged in), job, phase, type, or overdue only;
    - red = overdue, amber = due within 3 days;
    - double-click opens the job / Fab Issue / order;
    - the **H&S view** is simply the RAMS + crane plan filter (same data, no separate table).
  - **Job card:** an Actions panel showing that job's open actions.
  - **Daily email:** B10 becomes one **"Your actions"** email per project manager each morning: overdue first, then due this week.
  - **Needed:** a link between each Windows login and an employee, so "my actions" and "created by" fill themselves.
  - **Migration:** the existing H&S ticks (JobCardHS) become RAMS / crane plan actions automatically, so nothing is lost.
- [ ] **P5 Production meeting: built into the live Job Cards list** (Liam, 18 Nov: no PDF; the team scrolls the live job list on the meeting-room screen).
  - **Meeting view** toggle on the Job Cards list: larger text for the big screen, and a few extra columns per job (no project manager column: only 4 PMs and everyone knows whose job is whose; still searchable / filterable):
    - current phase (latest Fab Issue) and its required-on-site date;
    - procurement / actions badge (red / amber / green with the count of open actions);
    - next Goods In and next Goods Out;
    - RAMS / crane plan status.
  - **Expand a job** (click the arrow) to see its phases and open actions underneath, without leaving the list.
  - **Add action** straight from the row during the meeting (owner + due date), so meeting actions land in the Actions list (P4) and show next week.
  - Filter by project manager, so each PM's jobs can be gone through in turn.
  - Same data as everywhere else; no separate report to keep up to date.

### Workshop planning
- [ ] **W1 Workshop planner (6–8 week look-ahead)** (Liam, 18 Nov; needs a trial period to settle). **Each Fab Issue (phase) is one bar.** Same phase key as P1 / P4, so no new numbering.
  - **New Planner tab:**
    - weeks across the top (6–8 weeks, setting);
    - one row per phase: job no., project, Fab Issue no., Steelwork / Metalwork, weight (from the QA list once read for delivery notes);
    - today line; weekends shaded.
  - **Unallocated tray:** every Fab Issue sent lands here automatically. The planner gives it a **commencement date** and a **duration** (working days, typed in), and the bar appears on the plan. A re-issued revision keeps its bar.
  - **Material and fittings markers on each bar**, taken from data already held (no re-typing):
    - due dates from the phase's Fab Issue sheet and the job's purchase orders (delivery dates);
    - received / not received from Goods In;
    - a warning if the start date is before the last material / fittings are due, or if anything is overdue and not received;
    - the bar shows amber until everything is in, then green.
  - **Fab complete date** (planned, typed in): the date the phase should be complete and ready for dispatch. When the workshop finishes, **"Fab complete"** is ticked.
    - That tick is the **QFC04 Q04.8 final-check record** that iCONSTRUCTE doesn't have today.
    - It also feeds the phase board (P3) and the Meeting view.
  - **Delivery note flag:** if a phase's fab complete date is within N days (setting, e.g. 5) and **no delivery note** exists for it, the bar shows a red "No delivery note" flag. A **"Create delivery note"** action (P4) also goes to the despatch person.
  - **Editing:** first version by double-click / small dialog (start, duration, fab complete date); drag-to-move can follow if the trial shows it's wanted.
  - **Meeting view (P5):** each job row shows its phases' planned start / fab complete.
  - **Two lanes: Steelwork and Metalwork** (Liam, 18 Nov). Each phase sits in the lane matching its Fab Issue type, and each lane has its own unallocated tray.
  - Labour / capacity loading is **not** in the first version (see Wish list).
- [x] **W2 Site labour planner (12-week look-ahead)** (Liam, 18 Nov). **First version built 19 Nov (next test build):** Site Labour tab (12 weeks, weekends narrow, today highlighted, week numbers), job rows in a shared order (move up / down, remove / restore, add any job), cells with initials / numbers / SUB, green / amber / red / blue, totals (named, to find, subcontract), Ctrl+R fill right, right-click fill 1 / 2 / 4 weeks, copy / paste with Excel, autosave, labour list (initials from the operatives, plus subcontractors / agency, mobiles), start time and working away per job, WhatsApp instructions one per operative (editable, Open in WhatsApp or Copy, recorded, tick in the cells), site app link (named operatives get the job on their phone; My week). Still to come: holidays shown red (with 5.3), attendance → job card labour (W2b). Original spec: It replaces the spreadsheet / calendar where initials are typed against each project and copied across for the expected duration.
  - **New Site Labour tab:** a grid laid out like the spreadsheet, so it feels familiar.
    - **Rows** are jobs, **columns** are working days for the next 12 weeks (weekends shown narrow, usable for weekend work), with a today line and week numbers.
  - **Job rows:**
    - built from the live job list;
    - **custom order** (drag a row, or move up / down); the order is saved and shared, so everyone sees the same list;
    - **remove from planner** for jobs that don't need labour (e.g. commercial variations); a "show removed" tick brings them back;
    - add a job that isn't live yet if needed.
  - **Cells, as now:**
    - type **operatives' initials**, or a **number as a placeholder** for forecast labour (e.g. "2" = two operatives, names to follow);
    - several people per cell (e.g. "JS, MB");
    - **fill right / drag to copy** for the duration;
    - copy and paste ranges like Excel.
  - **Colours:**
    - placeholders show amber;
    - named operatives show green;
    - a red cell means the **same person is booked on two jobs the same day**;
    - later, also red if they're on holiday (once 5.3 Holidays is live).
  - **Daily totals** under each day: heads forecast vs named, so you can see where labour still needs finding.
  - **Initials** come from the employee list (operatives) plus a short list of subcontractors / agency names; hover a cell to see full names.
  - **Instructions by WhatsApp:**
    - select an operative's block (or a job + date range) and press **Send instructions**;
    - iCONSTRUCTE builds the message:
      - job no. and project;
      - dates and start time;
      - site address, postcode and the job card's Google Maps link;
      - site contact and phone;
      - RAMS / induction note;
      - a **"Collect on the way"** box;
      - a free **custom notes** box;
    - **one message per operative, sent individually** (Liam, 18 Nov: this is preferred, so special instructions can be tweaked per person). When several operatives are selected, iCONSTRUCTE steps through them one at a time:
      - each message is shown in an editable box first, so it can be changed for that person;
      - the "Collect on the way" and notes boxes are per person, starting from the shared text;
      - **Open in WhatsApp** opens that operative's chat (their mobile from the employee record) with the message typed; you press Send there, then **Next**;
    - each send is recorded (who, when, which dates), and the cell shows a small tick, so you can see who's been told;
    - **Cost:** the "click to chat" link is free and needs no set-up.
      - Fully automatic sending (no clicking Send) would need the WhatsApp Business Platform: Meta business verification, pre-approved message templates and a charge per conversation. Not worth it at this scale; listed on the Wish list.
      - WhatsApp can't pre-fill a message into a **group** chat. If a whole gang should get it, the message can be copied to the clipboard and pasted into the group.
  - **Later, with the site app (Stage 5):** each operative's allocations show in the app as "My week", next to check-in.
  - **Subcontract:** rarely used; normally a whole project awarded start to finish. Mark the cells **"SUB"** (company name optional, shown on hover). SUB cells:
    - count separately in the daily totals;
    - never trigger clash warnings;
    - get no WhatsApp instructions.
  - **Site hours:** each job is set as **Local** or **Working away**, with a default start / finish time for each, used in the WhatsApp message. Working away means a longer day. *Hours parked 19 Nov (see "Parked").*

- [ ] **W3 Drawing office planner** (Liam, 20 Nov: 4 draughtsmen in house plus several subcontract detailers; allocation is managed on a spreadsheet today). QFC02 (design and detailing).
  - **Job card tick: "Drawings"** (Liam, 20 Nov: named simply Drawings), ticked when the job card is created (new job cards ask, as the budget prompt does); it puts the job on the Drawing Office list. It sits in the job card's **Job ticks** card with RAMS, Crane plan and Commercial only, stored in JobCardFlags (a new column). Unticking takes it off (asks first if it's already allocated).
  - **Drawing Office tab:** every job needing detailing, **red until allocated**; then the draughtsman's name and dates. Columns: job, project, PM, execution class, drawings needed by (from the job's required-on-site date, less the fabrication lead time), allocated to, start, planned issue date, status.
  - **Allocation:** to one of the in-house draughtsmen (employees ticked as drawing office) or a **subcontract detailer** (suppliers in the **Technical** category, added 19 Nov); planned start and issue dates; estimated hours. A subcontract allocation can raise the purchase order to that detailer (cost on the job, no double entry).
  - **Look-ahead per person** (weeks across, like the site labour planner): who is on what, and who has room; a red flag where a job's planned issue date is after its drawings-needed-by date.
  - **Status from what's already recorded where possible:** allocated → in progress → **issued** (the first Fab Issue for the job, or drawings in 03) → complete; only the steps iCONSTRUCTE can't see are ticked by hand.
  - **Who can change it:** planner editors as on the site labour planner (StaffPrivileges, a "DrawingOffice" tick), everyone else views.
  - **Waiting on Liam:** the current allocation spreadsheet (to match its layout and stages), the stages used (e.g. GA / approval / fabrication drawings / revisions), the draughtsmen and subcontract detailers, and the usual fabrication lead time used to work back the drawings-needed-by date.
- [ ] **U1 Main menu grouped, and a "My day" home page (proposed 20 Nov)** (Liam: with all these tabs, do we need a launch pad?). Today's left menu has 11 pages (People, Quotes, Job Cards, Orders, Plant, NCRs, Employees, Goods In, Goods Out, Site Labour, Actions); with the Drawing Office, Workshop planner (W1) and Invoices (P7) it becomes 14, which is too many for one flat list.
  - **Menu by role, order by person** (Liam, 20 Nov): a tick-box sheet of roles against pages decides which pages each role sees (the rest are hidden, not just moved), and **each person can reorder their own list** (drag up / down, kept against their Windows login; "Reset to the role's order" puts it back). No headings or groups to argue over. Needs: a Role on each employee (with the Windows login link the Actions list already has) and the ticks.
  - **The roles workbook** (Sheets artifact "iCONSTRUCTE roles and screens", made 20 Nov) gathers every "who does what" question in one place: **Desktop pages** (which roles see which page, current and planned), **Who can change** (planner editing, attendance, wages CSV, default owners, settings, closing job cards, raising orders, drawing office allocation, invoice approval, seeing costs), **Site app** (features per Manager / Supervisor / Operative, filled in with what the demo does now), **People** (each person's role, the manager who approves their holidays and expenses, a deputy, van drivers) and **Who does what** (default owner for each action type, or the job's PM).
  - **"My day" home page** as the first page (not a page of tiles repeating the menu, which adds a click and nothing else): my urgent actions (urgency 1, overdue), deliveries in and out today and tomorrow, drawings due this week, site attendance to confirm, plant off-hire due; each line opens the thing itself. The same content as the planned morning email (B10) and the Monday digest (B9), so it is built once and used three ways.
  - Order: role pages and personal order once the workbook is filled in; "My day" with or after the bots (B9 / B10).

## Job folders: findings and proposal (18 Nov 2026; decided 19 Nov, see 2.11: today's folders kept)

**What iCONSTRUCTE creates today** for a new job card (table FolderStructure):
`01 - GA Drawings`, `02 - Engineers Drawings`, `03 - Assembley Drawings`, `04 - Procurement Quotes`, `05 - Delivery Notes`, `06 - Drawing Office Models`, `07 - Revisions`, `08 - Purchase Orders`, `09 - QA Docs`, `10 - H&S`, `11 - Instructions & DW Sheets`, `12 - Materials`. New code also writes to `Fab Issues` (not in the list) and `09 - QA` (site returns).

**Problems found:**
- **Delivery notes:** we agreed folder **10**, but in iCONSTRUCTE's list 10 is **H&S** and delivery notes have their own **05**. Needs settling before 2.6 is built: is the live server different from this list?
- **QA:** the site app files into `09 - QA`, but the folder is `09 - QA Docs`, so a second QA folder would appear (logged as bug B012).
- **Fab Issues** isn't in the list, so it's created loose; "Assembley" is misspelt; `07 - Revisions` mixes superseded drawings with everything else (the 00-SS rule already handles superseded drawings inside 03).
- Folder names are typed into the code in several places (HC1.7).

**Proposal (new jobs only; existing jobs keep their folders):** one folder per stage of the job, in the order of the QFCs, so anyone can guess where a document lives:

| Folder | Holds | QFC |
|---|---|---|
| `01 - Enquiry & Order` | client order / contract, quote, specs, correspondence | QFC01 |
| `02 - Design` | engineer's drawings, calcs, specs, RFIs | QFC02 |
| `03 - Drawings` | GA, assembly drawings, QA lists, bolt lists, models; `00-SS` for superseded | QFC02 |
| `04 - Procurement` | supplier quotes, purchase orders, plant hire, transport orders | QFC03 |
| `05 - Materials & Certs` | 3.1 certificates, goods-in delivery notes, bolt certificates | QFC03 / QFC06 |
| `06 - Fabrication` | Fab Issues, ITP, inspection and weld records, NDT | QFC04 |
| `07 - Finishes` | galv / paint certificates, DFT records | QFC04 |
| `08 - Delivery Notes` | outgoing delivery notes and signed PODs | QFC04 |
| `09 - Site` | RAMS, crane plans, permits, site QA returns, photos, day work sheets | QFC05 |
| `10 - Handover` | completion certificate, closed ITP, DoP / UKCA, H&S file | QFC05 / QFC06 |

- **Liam's feedback (18 Nov):**
  - no `Enquiry & Order` folder: the enquiry, quote and order already live in the quote's folder in iCONSTRUCTE;
  - **Engineers Drawings** covers design (no separate Design folder);
  - **03 = Assembly drawings**, which already holds what's proposed (GA / assemblies, QA lists, bolt lists, 00-SS);
  - the rest is close to today's list. **Next:** Liam sends a screenshot of the real folder names from the server, then we agree what goes in each (including where delivery notes, Fab Issues and site QA returns go).
- **How it's built:** one `JobFolders` helper (HC1.7) where code asks for a *purpose* ("purchase orders", "delivery notes"), and the FolderStructure table maps each purpose to its folder name. Renaming a folder is then a data change, not a new build, and old jobs are found by their old names.
- **Old jobs:** left as they are; the helper knows both layouts. Optionally, a one-off tidy can rename folders on live jobs at go-live.
- **Alternative:** keep today's numbers and just fix the three problems above. Smaller change, but the order of folders still doesn't follow the job.

## Health check 1 (18 Nov 2026): findings, all closed 19 Nov

Independent review of everything since 1.7.5 (76 changes, 79 files). The build is clean, all new database code is parameterised and safe, and the existing tables are untouched. Fixes are proposed in three batches:

**Batch A, safety (fix before the next build):**
- [x] **HC1.1** *(Fixed 18 Nov.)* Fab Issue: answering "No" to "issue as next revision?" overwrote the already-issued PDF and added a duplicate register row. Liam: only **New** or **Amend**; two people issuing at once is next to impossible, so no extra locking. Now an issue / revision already sent can only be saved as the next revision (OK) or cancelled, and an existing PDF is never overwritten.
- [x] **HC1.2** *(Fixed 18 Nov.)* Site Issue: closing a job with a blank job number could delete the whole site drawings library (synced to every device). The job number always comes from the job card the Site Issue was raised on (Liam, 18 Nov); now a blank or odd job number can never point at the library itself: the job's site folder must be a named folder directly inside the library, or nothing is deleted or issued.
- [x] **HC1.3** *(Fixed 18 Nov.)* Site returns filing: a locked file was filed again every 10 minutes ("(2)", "(3)" …), on every PC at once. Now each file is moved into a `_Filing` folder first (a file still syncing is left alone; only one PC can claim it), copied to the job folder, checked, then **deleted from OneDrive** (Liam, 18 Nov; it stays in the SharePoint recycle bin for 93 days). Only folders named like a job number (2514-021) are filed.
- [x] **HC1.4** *(Fixed 19 Nov.)* Three side tables saved by delete-then-insert outside a transaction (workshop door, project manager, site location). Each save is now one transaction: if anything fails part way, nothing changes and the old value is kept.

**Batch B, double-ups (one tidy-up):**
- [x] **HC1.5** *(Fixed 19 Nov.)* One Outlook draft routine (`OutlookMail`) now used by Email Order, Email Plant Hire and Fab Issue. It releases every Outlook object as soon as the draft is shown (never closes Outlook itself), so Outlook isn't held in the background and the next draft opens cleanly. The "Outlook not available" fallback (PDF shown in Explorer, mail program opened) is shared too.
- [x] **HC1.6** *(Fixed 19 Nov.)* One "save PDF to the job folder with revisions" routine (`JobPdf`) for Email Order and Email Plant Hire, ready for transport orders and delivery notes. Same behaviour as before: first issue, then "rev 1", "rev 2" only when the document changed; existing revision records still recognised.
- [x] **HC1.7** *(Fixed 19 Nov.)* One `JobFolders` helper: every screen (Email Order, Plant Hire, Fab Issue, Site Issue, H&S tab, site returns, job card Documents) asks it for the job folder by purpose (purchase orders, assembly drawings, H&S …). It finds the job's folder by its number ("08" finds "08 - Purchase Orders" whatever the rest of the name), and creates the job's standard folders if they're missing, including from Fab Issue. Folder names now live in one place (and the FolderStructure table).
- [x] **HC1.8** *(Fixed 19 Nov.)*
  - one file-name cleaner (`FileNames`) for purchase orders, plant hire, Fab Issue, job folders and filed enquiry attachments (long attachment names keep their extension);
  - one list of every table 1.8 adds (`AddedTables`, 8 tables), each created automatically on first use: the checklist for the Azure SQL move;
  - one error-log writer (`CrashLog.Append`) for both crash messages and the old ErrorHandler, same file (`DocStorage\Errors\yyyy_MM.txt`);
  - postcode / web look-up: the job card's look-ups are gone (Liam, 19 Nov: the Site location box only needs to be a Google Maps link that opens; see below), so only the email-drop town look-up remains.
  - **Site location simplified** (Liam, 19 Nov): paste the site's Google Maps link; **Open map** opens it. No postcode button, no what3words, no internet look-up (so no more freezes of up to 48 s). If the link contains the position (full Google Maps links do), the site app still gets it for directions and the distance check; a short phone share link (maps.app.goo.gl) has no position, so the site app shows a Directions button to the link but can't check distance from site.
- [x] **HC1.9** *(Fixed 19 Nov.)* One colour palette in `Theme` (page background, lines, edit boxes, hover, green / amber / red / blue status, calendar fills). Every screen now uses the palette names; no screen has its own colour numbers. The two page backgrounds are now one (very light grey, as the main pages), so Fab Issue's background matches the other pop-ups; near-identical greys, greens and reds were merged (e.g. the Goods In overdue red and the Fab Issue missing-cell red are now the same red; the Goods In calendar's blue selection is now the same pale orange as every other list).
- [x] **HC1.10** *(Fixed 19 Nov.)* Company details and settings are read once at start-up and used everywhere (Fab Issue sheet and register, plant hire PDF, "deliver to office" addresses on orders, job cards, plant and stock orders, quote-from-email). The company logo is converted once and kept. Admin refreshes both when company details, the logo or system settings are saved, so changes show straight away. Supplier names for the Fab Issue finisher list are shared by every Fab Issue window and re-read every 5 minutes.

**Batch C, speed and small fixes:**
- [x] **HC1.11** *(Fixed 19 Nov.)* Nothing slow runs on the screen any more:
  - **dropping an email on a new quote**: reading it, the customer / contact look-ups, the town check over the internet and reading attached PDF drawings run in the background; the drop box says "Reading the email …" and the window stays usable (anything typed meanwhile is kept). Save waits until the email has been read, so it's always filed with the quote;
  - **Site Issue**: the job folder is read in the background, and only folders 01, 03 and 10 are read (not the whole job folder);
  - the site location link expansion has gone (19 Nov);
  - after a failed town look-up, iCONSTRUCTE stops trying for 5 minutes instead of for the rest of the day.
- [x] **HC1.12** *(Fixed 19 Nov.)*
  - **Job Cards**: the job list for the current filters, plus project names, execution classes and project managers, is read once and kept; typing in Search all fields filters it in memory (before: six database reads per pause in typing). Only a search containing a number also checks invoice numbers in the database, once per search. Refresh, saving a job card or changing a drop-down reads fresh data; the kept copy is also dropped after a minute;
  - **Plant**: "filter all" now updates as you type too, searching the kept list the same way.
- [x] **HC1.13** *(Fixed 19 Nov.)* Small items:
  - long PDF paths and file names: file names are capped at 120 characters and lose trailing dots / spaces; a path still too long for Windows stops with a clear message (Email Order, Email Plant Hire, Fab Issue sheet, preview and register) instead of failing or being cut short;
  - Fab Issue revisions: numbers keep their style (1 → 2, 01 → 02, P01 → P02, C9 → C10) instead of resetting to "A"; letters work as before (A → B, Z → AA);
  - `FabIssueExcludeSuppliers` added to the config notes (ADDITIONS file);
  - Print Order writes the standard notes to the order (confirmed wanted, 19 Nov: no change);
  - estimate sheet Summary date: the date was written as text, so the Summary's long date format didn't apply. It's now a real date, so it shows as e.g. "Thursday, November 19, 2026" and never changes.
- [x] **HC1.14** *(Done 19 Nov.)* The Fab Issue window's code is split into five files: the sheet's data and set-up, Layout, Drawings, Register and Output (preview / save / email). The code itself is unchanged (checked line for line); nothing changes for users. Delivery notes can now reuse the parts cleanly.

## Health check 2 (19 Nov 2026): findings, awaiting Liam's go-ahead

Independent review (reviewer had not seen the work) of everything since Health check 1, plus readiness for moving to SQL Server / Azure SQL and the desktop ↔ SharePoint ↔ site app link. Build clean. **HC1 fixes confirmed sound** (Fab Issue no-overwrite, library delete guard, transactions, Outlook release, background work, search caches, Fab Issue split identical line for line). No SQL injection risk. The three High findings below were re-checked against the code by Claude and are real.

**Batch D, drawings on site (safety: an operative could see the wrong revision; NSSS 3.1 requires that the latest information is used and superseded information withdrawn):**
- [x] **HC2.1** *(Closed by process, Liam 19 Nov: BSS has a document controller; the drawings in iCONSTRUCTE's 03 folder are always the latest, without question. On revision the old one is moved to superseded (00-SS) and the new one is re-issued to site. Under that rule Site Issue's "Newer revision?" label is correct, so no revision comparison is needed.)* Original finding: Site Issue matches drawings by name only, not revision: an *older* revision still in folder 03 is labelled "Newer revision?" and set to replace the current one. Fix: one shared revision comparison (A<B, P01<P02, 1<2); a lower revision is blocked or needs confirming; warn if two revisions of one drawing would be on site. *Medium.*
- [x] **HC2.2** *(Closed by process, as HC2.1: only the latest revision is in 03.)* Fab Issue "Tick latest revision of each" picks the newest file *date*, not the highest revision (a re-saved old revision would go to the workshop). Fix: same comparison as HC2.1. *Small.*
- [x] **HC2.3 (High, still recommended)** *(Fixed 20 Nov. Liam: old drawings on SharePoint are deleted when new ones are pushed; the office still picks the drawings (20 Nov: not a whole-folder issue). The ticked files go all or nothing (copied as .part files, swapped in, then the register updated in one step with a new issue date); the files they replace are deleted from SharePoint, and a delete OneDrive refuses is retried on every refresh until the job's site folder matches the register.)* This is the system carrying out Liam's rule (old superseded, new re-issued) reliably, whatever the folder holds. Issuing to site isn't all-or-nothing: the database records the change before the file is copied, the copy overwrites in place, and a failed delete (e.g. OneDrive has the file locked) is ignored, so a superseded drawing can stay in SharePoint while iCONSTRUCTE says it's withdrawn. Same for a closed job's folder. Fix: copy to a temporary name then swap; update the database only after success; keep and retry failed deletes and warn the office. *Medium.*
- [x] **HC2.19 (High, still recommended)** *(Fixed 20 Nov with HC2.3: every re-issued file has a new issue date, so phones download it fresh; the manifest also carries each file's size and the phone replaces a saved copy that doesn't match. The app checks for updates when opened, when switched back to, when signal returns and on Refresh.)* Site app offline copies are keyed by file name and issue date and shown first: if a drawing is re-issued under the same file name and the list syncs before the file, the phone can keep showing the old drawing. Fix: each file's size and fingerprint in the manifest, checked on every download; never re-issue under the same name. *Small–medium.*
- [x] **HC2.20 (Medium)** *(Fixed 20 Nov (first part). No timed refresh and no warning banner (Liam, 20 Nov: drawings don't change that often). **Push notifications** (Liam: these will suffice) ("new drawings issued for 2514/021") come with Azure (Stage 4): Android, and iPhone once the app is on the home screen.)* If the app can't refresh, the last list is shown with no time limit. Fix: "last checked X ago" on every drawing, red warning after 12–24 hours. *Small.*

**Batch E, filing and robustness:**
- [ ] **HC2.4 (Medium)** Site returns: a corrected certificate with the same name and size as one already filed is skipped and deleted from OneDrive. Fix: compare a fingerprint; different content saved as "(2)". *Small.*
- [ ] **HC2.5 / HC2.23 (Medium)** Each office user on the server syncs their own copy of the libraries, so two people can file the same return (duplicates) and manifests conflict. Fix: one account publishes and files (config switch). *Small.*
- [ ] **HC2.6 (Medium)** Filing every 10 minutes and the manifest refresh after a job card save still run on the screen thread (can freeze while OneDrive downloads). Fix: run in the background, one at a time. *Small.*
- [ ] **HC2.7 (Low)** PDF fallback to the temp folder treats every later send as a revision. *Small.*
- [ ] **HC2.8 (Low)** Two PCs creating a new table at the same moment: one gets "already exists" once. Fix: catch and re-check; go-live script creates all 8 tables. *Small.*
- [ ] **HC2.9 (Low, unverified)** Estimate sheet: any dd/MM/yyyy value becomes a date number; only do this for known date cells. *Small.*
- [ ] **HC2.10 (Low)** Site app docs out of date (postcode look-up, "_Filed"); manifest still sends what3words. *Small.*
- [ ] **HC2.11 (Low)** Remaining small double-ups (query helpers, unique-file-name, config folder readers). Merge when next in each file. *Small.*
- [ ] **HC2.24 (Low)** Editing a job number leaves its site files in the old folder. Fix: move the folder. *Small.*

**Batch F, site app security and privacy:**
- [ ] **HC2.21 (Medium)** The app asks Microsoft for read/write on *all* SharePoint sites (`Sites.ReadWrite.All`) and keeps sign-in on the phone long-term. Fix: `Sites.Selected` limited to Site Drawings; session-only sign-in on shared tablets. *Small.*
- [ ] **HC2.22 (Medium)** Every operative can read the whole drawings library and manifest (all live jobs, customers, operatives' emails) and, with Edit on Site Returns, read or delete others' returns. Fixed properly by the Azure API (server-side filtering). *Medium.*

**Batch G, getting ready for SQL Server / Azure SQL (do now, cheap):**
- [ ] **HC2.12** Database connection string from config (Access provider is hard-coded). *Small.*
- [ ] **HC2.13** Export the ~50 Access saved queries (getJobCards, getOrders …) to text files in the repo: today their SQL exists only inside the .accdb. *Small.*
- [x] **HC2.14** ~~List the 29 Crystal reports and the tables each uses.~~ *Closed 19 Nov: Crystal removed (2.14), nothing to re-point.*
- [ ] **HC2.15** Remove Access-only SQL from the new code (`#date#`, `= True`); keep a SQL Server version of the 8 added tables. *Small.*
- [ ] **HC2.17** Move the order notes' database code into the data layer. *Small.*
- At migration (not now): SQL Server Migration Assistant for tables and queries; swap the provider to MSOLEDBSQL so the existing code keeps working; replace `@@IDENTITY` (HC2.16); re-point the reports; measure speed. **Estimate: 15–25 developer days** for the move including a full test pass; a full data-layer rewrite (not needed) would be a further 20–30. Biggest unknown: the content of the saved queries (HC2.13 answers it).
- **HC2.18 (privacy, existing):** NI number, bank details and date of birth unencrypted in the Access file on a share (same as 2.1). Lock down or move out; encrypt / restrict at migration.

**Recommended direction for the site link:** keep the OneDrive file sync for the pilot, with Batch D fixed and one publishing account; replace it with the Azure API (Stage 4) before rolling out beyond the pilot: drawings uploaded with a fingerprint, old revision superseded in the same step, each operative's list filtered on the server, returns sent with an ID so a resend never duplicates, nothing deleted until filing is confirmed.

## Health check 3 (19 Nov 2026, evening): findings, awaiting Liam's go-ahead

Independent review (reviewer had not seen the work) of the 59 changes since Health check 2: delivery notes and Goods Out, Actions additions, budget prompt, spelling / searches, preferred suppliers and categories, quote site, site labour planner, attendance booking, week plan. **Build: 0 errors** (8 old warnings, none in new code); site app JS checks pass. The three High findings were re-checked against the code by Claude and are real.

**Confirmed sound:** all new SQL parameterised; no reserved-word columns in the 21 added tables; PDFs WinAnsi-safe; no file overwritten (delivery notes, signed copies, quote folders); route / planner / quote-site saves in transactions; nothing personal on the Actions list; no check-in locations in Access; Crystal fully gone; JobFolders / FileNames / OutlookMail / DocLayout reused; planner grid repaint and searches in memory; site app role guards and escaping consistent.

**Batch H, attendance and labour booking (recommended before test build 14):**
- [x] **HC3.1 (High)** *(Fixed 19 Nov. Liam: confirming is one person's action: the Site attendance action goes to the Default Owner for "Site attendance", else the first planner editor; only planner editors can open Confirm attendance. Also made safe on its own: the day is claimed in the attendance table first (its key refuses a second claim), then the labour is booked, and the claim is released if booking fails; what's already confirmed is re-read at the moment of confirming.)* Attendance can book Work Log hours twice: "already confirmed" comes from the window's copy, the labour line is written before the attendance record (separate connections, no transaction) and the record is deleted then re-inserted. Two PCs confirming the same day, or one failed write then a retry, books 20 h instead of 10. Fix: attendance record first (its key rejects a duplicate), then the labour line, in one transaction; a duplicate means "confirmed by someone else" and reloads. *Small–medium.*
- [x] **HC3.2 (High)** *(Fixed 19 Nov. Liam: job cards usually stay open a week or more after completion, until the production meeting or month-end valuations, so this is rare; the fix cost one line: attendance now reads every job with planner entries, closed or removed.)* A job closed (or removed from the planner) before its last days are confirmed: those days never appear, no hours are booked, and the Site attendance action still closes. Fix: attendance reads every job with planner entries in the range, whatever its status. *Small.*
- [x] **HC3.3 (High, house rule)** *(Fixed 19 Nov as Liam asked: "If not attended" picks Moved to another job / Not needed / Absent / Other; Other takes a short note headed "no medical or holiday details"; no reason goes on the labour log.)* The not-attended note prompts "sick, holiday" into the Access file, the Work Log comment and the wages CSV. Fix: a fixed reason list (Moved job / Not needed / Absent, reason held by manager / Other with a "no medical or holiday details" warning); no reason on the Work Log. *Small.*
- [x] **HC3.4 (Medium)** *(Fixed 20 Nov. Liam: use the check-in / check-out data from the site app. Until check-ins are live: someone on two jobs the same day has the day split between them (5 + 5, editable) and is flagged; hours already in the labour log that day are shown; booking more than a full day asks first. Once live, the split comes from the check-in times at each site.)* Someone on two jobs the same day is booked 2 × 10 h; hours already in the Work Log for that person and date aren't checked. Fix: flag clashes in Confirm and ask for the split; warn on existing hours. *Small.*
- [x] **HC3.5 (Medium)** *(Fixed 20 Nov. Failsafe (Liam asked): confirmed planner cells lock (grey italic, can't be typed over, pasted or filled); to change one, a planner editor uses Reverse booking in Confirm attendance, with a reason: the labour line comes off the job card and the cell unlocks, all in one step, recorded in SiteAttendanceReversals; the attendance key still refuses a second booking underneath.)* Editing a past, already-confirmed planner cell can book the person again on the new job. Fix: confirmed cells read-only (or offer to reverse the booking). *Small.*
- [x] **HC3.6 (Medium)** *(Fixed 20 Nov. Liam: a pop-up on the planner for unverified labour: when a planner editor opens Site Labour, any planner days in the last two weeks not yet confirmed are listed (once a session) with "Confirm the earliest day now?". The Actions list raises one Site attendance action per unverified day (any day of the week, so weekend work and the day after a bank holiday are never missed).)* The daily Site attendance action only looks at the previous working day: yesterday's stays open once confirmed later, and a skipped day (or a bank holiday Monday) is never raised. Fix: check every open attendance action and every unconfirmed day in the last N days; bank holidays in one working-day helper (HC3.17). *Small.*
- [x] **HC3.19 (Low)** *(Fixed 19 Nov: Confirm says which people were booked at £0.)* An operative with no on-site rate is booked at £0 without warning. *Small.*
- [x] **HC3.20 (Low)** *(Fixed 20 Nov. Liam: the Wages CSV is now the **Timesheet**, an Excel file saved in a Timesheets folder for accounts and management (config TimesheetFolder; default the documents folder's Timesheets). Sheet **Payroll** (Liam, 20 Nov: payroll needs just names and hours to work down): one line per person with total hours, days on site and days not confirmed, plus a total; sheet **By job**: hours per job; sheet **Detail**: name, date, job, site, hours, status. No pay, rates, overtime, clock times or notes.)* Wages CSV: default to the user's own Documents, "contains personal data" line, neutralise values starting = + - @ (Excel). *Small.*

**Batch I, sharing between PCs and the site app:**
- [ ] **HC3.7 (Medium)** Two PCs syncing actions at once can create duplicate automatic actions (the older never closes). Fix: close extra copies as duplicates in Sync. *Small.*
- [ ] **HC3.8 (Medium, makes HC2.22 worse)** *(Reduced 19 Nov, Liam: the phones only get this week (and next Monday from Friday), and the app shows each person only their own days; supervisors also see who is with them on their sites; managers the team. The manifest still lists the whole week for everyone, so the server-side filter (Azure, Stage 4) is still needed.)* The site manifest now holds every operative's email and where they are for 14 days, readable on every phone; the Team view is restricted only in the app. Fix for the pilot: initials plus a hashed email for "My week"; the Team grid only through the Azure API (Stage 4). *Small.*
- [x] **HC3.9 (Medium)** *(Fixed 20 Nov. Liam: a Lock / Unlock button: **Unlock to edit** takes the planner for one person (others see "Being edited by … since …" and view only); **Lock (finished editing)** gives it back; a lock not used for 30 minutes is free; taking over asks first, and a change made after being taken over isn't saved. Table EditLocks.)* *(Much less likely 19 Nov: only the ticked planner editors can change the planner, usually one of four with the PMs present; the check is still worth adding.)* Two people editing the planner can overwrite each other's cell without warning. Fix: check the cell hasn't changed since it was read; if it has, reload and say so. *Small.*
- [ ] **HC3.10 (Medium, makes HC2.6 / HC2.23 worse)** Site app republishing after planner edits: edits made during a publish can be missed, job card and planner publishes can collide on one temp file, and every PC rewrites the manifest. Fix: one publish queue with a short quiet period. *Small.*
- [ ] **HC3.23 (Low, test-bed safety)** The test install doesn't clear the Site Drawings / Returns folder settings; with the planner publishing quietly, a test copy so configured would overwrite the live site manifest. Fix: the install removes them and publishing refuses on the test documents folder. *Small.*

**Batch J, delivery notes and speed:**
- [x] **HC3.12 (Medium, NSSS 8.1.5 / QFC04)** *(Closed 20 Nov, Liam: the driver or supplier completes the note and returns it with photos; a completed leg turns green as now and shortages are dealt with separately (NCR).)* A shortage or damage recorded at a finisher doesn't flag the onward leg, which still lists the full load. Fix: the next leg shows amber "previous leg short / damaged" and dispatch asks to amend the load or raise an NCR. *Small.*
- [x] **HC3.13 (Low)** *(Closed 20 Nov, accepted risk: notes are raised and completed by one person.)* Completing a note twice (two PCs) can wipe the signed-copy link. *Small.*
- [x] **HC3.14 (Low)** *(Closed 20 Nov, accepted risk, as HC3.13.)* Two people raising notes on one job at the same moment can both get DN05. *Small.*
- [ ] **HC3.11 (Medium)** *(Liam, 20 Nov: understood; queued.)* Slow work on the screen: the 03 folder scan and QA list reads (Delivery Note, Bolts prompt), and Actions.Sync after every job card save now reads every Goods Out note, all job cards and employees. Fix: background scans; Sync reads only live notes and caches the day's attendance check; Sync after save in the background. *Medium.*
- [ ] **HC3.24 (Low, QFC04 Q04.8)** A delivery note can be raised with no final check recorded; tie in with W1's fab-complete tick when built. *Small.*

**Batch K, tidy-ups (when next in each file):**
- [ ] **HC3.15 (Low)** Supplier categories inserted into the existing SupplierType table automatically, with a catch-all fallback; move to the go-live script or check by name in a transaction. *Small.*
- [x] **HC3.16 (Low)** *(Fixed 20 Nov. Liam: every error goes in the log, to be imported here monthly for fine tuning. All 151 places that carried on silently now write to the monthly error log (Docs\Errors\yyyy_MM.txt), marked "Handled", once per place per hour; every entry now shows the user, PC and version. Send the month's file at the start of each month.)* Silent `catch {}` in Actions.Sync (Goods Out, attendance rules), manifest allocations and AttendanceForm: log to the error file. *Small.*
- [x] **HC3.17 (Low)** *(Fixed 20 Nov. Liam: bank holidays editable by a manager / admin; then (20 Nov) "can this not just auto-update?": yes. One WorkingDays helper (table BankHolidays, seeded with 2026–27 England and Wales) used for every due date and attendance; **updates itself**: when iCONSTRUCTE starts it fills this year and next from GOV.UK if they're missing (in the background, once a day; hand-entered dates never replaced); **Site Labour > Bank holidays…** (planner editors) to correct them; only if next year still isn't in by 8 December does an action ask for it; the planner shows bank holidays as BH, shaded like weekends.)* Double-ups: working-day / Monday logic in 7 places (none knows bank holidays); the "(2)" unique-file-name loop twice more; small string helpers copied into 5 files; People search repeats the Job Cards search pattern. Fix: one WorkingDays helper with bank holidays, one FileNames.Unique. *Small.*
- [ ] **HC3.18 (Low)** *(Explained to Liam 20 Nov: bare numbers such as StatusId 1 = live, RateId 1 / 4 / 2,3,5,6 = on-site / off-site / overtime, item type 37 = bolts, Goods Out statuses as text. If a rate or status were ever renumbered in Admin, totals would go wrong silently. Fix: one list of named values used everywhere, plus a start-up check that warns if the database no longer matches. With batch G.)* Magic numbers (status 1 = live, rate 1, operative type 2, bolts type 37, Goods Out statuses as text, Access date literals). *Small.*
- [x] **HC3.21 (Low)** *(Fixed 20 Nov. Liam: in line with BST. The week plan no longer steps weeks; the other site app date sums (My week, off in the next 2 weeks, card expiry days) now count calendar days, so the clocks changing never shifts a day.)* Site app Week plan: Next across the October clock change starts the week on Sunday. *Small.*
- [x] **HC3.22 (Low)** *(Fixed 20 Nov. Why: Windows' week-number function puts some late-December days in the wrong week. Liam works to dates, so the planner shows the month on each Monday instead of a week number.)* Planner week numbers wrong on 29–31 Dec in some years (next in 2031). *Small.*

Not checked: NSSS clause numbers against the PDF (not on the reviewer's disk); QFC04 / QFC05 Rev B were read.

## Process review: QFC01–QFC06 (runs alongside the stages)

Purpose: get the first principles right. Go through each QFC flowchart step by step and find where iCONSTRUCTE can do the work, remove re-typing, or add a small function. Changes to the QFCs themselves are allowed (Rev C).

For each QFC, one short review covering:
1. Each step (Q0x.n): who does it now, and what record it leaves (QFC06).
2. What iCONSTRUCTE already does for that step, and where data is typed twice.
3. Small functions that would help, each sized: small / medium / large.
4. The QFC Rev C wording changes needed.
5. Any NSSS clause the step must satisfy.

Agreed items go into the stages above as normal changes.

- [ ] **QFC01** Enquiry to Order Entry (already touched: quote from email, filled letter and estimate sheet; Rev C wording in 2.8)
- [ ] **QFC02** Design & Detailing (drawing register, issue control, superseded folders)
- [ ] **QFC03** Purchasing & Goods Receipt (orders, Goods In, delivery-note check against the order (NSSS 4.1.1), certificates)
- [ ] **QFC04** Steelwork Fabrication & Despatch (Fab Issue, QA list, delivery notes / Goods Out)
- [ ] **QFC05** Site Erection (RAMS / crane plan, site app, day work, inspection and handover)
- [ ] **QFC06** Identification & Traceability (one record list, checked against everything above)

## Stage 3: Site drawings for operatives

- [ ] **3.1** IT installs the **OneDrive sync client on the cloud server** (per-machine install).
- [ ] **3.2** **Interim:** point `SiteDrawingsFolder` at a synced OneDrive folder, issue a job, and share the job folder link with one gang. *Done when: a gang opens a drawing from the link on site.*
- [ ] **3.3** **Decision:** operative accounts. Choose one:
  - F1 licences (about £2.30 per user per month);
  - guest accounts for subcontract erectors;
  - stay on links.
- [ ] **3.4** Set up the SharePoint "Site Drawings" site, the app registration and hosting (see `claude/site-app/SETUP.md`).
- [ ] **3.5** **Pilot with Liam only**, then one gang on one job, then everyone.

## Stage 4: Azure foundation (needed for the field app)

- [ ] **4.1** Create an Azure subscription in BSS's name, in the UK South region.
- [ ] **4.2** Host the site app on Azure Static Web Apps. Try the demo with `?demo=1`.
- [ ] **4.3** **Decisions:** BSS's own form templates or the drafted ones; who approves holidays and expenses; leave allowances and managers per employee.
- [ ] **4.4** Write the staff notice about recording location at check-in (UK GDPR).
- [ ] **4.5** Build the Azure database and API (spec: `claude/site-app/API.md`).

## Stage 5: Field app, one section at a time

Each section has its own pilot: Liam first, then one gang, then everyone.

- [ ] **5.1** Check in / out and timesheets
- [ ] **5.2** RAMS sign-off and toolbox talks
- [ ] **5.3** Holidays, with the team calendar
- [ ] **5.4** Expenses, with the payroll export
- [ ] **5.5** Quality forms: day work, line/level/plumb, bolting, welding, snagging, NCR, completion certificate
- [ ] **5.6** **Delivery notes on the driver's app** (own transport; needs 2.6 and Stage 4).
  - **Sending it:** in iCONSTRUCTE, "Send to driver" pushes the note to the chosen driver's app; the note shows "With driver".
  - **The driver's Deliveries section:**
    - today's notes, with the address, a map / directions link, site contact (tap to call) and the load list;
    - works without signal and sends when back in coverage.
  - **At delivery:**
    - photos: load on the vehicle, as delivered, any damage;
    - confirm the load was received complete, or note any shortages / damage against the items affected;
    - receiver's printed name and signature on the phone;
    - time and location recorded at signing only.
  - **Back in iCONSTRUCTE:**
    - the note turns Delivered;
    - a signed PDF (signature, receipt details, photos added as extra pages) replaces the unsigned copy in the job folder;
    - optionally emailed to the customer automatically;
    - shortages and damage are flagged on the job card for follow-up (QP08 NCR if needed).
  - **Back end:** the Azure spec gets DeliveryNotes / DeliveryItems / Photos and two endpoints (driver's notes; proof of delivery); see `claude/site-app/API.md`.
- [ ] **5.7** **Competency cards on the app** (needs Stage 4).
  - **My cards:** each operative photographs the front and back of each card. Examples:
    - CSCS, CPCS / NPORS, IPAF, PASMA, SMSTS / SSSTS, first aid, slinger / signaller, abrasive wheels;
    - welder qualification certificates (BS EN ISO 9606-1, NSSS 5.2).
  - **Details stored per card:** type, card number, category, expiry date.
  - **On site:** the cards are kept on the phone, so they can be shown at the gate or induction without signal.
  - **Expiry reminders:**
    - the operative is reminded 60 and 30 days before a card expires;
    - the office sees the same list.
  - **In iCONSTRUCTE:**
    - each employee record shows their cards and photos; the existing CSCS Card Number field is filled from the app;
    - a competency matrix (who holds what, with expiry dates) for RAMS / induction packs and tender questionnaires;
    - expired cards show red.
  - **Data protection:** card photos are personal data. Only the card holder and the office can see them, and they're deleted when someone leaves (agree the retention period).
  - **Back end:** a Competencies table and the existing file upload in the Azure spec (`claude/site-app/API.md`).

- [ ] **5.8 3D model on site, and marking steel off as erected each day** (Liam, 19 Nov: "marking items off as installed daily would be a game changer"). Desktop part (issuing the model) plus a site app viewer. QFC05 (erection), NSSS 9 (erection: bolting, alignment and the line / level / plumb check before sign-off), NSSS 3.1 (latest information on site).
  - **The model on the phone:** the job's Tekla IFC is issued through **Site Issue**, the same as drawings: only the job's operatives get it, the latest revision replaces the old one (superseded withdrawn), kept on the phone for no-signal sites. Shown as **"For information: erect from the issued drawings"**; the 2D drawings stay the controlled document.
  - **Viewer** (open source, no licence cost: web-ifc MPL-2.0 and That Open Components MIT; not xeokit, which is AGPL): spin / zoom, section cut, show by phase, level or grid; tap a member to see its **assembly mark, profile, phase and weight**, with a link to its **assembly drawing**. Large models converted to the lighter Fragments format when issued, so older phones cope.
  - **Status per assembly, coloured on the model and in a list:**
    - **Not delivered** (grey) → **Delivered** (blue, from the signed delivery note / Goods Out, 2.6: no re-typing) → **Erected** (amber) → **Bolted and checked** (green: final bolting / torque and line, level, plumb done, NSSS 9) → (optional) **Snag** (red, opens the snag list, QA by job).
    - Separate Erected and Checked steps on purpose: steel stood up isn't complete until it's bolted and checked.
  - **Marking off on site (end of each day):** tap members, or select a whole **bay / level / grid line / phase** at once, then **Erected today** or **Bolted and checked**; who, when and the date are recorded; works offline, sent when there's signal. A list view (by mark, filterable) for anyone who'd rather tick than tap the 3D. Undo by the same person the same day; later changes by a supervisor with a note.
  - **Daily progress, back in the office:**
    - per job and phase: pieces and **tonnes erected / checked**, against delivered and the total; a daily progress line for the job;
    - the job card gets an **Erection progress** panel; the site diary / day report can include "today: 14 members, 6.2 t erected";
    - **tonnes erected for valuations / applications for payment** (from the model's weights; no measuring up);
    - with the planner and attendance (W2 / W2b): **tonnes per man-day** per job, for future estimating;
    - nothing left as erected but not checked for more than N days without showing amber (supervisor action).
  - **Model revisions:** status is kept against each assembly's **Tekla GUID and assembly mark**, so a re-issued model keeps what's already erected; members deleted in the new revision are listed for the supervisor to clear, new ones start as not delivered.
  - **Needs:**
    - Tekla IFC export settings that carry the **assembly mark, phase and weight** and export assemblies as assemblies (check on a sample);
    - the site app on Azure (Stage 4) to store status (it's job data, not personal data, but it has to reach the office and every phone); pilot can start on the SharePoint returns route;
    - delivery notes (2.6, built) for the Delivered status.
  - **Test viewer built 19 Nov** (site app preview, demo job 2514/021, Liam's sample "The Bond Roof Terrace - Test.ifc"): `SiteApp/model.js` (screen) and `vendor/model-viewer.js` (three.js + web-ifc, about 4 MB, loaded only when a model is opened; source `SiteApp/viewer/`, rebuilt with `viewer/build.sh`). Job page gets a **3D model** section; tap members (drag turns, pinch zooms), info card (profile, material, length, weight, phase, levels, bolts), **Erected** / **Bolted & checked** / Reset for Managers and Supervisors (feature `erect`; operatives view only, feature `model`), progress bar (pieces and kg), member list with filters, hide bolts / hide selected (the "About this export" notes were taken off, Liam 19 Nov). Test only: ticks kept on the phone.
  - **What the sample export showed (Tekla 2025 SP7, IFC2X3; fix in the export settings before 5.8 is built):**
    - **no erection marks**: Assemblies are Off and no mark property is exported (only "Preliminary mark", empty), so members can't be found or reported by mark. Export with Assemblies On and ASSEMBLY_POS / PART_POS in a property set;
    - **two plates over 5 t** (PLT150*19552.8 at 103 t and PLT10*19552.8 at 7.2 t, both 19.5 m) make up 110 t of the file's 112 t: reference slab / placeholders. The real steel is 52 members, 1.65 t. The viewer hides and leaves out anything over 5 t, but they should be left out of the export, or tonnes erected for valuations will be wrong;
    - **one phase** (1) on every part: phases need to match the Fab Issues for progress per phase;
    - profile is in the IFC Description, weights (kg), lengths, levels, materials and the site bolts (M12 / M16, 8.8, "Site") all come through.
  - **Assemblies, not parts** (Liam, 19 Nov: listing every part could mean thousands of rows): the viewer groups parts into their Tekla assembly (IfcElementAssembly), so the list has one row per assembly (mark, main part profile, number of parts, weight), tapping any part selects its whole assembly, and Erected / Bolted & checked are recorded per assembly. A file exported without assemblies (as the prelim sample) lists parts, with a one-line note. Checked with a copy of the sample with two assemblies added.
  - **Dated erection log** (Liam, 19 Nov: where is the data per day?): every tick adds a line (job, model, assembly ID, mark, weight, Erected / Bolted & checked / Reset, who, date and time); nothing is overwritten and a Reset is a line too. The status shown is each assembly's last line. **By day** lists, per day, assemblies erected (first erected, or straight to checked) and bolted & checked, with marks, tonnes and who; corrections counted; **Today** line on the progress card; **Download log (Excel)**: an .xlsx with a "By day" sheet and the full "Log" (opens in Excel on the desktop and on phones; CSV dropped as it won't open on a phone, Liam 19 Nov; written by `SiteApp/xlsx.js`, no library). *Test: kept on the phone.* **Live:** the same lines go to Azure SQL through the API (append-only), every phone and the office see one log, and iCONSTRUCTE reads it for the job card's erection progress and valuations; pilot before Azure: each day's lines sent as a file by the site-returns route to the job's 09 folder and read into a new Access table (not personal data).
  - **Liam, 19 Nov: the sample is from a preliminary model**, which explains the missing marks, the single phase and the placeholder slab. The real test needs a numbered, issued model (marks exist only after numbering).
  - **Next:** an export of a numbered, issued model with the settings above (assemblies, marks, phases, no reference slab), then try on a phone on site: load time, finding a member by mark, marking a bay at the end of the day.
  - **Alternative considered:** Trimble Connect's own phone app opens Tekla / IFC models today with nothing to build, but revisions are then controlled in Trimble rather than by the document controller through iCONSTRUCTE (NSSS 3.1), needs separate accounts, and its status data wouldn't reach the job card, valuations or labour figures.

- [x] **W2b Attendance → job card labour, clock times to CSV** (Liam, 19 Nov). **Confirm-and-book built 19 Nov (next test build); clock times and overtime fill in when the site app's check-ins are live.** Decided 19 Nov:
  - **Hours booked to the job card's labour:** **10 hours local, 12 hours working away** per person per day (cover travel each way; the actual start time is advised per job). Config `SiteDayHoursLocal` / `SiteDayHoursAway`.
  - **Overtime:** worked overtime appears on the **CSV for wages**; rounded to the nearest hour when it goes into the job card's labour log (with the clock times, once live).
  - **Confirming:** a daily **"Site attendance" action** each morning for the previous working day (Friday on a Monday), closed when every planner entry for that day is confirmed.
  - **Subcontract / agency:** the same hours as BSS operatives (10 / 12), booked to the employee record they're linked to on the labour list.
  - **Built:** Site Labour > **Confirm attendance…** (everyone the planner had on site that day, ticked as attended; hours 10 / 12 editable; not attended needs a note) books attended people to the job card's labour log at their on-site rate, through the existing Work Log code; each confirmation is kept (table SiteAttendance) so nothing is booked twice. **Wages CSV…** saves a week: date, person, job, site, local / away, attended, hours booked, clock in, clock out, hours clocked, overtime, confirmed by, note.
  - **Still to come (needs the site app live, Stage 4 / 5.1):** clock-in / out times filled from the check-ins; attended pre-ticked only where the check-in matches the job's site (others flagged); overtime (hours clocked over 10 / 12) on the CSV and rounded to the nearest hour into the labour log at the overtime rate.

## Manager dashboard (Liam, 19 Nov: proposed; **decided 19 Nov: on Azure**)

**Decision (Liam, 19 Nov): "if an Azure dashboard is the best way to go, then so be it".** Why a restricted table inside iCONSTRUCTE isn't enough: Access (.accdb) has no per-user or per-table permissions; a database password covers the whole file and iCONSTRUCTE has to hold it to open the file, so anyone running iCONSTRUCTE (or opening the file in Access) can read every table. The only real lock on the share is Windows folder permissions on a **separate file**, which managers could read but staff couldn't; but staff and site operatives couldn't then submit requests into it, and the phones can't reach it at all. Azure SQL behind the API gives each person only what they're allowed (own records; a manager their team), works from the phones and the office, and keeps the personal data out of the shared file.
**Built 19 Nov (demo mode, goes live with Stage 4): "Manager tools" in the site app** (Liam: build it into the mobile app, labelled Manager tools). Managers get a Manager tools entry on Home and in the account menu: on site now, waiting for you (holiday requests, expense claims, timesheets to approve, competency cards), today's status per person (flagged check-ins, missed check-outs), who's off in the next 2 weeks, cards expiring; time keeping week grid with Approve week (hours go to the Work Log against each job); person detail; competency card matrix with "seen the original" and CSV export. Everyone gets **My cards** (photos, number, category, expiry, kept on the phone for the gate). API spec updated (team endpoint, cards and timesheets, managers see only their own team). Still needed: the Employee fields Role and ManagerId in iCONSTRUCTE, Stage 4, and the Work Log import.
**Who's on site (live) and the 9am check-in** (Liam, 20 Nov; built in demo): Manager tools has a **Who's on site** screen, updating every minute: who is checked in, grouped by the site they checked in at, with the time, any away-from-site flag and reason, and "Planned on …" when they've checked in somewhere other than the planner says; then checked out, off today (holiday or the planner's Off row), and office staff not in. **Site staff (operatives and supervisors) not checked in by 09:00 on a working day are flagged in red**, unless on approved holiday or on the planner's Off row: at the top of Manager tools, on the live screen and on the manager's Home to-do list. The time is a setting (`checkInBy` in the site app's config.js). **Live (Stage 4):** the Azure API runs the same check at 09:00 and notifies the managers who have the alert ticked in the roles workbook (push to their phone and / or email), so nobody has to open the app to find out.
**So:** the manager dashboard is built as the **manager view of the site app** (web: works in a browser on the office PC and on a phone), signed in with Microsoft 365; iCONSTRUCTE gets a **Team** button that opens it, and reads back only what the office needs (approved hours into the Work Log, card expiry for RAMS packs). One dashboard, not a desktop page and a phone page doing the same job. It can be built now against the API in demo mode, like the rest of the site app, and goes live with Stage 4.


A **Team** page in iCONSTRUCTE for managers, as a starting point covering **expenses, holiday requests, competency cards and time keeping (check in / out)**. Managers can also approve from the site app; both work on the same records. It replaces and brings together 6.1 and the office side of 5.1, 5.3, 5.4 and 5.7.

**Security (Liam, 19 Nov: this must be secure; only certain staff see requests):**
- **Manager privileges in iCONSTRUCTE:** a role per employee (Staff / Manager / Admin) and an approver (manager) per employee, tied to the Windows login link the Actions list already uses. Only Managers see the Team page, and each only sees their own team's requests (Admin sees all). Nothing personal goes on the shared Actions list: approvals and expiry reminders are on the Team page only.
- **Where the data lives:** iCONSTRUCTE's roles only control what the program shows. The Access file on the share can be opened by anyone with access to the folder, so it is **not** a safe place for holidays, expenses or check-in locations (same problem as the NI and bank details in 2.1). These are kept in the **Azure SQL back end (Stage 4)**, reached through the API with each person's Microsoft 365 sign-in, which only returns a manager's own team. The Team page reads and approves through the same API.
- **So the order is:** roles and approvers now (harmless, needed anyway); competency card details (type, number, category, expiry) can sit with the employee record now as CSCS already does; card photos, holidays, expenses and check-ins wait for Stage 4.

**Assumed (Liam to confirm):**
- Approver = a **Manager** field on each employee record (with a deputy for when they're away), as the Azure spec already plans (ManagerId).
- **Check-in / out becomes the job hours:** after the manager approves the week, the hours go into the existing Work Log against the job, so labour costs on the job card fill themselves and timesheets aren't re-typed.

**Team page (first version):**
- tiles: requests waiting for me, who's on holiday this week / next, cards expiring in 60 days, people checked in today, expenses waiting / to pay;
- **Holidays:** requests with days, balance against allowance, clashes with the site labour planner (W2) and with others off; approve / decline with a note; team calendar;
- **Expenses:** claims with receipt photos, job, mileage; approve / decline / mark paid; monthly payroll export (CSV);
- **Competency cards:** matrix of who holds what with expiry dates (red expired, amber within 60 days), photos, reminders to the person and the manager; CSCS / CPCS / IPAF / PASMA / SMSTS / first aid / slinger-signaller / welder qualifications (BS EN ISO 9606-1, NSSS 5.2); feeds RAMS / induction packs (QFC05 Q05.5 access, permits and inductions);
- **Time keeping:** today's check-ins by job (with the distance-from-site flag), missing check-outs, week view per person, approve the week (creates the Work Log hours).

## Stage 6: Office side and moving off Access

- [ ] **6.1** iCONSTRUCTE tabs: Timesheets, Site Forms, Holidays, Expenses (reading the Azure data).
- [ ] **6.2** Move the iCONSTRUCTE database from Access to Azure SQL. iCONSTRUCTE keeps working the same.
- [ ] **6.3** Review: continue improving iCONSTRUCTE, or rebuild as a web system from a written specification.

## Wish list (good ideas, not needed yet)

- **Automatic WhatsApp sending** (WhatsApp Business Platform: messages sent without pressing Send, delivery receipts). Needs Meta business verification, approved templates and a per-conversation charge. Unlikely to be needed: individual, editable messages are preferred (18 Nov).
- **Workshop labour capacity** on the planner (W1): weekly hours (or tonnes) available per lane against what's planned, with overloaded weeks highlighted. Revisit once the planner has been trialled.

## Parked (not started until earlier stages are done)

- **Information parked by Liam, 19 Nov (come back to):**
  - who does what: the 4 PMs, transport / finisher orders, delivery notes, materials buying (P4 default owners);
  - van registration and drivers (2.6);
  - site hours for local and working-away jobs (W2);
  - NCR paper form, if there is one (2.12);
  - QMS document fixes for Rev C (Welding Quality Manual still gives BSS's address as 2nd Floor Peel House, 2 Chorley Old Road, Bolton BL1 3AA; BSS is at Unit 1b, Pocket Nook Lane, Lowton WA3 1AW (Liam, 19 Nov); ITP WM-14-8, Welding Quality Manual 3834-2:2005 and Orrell references, QP05 QFC reference, QP01 Orrell, bolt summary "CE Marking", galvanising 80/140 vs 85 microns); see `docs/QMS-DOCUMENT-REVIEW.md`.

- Webfleet link: site addresses to drivers' sat navs, time on site, mileage per job. Needs an API key request.
- Rebuild specification for Emergent or similar.
- Friday delivery calendar task (paused; can be deleted once the Deliveries tab is live).

---

## Change log

| Date | Change | Status |
|---|---|---|
| 17 Nov 2026 | 1.7.5 recovered and builds for .NET 4.8 | Done |
| 17 Nov 2026 | 1.8.0 features (see the "Where we are today" table) | In test |
| 17 Nov 2026 | Deliveries red until received; performance; Plant search | Built, for 1.8.1 |
| 17 Nov 2026 | Site app field sections (demo) and Azure API spec | Built (demo) |
| 18 Nov 2026 | Modern look: main window, job card and all pop-up windows | In test (1.8 test build) |
| 18 Nov 2026 | 1.8 test build issued (replaces 17 Nov build): new look + red-until-received + speed + Plant search | In test |
| 18 Nov 2026 | Job Cards "Search all fields"; no frame round lists; reports print in screen order; job card Site location (pin / coordinates / what3words / postcode) | In test (1.8 test build 2) |
| 18 Nov 2026 | Site app QA: BSS Works Inspection, photos per area (time-stamped, geo-tagged), snag list with close-out, completion certificate filed to job folder 09 - QA | Built; needs SharePoint Site Returns + Azure |
| 18 Nov 2026 | Job card banner and delivery address / delivery note area removed (delivery notes to be developed separately, 2.6 required); H&S required card | In test (1.8 test build 3) |
| 18 Nov 2026 | Project manager per job card (list column + Search all fields); filter label overlap fix | In test (1.8 test build 4) |
| 18 Nov 2026 | Source code pushed to private GitHub (Bolton-Steel-Structures/iconstruct) | Done |
| 18 Nov 2026 | Plant: Owned/Hired removed; progressive (contains) search in lookup boxes; Email Plant Hire (PDF to 08 - Purchase Orders + Outlook draft) | Built, for next test build |
| 18 Nov 2026 | Fixes from test build 5: Email Plant Hire crash (own PDF, no Crystal); quote from email: description = email title, banners removed, "Add as a new customer" from the signature; crash log | Built, for next test build |
| 18 Nov 2026 | Plant hire can be ordered with rates/expected costs blank or 0 ("to be confirmed" on the order); Plant list shows these pale yellow until rates are entered | Built, for next test build |
| 18 Nov 2026 | New quote: blank customer/contact/created by, Priority 2, town-only location (email, title, postcode or PDF drawing); look-up boxes stay blank when cleared; Project Manager column hidden on Job Cards (still searchable) | Built, for next test build |
| 18 Nov 2026 | Fab Issue from the job card: Steelwork / Metalwork sheet filled from the job and its orders, assembly drawings ticked from folder 03, PDF saved + recorded (table FabIssues, auto-created), Outlook email with sheet and drawings | Built, for next test build |
| 18 Nov 2026 | Fab Issue: delivery drop-downs with Other, BSL ref and Proc. removed, bought-in scope from order description, finishes ticked (finisher optional), can't issue until incoming materials complete, recipients per sheet type | Built, for next test build |
| 18 Nov 2026 | Orders: workshop door (1/2/3) for deliveries to our workshop, required, shown on the order, printed/emailed order, email and Deliveries calendar (table OrderDoor, auto-created) | Built, for next test build |
| 18 Nov 2026 | Fab Issue: bolt suppliers / unrelated orders left off, issue register tab + printable register, finishes specs renamed, Finisher supplier drop-down + Finishes column; Fab Issue and Site Issue skip 00-SS superseded folders | In test (1.8 test build 8) |
| 18 Nov 2026 | Fab Issue button moved before Site Issue; Fab Issue window redesigned to match the other pop-ups (header, details card, section list, live ready-to-issue status) | In test (1.8 test build 8) |
| 18 Nov 2026 | New quotes: letter and estimate sheet filled in automatically; new quote from a dropped client email (customer/contact/project/site/date found, email + attachments filed in the quote folder) | Built, for next test build |
| 18 Nov 2026 | Job card: "Job price" title removed and the price table made taller so every row shows; H&S ticks moved into the Budget card | Built, for next test build |
| 18 Nov 2026 | Pop-ups (Site window and any like it): window made taller where the cards ran into the footer buttons | Built, for next test build |
| 18 Nov 2026 | Delivery notes specified: 2.6 (desktop: load list from the 03 QA list, print/email, haulier POD) and 5.6 (driver's app: photos, signature, signed note back to the job) | Planned |
| 18 Nov 2026 | Delivery notes: decided folder 10, numbering full job number + DN (2627/012-DN01), content (pieces, max length, m², weight, finishes); waiting for sample QA list and template | Planned |
| 18 Nov 2026 | Competency cards on the site app (5.7): photos, number, expiry, reminders, shown offline on site; competency matrix in iCONSTRUCTE | Planned |
| 18 Nov 2026 | Deliveries tab renamed **Goods In** (outgoing steel will be **Goods Out**) | Built, for next test build |
| 18 Nov 2026 | Goods Out tab specified in 2.6: live delivery notes red until dispatched then green, Location column, complete removes from live list, onward note via finisher | Planned |
| 18 Nov 2026 | Process review of QFC01–06 and a regular health check (critique) added to how we work | Planned |
| 18 Nov 2026 | Delivery notes: Onward transport Yes/No; Yes creates the finisher leg and the onward leg together, the onward note held red until leg 1 is complete | Planned |
| 18 Nov 2026 | Delivery notes: onward transport option on every note (any first stop), legs can be chained | Planned |
| 18 Nov 2026 | Delivery notes: route built stop by stop (each Yes adds the next stop below; the No stop is the final destination); BSS works allowed as a stop; one note per leg | Planned |
| 18 Nov 2026 | Delivery notes: Our van / External transport per leg; external raises a transport purchase order and emails the haulier the order + delivery notes; our van pushed to the driver's app on dispatch; finisher's PO number printed on the note | Planned |
| 18 Nov 2026 | Delivery notes: our van limited to 1,600 kg; over-weight warning with split / external / carry on (with reason) | Planned |
| 18 Nov 2026 | Delivery notes: whole QA lists attached (no item ticking; lists split by finish beforehand); no van length check | Planned |
| 18 Nov 2026 | Delivery notes / Goods Out spec (2.6) agreed; build starts when the sample QA list and template arrive | Agreed |
| 18 Nov 2026 | Health check 1: build clean, SQL safe; 4 safety fixes, 6 double-ups, 4 speed / small items found (see Health check 1) | Awaiting go-ahead |
| 18 Nov 2026 | Task bots B1–B9 agreed in principle; procurement checklist (P1) and bolts-at-Fab-Issue failsafe (P2) proposed | Planned |
| 18 Nov 2026 | Procurement per phase (each Fab Issue = a phase); bolts prompted on every Fab Issue from that phase's bolt list in 03, order pre-filled, BAPP (2–3 days) or Whites (small / urgent) suggested, PM owns and is chased | Planned |
| 18 Nov 2026 | Bolts: prompt sends the bolt list out for quote (BAPP / Whites) at every Fab Issue; order just references the list; Phase board (P3) noted as an idea only | Planned |
| 18 Nov 2026 | Actions list (P4) proposed: one table for every incomplete prompt, replacing the H&S tab and holding procurement lines, filterable by project manager; weekly production meeting pack (P5) | Planned |
| 18 Nov 2026 | Production meeting: no PDF; a Meeting view on the live Job Cards list (bigger text, phase / actions / goods in-out / RAMS columns, expand to phases, add action from the row) | Planned |
| 18 Nov 2026 | Meeting view: no project manager column (still searchable / filterable) | Planned |
| 18 Nov 2026 | Workshop planner (W1): 6–8 week look-ahead, unallocated tray from Fab Issues, start + duration, material / fittings markers from orders and Goods In, fab complete date + tick (Q04.8), no-delivery-note flag. Actions can be reassigned, with default owners per action type | Planned |
| 18 Nov 2026 | Planner: separate Steelwork and Metalwork lanes; labour capacity moved to a new Wish list | Planned |
| 18 Nov 2026 | Site labour planner (W2): 12-week grid from the live job list (custom order, remove jobs), initials or placeholder numbers, fill right, clash and daily totals; Send instructions opens WhatsApp with a pre-written message (site, map, contact, collect-on-the-way, notes) | Planned |
| 18 Nov 2026 | Site labour planner: "SUB" for subcontract (no messages, counted separately); jobs set Local / Working away with default hours (Liam to confirm); new "Waiting on Liam" list | Planned |
| 18 Nov 2026 | WhatsApp instructions confirmed as one editable message per operative, stepped through in turn | Planned |
| 18 Nov 2026 | Order standard notes reworked around BS EN 1090-2, with NSSS cited only where it adds a requirement (bolt supplier NHSS 3). Notes now go by line type: Materials, Cold Rolled, Bolts, Galvanising and Painting each get their own short block, only when the order has that line type. Editable in OrderStandardNotes.txt using [type id] headers | Built, for next test build |
| 18 Nov 2026 | Go-live data clean-up added to 1.4: orders still open from before 1 Jan 2025 cleared on the live database at go-live (test copy not cleaned), plus go-live data checks | Planned |
| 18 Nov 2026 | Go-live: pre-2025 open orders closed at their values, left undelivered; Goods In ignores orders before 1 Jan 2025 (`GoodsInFromDate`) | Built, for next test build |
| 18 Nov 2026 | HC1.1 fixed: Fab Issue is New or Amend only; a sent issue / revision is never overwritten | Built, for next test build |
| 18 Nov 2026 | HC1.3 fixed: site returns claimed (moved) before filing, checked, then deleted from OneDrive; job-number folders only | Built, for next test build |
| 18 Nov 2026 | HC1.2 fixed: Site Issue can only ever delete one job's own folder (job number from the job card; blank job number does nothing) | Built, for next test build |
| 18 Nov 2026 | Bug log started (`docs/BUGLOG.md`, project doc `claude/BUGLOG.md`) | Done |
| 18 Nov 2026 | BSS certified to EXC4; execution class per job (2.9) proposed: job card field, printed on orders / Fab Issue / delivery notes | Proposed |
| 18 Nov 2026 | Execution class per job built (2.9): job card field (table JobCardExecution, auto-created, saved in a transaction), searchable; Fab Issue pill, PDF row + EXC3/4 warning band + email line; order notes use the job's class and add EXC3/4 traceability | Built, for next test build |
| 18 Nov 2026 | Site app infrastructure accounts listed with proposed names (owner mailbox, M365, Azure, web address, GitHub) | Waiting on Liam |
| 18 Nov 2026 | ITP that fills itself from iCONSTRUCTE records (2.10) proposed; waiting for BSS's ITP | Proposed |
| 18 Nov 2026 | Job folder review (2.11): delivery-note folder clash (10 is H&S in iCONSTRUCTE), 09 - QA vs 09 - QA Docs, Fab Issues not in the list; QFC-ordered structure proposed | For decision |
| 18 Nov 2026 | Next test build to be packaged tomorrow night or Friday (Liam adding ideas first) | Noted |
| 18 Nov 2026 | Site app accounts: owner liam@boltonstructures.com; web address site.boltonstructures.com; second admin recommended | Waiting on Liam |
| 18 Nov 2026 | Folder proposal narrowed: no enquiry folder (held in quotes), Engineers Drawings = design, 03 Assembly drawings unchanged; waiting for screenshot of real folder names | Waiting on Liam |
| 19 Nov 2026 | QMS documents received and checked (QMS-DOCUMENT-REVIEW.md): NCR and approved-supplier gaps in iCONSTRUCTE against QP08 / QP05; ITP and manual out-of-date references; EXC3/4 wording corrected to BS EN 1090-2 5.2 and the Welding Quality Manual | Built (wording) / For decision |
| 19 Nov 2026 | NCRs to match QP08 (2.12) added to the roadmap, to come back to | Planned |
| 19 Nov 2026 | Live iCONSTRUCTE.exe.config received and saved (0.4): only DBLocation set; runtime line to be updated to .NET 4.8 at go-live | Done |
| 19 Nov 2026 | Who does what, van / drivers, site hours and NCR form parked to come back to | Parked |
| 19 Nov 2026 | Decisions closed out: health check HC1.4 + batches B / C go ahead; standard notes on Print, Save and Email (no change); QFC04 reviewed first; QMS document fixes parked; approved suppliers stay on the spreadsheet, integration later (2.13) | Decided |
| 19 Nov 2026 | Job folders decided (2.11): delivery notes 05, QA 09 - QA Docs, safety 10 - H&S, Fab Issue sheets in 03 - Assembley Drawings\Fab Issues (built); site QA returns file into the job's own 09 folder (B012 fixed) | Built, for next test build |
| 19 Nov 2026 | Health check small items closed: HC1.4 (workshop door, project manager and site location saved in one transaction) and HC1.13 (long file names / paths, numeric and P01 revisions, FabIssueExcludeSuppliers config note, estimate Summary date as a real date) | Built, for next test build |
| 19 Nov 2026 | Health check double-ups HC1.5–HC1.7: one Outlook draft routine (releases Outlook properly), one save-PDF-with-revisions routine, one JobFolders helper for every job folder look-up | Built, for next test build |
| 19 Nov 2026 | HC1.8: one file-name cleaner, one list of added tables (auto-created), one error-log writer. Job card Site location simplified to a Google Maps link that opens (no postcode / what3words / internet look-ups); site app gets the link for directions | Built, for next test build |
| 19 Nov 2026 | HC1.9: one colour palette for every screen (one page background, merged near-identical colours). HC1.10: company details, logo and supplier names kept in memory, refreshed when Admin saves | Built, for next test build |
| 19 Nov 2026 | HC1.11: email drop and Site Issue folder read in the background (Site Issue reads only 01 / 03 / 10); offline look-ups retry after 5 minutes. HC1.12: Job Cards and Plant search in memory as you type. HC1.14: Fab Issue code split into five files. Health check 1 closed | Built, for next test build |
| 19 Nov 2026 | Health check 2 (independent): HC1 fixes confirmed; 3 High findings on drawing revisions reaching site (HC2.1, 2.3, 2.19); filing, security, SQL-readiness items; migration to SQL estimated 15–25 days; Azure API recommended before wide rollout | Awaiting go-ahead |
| 19 Nov 2026 | Drawing control rule (Liam): document controller keeps only the latest drawings in iCONSTRUCTE; on revision the old is superseded and the new re-issued to site. HC2.1 / HC2.2 closed by process; HC2.3 / HC2.19 still recommended (make the supersede reliable) | Decided |
| 19 Nov 2026 | Replace Crystal Reports with iCONSTRUCTE's own PDFs proposed (2.14): one list printer + document layouts; removes the Crystal runtime and most of the SQL-migration report work | Proposed |
| 19 Nov 2026 | Crystal replacement scoped to what's used (Liam): purchase order PDF, Goods In schedule printout (uncontrolled copy, new), delivery notes (2.6); other Crystal reports removed; about 1.5–2 sessions | Proposed |
| 19 Nov 2026 | Crystal Reports removed (2.14): own Purchase Order PDF for Print / Email Order, Print Plant Hire, new Goods In schedule printout (uncontrolled copy), list Print buttons print the on-screen list; other Crystal reports taken off; report viewer, 34 reports and Crystal references deleted; HC2.14 closed | Built, for next test build |
| 19 Nov 2026 | 1.8 test build 9 packaged: all changes since build 8 (HC1 fixes, execution class, notes per line type, Goods In from 2025, Crystal removed); install also copies OrderStandardNotes.txt | In test (1.8 test build 9) |
| 19 Nov 2026 | Actions list (P4) first version: Actions page replaces H&S; add / done / not needed / re-open / reassign with history; default owners per type; Windows login linked to an employee; job card Actions (n); automatic RAMS / crane plan (ticks migrated), plant rates and off-hire actions | Built, for next test build |
| 19 Nov 2026 | Bolts at every Fab Issue (P2): bolts window on saving a Fab Issue (send list for quote to BAPP / Whites, not needed with reason, or later), Bolts action per phase, closed by a Bolts order on the job | Built, for test build 10 |
| 19 Nov 2026 | 1.8 test build 10 packaged: Actions list + bolts at Fab Issue added to build 9 | In test (1.8 test build 10) |
| 19 Nov 2026 | Test copy was filing into live document folders and reusing live quote numbers (B018): test Docs folder via DocStorageLocation (set by the install), no overwriting on new quotes, start-up check. 1.8 test build 11 packaged with B016 / B017 / B018 | In test (1.8 test build 11) |
| 19 Nov 2026 | Roll-out package (1.4a) specified: live installer separate from the test builds, original live folders (no DocStorageLocation on live), templates, self-creating tables, rollback folder | Planned |
| 19 Nov 2026 | Manager dashboard proposed (Team page: expenses, holidays, competency cards, check in / out): manager roles and approvers in iCONSTRUCTE; personal data kept in Azure SQL, not the Access file; nothing personal on the Actions list | Proposed |
| 19 Nov 2026 | Manager dashboard decided: Azure (manager view of the site app, M365 sign-in; iCONSTRUCTE Team button opens it); Access has no per-table security, so no restricted table in iCONSTRUCTE | Decided |
| 19 Nov 2026 | Manager tools built into the site app (demo): dashboard, approvals, time keeping with approve week, competency cards (My cards + team matrix); preview published | Built (demo) |
| 19 Nov 2026 | Site app roles: Manager / Supervisor / Operative, what each sees set in config.js (waiting for Liam's tick-box schedule); operatives get no Manager tools, QA or weekly safety checks; sample logins Liam Pilkington (Manager), Ian Jones (Supervisor), Daniel Wiseman (Operative) | Built (demo) |
| 19 Nov 2026 | New job card with no budgets: prompt on first save; Yes adds a "Budget" action for the creator (due 2 working days, closes itself once any budget is entered), No records "not needed" on the job | Built, test build 13 |
| 19 Nov 2026 | Spelling: Job Cards search falls back to close spellings when nothing matches exactly (finds jobs typed wrong); spell check (Windows spell checker, UK English, shared BSS word list) before saving job card description / comments and quote project name / description | Built, test build 13 |
| 19 Nov 2026 | People tab: Name filter replaced by an open "Search all fields" (any word anywhere in the record or its contacts), updates as you type, close spellings when nothing matches | Built, test build 13 |
| 19 Nov 2026 | 0.2 source zips saved to a Gripil folder (Liam) | Done |
| 19 Nov 2026 | Roadmap tidied: status table brought up to date; reference documents ticked as received; quote-from-email checklist items ticked (confirmed by Liam); delivery notes and ITP marked ready (samples received) | Done |
| 19 Nov 2026 | Delivery notes stage 1 (2.6): Delivery Note window from the job card (route stop by stop, Our van / External per stop, whole QA lists from 03 as the load, 1,600 kg van check, finisher order number and spec), one note per leg {job}-DN01…, PDF in 05, register; tables GoodsOutNotes / GoodsOutItems (auto-created) | Built, test build 13 |
| 19 Nov 2026 | Delivery note layout revised (Liam): route row instead of the stacked "then on to" banner, load summarised by section size (pieces, longest, area, weight, heaviest item), BSS logo built in as a fallback on every printout (test copy's documents folder has no Logo) | Built, test build 13 |
| 19 Nov 2026 | BSS address confirmed (Liam): Unit 1b, Pocket Nook Lane, Lowton, WA3 1AW; to be checked in Admin → Company Details (test and live) as every printout uses it; Welding Quality Manual address added to the Rev C fixes | Noted |
| 19 Nov 2026 | Goods Out stage 2 (2.6): Goods Out tab (all live notes, red / waiting / green, Location, filters), Dispatch, Complete with receipt check (NSSS 8.1.5) and signed copy filed in 05, Undo, held later legs; Delivery note and Proof of delivery actions raised and closed automatically | Built, test build 13 |
| 19 Nov 2026 | 1.8 test build 12 packaged: delivery notes and Goods Out (stages 1–2), Budget prompt, spelling search and spell check, People search, built-in logo, B019 / B020 | In test (1.8 test build 12) |
| 19 Nov 2026 | Delivery notes: load can be typed by hand when there's no QA list (grid: section, qty, length, weight, area, finish); "Open 03 folder" renamed "Open Folder" | Built, test build 13 |
| 19 Nov 2026 | Delivery Note window (Liam): duplicate heading removed (window title already says Delivery Note - Job …); "Type load by hand" renamed "Manually Input"; "Open 05 folder" renamed "Open Del Notes" | Built, test build 13 |
| 19 Nov 2026 | Quote site (Liam): quotes link to a site with its address (QuoteSite table, Add Site on new quotes); picking the quote on a job card brings the site across; new job cards need a site with an address | Built, test build 13 |
| 19 Nov 2026 | Preferred suppliers (★ on the People list, first in supplier drop-downs; table PreferredSuppliers) and a supplier Category column on the People list | Built, test build 13 |
| 19 Nov 2026 | 1.8 test build 13 packaged: B021 Goods Out table fix, B022, Manually Input, quote site → job card, site address required, preferred suppliers and Category column | In test (1.8 test build 13) |
| 19 Nov 2026 | Delivery notes: one Date per stop (collected and delivered the same day, Liam); the note shows Date + time slot instead of Collection / Delivery dates | Built, test build 14 |
| 19 Nov 2026 | Supplier categories added: Stockholder, Profiler, Finisher, Transport, Bolts / Fixings (added to SupplierType automatically); delivery note finisher / haulier lists put Finisher / Transport suppliers first | Built, test build 14 |
| 19 Nov 2026 | P6 Procurement enquiries roadmapped (Liam): Request Quotes pop-up drafting enquiry emails to ★ preferred suppliers by category (sections, fittings, bolts, cold rolled, painting, galvanising, plant hire, transport), Execution Class requirements from the order-note blocks, attachments, editable "your request" text, follow-up actions | Planned |
| 19 Nov 2026 | P6 detailed (Liam): attachments from 03 (members list + NC1 + part drawings for sections; fittings list + NC1 + fitting drawings for plates / profiles), 3 suppliers by default, load summary from the lists, quote comparison (£/t, lead time, lowest highlighted, Accept raises the order); Cold Rolled supplier category added | Planned / category built |
| 19 Nov 2026 | P6 changed (Liam): lists attached only, no load summary in the email body; one email per enquiry with the suppliers in BCC | Planned |
| 19 Nov 2026 | Supplier categories Technical and Consumables added (Liam) | Built, test build 14 |
| 19 Nov 2026 | Delivery notes: external transport vehicle type (Van / Rigid / Hiab / Artic / Other with specialist text), printed on the note; one date per stop confirmed (Friday-for-Saturday typed in the time slot) | Built, test build 14 |
| 19 Nov 2026 | Goods Out board view (Liam): route rows, BSS works / Finishers / Site / Other columns, stop tiles red / amber / green; buttons act on the route's next leg; List view kept | Built, test build 14 |
| 20 Nov 2026 | Off row (permanent, bottom of the planner); site app Who's on site (live, by site, planned-elsewhere flag) and 9am check-in alert for operatives and supervisors unless on holiday or Off (Manager tools, Home to-do; Azure notifies at 09:00 when live); roles workbook changed to BSS's roles (Directors, Accounts, Admin, Estimators, Project Managers, Draughtsmen, QA Manager, Supervisor, Operatives) | Built, next test build / demo |
| 20 Nov 2026 | U1 decided (Liam): pages shown by role from a tick-box sheet, each person can reorder their own list; roles workbook made (pages, who can change, site app, people and approvers, who does what) | Waiting on Liam |
| 20 Nov 2026 | W3 Drawing office planner roadmapped (Liam): job card tick when created, red until allocated, in-house draughtsmen and subcontract detailers, look-ahead per person; U1 proposed: menu layout to be agreed with Liam, "My day" home page with the bots | Planned / proposed |
| 20 Nov 2026 | P7 supplier invoice matching roadmapped (Liam): Invoices tab, PO / supplier / value / goods received / duplicate checks, approved invoices marked Invoiced, Excel file with the reason for any not passed; by hand first, bot later | Planned |
| 20 Nov 2026 | Actions urgency (Liam): 1 Urgent / 2 Soon / 3 Can wait, automatic from the due date (1 within a week, 2 within two weeks, 3 later) or set by hand (Add / Edit, right-click for several); listed most urgent first; Urgency filter | Built, test build 14 |
| 20 Nov 2026 | Go-live prerequisite added (1.4a): .NET Framework 4.8 on every machine / server running iCONSTRUCTE (a different server asked for it) | Planned |
| 20 Nov 2026 | 1.8 test build 14 packaged: Site Labour planner, Off row, planner editors, site attendance and wages CSV, Actions urgency, Goods Out board, one date per stop, vehicle type, B023, supplier categories | In test (1.8 test build 14) |
| 19 Nov 2026 | 3D model: dated erection log (one line per tick, nothing overwritten), By day (erected / checked per day with marks and tonnes), Today line, Excel download (By day + Log sheets); live version to Azure (append-only) | Built, in the preview |
| 19 Nov 2026 | 3D model: list, select and mark by assembly (erection mark), not individual parts (Liam) | Built, in the preview |
| 19 Nov 2026 | Health check 3 batch H as Liam directed: attendance confirm can't book twice (claim first), closed jobs included, fixed reasons (Other with a no-medical / holiday note), £0-rate warning; planner editors (table StaffPrivileges, "Planner editors…"; others view only; nobody ticked = everyone); site app shows this week only (next Monday from Friday), own days only, supervisors see who's with them, managers the team | Built, test build 14 |
| 19 Nov 2026 | 5.8 test viewer (Liam's sample IFC): 3D model on the site app job page, tap to select, Erected / Bolted & checked (Managers, Supervisors), progress, member list; the export has no erection marks (assemblies off), one phase, and two placeholder plates of 110 t | Built, in the preview |
| 19 Nov 2026 | Health check 3 (independent, 59 changes since HC2): build clean, SQL / PDFs / no-overwrite / privacy of Actions sound; 3 High on attendance booking (double booking, closed jobs missed, sick / holiday notes in Access), plus sharing between PCs, site manifest privacy, onward leg after a shortage, speed and double-ups (HC3.1–HC3.24) | Awaiting go-ahead |
| 19 Nov 2026 | 5.8 roadmapped (Liam): 3D model on the site app (issued through Site Issue, for information only) and marking assemblies Delivered / Erected / Bolted and checked each day; tonnes erected per day for progress, valuations and tonnes per man-day; test viewer first, from a sample IFC | Planned |
| 19 Nov 2026 | Site app Week plan: Me (my days, start time, working away) and Team grid (Managers / Supervisors), Prev / Next week, sample week for the whole demo team; sw v13 | Built, in the preview |
| 19 Nov 2026 | W2 Site labour planner built (first version): Site Labour tab, shared job order, initials / to-find / SUB cells with colours and clash check, totals, fill and copy / paste, autosave, labour list, start times, WhatsApp instructions per operative (recorded, ticks), site app link (operatives get the job; My week on Home); tables SiteLabour / SiteLabourJobs / LabourPeople / LabourMessages | Built, test build 14 |
| 19 Nov 2026 | W2b roadmapped (Liam): confirmed daily attendance (planner vs site app check-in) books labour to the job card; clock-in / out times kept separately and compiled to a CSV | Planned |
| 19 Nov 2026 | W2b built (Liam's decisions): daily Site attendance action; Confirm attendance books 10 h local / 12 h away to the job card's labour (operatives, and subcontract / agency linked to an employee); Wages CSV per week (clock times / overtime columns ready for the site app); start time 'to be confirmed' unless set; table SiteAttendance | Built, test build 14 |
| 20 Nov 2026 | Job card **Commercial only** tick (Liam): commercial-only job cards left off the site labour planner (unless added by hand or already planned); RAMS, Crane plan and Commercial only grouped in one Job ticks card; table JobCardFlags | Built, next test build |
| 20 Nov 2026 | Commercial only = no RAMS (Liam: daywork / extra-over drawing comparisons): RAMS required unticked and greyed out; W3 job card tick named "Drawings"; Billed to client stays by Invoice number (agreed) | Built, next test build |
| 20 Nov 2026 | Commercial only (Liam): Crane plan greyed out too; no budget question, a Budget action always raised (price with the QS, extra-over figures, due 10 working days) | Built, next test build |
| 20 Nov 2026 | Health check decisions (Liam) built: HC3.4 two jobs a day split / existing hours, HC3.5 confirmed days locked + Reverse booking, HC3.6 unverified labour pop-up + action per day, HC3.9 Lock / Unlock planner, HC3.16 every error logged (151 places), HC3.17 bank holidays editor + December action, HC3.20 Timesheet folder (no pay), HC3.21 BST-safe dates, HC3.22 no week numbers, HC2.3 full drawing set re-issue with old deleted, HC2.19 file size check, HC2.20 15-minute check + stale banner; HC3.13 / 3.14 closed; B024 labour line delete fixed | Built, next test build |
| 20 Nov 2026 | Health check follow-up (Liam): Timesheet is an Excel file with a Payroll sheet (names and hours) first; bank holidays update themselves from GOV.UK; Site Issue back to selected drawings (all or nothing, replaced files deleted from SharePoint); no 15-minute refresh (push notifications with Azure); HC3.12 closed | Built, next test build |
| 20 Nov 2026 | Site app for managers (Liam): no check in / out, My week or Timesheet tile (not sent to sites by the planner); **Projects** page: every live project (job number before the "/"), My projects (where they're the job card PM) and All live, tap for its packages of work; Manager tools banner made a tile; 12-hour warning banner removed. Manifest now lists every live job card with its PM (operatives still see only their jobs); sw v23 | Built, in the preview |
| 20 Nov 2026 | Site app: managers don't sign RAMS (Liam): no "Sign the RAMS" to-dos or Read & sign button for the Manager role (they can still open the RAMS documents) | Built, in the preview |
| 20 Nov 2026 | Site app QA trimmed (Liam: too onerous): job QA page keeps the stage layout but only checks with a working form: 1. Before erection (safe site handover, foundation check), 2. Erection (line / level / plumb, bolting, site welding), 3. Close-out (site inspection with snags, NCR, completion certificate). The 13 planned placeholders (pre-site inspection, ITP, delivery / traceability / bolt batches, preloaded bolts, welder & WPS, packs & shims, protective treatment, DFT, QA dossier) taken off the screen; still listed here for later | Built, in the preview |
