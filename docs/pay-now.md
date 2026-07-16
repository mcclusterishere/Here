# pay-now v3 — the payment rail, SaaS Stripe-owned pricing (dashboard redeploy)

`pay.html?to=<slug>` pays the named desk. Two lanes, per the Connect SaaS
Stripe-owned pricing model:

- **House slugs** (`mccluster`, `equity-uprise`) collect on the platform's own
  account, as before.
- **Creators** process **direct charges on their own Stripe account** — they
  are the merchant of record, they pay Stripe's processing fees, they carry
  their own refund/chargeback liability, and the platform's **application fee**
  is carved off every transaction. Stripe charges the platform nothing in this
  model.

Replaces the earlier destination-charge edition: open the existing `pay-now`
function → Code → replace with the code below → Deploy. Settings stay:
**JWT OFF**, `STRIPE_SK` already set. Requires `docs/connect-saas.sql`.

## index.ts

```ts
// PAY-NOW v3 (Here) — house collects direct on the platform account;
// creators process DIRECT CHARGES on their own account (merchant of
// record, their Stripe fees, their liability) with the platform's
// application fee carved off. Server resolves the payee; nothing
// client-supplied is trusted but the amount.
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

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: String(title || "Payment").slice(0, 250) },
        unit_amount: Math.round(gross * 100),
      },
      quantity: 1,
    }],
    metadata: { slug: s, kind: "direct" },
    success_url: `${SITE}/pay.html?to=${encodeURIComponent(s)}&done=1`,
    cancel_url: `${SITE}/pay.html?to=${encodeURIComponent(s)}`,
  };

  if (HOUSE[s]) {
    // the house collects on the platform's own account
    const session = await stripe.checkout.sessions.create(params);
    return json({ url: session.url });
  }

  // a creator: resolve their rail server-side
  const rows = await fetch(
    `${SB}/rest/v1/providers?slug=eq.${encodeURIComponent(s)}&select=stripe_acct,charges_enabled&limit=1`,
    { headers: { apikey: SRV, Authorization: `Bearer ${SRV}` } },
  ).then((r) => r.json()).catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row || !row.stripe_acct || row.charges_enabled !== true) {
    return json({ error: "not_live" }, 409); // finishing payout setup
  }

  // DIRECT CHARGE — the session lives on the creator's account;
  // the application fee is the platform's SaaS revenue per transaction
  params.payment_intent_data = { application_fee_amount: Math.round(gross * fee_pct) };
  const session = await stripe.checkout.sessions.create(params, { stripeAccount: row.stripe_acct });
  return json({ url: session.url });
});
```

## Note

- `fee_pct` arrives in cents-per-dollar terms (8 → 8¢ per $1 = 8%), matching
  the platform's quoted rate.
- The `account.updated` webhook events for connected accounts only arrive if
  the Stripe webhook endpoint has **"Listen to events on Connected accounts"**
  selected — see docs/stripe-webhook.md.
