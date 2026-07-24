import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketplaceMap from "../../../components/marketplace-map";
import { getPropertyBySlug } from "../../../lib/db";
import { countryName, formatEuro } from "../../../lib/domain";

export const dynamic = "force-dynamic";

type PropertyPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug).catch(() => null);
  return property
    ? { title: `${property.titleEn} — XPORTAL`, description: property.commercialUse }
    : { title: "Property — XPORTAL" };
}

export default async function PropertyPage({ params, searchParams }: PropertyPageProps) {
  const { slug } = await params;
  const error = (await searchParams)?.error;
  const property = await getPropertyBySlug(slug).catch(() => null);
  if (!property) notFound();

  return (
    <main className="property-page">
      <div className="property-utility">
        <Link href="/">
          <Image src="/xportal-banner.jpg" alt="XPORTAL" width={1500} height={500} />
        </Link>
        <span>VERIFIED COMMERCIAL PROPERTY / {countryName(property.country).toUpperCase()}</span>
      </div>
      <section className="property-hero">
        <div>
          <p className="section-label">{property.region} / {property.municipality}</p>
          <h1>{property.titleEn}</h1>
        </div>
        <dl>
          <div><dt>Asking price</dt><dd>{formatEuro(property.priceEurCents)}</dd></div>
          <div><dt>Parcel area</dt><dd>{property.areaSqm.toLocaleString()} m²</dd></div>
          <div><dt>Status</dt><dd>{property.status}</dd></div>
        </dl>
      </section>
      <section className="property-map">
        <MarketplaceMap compact properties={[property]} />
      </section>
      <section className="property-facts">
        <div>
          <p className="section-label">Commercial profile</p>
          <h2>Built for business use.</h2>
        </div>
        <dl>
          <div><dt>Permitted use</dt><dd>{property.commercialUse}</dd></div>
          <div><dt>Development parameters</dt><dd>{property.developmentParameters || "See legal file"}</dd></div>
          <div><dt>Restrictions</dt><dd>{property.restrictions || "No additional restrictions recorded in the public summary"}</dd></div>
          <div><dt>Utilities</dt><dd>{Object.entries(property.utilities).filter(([, enabled]) => enabled).map(([key]) => key).join(", ") || "To be confirmed"}</dd></div>
          <div><dt>Cadastral reference</dt><dd>{property.cadastralReference}</dd></div>
          <div><dt>Price evidence</dt><dd>{property.priceSource}</dd></div>
          <div><dt>Risk notes</dt><dd>{property.riskNotes || "See country-specific legal and due-diligence file"}</dd></div>
        </dl>
      </section>
      <section className="property-integrity">
        <div>
          <p className="section-label">Data integrity record</p>
          <h2>
            Verifiable data.
            <br />
            Explicit limits.
          </h2>
          <p>
            The property record is canonicalised and hashed. A matching Cardano
            anchor can prove that the published dataset has not changed; it
            cannot by itself prove legal title, zoning or source accuracy.
          </p>
        </div>
        <div className="integrity-console">
          <div className="integrity-console-head">
            <span>XPORTAL PROPERTY PROOF / {property.integrity.schema}</span>
            <b className={`proof-${property.integrity.anchorStatus}`}>
              {property.integrity.anchorStatus === "anchored-match"
                ? "ON-CHAIN MATCH"
                : property.integrity.anchorStatus === "anchored-mismatch"
                  ? "HASH MISMATCH"
                  : "NOT YET ANCHORED"}
            </b>
          </div>
          <dl>
            <div><dt>Algorithm</dt><dd>{property.integrity.algorithm}</dd></div>
            <div>
              <dt>Data fingerprint</dt>
              <dd><code>{property.integrity.fingerprint}</code></dd>
            </div>
            <div>
              <dt>Record match</dt>
              <dd>{property.integrity.recordMatches ? "CURRENT DATASET MATCHES" : "REVIEW REQUIRED"}</dd>
            </div>
            <div>
              <dt>Cardano network</dt>
              <dd>{property.integrity.anchorNetwork ?? "NO ANCHOR RECORDED"}</dd>
            </div>
            <div>
              <dt>Transaction</dt>
              <dd><code>{property.integrity.anchorTxHash ?? "—"}</code></dd>
            </div>
            <div>
              <dt>Anchor slot</dt>
              <dd>{property.integrity.anchorSlot?.toLocaleString() ?? "—"}</dd>
            </div>
          </dl>
          <p>
            Integrity proof ≠ ownership proof. Consult the cadastral source,
            legal file and country-specific transaction documents.
          </p>
        </div>
      </section>
      <section className="reservation-section" id="reserve">
        <div>
          <p className="section-label">B2B inquiry</p>
          <h2>Start a controlled reservation.</h2>
          <p>
            Your inquiry opens a private status page. The current pilot covers
            discovery, qualification and legal review only. No payment method is
            active in this version.
          </p>
        </div>
        <form action="/api/reservations" method="post" className="reservation-form">
          {error && <p className="form-error">The inquiry could not be created. Review the fields or listing availability.</p>}
          <input type="hidden" name="propertyId" value={property.id} />
          <input type="hidden" name="propertySlug" value={property.slug} />
          <label>Full name<input name="buyerName" autoComplete="name" required /></label>
          <label>Business email<input name="buyerEmail" type="email" autoComplete="email" required /></label>
          <label>Legal company name<input name="buyerCompany" autoComplete="organization" required /></label>
          <label>Company country<input name="buyerCountry" autoComplete="country-name" required /></label>
          <label>Intended commercial use<textarea name="intendedUse" rows={4} minLength={10} required /></label>
          <label className="consent-row">
            <input type="checkbox" name="consent" value="yes" required />
            <span>I request B2B onboarding and consent to processing these details for due diligence and reservation handling.</span>
          </label>
          <button type="submit">Request qualification <span>↗</span></button>
        </form>
      </section>
    </main>
  );
}
