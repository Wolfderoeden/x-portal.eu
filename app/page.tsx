import Image from "next/image";
import Link from "next/link";

type HomeProps = {
  searchParams?: Promise<{ joined?: string; error?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = (await searchParams) ?? {};
  const joined = params.joined === "1";
  const hasError = params.error === "1";

  return (
    <main className="simple-page">
      <section className="simple-hero" aria-labelledby="hero-title">
        <div className="simple-copy">
          <div className="simple-protocol">
            <span className="simple-dot" aria-hidden="true" />
            <span>XPORTAL / CARDANO DEFI</span>
            <span>COMING SOON</span>
          </div>

          <p className="simple-kicker">The private gateway to Cardano DeFi</p>
          <h1 id="hero-title">
            Move before
            <br />
            the market does.
          </h1>
          <p className="simple-intro">
            XPORTAL is creating a focused entry point to the next wave of
            Cardano DeFi. Join the founding whitelist for launch intelligence,
            early product access and priority onboarding.
          </p>

          <div className="simple-signals" aria-label="XPORTAL principles">
            <span>Cardano-native</span>
            <span>Signal-first</span>
            <span>Early access</span>
          </div>
        </div>

        <aside
          className="simple-whitelist"
          id="whitelist"
          aria-labelledby="whitelist-title"
        >
          <div className="simple-card-topline">
            <span>Founding whitelist</span>
            <span>01 / ACCESS</span>
          </div>

          {joined ? (
            <div className="simple-success" role="status">
              <span className="simple-success-mark" aria-hidden="true">X</span>
              <p className="simple-eyebrow">Request received</p>
              <h2 id="whitelist-title">You are on the list.</h2>
              <p>
                We will contact you when the next XPORTAL access window opens.
              </p>
              <Link href="/" className="simple-text-link">Return to XPORTAL</Link>
            </div>
          ) : (
            <>
              <p className="simple-eyebrow">Private access</p>
              <h2 id="whitelist-title">Enter the portal.</h2>
              <p className="simple-form-copy">
                Be among the first to receive product updates and onboarding
                access as XPORTAL comes online.
              </p>

              {hasError && (
                <p className="simple-form-error" role="alert">
                  We could not save your request. Please check your details and try again.
                </p>
              )}

              <form action="/api/whitelist" method="post" className="simple-form">
                <label>
                  Full name
                  <input
                    name="fullName"
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    placeholder="Your full name"
                    required
                  />
                </label>

                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={160}
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <label>
                  Country of residence
                  <input
                    name="country"
                    autoComplete="country-name"
                    minLength={2}
                    maxLength={80}
                    placeholder="Your country"
                    required
                  />
                </label>

                <div className="honeypot" aria-hidden="true">
                  <label>
                    Website
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <label className="simple-consent">
                  <input name="consent" type="checkbox" value="yes" required />
                  <span>
                    I agree to receive XPORTAL launch and whitelist updates by email.
                  </span>
                </label>

                <button type="submit" className="simple-submit">
                  <span>Request early access</span>
                  <span aria-hidden="true">-&gt;</span>
                </button>
              </form>

              <p className="simple-privacy">
                Your information is used only for XPORTAL access updates. No spam.
              </p>
            </>
          )}
        </aside>
      </section>

      <section className="simple-values" aria-label="Why XPORTAL">
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

      <section className="simple-thesis">
        <div>
          <p className="simple-section-label">The thesis</p>
          <h2>Cardano deserves a sharper front door.</h2>
        </div>
        <div className="simple-thesis-copy">
          <p>
            DeFi should feel deliberate, understandable and worth returning to.
            XPORTAL is being built to turn a fragmented journey into a focused
            experience for the people arriving early.
          </p>
          <p className="simple-risk">
            Digital assets involve risk. Whitelist access is not an investment
            offer and does not guarantee allocation, returns or product access.
          </p>
        </div>
      </section>

      <footer className="simple-footer">
        <Image
          src="/xportal-banner.jpg"
          alt="XPORTAL"
          width={1500}
          height={500}
        />
        <div>
          <span>Cardano DeFi / Coming soon</span>
          <span>© 2026 XPORTAL</span>
        </div>
      </footer>
    </main>
  );
}
