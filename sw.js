/* ============================================================
   THE KEEPER — the offline layer every store demands.
   Conservative by law:
   - never touches other origins (Supabase, CDNs ride untouched)
   - never touches media streams (range requests pass through)
   - fonts & images: cache-first (instant on revisit)
   - pages, css, js, data: network-first with cache fallback
     (the app opens even with no signal)
   The version stamp changes on every deploy, which retires the
   old cache automatically. No stale sites, ever.
   ============================================================ */
var V = "mcc-2cf3d88f315a";

self.addEventListener("install", function () { self.skipWaiting(); });

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.headers.has("range")) return;
  if (/\.(mp4|webm|mp3|m4a|wav)$/i.test(u.pathname)) return;

  if (/\.(woff2|png|jpg|jpeg|webp|svg|ico)$/i.test(u.pathname)) {
    e.respondWith(
      caches.open(V).then(function (c) {
        return c.match(r).then(function (hit) {
          return hit || fetch(r).then(function (res) {
            if (res.ok) c.put(r, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }

  e.respondWith(
    fetch(r).then(function (res) {
      if (res.ok) caches.open(V).then(function (c) { c.put(r, res.clone()); });
      return res;
    }).catch(function () {
      return caches.match(r).then(function (hit) { return hit || caches.match("index.html"); });
    })
  );
});
