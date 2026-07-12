import Image from "next/image";

export default function Home() {
  return (
    <main className="landing-shell">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">XPORTAL · PRIVATE ACCESS</p>
          <h1 id="hero-title">
            The next portal
            <br />
            opens soon.
          </h1>
          <p className="intro">
            A new digital experience is taking shape. Join the whitelist and be
            among the first to cross the threshold.
          </p>

          <div className="launch-block">
            <p className="coming-soon">COMING SOON</p>
            <a
              className="whitelist-button"
              href="mailto:hello@x-portal.eu?subject=XPORTAL%20Whitelist%20Request"
            >
              Join the whitelist
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="portal-frame">
            <Image
              src="/xportal-logo.jpg"
              alt=""
              width={400}
              height={400}
              className="portal-symbol"
              priority
            />
            <span className="frame-label">01 — ENTRY</span>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <Image
          src="/xportal-banner.jpg"
          alt="XPORTAL"
          width={1500}
          height={500}
          className="wordmark"
        />
        <p>© 2026 XPORTAL</p>
      </footer>
    </main>
  );
}
