import Image from "next/image";

type HomeProps = {
  searchParams?: Promise<{ joined?: string; error?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = (await searchParams) ?? {};
  const joined = params.joined === "1";
  const hasError = params.error === "1";

  return (
    <main className="defi-page">
      <section className="defi-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="protocol-line">
            <span className="protocol-dot" aria-hidden="true" />
            <span>XPORTAL / CARDANO DEFI</span>
            <span>PRIVATE ACCESS</span>
          </div>

          <p className="hero-kicker">The private gateway to Cardano DeFi</p>
          <h1 id="hero-title">
            Move before
            <br />
            the market does.
          </h1>
          <p className="hero-intro">
            XPORTAL is creating a focused entry point to the next wave of
            Cardano DeFi. Join the founding whitelist for launch intelligence,
            early product access and priority onboarding.
          </p>

          <div className="signal-row" aria-label="XPORTAL principles">
            <span>Cardano-native</span>
            <span>Signal-first</span>
            <span>Early access</span>
          </div>
        </div>

        <aside className="whitelist-card" id="whitelist" aria-labelledby="whitelist-title">
          <div className="card-topline">
            <span>Founding whitelist</span>
            <span>01 / ACCESS</span>
          </div>

          {joined ? (
            <div className="success-state" role="status">
              <span className="success-mark" aria-hidden="true">X</span>
              <p className="form-eyebrow">Request received</p>
              <h2 id="whitelist-title">You are on the list.</h2>
              <p>
                We will contact you when the next XPORTAL access window opens.
              </p>
              <a href="/" className="text-link">Return to XPORTAL</a>
            </div>
          ) : (
            <>
              <p className="form-eyebrow">Private access</p>
              <h2 id="whitelist-title">Enter the portal.</h2>
              <p className="form-copy">
                Be among the first to receive product updates and onboarding
                access as XPORTAL comes online.
              </p>

              {hasError && (
                <p className="form-error" role="alert">
                  We could not save your request. Please check your details and try again.
                </p>
              )}

              <form action="/api/whitelist" method="post" className="whitelist-form">
                <div className="form-field">
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={160}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="country">Country of residence</label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    autoComplete="country-name"
                    minLength={2}
                    maxLength={80}
                    placeholder="Your country"
                    required
                  />
                </div>

                <div className="honeypot" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                <label className="consent-row">
                  <input name="consent" type="checkbox" value="yes" required />
                  <span>
                    I agree to receive XPORTAL launch and whitelist updates by email.
                  </span>
                </label>

                <button type="submit" className="submit-button">
                  <span>Request early access</span>
                  <span aria-hidden="true">-&gt;</span>
                </button>
              </form>

              <p className="privacy-note">
                Your information is used only for XPORTAL access updates. No spam.
              </p>
            </>
          )}
        </aside>
      </section>

      <section className="value-strip" aria-label="Why XPORTAL">
        <article>
          <span>01</span>
          <h2>One focused entry point.</h2>
          <p>
            A clearer path into the Cardano DeFi landscape, built for people
            who value signal over noise.
          </p>
        </article>
        <article>
          <span>02</span>
          <h2>Access before launch.</h2>
          <p>
            Whitelist members receive launch updates and priority consideration
            for early onboarding.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>Built around Cardano.</h2>
          <p>
            A product direction shaped around the network, its ecosystem and
            its next generation of DeFi users.
          </p>
        </article>
      </section>

      <section className="thesis-section">
        <div>
          <p className="section-label">The thesis</p>
          <h2>Cardano deserves a sharper front door.</h2>
        </div>
        <div className="thesis-copy">
          <p>
            DeFi should feel deliberate, understandable and worth returning to.
            XPORTAL is being built to turn a fragmented journey into a focused
            experience for the people arriving early.
          </p>
          <p className="risk-note">
            Digital assets involve risk. Whitelist access is not an investment
            offer and does not guarantee allocation, returns or product access.
          </p>
        </div>
      </section>

      <footer className="defi-footer">
        <Image
          src="/xportal-banner.jpg"
          alt="XPORTAL"
          width={1500}
          height={500}
          className="footer-wordmark"
        />
        <div>
          <span>Cardano DeFi / Coming soon</span>
          <span>© 2026 XPORTAL</span>
        </div>
      </footer>
    </main>
  );
}
