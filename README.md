# HERE

**Have no fear, McCluster is here.**

The six-song album by Matthew McCluster, and the marketing agency behind it —
stripped to the essentials. Forked from the
[McCluster-Portfolio](https://github.com/mcclusterishere/McCluster-Portfolio)
platform; the full ecosystem still lives at
[streetcreditbureau.com](https://streetcreditbureau.com).

## The record

1. Who Did The Shoot
2. Lightroom
3. Runway Walk
4. Write a Song
5. Here
6. Antisocial

## The pages

- `index.html` — the album (plays in place) + the agency
- `hire.html` — rates, proof, booking
- `pay.html` — the Apple Pay / Google Pay widget (`?to=slug&for=…&amt=…`)

## Deploy

Push to `main` → `.github/workflows/deploy-pages.yml` stamps asset versions and
mirrors to `gh-pages`. In repo **Settings → Pages**, set the source to the
`gh-pages` branch (one-time). Payments ride the same Supabase + Stripe rail as
the mothership (`pay-now` edge function).
