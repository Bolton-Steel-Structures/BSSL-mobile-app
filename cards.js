/* iCONSTRUCTE Site: competency cards (roadmap 5.7).
 * Each person photographs the front and back of their cards (CSCS, CPCS / NPORS, IPAF, PASMA, SMSTS / SSSTS, first aid,
 * slinger / signaller, abrasive wheels, welder qualification certificates to BS EN ISO 9606-1 …) with the card number,
 * category and expiry date. The cards are kept on the phone, so they can be shown at the gate or induction with no
 * signal. Managers see the team's cards in Manager tools and mark a card "checked" once they've seen the original.
 * Photos are personal data: only the card holder and their manager can see them (API rule).
 */
(function () {
  "use strict";
  const { $, esc, fmtDate, isoDate, parseDate, Data, sheet, toast, setBar, route, shrinkImage } = IC;

  const TYPES = ["CSCS", "CPCS", "NPORS", "IPAF", "PASMA", "SMSTS", "SSSTS", "First aid at work", "Slinger / signaller", "Abrasive wheels",
    "Welder qualification (BS EN ISO 9606-1)", "Working at height", "Manual handling", "Asbestos awareness", "Other"];
  // Workshop staff (Liam, 21 Nov): no CSCS or other site cards; welder qualifications and copies of the weld procedures
  const WS_TYPES = ["Welder qualification (BS EN ISO 9606-1): 135 MAG", "Welder qualification (BS EN ISO 9606-1): 111 MMA", "Weld procedure (WPS)", "Visual weld inspection", "Other"];
  const wsMode = () => IC.can("workshop") && !IC.can("drawings");
  const SOON_DAYS = 60;

  // Valid / expiring (within 60 days) / expired, from the expiry date.
  function state(c) {
    if (!c.expiry) return { cls: "", label: "No expiry date" };
    const days = Math.round((parseDate(c.expiry) - parseDate(isoDate(new Date()))) / 864e5); // round: a day is 23 or 25 h at the clock change
    if (days < 0) return { cls: "declined", label: "Expired " + fmtDate(c.expiry), days };
    if (days <= SOON_DAYS) return { cls: "pending", label: "Expires in " + days + " day" + (days === 1 ? "" : "s"), days };
    return { cls: "approved", label: "Valid to " + fmtDate(c.expiry), days };
  }
  const live = (c) => c.status !== "removed";
  const checked = (c) => c.status === "verified";
  const name = (c) => (c.type === "Other" && c.otherType ? c.otherType : c.type);

  const row = (c, who) => {
    const s = state(c);
    return '<a class="tile-row" href="#/card/' + c.id + '"><span><b>' + esc(who ? c.userName : name(c)) + '</b><span class="small">' +
      esc((who ? name(c) + " · " : "") + [c.category, c.number ? "No. " + c.number : ""].filter(Boolean).join(" · ")) + "</span></span>" +
      '<span class="amt"><span class="pill ' + s.cls + '">' + esc(s.label) + "</span>" + (checked(c) ? '<span class="small">✓ checked</span>' : "") + "</span></a>";
  };

  // ---------------------------------------------------------------- my cards
  route("cards", async () => {
    setBar(wsMode() ? "Weld certificates" : "My cards", wsMode() ? "Welder qualifications and weld procedures" : "Show these at the gate or induction", false);
    const mine = (await Data.list("cards")).filter(live).sort((a, b) => (a.expiry || "9").localeCompare(b.expiry || "9"));
    const due = mine.filter((c) => { const s = state(c); return s.days != null && s.days <= SOON_DAYS; });
    $("main").innerHTML = (due.length ? '<div class="warnbox">' + due.map((c) => esc(name(c)) + ": " + esc(state(c).label.toLowerCase())).join("<br>") + ". Book the renewal and tell the office.</div>" : "") +
      '<a class="btn primary block" href="#/card-new">' + (wsMode() ? "Add a certificate" : "Add a card") + '</a><div class="section-h">' + (wsMode() ? "My certificates" : "My cards") + " (" + mine.length + ")</div>" +
      (mine.length ? mine.map((c) => row(c)).join("") : '<div class="empty small">' + (wsMode() ? "Nothing yet. Add your welder qualifications and copies of the weld procedures you work to." : "No cards yet. Add your CSCS card and any others (CPCS, IPAF, PASMA, first aid …) so they\'re on your phone on site.") + "</div>");
  });

  route("card-new", async (args) => {
    const editing = args[0] ? await Data.get("cards", args[0]) : null;
    setBar(editing ? "Update" : wsMode() ? "Add a certificate" : "Add a card", "", true);
    const c = editing || {};
    $("main").innerHTML = '<form class="frm" novalidate>' +
      '<label class="fl">Card<select id="cType"><option value="">Choose…</option>' + (wsMode() ? WS_TYPES : TYPES).map((t) => "<option" + (t === c.type ? " selected" : "") + ">" + esc(t) + "</option>").join("") + "</select></label>" +
      '<label class="fl" id="cOtherL" hidden>Which card?<input id="cOther" value="' + esc(c.otherType || "") + '"></label>' +
      '<div class="row"><label class="fl">Card number<input id="cNo" value="' + esc(c.number || "") + '" autocomplete="off"></label><label class="fl">Expiry date<input type="date" id="cExp" value="' + esc(c.expiry || "") + '"></label></div>' +
      '<label class="fl">Category / level (optional)<input id="cCat" value="' + esc(c.category || "") + '" placeholder="e.g. Skilled worker (blue), 3a/3b, A60 telehandler"></label>' +
      '<div class="ff-l">Photos: front and back <span class="req-star">*</span></div><div class="thumbs" id="cThumbs"></div>' +
      '<label class="btn"><input type="file" id="cPh" accept="image/*" capture="environment" multiple hidden>Photograph card</label>' +
      '<div class="err" id="cErr" hidden></div><button type="submit" class="btn primary block">Save card</button></form>';
    let photos = (c.photos || []).slice();
    const other = () => ($("cOtherL").hidden = $("cType").value !== "Other");
    $("cType").onchange = other; other();
    const draw = async () => {
      const urls = await Promise.all(photos.map((id) => Data.blobUrl(id)));
      $("cThumbs").innerHTML = urls.map((u) => '<img src="' + u + '">').join("");
      $("cThumbs").querySelectorAll("img").forEach((img, i) => (img.onclick = async () => { if (await IC.ask("Remove this photo?", "Remove")) { photos.splice(i, 1); draw(); } }));
    };
    $("cPh").onchange = async (ev) => { for (const f of ev.target.files) photos.push(await Data.putBlob(await shrinkImage(f, 1600, 0.8))); ev.target.value = ""; draw(); };
    draw();
    document.querySelector(".frm").onsubmit = async (ev) => {
      ev.preventDefault();
      const errs = [];
      if (!$("cType").value) errs.push("Choose the card");
      if ($("cType").value === "Other" && !$("cOther").value.trim()) errs.push("Say which card it is");
      if (!$("cNo").value.trim()) errs.push("Enter the card number");
      if (!photos.length) errs.push("Photograph the card (front and back)");
      if ($("cExp").value && $("cExp").value < isoDate(new Date()) && !(await IC.ask("That card has already expired. Save it anyway?", "Save"))) return;
      if (errs.length) { $("cErr").hidden = false; $("cErr").innerHTML = errs.map(esc).join("<br>"); return; }
      const rec = Object.assign(c, { type: $("cType").value, otherType: $("cType").value === "Other" ? $("cOther").value.trim() : "", number: $("cNo").value.trim(), expiry: $("cExp").value,
        category: $("cCat").value.trim(), photos, status: "current" });
      // a changed card has to be checked again
      if (editing) { delete rec.decidedBy; delete rec.decidedAt; delete rec.decisionNote; }
      await Data.save("cards", rec);
      toast("Card saved"); location.hash = "#/cards";
    };
  });

  route("card", async (args) => {
    const c = await Data.get("cards", args[0]); if (!c) { history.back(); return; }
    const mine = c.user === Data.profile.email, s = state(c);
    setBar(name(c), mine ? "" : c.userName, true);
    const urls = await Promise.all((c.photos || []).map((id) => Data.blobUrl(id)));
    $("main").innerHTML = '<div class="big-amt" style="font-size:22px">' + esc(name(c)) + ' <span class="pill ' + s.cls + '">' + esc(s.label) + "</span></div>" +
      '<div class="kv">' + [["Holder", c.userName], ["Card number", c.number], c.category ? ["Category", c.category] : null, ["Expiry", c.expiry ? fmtDate(c.expiry) : "None"],
        ["Checked against the original", checked(c) ? c.decidedBy + " · " + fmtDate(c.decidedAt) : "Not yet"]].filter(Boolean).map(([k, v]) => "<div><span>" + esc(k) + "</span><b>" + esc(v) + "</b></div>").join("") + "</div>" +
      (urls.length ? '<div class="section-h">Photos</div><div class="receipts">' + urls.map((u) => '<img src="' + u + '">').join("") + "</div>" : "") +
      (mine ? '<div class="row"><a class="btn" href="#/card-new/' + c.id + '">Update (renewed card)</a><button class="btn" id="rm">Remove</button></div>' : "") +
      (!mine && Data.profile.isManager && !checked(c) ? '<button class="btn go block" id="ver">I\'ve seen the original card</button>' : "");
    if ($("rm")) $("rm").onclick = async () => { if (!(await IC.ask("Remove this card from your phone and the office record?", "Remove"))) return; c.status = "removed"; await Data.save("cards", c); toast("Removed"); location.hash = "#/cards"; };
    if ($("ver")) $("ver").onclick = async () => {
      // recorded as a manager decision so the card holder can't set it themselves
      await Data.decide("cards", c.id, "verified", "Checked against the original");
      toast("Marked as checked"); IC.refreshView();
    };
  });

  IC.Cards = { TYPES, state, live, checked, name, row, SOON_DAYS };
})();
