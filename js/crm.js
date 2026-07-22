/* ============================================================
   THE FRONT DESK, street side — no lead ever slips.
   - First-touch attribution: utm_* / gclid on ANY landing gets
     remembered on the device, so a Google Ads click three pages
     ago still shows up on the lead it becomes.
   - THE SHEET: name, email, what you need — twenty seconds and
     it's on the owner's desk. Any [data-lead-sheet] opens it.
   ============================================================ */
(function () {
  "use strict";
  var SB_URL = "https://zmnhbrjyhxzhkxmhkexs.supabase.co";
  var SB_KEY = "sb_publishable_kr5NujBZ1n518IUMDoa2dQ_tqQAJef4";

  /* ---------- first touch: remember how they found the house ---------- */
  var A_KEY = "mcc_attrib";
  try {
    var q = new URLSearchParams(location.search);
    var src = q.get("utm_source") || (q.get("gclid") ? "google-ads" : null);
    if (src && !localStorage.getItem(A_KEY)) {
      localStorage.setItem(A_KEY, JSON.stringify({
        source: src, medium: q.get("utm_medium"), campaign: q.get("utm_campaign"),
        gclid: q.get("gclid"), landing: location.pathname.split("/").pop() || "index.html",
        at: new Date().toISOString(),
      }));
      if (window.MCC_TRACK) window.MCC_TRACK("ad_visit", { source: src, campaign: q.get("utm_campaign") || "" });
    }
  } catch (e) {}
  function attrib() { try { return JSON.parse(localStorage.getItem(A_KEY)) || {}; } catch (e) { return {}; } }

  function send(lead) {
    var a = attrib();
    return fetch(SB_URL + "/rest/v1/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, Prefer: "return=minimal" },
      body: JSON.stringify({
        name: lead.name, email: lead.email, want: lead.want || "", note: lead.note || "",
        page: location.pathname.split("/").pop() || "index.html",
        source: lead.source || a.source || "direct", medium: a.medium || null,
        campaign: lead.campaign || a.campaign || null, gclid: a.gclid || null,
      }),
    }).then(function (r) { if (!r.ok) throw new Error("lead " + r.status); });
  }

  /* ---------- THE SHEET ---------- */
  var WANTS = ["Video / brand film", "Photography", "Web design", "Media management / consulting", "Music / scoring", "Something else"];
  var el = null;
  function close() { if (el && el.parentNode) el.parentNode.removeChild(el); el = null; }
  function open(want) {
    close();
    el = document.createElement("div");
    el.className = "leadsheet";
    el.innerHTML =
      '<div class="leadsheet__card" role="dialog" aria-label="Lock in">' +
      "<b>Lock in.</b>" +
      "<small>Tell me what you need — it lands on my desk the second you send it.</small>" +
      '<input name="name" placeholder="Your name" autocomplete="name" maxlength="80">' +
      '<input name="email" type="email" placeholder="Email" autocomplete="email" maxlength="120">' +
      '<select name="want"><option value="">What do you need?</option>' +
      WANTS.map(function (w) { return "<option" + (w === want ? " selected" : "") + ">" + w + "</option>"; }).join("") +
      "</select>" +
      '<textarea name="note" rows="3" maxlength="1200" placeholder="The project, the date, the budget — whatever you have"></textarea>' +
      '<button class="leadsheet__go" type="button">Send it &#8594;</button>' +
      '<button class="leadsheet__no" type="button">Not yet</button>' +
      '<p class="leadsheet__err" hidden>That didn’t go through — check the email and try again, or just email matthew@mccluster.org.</p>' +
      "</div>";
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      if (e.target === el || (e.target.closest && e.target.closest(".leadsheet__no"))) { close(); return; }
      if (!(e.target.closest && e.target.closest(".leadsheet__go"))) return;
      var f = function (n) { var i = el.querySelector('[name="' + n + '"]'); return i ? i.value.trim() : ""; };
      var lead = { name: f("name"), email: f("email"), want: f("want"), note: f("note") };
      var err = el.querySelector(".leadsheet__err");
      if (!lead.name || !/.+@.+\..+/.test(lead.email)) { err.hidden = false; return; }
      var go = el.querySelector(".leadsheet__go");
      go.disabled = true; go.textContent = "Sending…";
      send(lead).then(function () {
        if (window.MCC_TRACK) window.MCC_TRACK("lead_submit", { want: lead.want, source: attrib().source || "direct" });
        el.querySelector(".leadsheet__card").innerHTML =
          "<b>On the desk.</b>" +
          "<small>Got it — I reply fast. Want the date locked today? Book the call now and the deposit applies to your project.</small>" +
          '<a class="leadsheet__go" href="mailto:matthew@mccluster.org?subject=' +
          encodeURIComponent("Book a call — " + lead.name) + '">Book a call &#8594;</a>' +
          '<button class="leadsheet__no" type="button">Done</button>';
      }).catch(function () {
        go.disabled = false; go.textContent = "Send it →"; err.hidden = false;
      });
    });
    var first = el.querySelector('[name="name"]');
    if (first) first.focus();
  }

  window.MCC_CRM = { open: open, attrib: attrib, send: send };
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-lead-sheet]");
    if (b) { e.preventDefault(); open(b.getAttribute("data-lead-sheet") || ""); }
  });
})();
