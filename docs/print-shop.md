# THE PRINT SHOP — how it runs today, how it arms

## Live now (no keys needed)

prints.html sells every photo three ways: physical prints (8×10 $35 ·
11×14 $65 · 16×20 $110 · 24×36 $200), PNG personal-use $25, full-res +
print rights $65, RAW + commercial rights $350. All prices live in
data/prints.json — one file to reprice.

Today's flow: buyer picks a format, prints collect a shipping address,
the order lands on crm.html structured like
`PRINT SHOP · rally-03 · 16×20 print ($110) · SHIP TO: …` —
owner invoices from the desk (Stripe invoice or Square), then:
- prints: place the lab order manually (or wait for the armed rail)
- PNG/full-res: email the file
- RAW: email the file + license note within 24h

## The armed era (three keys, in order)

1. **Migration 0004** (this repo) creates `print_orders` + the private
   `masters` storage bucket — applies via the migration rail or the
   Supabase connector when either is live.
2. **Stripe checkout**: an edge function creates a Checkout Session
   (shipping address collection ON for prints); stripe-webhook catches
   `checkout.session.completed` → marks the order `paid`.
3. **Prodigi** (print API — prodigi.com, free account, pay per order):
   `PRODIGI_API_KEY` goes in Supabase function secrets. On `paid`
   print orders the webhook posts to Prodigi's order API with the
   print-ready file URL + address; Prodigi prints/ships/webhooks
   tracking back → order shows `shipped` + tracking on the desk.
4. **Digital delivery**: on `paid` digital orders, generate a signed
   expiring URL from the `masters` bucket and email it (Resend
   connector is authorized for this). RAW orders attach the license
   text automatically.

Masters upload: RAW/full-res files go to the `masters` bucket via the
dashboard (Storage → masters) named `<photo-id>.<ext>` — e.g.
`rally-03.dng`, `rally-03.png`. The delivery rail matches on photo id.

Owner-only errands: Prodigi account + API key into function secrets;
upload masters; keep prices honest in data/prints.json.

## Lab cost reference (so prices stay profitable)

8×10 ~$6–9 · 11×14 ~$10–14 · 16×20 ~$14–20 · 24×36 ~$25–35, plus
$5–12 shipping. Current ladder clears healthy margin at every size.
