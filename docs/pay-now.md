# pay-now — the Here app's payment rail (dashboard deploy)

`pay.html` shows one button; this function is what's behind it. A walk-up
client pays the house directly through Stripe Checkout — Apple Pay on iOS
Safari and Google Pay on Android Chrome appear automatically, no extra setup.

This is the Here edition: the success/cancel URLs point at the Here app, and
since the Here desk is the only payee, no providers table is required — the
house slug collects on the platform's own Stripe account.

## Deploy (Supabase dashboard, "Here" project)

1. Edge Functions → **Deploy a new function** → name it exactly `pay-now`.
2. Delete the template `index.ts`, paste the code below, no extra files.
3. **Enforce JWT verification: OFF** — the payer is a walk-up client with no
   account; the function never trusts anything client-supplied but the amount.
4. Project Settings → Edge Functions → **Secrets** → add `STRIPE_SK` = your
   Stripe secret key (sk_live_… — same key the mothership uses, or a fresh
   restricted key). `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are injected
   by the platform automatically.
5. Deploy.

## index.ts

```ts
// PAY-NOW (Here edition) — a walk-up client pays the house directly.
// Stripe Checkout hosts the sheet; Apple Pay / Google Pay ride free.
import Stripe from "npm:stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SK")!);
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

  const { slug, amount, title } = await req.json().catch(() => ({}));
  const s = String(slug || "").toLowerCase().trim();
  const gross = Math.max(0, Number(amount) || 0);
  if (!s || gross < 1) return json({ error: "bad_request" }, 400);
  if (!HOUSE[s]) return json({ error: "not_live" }, 409); // the Here desk pays the house only

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: String(title || "Payment to McCluster").slice(0, 250) },
        unit_amount: Math.round(gross * 100),
      },
      quantity: 1,
    }],
    metadata: { slug: s, kind: "direct" },
    success_url: `${SITE}/pay.html?to=${encodeURIComponent(s)}&done=1`,
    cancel_url: `${SITE}/pay.html?to=${encodeURIComponent(s)}`,
  });

  return json({ url: session.url });
});
```

## Notes

- Stripe emails the payer a receipt automatically.
- When outside creators (Laire, Zakir) should get paid through the Here app
  too, bring over the mothership's `providers` columns + `connect-onboard`
  door and swap in the destination-charge edition of this function — the
  mothership's `docs/pay-now.md` is that version.
