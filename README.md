# XPORTAL

B2B marketplace and spatial-intelligence interface for verified commercial
development sites in Ukraine, Poland, Slovakia, Hungary and Romania. The
application runs on Next.js and Netlify with provider-neutral PostgreSQL and
private Netlify Blobs.

## Current product stage

- XPORTAL starts as an intermediary, not the property owner.
- The public experience focuses on discovery, cadastral verification, buyer
  qualification and visual marketplace design.
- No payment method, wallet connection or transaction endpoint is active.
- Only verified commercial property records can be published as listings.
- When no verified geometry exists, the immersive map renders clearly labelled
  design-preview zones that are not offers for sale.

## Spatial experience

The first four viewport heights form one reversible scroll sequence:

1. the XPORTAL landing page fills the viewport;
2. scrolling forward scales the landing page away and reveals Europe;
3. the camera centres on Rakhiv Raion in Ukraine;
4. further scrolling descends to parcel level and reveals verified boundaries,
   or labelled interface-preview zones when inventory is still empty.

Scrolling upward reverses the same camera and landing-page transition. The map
remains draggable, while the page scroll controls its altitude.

## Application areas

- `/` and `/de`: English/German immersive marketplace and buyer whitelist.
- `/properties/[slug]`: verified property exposé and B2B inquiry.
- `/account/[token]`: private buyer qualification status.
- `/admin`: password-protected operations dashboard.
- `/admin/properties/new`: cadastral intake and property creation.
- `/admin/reservations`: inquiry and KYB workflow.
- `/admin/compliance`: evidence checks and private document storage.

Poland uses the official GUGiK ULDK interface and Romania uses the official
ANCPI ArcGIS service for parcel-by-reference geometry. Ukraine, Hungary and
Slovakia deliberately fall back to manually verified GeoJSON until a reliable,
licensed parcel lookup contract is connected.

## Local validation

```bash
pnpm install
pnpm lint
pnpm build
```

Use `netlify dev` when testing PostgreSQL or private Blobs locally. Migrations
are stored in `netlify/database/migrations/`; the Netlify build runs
`pnpm db:migrate` before compiling and skips migration when no database URL is
configured.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled PostgreSQL URL |
| `SUPABASE_DATABASE_URL` | Optional fallback name used by Netlify's Supabase extension |
| `ADMIN_PASSWORD` | Admin password |
| `ADMIN_SESSION_SECRET` | HMAC signing secret for eight-hour sessions |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Optional MapLibre-compatible basemap style |

Never commit these values. Add them through Netlify environment variables.

## Production gates

Real listings require ownership, cadastre, commercial zoning, sanctions,
seller verification and price evidence. Consumer sales, custody, exchange
services and crypto settlement require separate legal, security and product
approval before any payment functionality is reintroduced.
