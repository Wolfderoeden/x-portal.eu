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

The opening experience is one reversible five-stage command-map sequence:

1. the XPORTAL landing page fills the viewport;
2. scrolling forward scales the landing page away and reveals the entire world;
3. connected market nodes converge on Central and Eastern Europe;
4. the camera approaches Rakhiv Raion in Ukraine;
5. further scrolling descends to parcel level and reveals verified boundaries,
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

## Geo and cadastral APIs

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `/api/geo/markets` | Public | Market nodes, map centres and integration status |
| `/api/geo/cadastre` | Public | Official-source knowledge index and capabilities |
| `/api/geo/parcels` | Public | GeoJSON for published, legally verified parcels only |
| `/api/admin/cadastre/resolve` | Admin | Resolve Poland/Romania references and retain source evidence |
| `/api/admin/cadastre/records` | Admin | Search normalized cadastral records |

The public endpoints never return owners, buyer/KYC records, private documents
or audit entries. `cadastre_sources` stores the controlled source catalogue and
`cadastre_records` stores normalized references, reviewed geometries, source
URLs and verification state. Property records link to a cadastral record rather
than treating a drawn polygon as legal proof.

## Local validation

```bash
pnpm install
pnpm lint
pnpm build
```

Use `netlify dev` when testing PostgreSQL or private Blobs locally. Migrations
are stored in `netlify/database/migrations/`; the Netlify build runs
`pnpm db:migrate` before compiling and skips migration when no database URL is
configured. The installed Supabase extension still requires a one-time project
connection before the production cadastral datastore becomes active.

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
