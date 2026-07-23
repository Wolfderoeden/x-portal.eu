import type { Metadata } from "next";
import Link from "next/link";
import AdminShell from "../../../../components/admin-shell";
import CadastreResolver from "../../../../components/cadastre-resolver";
import { requireAdmin } from "../../../../lib/admin-auth";

export const metadata: Metadata = {
  title: "New property — XPORTAL Admin",
  robots: { index: false, follow: false },
};

type NewPropertyProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewPropertyPage({ searchParams }: NewPropertyProps) {
  const session = await requireAdmin(["owner", "operations"]);
  const error = (await searchParams)?.error;

  return (
    <AdminShell session={session}>
      <section className="admin-content narrow">
        <div className="admin-page-title">
          <div>
            <p className="section-label">Inventory / controlled intake</p>
            <h1>New commercial property</h1>
          </div>
          <Link href="/admin" className="text-link-dark">Cancel</Link>
        </div>

        {error && (
          <p className="admin-alert" role="alert">
            {error === "geometry"
              ? "The parcel geometry is not valid GeoJSON."
              : error === "save"
                ? "The property could not be saved. Check for a duplicate cadastral reference."
                : "Review the required fields and try again."}
          </p>
        )}

        <form action="/api/admin/properties" method="post" className="admin-form">
          <fieldset>
            <legend>01 / Official parcel identity</legend>
            <p className="field-note">
              Poland and Romania support automatic boundary lookup. Other markets require
              official GeoJSON until a reliable licensed interface is connected.
            </p>
            <CadastreResolver />
            <div className="form-grid two">
              <label>
                Region
                <input name="region" minLength={2} maxLength={120} required />
              </label>
              <label>
                Municipality
                <input name="municipality" minLength={2} maxLength={120} required />
              </label>
            </div>
            <label>
              Area in m²
              <input name="areaSqm" type="number" min="1" step="0.01" required />
            </label>
          </fieldset>

          <fieldset>
            <legend>02 / Offer and commercial use</legend>
            <div className="form-grid two">
              <label>
                English title
                <input name="titleEn" minLength={4} maxLength={160} required />
              </label>
              <label>
                German title
                <input name="titleDe" minLength={4} maxLength={160} required />
              </label>
            </div>
            <label>
              Permitted commercial use
              <textarea name="commercialUse" rows={3} minLength={3} maxLength={500} required />
            </label>
            <label>
              Development parameters
              <textarea name="developmentParameters" rows={4} maxLength={2000} />
            </label>
            <label>
              Restrictions and encumbrances
              <textarea name="restrictions" rows={4} maxLength={2000} />
            </label>
            <div className="utility-grid">
              {[
                ["utilityRoad", "Road"],
                ["utilityPower", "Power"],
                ["utilityWater", "Water"],
                ["utilitySewer", "Sewer"],
                ["utilityInternet", "Internet"],
              ].map(([name, label]) => (
                <label key={name} className="check-card">
                  <input type="checkbox" name={name} value="yes" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>03 / Price and reservation</legend>
            <div className="form-grid two">
              <label>
                EUR asking price
                <input name="priceEur" type="number" min="1" step="0.01" required />
              </label>
              <label>
                EUR reservation deposit
                <input name="depositEur" type="number" min="1" step="0.01" required />
              </label>
            </div>
            <label>
              Documented price source
              <textarea name="priceSource" rows={3} minLength={3} maxLength={500} required />
            </label>
          </fieldset>

          <fieldset>
            <legend>04 / Verification and publication</legend>
            <label>
              Risk notes
              <textarea name="riskNotes" rows={5} maxLength={3000} />
            </label>
            <div className="form-grid two">
              <label>
                Verification status
                <select name="verificationStatus" defaultValue="unverified">
                  <option value="unverified">Unverified</option>
                  <option value="documents-pending">Documents pending</option>
                  <option value="legal-review">Legal review</option>
                  <option value="verified">Verified</option>
                  <option value="blocked">Blocked</option>
                </select>
              </label>
              <label>
                Marketplace status
                <select name="status" defaultValue="draft">
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
              </label>
            </div>
            <label className="admin-consent">
              <input type="checkbox" name="published" value="yes" />
              <span>
                Publish only if ownership, cadastre, commercial zoning, sanctions and
                price evidence are approved. The API enforces verified + available/reserved.
              </span>
            </label>
          </fieldset>

          <button type="submit" className="admin-primary-button">
            Save controlled property record
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
