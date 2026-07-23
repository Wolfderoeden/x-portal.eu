import Image from "next/image";
import Link from "next/link";
import MarketplaceMap from "./marketplace-map";
import {
  MARKET_COUNTRIES,
  countryName,
  formatEuro,
  type Property,
} from "../lib/domain";

type Language = "en" | "de";

const copy = {
  en: {
    marketLine: "CARDANO-ENABLED / COMMERCIAL REAL ESTATE / B2B",
    heroKicker: "Five markets. One verified portal.",
    heroTitleA: "Ground for",
    heroTitleB: "what comes next.",
    heroText: "XPORTAL connects businesses with verified commercial development sites across Central and Eastern Europe — with transparent diligence and non-custodial Cardano reservations.",
    explore: "Explore verified sites",
    join: "Join buyer whitelist",
    mapLabel: "Live market view",
    mapTitle: "See the ground. Read the evidence.",
    mapText: "Every published boundary is tied to a cadastral reference, source and review date. A map outline is discovery data — ownership and zoning are confirmed through the legal file.",
    noListings: "Verified inventory is being onboarded.",
    noListingsBody: "XPORTAL does not publish placeholder land as if it were for sale. Join the buyer list to receive verified commercial sites as they clear review.",
    offers: "Verified opportunities",
    model: "The transaction model",
    modelTitle: "A controlled route from parcel to reservation.",
    steps: [
      ["01", "Discover", "Search verified commercial parcels, utilities, development constraints and documented EUR pricing."],
      ["02", "Qualify", "Business buyers complete KYB, sanctions and source-of-funds checks before payment access."],
      ["03", "Reserve", "A time-limited ADA quote is signed by the buyer’s own CIP-30 wallet on Cardano Preprod first."],
      ["04", "Contract", "The full purchase price remains outside the dApp until a country-specific, legally approved escrow is in place."],
    ],
    cardano: "CARDANO / NON-CUSTODIAL",
    cardanoTitle: "Your wallet. Your signature. No seed phrase. Ever.",
    cardanoText: "XPORTAL creates a single-use payment intent for an approved reservation. Your wallet displays the testnet, receiving address and amount before you sign. The backend verifies the transaction before changing the property status.",
    preprod: "PREPROD ONLY",
    preprodText: "Mainnet stays disabled until legal approval, security review and a complete Preprod test covering underpayment, overpayment and refunds.",
    trustTitle: "Verification before velocity.",
    trustItems: [
      ["Intermediary first", "XPORTAL starts as a B2B marketplace and intermediary, not the property owner."],
      ["Country by country", "Ownership, cadastre, commercial zoning and local brokerage duties are checked in the relevant jurisdiction."],
      ["Data minimisation", "Buyer and seller files are separated by role, retention purpose and audit history."],
    ],
    whitelistLabel: "Qualified buyer access",
    whitelistTitle: "Enter before the inventory goes live.",
    whitelistText: "Register your full name, business email and country. This is an access request, not an investment offer or allocation.",
    fullName: "Full name",
    email: "Business email",
    country: "Country",
    company: "Company (optional)",
    consent: "I agree to receive XPORTAL buyer-access updates and accept the privacy notice.",
    submit: "Join the buyer whitelist",
    received: "Request received.",
    receivedText: "We will contact you when a verified opportunity matches the buyer programme.",
    error: "We could not save the request. Check the required fields and try again.",
    legal: "Commercial property and digital assets involve risk. Listing publication is not proof of title, legal advice or an investment recommendation. Reservations remain conditional on legal and compliance approval.",
  },
  de: {
    marketLine: "CARDANO / GEWERBEIMMOBILIEN / B2B",
    heroKicker: "Fünf Märkte. Ein verifiziertes Portal.",
    heroTitleA: "Grund für",
    heroTitleB: "das, was folgt.",
    heroText: "XPORTAL verbindet Unternehmen mit geprüften gewerblichen Baugrundstücken in Mittel- und Osteuropa — mit transparenter Due Diligence und Cardano-Reservierungen ohne Verwahrung.",
    explore: "Geprüfte Grundstücke",
    join: "Zur Käufer-Whitelist",
    mapLabel: "Marktübersicht",
    mapTitle: "Grundstück sehen. Nachweise verstehen.",
    mapText: "Jede veröffentlichte Grenze ist mit Katasterreferenz, Quelle und Prüfdatum verknüpft. Die Kartengrenze dient der Suche — Eigentum und Widmung werden über die Rechtsakte bestätigt.",
    noListings: "Geprüfte Angebote werden derzeit aufgenommen.",
    noListingsBody: "XPORTAL veröffentlicht keine Platzhalter als vermeintliche Verkaufsangebote. Die Käuferliste informiert, sobald gewerbliche Grundstücke die Prüfung abgeschlossen haben.",
    offers: "Geprüfte Angebote",
    model: "Transaktionsmodell",
    modelTitle: "Ein kontrollierter Weg vom Kataster zur Reservierung.",
    steps: [
      ["01", "Entdecken", "Gewerbegrundstücke, Anschlüsse, Bebauungsgrenzen und dokumentierte EUR-Preise vergleichen."],
      ["02", "Prüfen", "Geschäftskunden durchlaufen KYB-, Sanktions- und Mittelherkunftsprüfungen vor dem Zahlungszugang."],
      ["03", "Reservieren", "Ein befristeter ADA-Kurs wird zuerst auf Cardano Preprod mit der eigenen CIP-30-Wallet signiert."],
      ["04", "Vertrag", "Der vollständige Kaufpreis bleibt außerhalb der dApp, bis ein landesspezifisch geprüftes Escrow-Modell besteht."],
    ],
    cardano: "CARDANO / OHNE VERWAHRUNG",
    cardanoTitle: "Deine Wallet. Deine Signatur. Niemals eine Seed-Phrase.",
    cardanoText: "XPORTAL erzeugt für eine freigegebene Reservierung einen einmaligen Zahlungsauftrag. Die Wallet zeigt Testnetz, Empfängeradresse und Betrag vor der Signatur. Erst nach Backend-Prüfung ändert sich der Grundstücksstatus.",
    preprod: "NUR PREPROD",
    preprodText: "Mainnet bleibt deaktiviert, bis Recht, Sicherheit und ein vollständiger Preprod-Test einschließlich Unter-, Über- und Rückzahlungen freigegeben sind.",
    trustTitle: "Prüfung vor Geschwindigkeit.",
    trustItems: [
      ["Zunächst Vermittler", "XPORTAL startet als B2B-Marktplatz und Vermittler, nicht als Grundstückseigentümer."],
      ["Land für Land", "Eigentum, Kataster, gewerbliche Widmung und lokale Vermittlerpflichten werden im jeweiligen Land geprüft."],
      ["Datenminimierung", "Käufer- und Verkäuferakten werden nach Rolle, Zweck, Löschfrist und Audit-Historie getrennt."],
    ],
    whitelistLabel: "Zugang für qualifizierte Käufer",
    whitelistTitle: "Sei dabei, bevor die Angebote live gehen.",
    whitelistText: "Hinterlege vollständigen Namen, geschäftliche E-Mail und Land. Dies ist eine Zugangsanfrage, kein Investmentangebot und keine Zuteilung.",
    fullName: "Vollständiger Name",
    email: "Geschäftliche E-Mail",
    country: "Land",
    company: "Unternehmen (optional)",
    consent: "Ich möchte XPORTAL-Zugangsinformationen erhalten und akzeptiere den Datenschutzhinweis.",
    submit: "Käufer-Whitelist beitreten",
    received: "Anfrage erhalten.",
    receivedText: "Wir melden uns, sobald ein geprüftes Angebot zum Käuferprogramm passt.",
    error: "Die Anfrage konnte nicht gespeichert werden. Bitte Pflichtfelder prüfen.",
    legal: "Gewerbeimmobilien und digitale Vermögenswerte sind mit Risiken verbunden. Eine Veröffentlichung ist kein Eigentumsnachweis, keine Rechtsberatung und keine Anlageempfehlung. Reservierungen stehen unter Rechts- und Compliancevorbehalt.",
  },
};

