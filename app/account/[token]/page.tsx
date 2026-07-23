import { createHash } from "node:crypto";
import { getDatabase } from "@/lib/database";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Inquiry status — XPORTAL",
  robots: { index: false, follow: false },
};

export default async function BuyerAccountPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (token.length < 30 || token.length > 100) notFound();
  const hash = createHash("sha256").update(token).digest("hex");
  const db = getDatabase();
  const rows = await db.sql`
    SELECT r.*, p.title_en, p.slug
    FROM reservations r
    JOIN properties p ON p.id = r.property_id
    WHERE r.access_token_hash = ${hash}
    LIMIT 1
  `;
  const reservation = rows[0];
  if (!reservation) notFound();

  return (
    <main className="buyer-account-page">
      <div className="account-brand">
        <Link href="/">
          <Image src="/xportal-banner.jpg" alt="XPORTAL" width={1500} height={500} />
        </Link>
        <span>PRIVATE BUYER STATUS</span>
      </div>
      <section className="account-hero">
        <p className="section-label">Inquiry {String(reservation.id).slice(0, 8)}</p>
        <h1>{String(reservation.title_en)}</h1>
        <div className="account-status">
          <span>{String(reservation.status)}</span>
          <span>Documents: {String(reservation.document_status)}</span>
        </div>
      </section>
      <section className="status-timeline">
        {[
          ["01", "Inquiry", "Business details received", true],
          ["02", "Qualification", "KYB, sanctions and documents under review", ["approved", "reserved"].includes(String(reservation.status))],
          ["03", "Legal process", "Country-specific contracting follows after approval", reservation.status === "reserved"],
        ].map(([number, title, text, complete]) => (
          <article className={complete ? "complete" : ""} key={String(number)}>
            <span>{String(number)}</span>
            <h2>{String(title)}</h2>
            <p>{String(text)}</p>
          </article>
        ))}
      </section>
      <section className="account-design-hold">
        <p className="section-label">Visual pilot</p>
        <h2>Transaction functions are not active yet.</h2>
        <p>
          XPORTAL is currently validating the marketplace, map and qualification
          experience. No payment method is available in this version.
        </p>
      </section>
      <p className="account-security">
        Keep this private status link secure. The operations team will contact
        your business directly when the next review step is ready.
      </p>
    </main>
  );
}
