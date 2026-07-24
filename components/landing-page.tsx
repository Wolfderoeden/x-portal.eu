"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
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
    marketLine: "COMMERCIAL SITE INTELLIGENCE / B2B",
    heroKicker: "Five markets. One terrain layer.",
    heroTitleA: "Ground for",
    heroTitleB: "what comes next.",
    heroText:
      "XPORTAL connects businesses with verified commercial development sites across Central and Eastern Europe — mapped from cadastral evidence and reviewed market by market.",
    enter: "Enter the map",
    join: "Join buyer whitelist",
    scroll: "Scroll to enter terrain",
    mapMode: "Terrain intelligence",
    mapFocus: "Rakhiv Raion / Ukraine",
    mapStatus: "Live spatial interface",
    mapHint: "Continue scrolling to descend to parcel level",
    prototype:
      "The map never invents inventory. A parcel outline appears only after a verified backend record contains approved cadastral geometry and has been released for publication.",
    integrityLabel: "Property integrity protocol",
    integrityTitle: "A proof trail for every public parcel.",
    integrityText:
      "XPORTAL creates a deterministic SHA-256 fingerprint from the public property record. A future Cardano anchor can prove that the record has not changed since publication. It does not replace title, zoning or legal due diligence.",
    integritySteps: [
      ["01", "Official source", "Cadastral reference, source and boundary geometry are attached to the controlled record."],
      ["02", "Legal release", "Only verified and approved available or reserved properties can enter the public feed."],
      ["03", "Data fingerprint", "Commercial, cadastral and risk data is canonicalised and hashed with SHA-256."],
      ["04", "Cardano anchor", "The interface shows an on-chain match only after a real transaction anchor exists and matches the current hash."],
    ],
    noListings: "Verified inventory is being onboarded.",
    noListingsBody:
      "XPORTAL does not publish placeholder land as if it were for sale. Join the buyer list to receive verified commercial sites as they clear review.",
    offers: "Verified opportunities",
    model: "The access model",
    modelTitle: "From terrain intelligence to a controlled transaction.",
    steps: [
      ["01", "Discover", "Navigate markets spatially and inspect commercial location, access and infrastructure."],
      ["02", "Verify", "Read cadastral sources, zoning constraints, ownership evidence and documented pricing."],
      ["03", "Qualify", "Business buyers complete KYB, sanctions and source-of-funds checks."],
      ["04", "Proceed", "Approved parties move into a country-specific legal and contractual process."],
    ],
    trustTitle: "Evidence before opportunity.",
    trustItems: [
      ["Intermediary first", "XPORTAL starts as a B2B marketplace and intermediary, not the property owner."],
      ["Country by country", "Ownership, cadastre, commercial zoning and local brokerage duties are checked in the relevant jurisdiction."],
      ["Controlled access", "Buyer and seller files remain separated by role, purpose and audit history."],
    ],
    whitelistLabel: "Qualified buyer access",
    whitelistTitle: "Enter before the inventory goes live.",
    whitelistText:
      "Register your full name, business email and country. This is an access request, not an investment offer or allocation.",
    fullName: "Full name",
    email: "Business email",
    country: "Country",
    company: "Company (optional)",
    consent:
      "I agree to receive XPORTAL buyer-access updates and accept the privacy notice.",
    submit: "Join the buyer whitelist",
    received: "Request received.",
    receivedText:
      "We will contact you when a verified opportunity matches the buyer programme.",
    error:
      "We could not save the request. Check the required fields and try again.",
    legal:
      "Commercial property involves risk. Listing publication is not proof of title, legal advice or an investment recommendation. Every transaction remains conditional on legal and compliance approval.",
  },
  de: {
    marketLine: "GEWERBEFLÄCHEN / RAUMDATEN / B2B",
    heroKicker: "Fünf Märkte. Eine Geländeebene.",
    heroTitleA: "Grund für",
    heroTitleB: "das, was folgt.",
    heroText:
      "XPORTAL verbindet Unternehmen mit geprüften gewerblichen Baugrundstücken in Mittel- und Osteuropa — kartiert aus Katasterdaten und Markt für Markt geprüft.",
    enter: "Karte betreten",
    join: "Zur Käufer-Whitelist",
    scroll: "Scrollen, um das Gelände zu betreten",
    mapMode: "Terrain Intelligence",
    mapFocus: "Rajon Rakhiv / Ukraine",
    mapStatus: "Räumliche Live-Oberfläche",
    mapHint: "Weiterscrollen bis auf Grundstücksebene",
    prototype:
      "Die Karte erfindet keine Angebote. Ein Grundstücksumriss erscheint erst, wenn ein verifizierter Backend-Datensatz freigegebene Katastergeometrie enthält und zur Veröffentlichung freigegeben wurde.",
    integrityLabel: "Property-Integrity-Protokoll",
    integrityTitle: "Eine Beweiskette für jedes öffentliche Grundstück.",
    integrityText:
      "XPORTAL erzeugt einen deterministischen SHA-256-Fingerprint aus dem öffentlichen Grundstücksdatensatz. Ein späterer Cardano-Anker kann belegen, dass dieser Datensatz seit der Veröffentlichung nicht verändert wurde. Eigentums-, Widmungs- und Rechtsprüfung ersetzt er nicht.",
    integritySteps: [
      ["01", "Offizielle Quelle", "Katasterreferenz, Quelle und Grenzgeometrie werden dem kontrollierten Datensatz zugeordnet."],
      ["02", "Rechtliche Freigabe", "Nur geprüfte und freigegebene verfügbare oder reservierte Grundstücke gelangen in den öffentlichen Feed."],
      ["03", "Daten-Fingerprint", "Gewerbliche, katasterbezogene und risikorelevante Daten werden kanonisiert und mit SHA-256 gehasht."],
      ["04", "Cardano-Anker", "Die Oberfläche zeigt einen On-Chain-Match erst, wenn ein echter Transaktionsanker existiert und zum aktuellen Hash passt."],
    ],
    noListings: "Geprüfte Angebote werden derzeit aufgenommen.",
    noListingsBody:
      "XPORTAL veröffentlicht keine Platzhalter als vermeintliche Verkaufsangebote. Die Käuferliste informiert, sobald gewerbliche Grundstücke die Prüfung abgeschlossen haben.",
    offers: "Geprüfte Angebote",
    model: "Das Zugangsmodell",
    modelTitle: "Von Raumdaten zu einer kontrollierten Transaktion.",
    steps: [
      ["01", "Entdecken", "Märkte räumlich erkunden und Lage, Zufahrt sowie Infrastruktur bewerten."],
      ["02", "Verifizieren", "Katasterquellen, Widmung, Eigentumsnachweise und Preisgrundlagen prüfen."],
      ["03", "Qualifizieren", "Geschäftskunden durchlaufen KYB-, Sanktions- und Mittelherkunftsprüfungen."],
      ["04", "Fortfahren", "Freigegebene Parteien wechseln in den landesspezifischen Rechts- und Vertragsprozess."],
    ],
    trustTitle: "Nachweise vor Gelegenheit.",
    trustItems: [
      ["Zunächst Vermittler", "XPORTAL startet als B2B-Marktplatz und Vermittler, nicht als Grundstückseigentümer."],
      ["Land für Land", "Eigentum, Kataster, gewerbliche Widmung und lokale Vermittlerpflichten werden im jeweiligen Land geprüft."],
      ["Kontrollierter Zugang", "Käufer- und Verkäuferakten bleiben nach Rolle, Zweck und Audit-Historie getrennt."],
    ],
    whitelistLabel: "Zugang für qualifizierte Käufer",
    whitelistTitle: "Sei dabei, bevor die Angebote live gehen.",
    whitelistText:
      "Hinterlege vollständigen Namen, geschäftliche E-Mail und Land. Dies ist eine Zugangsanfrage, kein Investmentangebot und keine Zuteilung.",
    fullName: "Vollständiger Name",
    email: "Geschäftliche E-Mail",
    country: "Land",
    company: "Unternehmen (optional)",
    consent:
      "Ich möchte XPORTAL-Zugangsinformationen erhalten und akzeptiere den Datenschutzhinweis.",
    submit: "Käufer-Whitelist beitreten",
    received: "Anfrage erhalten.",
    receivedText:
      "Wir melden uns, sobald ein geprüftes Angebot zum Käuferprogramm passt.",
    error:
      "Die Anfrage konnte nicht gespeichert werden. Bitte Pflichtfelder prüfen.",
    legal:
      "Gewerbeimmobilien sind mit Risiken verbunden. Eine Veröffentlichung ist kein Eigentumsnachweis, keine Rechtsberatung und keine Anlageempfehlung. Jede Transaktion steht unter Rechts- und Compliancevorbehalt.",
  },
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

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
  const stageRef = useRef<HTMLElement>(null);
  const whitelistRef = useRef<HTMLElement>(null);
  const [sceneProgress, setSceneProgress] = useState(0);
  const home = language === "de" ? "/de" : "/";
  const otherLanguage = language === "de" ? "/" : "/de";
  const heroProgress = clamp(sceneProgress / 0.34);
  const mapProgress = clamp((sceneProgress - 0.08) / 0.92);
  const cameraStage =
    mapProgress < 0.3
      ? { level: "WORLD", focus: "GLOBAL MARKET NETWORK", detail: "05 MARKETS / 01 COMMAND LAYER" }
      : mapProgress < 0.58
        ? { level: "EUROPE", focus: "CENTRAL + EASTERN EUROPE", detail: "REGIONAL INTELLIGENCE" }
        : mapProgress < 0.82
          ? { level: "UKRAINE", focus: "RAKHIV RAION / UKRAINE", detail: "COUNTRY APPROACH" }
          : { level: "PARCEL", focus: "RAKHIV / CADASTRAL GRID", detail: "48.0524 N / 24.2099 E" };

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const start = stage.offsetTop;
        const distance = Math.max(stage.offsetHeight - window.innerHeight, 1);
        setSceneProgress(clamp((window.scrollY - start) / distance));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (joined || hasError) {
      whitelistRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hasError, joined]);

  function enterMap() {
    const stage = stageRef.current;
    if (!stage) return;
    const distance = stage.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: stage.offsetTop + distance * 0.72,
      behavior: "smooth",
    });
  }

  const sceneStyle = {
    "--hero-progress": heroProgress,
    "--map-progress": mapProgress,
  } as CSSProperties;

  return (
    <main className="marketplace-page" style={sceneStyle}>
      <section className="strategy-stage" ref={stageRef} aria-label={t.mapMode}>
        <div className="strategy-sticky">
          <MarketplaceMap
            properties={properties}
            immersive
            progress={mapProgress}
            language={language}
          />

          <div className="strategy-grid" aria-hidden="true" />
          <div className="strategy-vignette" aria-hidden="true" />
          <div className="strategy-scanline" aria-hidden="true" />

          <div className="strategy-hud" aria-hidden={mapProgress < 0.18}>
            <div className="hud-top-left">
              <span>XPORTAL / {t.mapMode}</span>
              <strong>{cameraStage.focus}</strong>
            </div>
            <div className="hud-top-right">
              <span>CAMERA / {cameraStage.level}</span>
              <span>{Math.round(mapProgress * 100).toString().padStart(3, "0")}%</span>
              <b>{cameraStage.detail}</b>
            </div>
            <div className="hud-side">
              <span>WORLD</span>
              <i />
              <span>EUROPE</span>
              <i />
              <span>UKRAINE</span>
              <i />
              <span>PARCEL</span>
            </div>
            <div className="hud-bottom">
              <span>{t.mapStatus}</span>
              <span>{t.mapHint}</span>
              <span>{Math.round(mapProgress * 100).toString().padStart(3, "0")} / 100</span>
            </div>
            <div className="hud-network">
              <div>
                <span>CADASTRAL NETWORK</span>
                <b>05 NODES</b>
              </div>
              <ul>
                <li><span>PL / GUGiK ULDK</span><b>CONNECTED</b></li>
                <li><span>RO / ANCPI INSPIRE</span><b>CONNECTED</b></li>
                <li><span>SK / ZBGIS</span><b>SOURCE REVIEW</b></li>
                <li><span>HU / E-ING</span><b>LICENSE GATE</b></li>
                <li><span>UA / STATE CADASTRE</span><b>SOURCE REVIEW</b></li>
              </ul>
              <span className="hud-network-index">PUBLIC PARCEL FEED / BACKEND CONTROLLED</span>
            </div>
          </div>

          <div
            className="gateway-hero"
            aria-hidden={heroProgress > 0.98}
            style={{ pointerEvents: heroProgress > 0.92 ? "none" : "auto" }}
          >
            <div className="hero-utility">
              <Image
                src="/xportal-banner.jpg"
                alt="XPORTAL"
                width={1500}
                height={500}
                priority
              />
              <div>
                <span>{t.marketLine}</span>
                <Link href={otherLanguage}>{language === "de" ? "EN" : "DE"}</Link>
              </div>
            </div>
            <div className="market-hero-copy">
              <p>{t.heroKicker}</p>
              <h1>
                {t.heroTitleA}
                <br />
                <em>{t.heroTitleB}</em>
              </h1>
              <div className="hero-bottom">
                <p>{t.heroText}</p>
                <div className="hero-actions">
                  <button type="button" onClick={enterMap}>{t.enter}</button>
                  <a href="#whitelist" className="button-dark">{t.join}</a>
                </div>
              </div>
            </div>
            <button type="button" className="scroll-cue" onClick={enterMap}>
              <span>{t.scroll}</span>
              <i />
            </button>
          </div>
        </div>
      </section>

      <section className="terrain-note">
        <p className="section-label">{t.mapFocus}</p>
        <p>{t.prototype}</p>
      </section>

      <section className="integrity-section" aria-labelledby="integrity-title">
        <div className="integrity-intro">
          <p className="section-label">{t.integrityLabel}</p>
          <h2 id="integrity-title">{t.integrityTitle}</h2>
          <p>{t.integrityText}</p>
        </div>
        <div className="integrity-proof-rail">
          {t.integritySteps.map(([number, title, text], index) => (
            <article key={number}>
              <div>
                <span>{number}</span>
                <i className={index < 3 ? "proof-ready" : "proof-pending"} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <b>{index < 3 ? "PROTOCOL READY" : "ANCHOR REQUIRED"}</b>
            </article>
          ))}
        </div>
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
                <div className="listing-card-top">
                  <span>{countryName(property.country)} / {property.municipality}</span>
                  <span>{property.status}</span>
                </div>
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
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-section">
        <h2>{t.trustTitle}</h2>
        <div>
          {t.trustItems.map(([title, text], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="buyer-access" id="whitelist" ref={whitelistRef}>
        <div>
          <p className="section-label">{t.whitelistLabel}</p>
          <h2>{t.whitelistTitle}</h2>
          <p>{t.whitelistText}</p>
          <div className="market-tags">
            {MARKET_COUNTRIES.map((country) => <span key={country.code}>{country.name}</span>)}
          </div>
        </div>
        <div className="buyer-form-panel">
          {joined ? (
            <div className="success-state">
              <span className="success-mark">X</span>
              <h3>{t.received}</h3>
              <p>{t.receivedText}</p>
              <Link href={home}>XPORTAL</Link>
            </div>
          ) : (
            <form action="/api/whitelist" method="post" className="buyer-form">
              {hasError && <p className="form-error">{t.error}</p>}
              <input type="hidden" name="locale" value={language} />
              <label>{t.fullName}<input name="fullName" autoComplete="name" minLength={2} maxLength={100} required /></label>
              <label>{t.email}<input name="email" type="email" autoComplete="email" maxLength={160} required /></label>
              <label>{t.country}<input name="country" autoComplete="country-name" minLength={2} maxLength={80} required /></label>
              <label>{t.company}<input name="company" autoComplete="organization" maxLength={160} /></label>
              <div className="honeypot" aria-hidden="true">
                <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
              </div>
              <label className="consent-row">
                <input name="consent" type="checkbox" value="yes" required />
                <span>{t.consent}</span>
              </label>
              <button type="submit">{t.submit}<span>↗</span></button>
            </form>
          )}
        </div>
      </section>

      <footer className="market-footer">
        <Image src="/xportal-banner.jpg" alt="XPORTAL" width={1500} height={500} />
        <p>{t.legal}</p>
        <div><span>© 2026 XPORTAL</span><span>B2B / FIVE MARKETS / SPATIAL PILOT</span></div>
      </footer>
    </main>
  );
}
