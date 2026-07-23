import { getDatabase } from "@/lib/database";
import AdminShell from "../../../components/admin-shell";
import { requireAdmin } from "../../../lib/admin-auth";

export const dynamic = "force-dynamic";

type ReservationsPageProps = {
  searchParams?: Promise<{ error?: string; updated?: string }>;
};

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const session = await requireAdmin(["owner", "operations", "compliance", "viewer"]);
  const params = (await searchParams) ?? {};
  const db = getDatabase();
  const reservations = await db.sql`
    SELECT
      r.*, p.title_en
    FROM reservations r
    JOIN properties p ON p.id = r.property_id
    ORDER BY r.created_at DESC
  `;

  return (
    <AdminShell session={session}>
      <section className="admin-content">
        <div className="admin-page-title">
          <div><p className="section-label">Buyer pipeline / qualification</p><h1>Reservations</h1></div>
        </div>
        {params.updated && <p className="admin-alert">Reservation workflow updated and written to the audit log.</p>}
        {params.error && <p className="admin-alert">The requested operation could not be completed.</p>}
        <div className="reservation-admin-grid">
          {reservations.length === 0 ? (
            <div className="admin-empty"><h3>No inquiries yet.</h3><p>Qualified buyer inquiries will appear here.</p></div>
          ) : reservations.map((reservation) => (
            <article className="reservation-admin-card" key={String(reservation.id)}>
              <div className="reservation-card-top">
                <span>{String(reservation.id).slice(0, 8)}</span>
                <span className="status-pill">{String(reservation.status)}</span>
              </div>
              <h2>{String(reservation.title_en)}</h2>
              <dl>
                <div><dt>Buyer</dt><dd>{String(reservation.buyer_name)} / {String(reservation.buyer_company)}</dd></div>
                <div><dt>Email</dt><dd>{String(reservation.buyer_email)}</dd></div>
                <div><dt>Country</dt><dd>{String(reservation.buyer_country)}</dd></div>
                <div><dt>Documents</dt><dd>{String(reservation.document_status)}</dd></div>
              </dl>
              {session.role !== "viewer" && (
                <form action="/api/admin/reservations" method="post" className="reservation-admin-actions">
                  <input type="hidden" name="reservationId" value={String(reservation.id)} />
                  {reservation.status === "inquiry" && (
                    <button name="action" value="approve">Approve KYB & documents</button>
                  )}
                  {!["cancelled", "reserved"].includes(String(reservation.status)) && (
                    <button className="danger-button" name="action" value="cancel" formNoValidate>Cancel</button>
                  )}
                </form>
              )}
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
