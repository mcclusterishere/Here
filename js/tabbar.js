/* ============================================================
   THE BAR — three doors, one grammar, all four laws.
   TAB:   one tap opens the icon's wing right on the bar (tap it
          again to close) · two taps walk you all the way through.
   SLOT:  one tap PEEKS — the item's widget pops above the bar so
          you see the room before you enter · two taps go through
          to the full experience.
   THREE or more taps do nothing, so you never fat-finger your
   way somewhere. A single 300ms timer decides once, by the final
   tap count. The anchor law holds: the tab you tapped never moves
   — only the other slots become the wing's menu.
   THE WALK: first boot on any device, a four-beat lesson teaches
   the grammar in practice mode (doors hold, nothing navigates).
   Skippable; never shown twice (mcc_here_walk). ?walk=1 replays.
   ============================================================ */
(function () {
  "use strict";
  var dock = document.querySelector(".appbar");
  if (!dock) return;

  /* slots: [href, icon, label, peek {ic, title, sub, dyn}] — every room in
     the house lives in one of the three wings */
  var WINGS = {
    /* the trim law: a wing carries exactly TWO rooms, so an open wing is
       the same three-cell bar you started with — the anchor plus two
       doors, never a crowd. Everything else lives in the footer. */
    music: {
      home: "album.html",
      slots: [
        ["album.html", "note", "The album", { ic: "♫", title: "HERE — the album",
          sub: "Six tracks in the site's own player — the deck, lock-screen controls, and a memory. It picks up where you left off." }],
        ["films.html", "film", "Lyric Videos", { ic: "🎬", title: "Lyric videos — one swipe",
          sub: "The whole catalog as lyric videos — swipe, and every record plays its own scene-cut film with the words live on the picture." }],
      ],
    },
    home: {
      home: "index.html",
      slots: [
        ["hire.html", "case", "Hire", { ic: "🤝", title: "Hire the agency",
          sub: "Brand films, photography, web builds, campaign strategy — one team, start to finish." }],
        ["prints.html", "card", "Prints", { ic: "🖼️", title: "The Print Shop",
          sub: "Own the work — museum-stock prints shipped to your door, files for personal use, or the RAW with commercial rights." }],
      ],
    },
    profile: {
      home: "account.html",
      slots: [
        ["account.html", "key", "Sign in", { ic: "🔑", title: "Your account",
          sub: "A sign-in link lands in your email — no password. Your record with the agency lives here.",
          dyn: function () {
            var u = window.MCC_AUTH && window.MCC_AUTH.user && window.MCC_AUTH.user();
            return u ? "Signed in as " + (u.email || "your instant account") + " — your bookings and receipts are on the record." : null;
          } }],
        ["shots.html", "grid", "Shot Wall", { ic: "📸", title: "The Shot Wall",
          sub: "Were you at the event? Find your photo on the wall — the first one's free with a follow, the whole pack is a few dollars." }],
      ],
    },
  };
  var ORDER = ["music", "home", "profile"];
  /* the coin: the wing this page lives in wears the filled gold circle */
  var PAGE_WING = {
    "album.html": "music", "films.html": "music", "catalogue.html": "music",
    "": "home", "index.html": "home", "hire.html": "home", "feed.html": "home",
    "ecosystem.html": "home", "equity-uprise.html": "home", "docket-516.html": "home",
    "portfolio.html": "home", "shots.html": "home", "production.html": "home", "archive.html": "home", "gallery.html": "home", "prints.html": "home",
    "account.html": "profile", "cut.html": "profile", "pay.html": "profile",
    "press.html": "profile", "matthew-mccluster.html": "profile", "crm.html": "profile"
  };
  var hereTab = dock.querySelector('[data-appnav="' + (PAGE_WING[location.pathname.split("/").pop()] || "") + '"]');
  if (hereTab) hereTab.classList.add("is-here");
  var HOME_BAR = dock.innerHTML;
  var wingOn = null, taps = 0, tapKey = null, timer = null, practice = false;

  var ICONS = {
    film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 5v4M12 5v4M17 5v4"/>',
    note: '<path d="M9 18V6l10-2v11"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="15" r="2.5"/>',
    case: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
    key: '<circle cx="8" cy="14" r="4"/><path d="M11 11L20 2"/><path d="M17 5l2.5 2.5M14.5 7.5L17 10"/>',
    card: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19"/><path d="M6 15h4"/>',
    disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 3.5L17 11H5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    news: '<rect x="3" y="4.5" width="15" height="15" rx="2"/><path d="M18 8h1.5a1.5 1.5 0 0 1 1.5 1.5V17a2.5 2.5 0 0 1-2.5 2.5H5"/><path d="M6.5 8.5h8M6.5 12h8M6.5 15.5h5"/>',
    desk: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  };
  function ic(k) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[k] || ICONS.desk) + "</svg>";
  }
  function emit(n, d) { try { window.dispatchEvent(new CustomEvent(n, { detail: d || {} })); } catch (e) {} }

  var SOUND_ON = false;
  window.addEventListener("mcc:nowplaying", function (e) {
    SOUND_ON = !!(e.detail && e.detail.playing);
    var mt = dock.querySelector('[data-appnav="music"]');
    if (mt) mt.classList.toggle("is-sound", SOUND_ON);
  });
  function soundLive() { return SOUND_ON; }
  function hushAll() {
    document.querySelectorAll("audio, video").forEach(function (a) {
      if (a.classList && a.classList.contains("wings__vid")) return; // the door films never stop
      try { a.pause(); } catch (e) {}
    });
    SOUND_ON = false;
    var mt = dock.querySelector('[data-appnav="music"]');
    if (mt) mt.classList.remove("is-sound");
  }

  /* the veil the departure rides behind */
  var veil = document.createElement("div");
  veil.className = "pt-veil";
  document.body.appendChild(veil);
  function veilOn() { document.documentElement.classList.add("pt-out"); }
  function veilOff() { document.documentElement.classList.remove("pt-out"); }

  function sail(dest, wait) {
    unpeek();
    if (practice) { emit("mcc:bar-go", { href: dest }); return; } // class is in session — the door holds
    var url = null;
    try { url = new URL(dest, location.href); } catch (e) {}
    if (url && url.pathname === location.pathname && url.search === location.search) {
      veilOff(); revert();
      if (url.hash) location.hash = url.hash;
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    veilOn();
    setTimeout(function () { location.href = dest; }, wait);
  }

  /* ---------- THE PEEK: one tap on a slot shows the room's widget ---------- */
  var peekEl = null, peekFor = null;
  function unpeek() {
    if (peekEl && peekEl.parentNode) peekEl.parentNode.removeChild(peekEl);
    peekEl = null; peekFor = null;
  }
  function peek(slotHref) {
    if (peekFor === slotHref) { unpeek(); return; } // tap the same slot again: the card folds
    unpeek();
    var def = null;
    Object.keys(WINGS).forEach(function (k) {
      WINGS[k].slots.forEach(function (s) { if (s[0] === slotHref) def = s; });
    });
    if (!def || !def[3]) { sail(slotHref, 460); return; }
    var p = def[3];
    var sub = (p.dyn && p.dyn()) || p.sub;
    peekFor = slotHref;
    peekEl = document.createElement("div");
    peekEl.className = "dk-peek";
    peekEl.innerHTML =
      '<div class="dk-peek__card">' +
      '<div class="dk-peek__top"><span class="dk-peek__ic">' + p.ic + "</span>" +
      "<span><b>" + p.title + "</b><small>" + sub + "</small></span></div>" +
      '<div class="dk-peek__acts">' +
      '<button class="dk-peek__go" type="button" data-peek-go="' + slotHref + '">Step inside &#8594;</button>' +
      '<button class="dk-peek__alt" type="button" data-peek-no>Not yet</button>' +
      "</div></div>";
    document.body.appendChild(peekEl);
    peekEl.addEventListener("click", function (e) {
      var go = e.target.closest && e.target.closest("[data-peek-go]");
      if (go) { sail(go.getAttribute("data-peek-go"), 460); return; }
      if (e.target.closest && e.target.closest("[data-peek-no]")) unpeek();
    });
    emit("mcc:bar-peek", { href: slotHref });
  }

  function morph(key) {
    var w = WINGS[key];
    if (!w || wingOn === key) return;
    veilOff();
    unpeek();
    wingOn = key;
    dock.classList.add("appbar--morph");
    /* anchor law: the tapped tab holds its cell, untouched */
    var tmp = document.createElement("div");
    tmp.innerHTML = HOME_BAR;
    var anchor = tmp.querySelector('[data-appnav="' + key + '"]');
    if (anchor) anchor.classList.add("appbar__tab--wing", "is-active");
    var slotHtml = w.slots.map(function (s) {
      return '<a class="appbar__tab appbar__tab--slot" href="' + s[0] + '" data-dock="' + s[0] + '">' +
        ic(s[1]) + "<span>" + s[2] + "</span></a>";
    });
    /* the anchor keeps its side of the bar: left tab stays leftmost, the
       center tab stays centered, the right tab stays rightmost — however
       many rooms its wing carries */
    var total = slotHtml.length + 1;
    var idx = ORDER.indexOf(key);
    var anchorAt = idx === 0 ? 0 : idx === ORDER.length - 1 ? total - 1 : Math.floor(total / 2);
    var cells = [], si = 0;
    for (var i = 0; i < total; i++) {
      if (i === anchorAt) cells.push(anchor ? anchor.outerHTML : "");
      else cells.push(slotHtml[si++]);
    }
    dock.innerHTML = cells.join("");
    emit("mcc:bar-morph", { wing: key });
  }

  function revert() {
    if (!wingOn) return;
    unpeek();
    wingOn = null;
    dock.classList.remove("appbar--morph");
    dock.innerHTML = HOME_BAR;
  }

  dock.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[data-dock],a[data-appnav]");
    if (!a || !dock.contains(a)) return;
    e.preventDefault();
    var slot = a.getAttribute("data-dock");
    var key = a.getAttribute("data-appnav");
    var id = slot || key;
    var w = key ? WINGS[key] : null;
    if (id !== tapKey) { taps = 0; tapKey = id; }
    taps += 1;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var n = taps;
      taps = 0;
      if (n === 1) {
        if (!practice && key === "music" && soundLive()) { hushAll(); revert(); return; } // playing? one tap hushes and folds
        if (!practice && key === "music" && window.MCC_NP_PLAY && !wingOn) { window.MCC_NP_PLAY(); } // once for the sound — and the wing opens with it
        if (w) { if (wingOn === key) revert(); else morph(key); } // a tab opens (or closes) its wing
        else peek(slot); // a slot previews its widget — travel waits
      } else if (n === 2) {
        sail(w ? w.home : slot, 460); // two taps: all the way through
      }
      // three or more: nothing
    }, 300);
  });

  /* tap anywhere off the bar (and off a peek): everything folds home */
  document.addEventListener("pointerdown", function (e) {
    if (e.target.closest && (e.target.closest(".appbar") || e.target.closest(".dk-peek") || e.target.closest(".dockwalk"))) return;
    if (peekEl) unpeek();
    if (wingOn) revert();
  }, true);
  window.addEventListener("pageshow", function () { taps = 0; tapKey = null; veilOff(); unpeek(); revert(); });

  window.MCC_BAR = { morph: morph, revert: revert, peek: peek, wing: function () { return wingOn; } };
  if (window.MCC_TRACK) window.MCC_TRACK("bar_boot", { page: location.pathname.split("/").pop() });

  /* ---------- THE WALK: four beats, first boot only ---------- */
  var WALK_KEY = "mcc_here_walk";
  var walked = false;
  try { walked = !!localStorage.getItem(WALK_KEY); } catch (e) {}
  if (walked && !/[?&]walk=1/.test(location.search)) return;
  /* tap-card landings came for one thing — never put a lesson between
     a person and their photo (replayable anywhere with ?walk=1) */
  if (location.pathname.split("/").pop() === "shots.html" && !/[?&]walk=1/.test(location.search)) return;

  practice = true;
  var step = 0;
  var STEPS = [
    { k: "✦ Lesson one — the bar", h: "One tap looks.", p: "Tap <b>♫ Music</b> once — its wing opens right on the bar. Nothing moves you anywhere.", wait: "mcc:bar-morph" },
    { k: "✦ Lesson two — the preview", h: "One tap previews.", p: "Now tap <b>The album</b> once — its widget pops up so you see the room before you enter.", wait: "mcc:bar-peek" },
    { k: "✦ Lesson three — the commit", h: "Two taps go through.", p: "Double-tap any door. In class the door holds — out there, two taps take you all the way.", wait: "mcc:bar-go" },
    { k: "✦ The whole grammar", h: "Three taps? Nothing.", p: "You can never fat-finger your way somewhere. One tap looks · two taps go · three taps rest. The doors are yours.", wait: null },
  ];
  var ov = document.createElement("div");
  ov.className = "dockwalk";
  document.body.appendChild(ov);

  function paintStep() {
    var s = STEPS[step];
    ov.innerHTML = '<div class="dockwalk__card">' +
      '<p class="dockwalk__k">' + s.k + "</p><h3>" + s.h + "</h3><p>" + s.p + "</p>" +
      '<div class="dockwalk__dots">' + STEPS.map(function (_, i) {
        return '<i class="' + (i <= step ? "is-lit" : "") + '"></i>'; }).join("") + "</div>" +
      (s.wait ? '<button class="dk-peek__alt" type="button" data-walk-skip style="margin-top:1rem">Skip the lesson &#10005;</button>'
              : '<button class="dockwalk__btn" type="button" data-walk-done>Open the doors &#8594;</button>') +
      "</div>";
  }
  function finish() {
    try { localStorage.setItem(WALK_KEY, String(Date.now())); } catch (e) {}
    practice = false;
    if (ov.parentNode) ov.parentNode.removeChild(ov);
    unpeek(); revert();
    if (window.MCC_TRACK) window.MCC_TRACK("bar_walk_done", { at_step: step });
  }
  function advance() {
    if (step >= STEPS.length - 1) return;
    step += 1;
    paintStep();
  }
  ["mcc:bar-morph", "mcc:bar-peek", "mcc:bar-go"].forEach(function (ev) {
    window.addEventListener(ev, function () {
      if (!practice) return;
      if (STEPS[step] && STEPS[step].wait === ev) advance();
    });
  });
  ov.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-walk-skip]")) { finish(); return; }
    if (e.target.closest && e.target.closest("[data-walk-done]")) finish();
  });
  paintStep();
  if (window.MCC_TRACK) window.MCC_TRACK("bar_walk_start", {});
})();
