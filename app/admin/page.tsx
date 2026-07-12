import Image from "next/image";
import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="admin-page">
      <header className="site-header">
        <Link href="/" className="brand-mark" aria-label="XPORTAL home">
          <Image
            src="/xportal-logo.jpg"
            alt="XPORTAL symbol"
            width={52}
            height={52}
          />
        </Link>
        <Link href="/" className="back-link">
          ← Back to site
        </Link>
      </header>

      <section className="admin-panel" aria-labelledby="admin-title">
        <p className="eyebrow">XPORTAL / ADMIN</p>
        <h1 id="admin-title">Control center.</h1>
        <p>
          The administration area is reserved for the XPORTAL team and will be
          activated before launch.
        </p>
        <div className="status-row">
          <span className="status-dot">System staged</span>
          <span>Access locked</span>
        </div>
      </section>
    </main>
  );
}