export default function LandingPage({
  language,
  properties,
  joined,
  hasError,
}: {
  language: Language;
  properties: Property[];
  joined: boolean;
  hasError: boolean;
}) {
  const t = copy[language];
  const home = language === "de" ? "/de" : "/";
  const otherLanguage = language === "de" ? "/" : "/de";

  return (
    <main className="marketplace-page">
      <section className="market-hero" aria-labelledby="hero-title">
        <div className="hero-utility">
          <Image src="/xportal-banner.jpg" alt="XPORTAL" width={1500} height={500} priority />
          <div><span>{t.marketLine}</span><Link href={otherLanguage}>{language === "de" ? "EN" : "DE"}</Link></div>
        </div>
        <div className="market-hero-copy">
          <p>{t.heroKicker}</p>
          <h1 id="hero-title">{t.heroTitleA}<br /><em>{t.heroTitleB}</em></h1>
          <div className="hero-bottom">
            <p>{t.heroText}</p>
            <div className="hero-actions">
              <a href="#market">{t.explore}</a>
              <a href="#whitelist" className="button-dark">{t.join}</a>
            </div>
          </div>
        </div>
      </section>

      <section className="market-map-section" id="market" aria-labelledby="map-title">
        <div className="section-intro">
          <p className="section-label">{t.mapLabel}</p>
          <h2 id="map-title">{t.mapTitle}</h2>
          <p>{t.mapText}</p>
        </div>
        <MarketplaceMap properties={properties} />
      </section>

      <section className="listing-section" aria-labelledby="listing-title">
        <div className="listing-heading">
          <p className="section-label">{t.offers}</p>
          <h2 id="listing-title">{properties.length.toString().padStart(2, "0")}</h2>
        </div>
        {properties.length === 0 ? (
          <div className="inventory-empty">
            <span>VERIFICATION QUEUE / ACTIVE</span>
            <h3>{t.noListings}</h3>
            <p>{t.noListingsBody}</p>
            <a href="#whitelist">{t.join} →</a>
          </div>
        ) : (
          <div className="listing-grid">
            {properties.map((property) => (
              <Link href={`/properties/${property.slug}`} className="listing-card" key={property.id}>
                <div className="listing-card-top"><span>{countryName(property.country)} / {property.municipality}</span><span>{property.status}</span></div>
                <h3>{language === "de" ? property.titleDe : property.titleEn}</h3>
                <dl>
                  <div><dt>Area</dt><dd>{property.areaSqm.toLocaleString()} m²</dd></div>
                  <div><dt>Price</dt><dd>{formatEuro(property.priceEurCents, language === "de" ? "de-DE" : "en-IE")}</dd></div>
                  <div><dt>Cadastre</dt><dd>{property.cadastralReference}</dd></div>
                </dl>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="transaction-section" aria-labelledby="model-title">
        <div className="section-intro dark">
          <p className="section-label">{t.model}</p>
          <h2 id="model-title">{t.modelTitle}</h2>
        </div>
        <div className="process-grid">
          {t.steps.map(([number, title, text]) => (
            <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="cardano-section">
        <div><p className="section-label">{t.cardano}</p><h2>{t.cardanoTitle}</h2><p>{t.cardanoText}</p></div>
        <aside>
          <span>{t.preprod}</span>
          <div className="network-orbit" aria-hidden="true"><i /><i /><i /><i /><b>₳</b></div>
          <p>{t.preprodText}</p>
        </aside>
      </section>

      <section className="trust-section">
        <h2>{t.trustTitle}</h2>
        <div>
          {t.trustItems.map(([title, text], index) => (
            <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="buyer-access" id="whitelist">
        <div>
          <p className="section-label">{t.whitelistLabel}</p>
          <h2>{t.whitelistTitle}</h2>
          <p>{t.whitelistText}</p>
          <div className="market-tags">{MARKET_COUNTRIES.map((country) => <span key={country.code}>{country.name}</span>)}</div>
        </div>
        <div className="buyer-form-panel">
          {joined ? (
            <div className="success-state">
              <span className="success-mark">X</span><h3>{t.received}</h3><p>{t.receivedText}</p><Link href={home}>XPORTAL</Link>
            </div>
          ) : (
            <form action="/api/whitelist" method="post" className="buyer-form">
              {hasError && <p className="form-error">{t.error}</p>}
              <input type="hidden" name="locale" value={language} />
              <label>{t.fullName}<input name="fullName" autoComplete="name" minLength={2} maxLength={100} required /></label>
              <label>{t.email}<input name="email" type="email" autoComplete="email" maxLength={160} required /></label>
              <label>{t.country}<input name="country" autoComplete="country-name" minLength={2} maxLength={80} required /></label>
              <label>{t.company}<input name="company" autoComplete="organization" maxLength={160} /></label>
              <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              <label className="consent-row"><input name="consent" type="checkbox" value="yes" required /><span>{t.consent}</span></label>
              <button type="submit">{t.submit}<span>↗</span></button>
            </form>
          )}
        </div>
      </section>

      <footer className="market-footer">
        <Image src="/xportal-banner.jpg" alt="XPORTAL" width={1500} height={500} />
        <p>{t.legal}</p>
        <div><span>© 2026 XPORTAL</span><span>B2B / PREPROD / FIVE MARKETS</span></div>
      </footer>
    </main>
  );
}
