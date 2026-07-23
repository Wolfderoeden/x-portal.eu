# XPORTAL

B2B marketplace for verified commercial development sites in Ukraine, Poland,
Slovakia, Hungary and Romania. The application runs on Next.js and Netlify,
uses provider-neutral PostgreSQL, private Netlify Blobs and a non-custodial
Cardano Preprod reservation flow.

## Product boundaries

- XPORTAL starts as an intermediary, not the property owner.
- Only verified commercial property records can be published.
- Cardano is limited to reservation deposits.
- The full purchase price stays outside the dApp until a country-specific,
  legally approved escrow arrangement exists.
- Mainnet is not supported by the schema or payment API.
- No private key or seed phrase enters XPORTAL. CIP-30 wallets connect and sign
  in the browser with the buyer's explicit approval.

## Application areas

- `/` and `/de`: English/German marketplace landing pages and buyer whitelist.
- `/properties/[slug]`: verified property exposé and B2B inquiry.
- `/account/[token]`: private buyer status and Preprod payment.
- `/admin`: protected operations dashboard.
- `/admin/properties/new`: cadastral intake and property creation.
- `/admin/reservations`: KYB approval and time-limited payment intents.
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

Use `netlify dev` when testing PostgreSQL, Blobs or scheduled functions locally.
Migrations are stored in `netlify/database/migrations/` and the Netlify build
runs `pnpm db:migrate` before compiling. The migration runner is a no-op until a
database URL is configured.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled PostgreSQL URL (Prisma Postgres or another provider) |
| `SUPABASE_DATABASE_URL` | Optional fallback name used by Netlify's Supabase extension |
| `ADMIN_PASSWORD` | Admin password |
| `ADMIN_SESSION_SECRET` | HMAC signing secret for eight-hour sessions |
| `ADMIN_TOTP_SECRET` | Base32 TOTP secret; when present, MFA is mandatory |
| `CARDANO_PREPROD_ADDRESS` | Reservation recipient; must begin with `addr_test1` |
| `BLOCKFROST_PREPROD_PROJECT_ID` | Server-side Preprod transaction builder and monitor |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Optional MapLibre-compatible basemap style |

Never commit these values. Add them through Netlify environment variables.

## Payment verification

An approved reservation receives a 15-minute EUR/ADA quote with a recorded rate
source and timestamp. The buyer's CIP-30 wallet signs and submits the transaction.
The scheduled monitor verifies:

1. Cardano Preprod transaction ID
2. recipient address
3. lovelace amount
4. confirmation count
5. underpayment or overpayment

Three confirmations change the reservation and property to `reserved`.
Underpayments, overpayments and refunds remain explicit review states.

## Production gates

Real listings require ownership, cadastre, commercial zoning, sanctions, seller
verification and price evidence. Mainnet, consumer sales, custody, exchange
services and full-price crypto settlement require separate legal and security
approval before implementation.
