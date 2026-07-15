/* ============================================================
   THE BAR — three doors, one grammar.
   The same tap law as the mothership dock: ONE tap opens the
   icon's menu right on the bar (tap it again to close) · TWO
   taps walk you all the way through · THREE or more do nothing,
   so you never fat-finger your way somewhere. A single 300ms
   timer decides once, by the final tap count, so a second tap
   always has time to cancel the first. The anchor law holds:
   the tab you tapped never moves and never changes — only the
   other slots rearrange into the wing's menu.
   Tabs: MUSIC (the old law — once for the sound, twice for the
   album) · HERE, center (the M emblem over the word, back to the
   front page) · PROFILE (for those who can log in).
   ============================================================ */
(function () {
  "use strict";
  var dock = document.querySelector(".appbar");
  if (!dock) return;

  var SCB = "https://streetcreditbureau.com/";
  var WINGS = {
    music: {
      home: "album.html",
      slots: [
        ["album.html", "note", "The album"],
        ["index.html", "film", "The film"],
      ],
    },
    home: {
      home: "index.html",
      slots: [
        ["album.html", "note", "The album"],
        ["hire.html", "case", "Hire"],
      ],
    },
    profile: {
      home: SCB + "profile.html",
      slots: [
        [SCB + "profile.html", "key", "Sign in"],
        [SCB + "profile.html#yours", "desk", "Your desk"],
      ],
    },
  };
  var ORDER = ["music", "home", "profile"];
  var HOME_BAR = dock.innerHTML;
  var wingOn = null, taps = 0, tapKey = null, timer = null;

  var ICONS = {
    flag: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 3.5L17 11H5"/>',
    film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 5v4M12 5v4M17 5v4"/>',
    note: '<path d="M9 18V6l10-2v11"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="15" r="2.5"/>',
    case: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
    key: '<circle cx="8" cy="14" r="4"/><path d="M11 11L20 2"/><path d="M17 5l2.5 2.5M14.5 7.5L17 10"/>',
    desk: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  };
  function ic(k) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[k] || ICONS.desk) + "</svg>";
  }

  var SOUND_ON = false;
  window.addEventListener("mcc:nowplaying", function (e) {
    SOUND_ON = !!(e.detail && e.detail.playing);
    var mt = dock.querySelector('[data-appnav="music"]');
    if (mt) mt.classList.toggle("is-sound", SOUND_ON);
  });
  function soundLive() { return SOUND_ON; }
  function hushAll() {
    document.querySelectorAll("audio, video").forEach(function (a) { try { a.pause(); } catch (e) {} });
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

  function morph(key) {
    var w = WINGS[key];
    if (!w || wingOn === key) return;
    veilOff();
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
    var idx = ORDER.indexOf(key), cells = [], si = 0;
    for (var i = 0; i < ORDER.length; i++) {
      if (i === idx) cells.push(anchor ? anchor.outerHTML : "");
      else cells.push(slotHtml[si++]);
    }
    dock.innerHTML = cells.join("");
  }

  function revert() {
    if (!wingOn) return;
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
        if (key === "music" && soundLive()) { hushAll(); return; }       // playing? one tap hushes
        if (key === "music" && window.MCC_NP_PLAY) { window.MCC_NP_PLAY(); return; } // once for the sound
        if (w) { if (wingOn === key) revert(); else morph(key); } // open (or close) the wing
        else sail(slot, 460); // a slot in an open wing is already the answer — go
      } else if (n === 2) {
        sail(w ? w.home : slot, 460); // two taps: all the way through
      }
      // three or more: nothing
    }, 300);
  });

  /* tap anywhere off the bar: the wing folds home */
  document.addEventListener("pointerdown", function (e) {
    if (wingOn && !(e.target.closest && e.target.closest(".appbar"))) revert();
  }, true);
  window.addEventListener("pageshow", function () { taps = 0; tapKey = null; veilOff(); revert(); });

  window.MCC_BAR = { morph: morph, revert: revert, wing: function () { return wingOn; } };
  if (window.MCC_TRACK) window.MCC_TRACK("bar_boot", { page: location.pathname.split("/").pop() });
})();
