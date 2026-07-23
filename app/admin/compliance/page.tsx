import { getDatabase } from "@netlify/database";
import AdminShell from "../../../components/admin-shell";
import { requireAdmin } from "../../../lib/admin-auth";

export const dynamic = "force-dynamic";

type CompliancePageProps = {
  searchParams?: Promise<{ error?: string; updated?: string; uploaded?: string }>;
};

export default async function CompliancePage({ searchParams }: CompliancePageProps) {
  const session = await requireAdmin(["owner", "compliance", "operations", "viewer"]);
  const params = (await searchParams) ?? {};
  const db = getDatabase();
  const [properties, reservations, checks, documents] = await Promise.all([
    db.sql`SELECT id, title_en FROM properties ORDER BY updated_at DESC`,
    db.sql`SELECT id, buyer_company FROM reservations ORDER BY updated_at DESC`,
    db.sql`SELECT * FROM compliance_checks ORDER BY created_at DESC LIMIT 100`,
    db.sql`SELECT * FROM documents ORDER BY created_at DESC LIMIT 100`,
  ]);

  return (
    <AdminShell session={session}>
      <section className="admin-content">
        <div className="admin-page-title">
          <div><p className="section-label">Evidence / jurisdiction / audit</p><h1>Compliance centre</h1></div>
        </div>
        {(params.updated || params.uploaded) && (
          <p className="admin-alert">The evidence record was saved and written to the audit log.</p>
        )}
        {params.error && <p className="admin-alert">The evidence could not be saved. Check file type, size and identifiers.</p>}

        {session.role !== "viewer" && (
          <div className="compliance-form-grid">
            <form action="/api/admin/compliance" method="post" className="admin-form compact">
              <fieldset>
                <legend>Record a compliance check</legend>
                <label>Entity type<select name="entityType"><option value="property">Property</option><option value="reservation">Reservation</option><option value="organisation">Organisation</option></select></label>
                <label>Entity UUID<input name="entityId" list="known-entities" required /></label>
                <datalist id="known-entities">
                  {properties.map((property) => <option key={String(property.id)} value={String(property.id)}>{String(property.title_en)}</option>)}
                  {reservations.map((reservation) => <option key={String(reservation.id)} value={String(reservation.id)}>{String(reservation.buyer_company)}</option>)}
                </datalist>
                <label>Check type
                  <select name="checkType">
                    <option value="ownership">Ownership</option><option value="cadastre">Cadastre</option>
                    <option value="zoning">Commercial zoning</option><option value="sanctions">Sanctions</option>
                    <option value="source-of-funds">Source of funds</option><option value="seller-kyb">Seller KYB</option>
                    <option value="buyer-kyb">Buyer KYB</option><option value="country-legal">Country legal review</option>
                  </select>
                </label>
                <label>Country<select name="country"><option value="">Not applicable</option><option value="UA">Ukraine</option><option value="PL">Poland</option><option value="SK">Slovakia</option><option value="HU">Hungary</option><option value="RO">Romania</option></select></label>
                <label>Status<select name="status"><option value="pending">Pending</option><option value="in-review">In review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="expired">Expired</option></select></label>
                <label>Evidence summary<textarea name="evidenceSummary" rows={5} minLength={3} required /></label>
                <button className="admin-primary-button" type="submit">Record check</button>
              </fieldset>
            </form>

            <form action="/api/admin/documents" method="post" encType="multipart/form-data" className="admin-form compact">
              <fieldset>
                <legend>Upload private evidence</legend>
                <p className="field-note">PDF, JPEG or PNG. Maximum 12 MB. Files are never exposed through a public URL.</p>
                <label>Entity type<select name="entityType"><option value="property">Property</option><option value="reservation">Reservation</option><option value="organisation">Organisation</option></select></label>
                <label>Entity UUID<input name="entityId" list="known-entities" required /></label>
                <label>Document type<input name="documentType" placeholder="Title extract / zoning / KYB…" required /></label>
                <label>File<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required /></label>
                <button className="admin-primary-button" type="submit">Upload private evidence</button>
              </fieldset>
            </form>
          </div>
        )}

        <section className="admin-section">
          <div className="admin-section-heading"><h2>Review log</h2><span>{checks.length} records</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Type</th><th>Entity</th><th>Country</th><th>Status</th><th>Reviewer</th><th>Evidence</th></tr></thead>
              <tbody>
                {checks.map((check) => (
                  <tr key={String(check.id)}>
                    <td>{String(check.check_type)}</td>
                    <td>{String(check.property_id ?? check.reservation_id ?? check.organisation_id).slice(0, 8)}</td>
                    <td>{String(check.country ?? "—")}</td><td><span className="status-pill">{String(check.status)}</span></td>
                    <td>{String(check.reviewer ?? "—")}</td><td>{String(check.evidence_summary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading"><h2>Private documents</h2><span>{documents.length} files</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Type</th><th>Filename</th><th>Status</th><th>Uploaded</th><th>Access</th></tr></thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={String(document.id)}>
                    <td>{String(document.document_type)}</td><td>{String(document.file_name)}</td>
                    <td><span className="status-pill">{String(document.status)}</span></td>
                    <td>{new Date(String(document.created_at)).toLocaleString("en-GB")}</td>
                    <td><a className="text-link-dark" href={`/api/admin/documents/${document.id}`}>Download</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </AdminShell>
  );
}
