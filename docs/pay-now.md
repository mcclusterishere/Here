# pay-now v2 — the payment rail, Connect SaaS edition (dashboard redeploy)

`pay.html?to=<slug>` pays the named desk. The house slugs collect on the
platform's own account; a creator with a live Express rail is paid by
**destination charge** — their money lands in their bank, and the platform's
application fee is carved off automatically. That fee is the SaaS revenue on
every payment that moves through the app.

Replaces the v1 (house-only) function: open the existing `pay-now` function →
Code → replace with the code below → Deploy. Settings stay: **JWT OFF**,
`STRIPE_SK` already set. Requires `docs/connect-saas.sql` (the providers table).

## index.ts

```ts
// PAY-NOW v2 (Here) — house collects direct; creators get destination
// charges with the platform fee carved off. Server resolves the payee;
// nothing client-supplied is trusted but the amount.
import Stripe from "npm:stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SK")!);
const SB = Deno.env.get("SUPABASE_URL")!;
const SRV = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://mcclusterishere.github.io/Here";
const HOUSE: Record<string, boolean> = { mccluster: true, "equity-uprise": true };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const { slug, amount, title, fee_pct = 8 } = await req.json().catch(() => ({}));
  const s = String(slug || "").toLowerCase().trim();
  const gross = Math.max(0, Number(amount) || 0);
  if (!s || gross < 1) return json({ error: "bad_request" }, 400);

  const house = !!HOUSE[s];
  let acct: string | null = null;

  if (!house) {
    const rows = await fetch(
      `${SB}/rest/v1/providers?slug=eq.${encodeURIComponent(s)}&select=stripe_acct,charges_enabled&limit=1`,
      { headers: { apikey: SRV, Authorization: `Bearer ${SRV}` } },
    ).then((r) => r.json()).catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || !row.stripe_acct || row.charges_enabled !== true) {
      return json({ error: "not_live" }, 409); // finishing payout setup
    }
    acct = row.stripe_acct as string;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: String(title || "Payment").slice(0, 250) },
        unit_amount: Math.round(gross * 100),
      },
      quantity: 1,
    }],
    ...(acct ? {
      payment_intent_data: {
        application_fee_amount: Math.round(gross * fee_pct), // the platform's cut, in cents
        transfer_data: { destination: acct },
      },
    } : {}),
    metadata: { slug: s, kind: "direct" },
    success_url: `${SITE}/pay.html?to=${encodeURIComponent(s)}&done=1`,
    cancel_url: `${SITE}/pay.html?to=${encodeURIComponent(s)}`,
  });

  return json({ url: session.url });
});
```
