import Link from "next/link";
import AdminShell from "../../components/admin-shell";
import { requireAdmin } from "../../lib/admin-auth";
import { dashboardCounts, listAllProperties } from "../../lib/db";
import { countryName, formatEuro } from "../../lib/domain";
import { listWhitelistEntries } from "../../lib/whitelist";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdmin();
  const [counts, properties, leads] = await Promise.all([
    dashboardCounts().catch(() => ({ properties: 0, reservations: 0, compliance: 0 })),
    listAllProperties().catch(() => []),
    listWhitelistEntries(),
  ]);

  return (
    <AdminShell session={session}>
      <section className="admin-content">
        <div className="admin-page-title">
          <div><p className="section-label">Private control centre</p><h1>Operations overview</h1></div>
          <Link href="/admin/properties/new" className="admin-primary-link">+ Add property</Link>
        </div>
        <div className="metric-grid">
          <article><strong>{counts.properties}</strong><span>Properties</span></article>
          <article><strong>{counts.reservations}</strong><span>Reservations</span></article>
          <article><strong>{counts.compliance}</strong><span>Open checks</span></article>
          <article><strong>{leads.length}</strong><span>Buyer leads</span></article>
        </div>

        <section className="admin-section">
          <div className="admin-section-heading"><h2>Property inventory</h2><Link href="/admin/properties/new">New record →</Link></div>
          {properties.length === 0 ? (
            <div className="admin-empty"><h3>No controlled properties yet.</h3><p>Create the first record from an official cadastral reference.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Property</th><th>Market</th><th>Price</th><th>Verification</th><th>Status</th><th>Public</th></tr></thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property.id}>
                      <td>{property.titleEn}<br /><small>{property.cadastralReference}</small></td>
                      <td>{countryName(property.country)} / {property.municipality}</td>
                      <td>{formatEuro(property.priceEurCents)}</td>
                      <td><span className="status-pill">{property.verificationStatus}</span></td>
                      <td><span className="status-pill">{property.status}</span></td>
                      <td>{property.published ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-section">
          <div className="admin-section-heading"><h2>Qualified buyer leads</h2><span>{leads.length} total</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Country</th><th>Received</th></tr></thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.fullName}</td><td>{lead.company || "—"}</td>
                    <td><a href={`mailto:${lead.email}`}>{lead.email}</a></td>
                    <td>{lead.country}</td><td>{new Date(lead.createdAt).toLocaleString("en-GB")}</td>
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
