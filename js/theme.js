/* THE LIGHT SWITCH — dark by default, light on request, remembered on
   the device, following the system if the visitor never chose. Loads in
   the head so the page paints in the right mode from frame one. */
(function () {
  "use strict";
  var t = null;
  try { t = localStorage.getItem("mcc_theme"); } catch (e) {}
  if (t !== "light" && t !== "dark") {
    t = (window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
  }
  document.documentElement.setAttribute("data-theme", t);
  window.MCC_THEME = {
    get: function () { return document.documentElement.getAttribute("data-theme"); },
    set: function (x) {
      document.documentElement.setAttribute("data-theme", x);
      try { localStorage.setItem("mcc_theme", x); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent("mcc:theme", { detail: { theme: x } })); } catch (e) {}
    },
    flip: function () { this.set(this.get() === "light" ? "dark" : "light"); },
  };
})();

/* THE KEEPER boards on every page the theme rides */
if ("serviceWorker" in navigator) {
  addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}
