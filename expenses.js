/* iCONSTRUCTE Site: expense claims with receipt photos; manager approval and payroll export.
 * Mileage uses the HMRC approved rate for cars and vans (CFG.mileageRate for the first 10,000 business miles in the
 * tax year, CFG.mileageRateOver10k after that). Each claim can be costed to a job.
 */
(function () {
  "use strict";
  const { CFG, $, esc, fmtDate, fmtDay, fmtMoney, isoDate, Data, jobByFolder, jobOptions, sheet, toast, setBar, route, shrinkImage } = IC;
  const CATS = ["Fuel", "Mileage (own vehicle)", "Parking", "Tolls / congestion charge", "Subsistence / meals", "Accommodation", "Tools / PPE", "Materials", "Other"];
  const isMileage = (c) => /^Mileage/.test(c || "");
  const cap = (s) => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);

  function taxYearStart(d) { const x = d || new Date(); const y = x.getMonth() > 3 || (x.getMonth() === 3 && x.getDate() >= 6) ? x.getFullYear() : x.getFullYear() - 1; return isoDate(new Date(y, 3, 6)); }
  async function milesThisTaxYear(exceptId) {
    const start = taxYearStart();
    return (await Data.list("expenses")).filter((e) => isMileage(e.category) && e.id !== exceptId && e.date >= start && e.status !== "declined" && e.status !== "cancelled").reduce((t, e) => t + (Number(e.miles) || 0), 0);
  }
  function mileageAmount(miles, before) {
    const atFull = Math.max(0, Math.min(miles, 10000 - before)), rest = miles - atFull;
    return Math.round((atFull * CFG.mileageRate + rest * CFG.mileageRateOver10k) * 100) / 100;
  }

  const row = (e, team) => '<a class="tile-row" href="#/expense/' + e.id + '"><span><b>' + esc(team ? e.userName : e.category) + '</b><span class="small">' + esc((team ? e.category + " · " : "") + fmtDay(e.date) + (e.jobNumber ? " · " + e.jobNumber : "")) + "</span></span>" +
    '<span class="amt">' + fmtMoney(e.amount) + '<span class="pill ' + e.status + '">' + esc(cap(e.status)) + "</span></span></a>";

  route("expenses", async (args) => {
    const team = args[0] === "team" && Data.profile && Data.profile.isManager;
    setBar("Expenses", team ? "Team" : "", false);
    const tabs = Data.profile.isManager ? '<div class="tabs"><a' + (team ? "" : ' class="on"') + ' href="#/expenses">Mine</a><a' + (team ? ' class="on"' : "") + ' href="#/expenses/team">Team</a></div>' : "";
    if (team) {
      const all = (await Data.list("expenses", "team")).sort((a, b) => b.date.localeCompare(a.date));
      const pend = all.filter((e) => e.status === "pending" && e.user !== Data.profile.email), appr = all.filter((e) => e.status === "approved");
      $("main").innerHTML = tabs + '<div class="section-h">Waiting for approval (' + pend.length + ")</div>" + (pend.length ? pend.map((e) => row(e, true)).join("") : '<div class="empty small">Nothing waiting.</div>') +
        '<div class="section-h">Approved, not yet paid (' + appr.length + " · " + fmtMoney(appr.reduce((t, e) => t + e.amount, 0)) + ")</div>" + appr.map((e) => row(e, true)).join("") +
        (appr.length ? '<div class="row"><button class="btn" id="csv">Export for payroll (CSV)</button><button class="btn" id="paid">Mark all paid</button></div>' : "");
      if ($("csv")) $("csv").onclick = () => exportCsv(appr);
      if ($("paid")) $("paid").onclick = async () => { if (!(await IC.ask("Mark " + appr.length + " claims as paid?", "Mark paid"))) return; for (const e of appr) await Data.decide("expenses", e.id, "paid"); toast("Marked paid"); IC.refreshView(); };
      return;
    }
    const mine = (await Data.list("expenses")).sort((a, b) => b.date.localeCompare(a.date));
    const sum = (st) => mine.filter((e) => e.status === st).reduce((t, e) => t + e.amount, 0);
    $("main").innerHTML = tabs + '<div class="stats"><div><b>' + fmtMoney(sum("pending")) + "</b><span>waiting</span></div><div><b>" + fmtMoney(sum("approved")) + "</b><span>approved, to be paid</span></div></div>" +
      '<a class="btn primary block" href="#/expense-new">New claim</a><div class="section-h">My claims</div>' + (mine.length ? mine.map((e) => row(e)).join("") : '<div class="empty small">No claims yet.</div>');
  });

  route("expense-new", async () => {
    setBar("New claim", "", true);
    const before = await milesThisTaxYear();
    $("main").innerHTML = '<form class="frm" novalidate>' +
      '<label class="fl">What for?<select id="eCat"><option value="">Choose…</option>' + CATS.map((c) => "<option>" + c + "</option>").join("") + "</select></label>" +
      '<div class="row"><label class="fl">Date<input type="date" id="eDate" max="' + isoDate(new Date()) + '" value="' + isoDate(new Date()) + '"></label><label class="fl">Job<select id="eJob">' + jobOptions(IC.LS.get("lastJob", ""), true) + "</select></label></div>" +
      '<div id="eMiles" hidden><div class="row"><label class="fl">From<input id="eFrom" placeholder="e.g. Yard, Bolton"></label><label class="fl">To<input id="eTo" placeholder="e.g. site postcode"></label></div>' +
      '<label class="fl">Business miles<input type="number" id="eMi" inputmode="decimal" min="0" step="any"></label><div class="small" id="eRate"></div></div>' +
      '<div id="eMoney"><div class="row"><label class="fl">Total (£)<input type="number" id="eAmt" inputmode="decimal" min="0" step="0.01"></label><label class="fl">of which VAT (£)<input type="number" id="eVat" inputmode="decimal" min="0" step="0.01"></label></div>' +
      '<div class="ff-l">Receipt <span class="req-star">*</span></div><div class="thumbs" id="eThumbs"></div><label class="btn"><input type="file" id="eRcpt" accept="image/*" capture="environment" multiple hidden>Photograph receipt</label></div>' +
      '<label class="fl">Note<textarea id="eNote" rows="2" placeholder="What was it for?"></textarea></label>' +
      '<div class="err" id="eErr" hidden></div><button type="submit" class="btn primary block">Submit claim</button></form>';
    let rc = [];
    const draw = async () => { const urls = await Promise.all(rc.map((id) => Data.blobUrl(id))); $("eThumbs").innerHTML = urls.map((u) => '<img src="' + u + '">').join(""); $("eThumbs").querySelectorAll("img").forEach((img, i) => (img.onclick = async () => { if (await IC.ask("Remove this photo?", "Remove")) { rc.splice(i, 1); draw(); } })); };
    $("eRcpt").onchange = async (ev) => { for (const f of ev.target.files) rc.push(await Data.putBlob(await shrinkImage(f, 2000, 0.8))); ev.target.value = ""; draw(); };
    const mode = () => { const m = isMileage($("eCat").value); $("eMiles").hidden = !m; $("eMoney").hidden = m; rate(); };
    const rate = () => { const mi = Number($("eMi").value) || 0; $("eRate").innerHTML = "<b>" + fmtMoney(mileageAmount(mi, before)) + "</b> at " + Math.round(CFG.mileageRate * 100) + "p a mile (HMRC rate" + (before + mi > 10000 ? "; " + Math.round(CFG.mileageRateOver10k * 100) + "p after 10,000 miles this tax year" : "") + "). " + Math.round(before) + " business miles claimed so far this tax year."; };
    $("eCat").onchange = mode; $("eMi").oninput = rate; mode();
    document.querySelector(".frm").onsubmit = async (ev) => {
      ev.preventDefault();
      const cat = $("eCat").value, m = isMileage(cat), errs = [];
      if (!cat) errs.push("Choose what the claim is for");
      if (m && !(Number($("eMi").value) > 0)) errs.push("Enter the business miles");
      if (m && (!$("eFrom").value.trim() || !$("eTo").value.trim())) errs.push("Enter where you travelled from and to");
      if (!m && !(Number($("eAmt").value) > 0)) errs.push("Enter the amount");
      if (!m && Number($("eVat").value) > Number($("eAmt").value)) errs.push("VAT can't be more than the total");
      if (!m && cat && !rc.length) errs.push("Add a photo of the receipt");
      if (errs.length) { $("eErr").hidden = false; $("eErr").innerHTML = errs.map(esc).join("<br>"); return; }
      const j = jobByFolder($("eJob").value), miles = Number($("eMi").value) || 0;
      await Data.save("expenses", { category: cat, date: $("eDate").value, jobFolder: j ? j.folder : "", jobNumber: j ? j.jobNumber : "", note: $("eNote").value.trim(),
        amount: m ? mileageAmount(miles, before) : Math.round(Number($("eAmt").value) * 100) / 100, vat: m ? 0 : Math.round((Number($("eVat").value) || 0) * 100) / 100,
        miles: m ? miles : undefined, from: m ? $("eFrom").value.trim() : undefined, to: m ? $("eTo").value.trim() : undefined, receipts: m ? [] : rc, status: "pending" });
      toast("Claim sent for approval"); location.hash = "#/expenses";
    };
  });

  route("expense", async (args) => {
    const e = await Data.get("expenses", args[0]); if (!e) { location.hash = "#/expenses"; return; }
    const mineRec = e.user === Data.profile.email;
    setBar(e.category, (mineRec ? "" : e.userName + " · ") + fmtDate(e.date), true);
    const urls = await Promise.all((e.receipts || []).map((id) => Data.blobUrl(id)));
    $("main").innerHTML = '<div class="big-amt">' + fmtMoney(e.amount) + ' <span class="pill ' + e.status + '">' + esc(cap(e.status)) + "</span></div>" +
      '<div class="kv">' + [["Claimed by", e.userName], ["Date", fmtDay(e.date)], ["Job", e.jobNumber || "None"], e.vat ? ["VAT", fmtMoney(e.vat)] : null, e.miles ? ["Journey", (e.from || "") + " → " + (e.to || "") + " · " + e.miles + " miles"] : null, e.note ? ["Note", e.note] : null,
        e.decidedBy ? [cap(e.status) + " by", e.decidedBy + " · " + fmtDay(e.decidedAt || e.updatedAt)] : null, e.decisionNote ? ["Reason", e.decisionNote] : null]
        .filter(Boolean).map(([k, v]) => "<div><span>" + esc(k) + "</span><b>" + esc(v) + "</b></div>").join("") + "</div>" +
      (urls.length ? '<div class="section-h">Receipt</div><div class="receipts">' + urls.map((u) => '<img src="' + u + '">').join("") + "</div>" : "") +
      (Data.profile.isManager && !mineRec && e.status === "pending" ? '<div class="row sticky-actions"><button class="btn" id="no">Decline</button><button class="btn go" id="ok">Approve</button></div>' : "") +
      (mineRec && e.status === "pending" ? '<button class="btn block" id="cx">Withdraw claim</button>' : "");
    if ($("ok")) $("ok").onclick = async () => { await Data.decide("expenses", e.id, "approved"); toast("Approved"); history.back(); };
    if ($("no")) $("no").onclick = () => { const sh = sheet('<h3>Decline claim</h3><label class="fl">Reason (shown to them)<textarea id="why" rows="2"></textarea></label><button class="btn primary block" id="go">Decline</button><button class="btn block" id="x">Cancel</button>');
      $("x").onclick = sh.close; $("go").onclick = async () => { if (!$("why").value.trim()) { toast("Add a reason"); return; } await Data.decide("expenses", e.id, "declined", $("why").value.trim()); sh.close(); toast("Declined"); history.back(); }; };
    if ($("cx")) $("cx").onclick = async () => { e.status = "cancelled"; await Data.save("expenses", e); toast("Claim withdrawn"); history.back(); };
  });

  function exportCsv(list) {
    const q = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const lines = [["Employee", "Email", "Date", "Category", "Job", "Net", "VAT", "Total", "Miles", "Journey", "Note", "Approved by"].map(q).join(",")]
      .concat(list.map((e) => [e.userName, e.user, e.date, e.category, e.jobNumber, (e.amount - (e.vat || 0)).toFixed(2), (e.vat || 0).toFixed(2), e.amount.toFixed(2), e.miles || "", e.miles ? e.from + " to " + e.to : "", e.note, e.decidedBy].map(q).join(",")));
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv" })); a.download = "Expenses for payroll " + isoDate(new Date()) + ".csv"; a.click();
  }

  IC.Expenses = { pendingForManager: async () => (await Data.list("expenses", "team")).filter((e) => e.status === "pending" && e.user !== Data.profile.email).length };
})();
