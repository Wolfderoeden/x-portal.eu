import { createHash } from "node:crypto";
import { getDatabase } from "@/lib/database";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import WalletPayment from "../../../components/wallet-payment";
import { formatEuro } from "../../../lib/domain";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Reservation status — XPORTAL",
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
    SELECT
      r.*, p.title_en, p.slug, p.deposit_eur_cents,
      pi.id AS payment_id, pi.status AS payment_status, pi.recipient_address,
      pi.lovelace_amount, pi.ada_eur_rate, pi.rate_source, pi.quote_timestamp,
      pi.expires_at, pi.tx_hash, pi.confirmations,
      (pi.expires_at > NOW()) AS payment_open
    FROM reservations r
    JOIN properties p ON p.id = r.property_id
    LEFT JOIN LATERAL (
      SELECT * FROM payment_intents
      WHERE reservation_id = r.id
      ORDER BY created_at DESC LIMIT 1
    ) pi ON TRUE
    WHERE r.access_token_hash = ${hash}
    LIMIT 1
  `;
  const reservation = rows[0];
  if (!reservation) notFound();
  const paymentOpen =
    reservation.payment_id &&
    reservation.payment_status === "created" &&
    Boolean(reservation.payment_open);

  return (
    <main className="buyer-account-page">
      <div className="account-brand">
        <Link href="/">
          <Image src="/xportal-banner.jpg" alt="XPORTAL" width={1500} height={500} />
        </Link>
        <span>PRIVATE BUYER STATUS / PREPROD</span>
      </div>
      <section className="account-hero">
        <p className="section-label">Reservation {String(reservation.id).slice(0, 8)}</p>
        <h1>{String(reservation.title_en)}</h1>
        <div className="account-status">
          <span>{String(reservation.status)}</span>
          <span>Documents: {String(reservation.document_status)}</span>
        </div>
      </section>
      <section className="status-timeline">
        {[
          ["01", "Inquiry", "Business details received", ["inquiry","kyb-review","approved","payment-pending","reserved"].includes(String(reservation.status))],
          ["02", "Qualification", "KYB, sanctions and documents approved", ["approved","payment-pending","reserved"].includes(String(reservation.status))],
          ["03", "Deposit", "Cardano Preprod payment verified", reservation.payment_status === "confirmed"],
          ["04", "Reserved", "Property status locked for contract work", reservation.status === "reserved"],
        ].map(([number, title, text, complete]) => (
          <article className={complete ? "complete" : ""} key={String(number)}>
            <span>{String(number)}</span><h2>{String(title)}</h2><p>{String(text)}</p>
          </article>
        ))}
      </section>
      <section className="account-payment">
        <div>
          <p className="section-label">Reservation deposit</p>
          <h2>{formatEuro(Number(reservation.deposit_eur_cents))}</h2>
          <p>
            Cardano is enabled only after qualification. The quote is time-stamped
            and expires after 15 minutes. The full property purchase is not paid
            through this interface.
          </p>
        </div>
        <div>
          {paymentOpen ? (
            <>
              <div className="quote-line">
                <span>Rate</span>
                <strong>€{Number(reservation.ada_eur_rate).toFixed(4)} / ADA</strong>
              </div>
              <div className="quote-line">
                <span>Source</span>
                <strong>{String(reservation.rate_source)}</strong>
              </div>
              <div className="quote-line">
                <span>Expires</span>
                <strong>{new Date(String(reservation.expires_at)).toLocaleString("en-GB")}</strong>
              </div>
              <WalletPayment
                intentId={String(reservation.payment_id)}
                accessToken={token}
                lovelaceAmount={Number(reservation.lovelace_amount)}
                recipientAddress={String(reservation.recipient_address)}
              />
            </>
          ) : reservation.payment_status === "submitted" ? (
            <div className="payment-message">
              <h3>Transaction submitted.</h3>
              <p>Preprod monitoring is checking the recipient, amount and confirmations.</p>
              <code>{String(reservation.tx_hash)}</code>
            </div>
          ) : reservation.payment_status === "confirmed" ? (
            <div className="payment-message">
              <h3>Deposit confirmed.</h3>
              <p>{Number(reservation.confirmations)} confirmations recorded. The reservation is locked.</p>
            </div>
          ) : (
            <div className="payment-message">
              <h3>Payment is not open.</h3>
              <p>The operations team will create a fresh Preprod quote after document approval.</p>
            </div>
          )}
        </div>
      </section>
      <p className="account-security">
        Keep this private link secure. XPORTAL will never ask for a seed phrase or private key.
      </p>
    </main>
  );
}
