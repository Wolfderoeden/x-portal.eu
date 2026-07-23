"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { GeoJsonGeometry } from "../lib/domain";

const MarketplaceMap = dynamic(() => import("./marketplace-map"), { ssr: false });

type ResolverResponse = {
  status: "resolved" | "manual";
  geometry?: GeoJsonGeometry;
  sourceUrl?: string;
  checkedAt?: string;
  message: string;
};

export default function CadastreResolver() {
  const [country, setCountry] = useState("PL");
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<ResolverResponse | null>(null);
  const [geometryText, setGeometryText] = useState("");
  const [busy, setBusy] = useState(false);

  async function resolveParcel() {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch(
        `/api/admin/cadastre/resolve?country=${encodeURIComponent(country)}&reference=${encodeURIComponent(reference)}`,
      );
      const body = (await response.json()) as ResolverResponse;
      setResult(body);
      setGeometryText(body.geometry ? JSON.stringify(body.geometry) : "");
    } catch {
      setResult({
        status: "manual",
        message: "The cadastral service could not be reached. Paste verified GeoJSON manually.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cadastre-resolver">
      <div className="form-grid two">
        <label>
          Country
          <select name="country" value={country} onChange={(event) => setCountry(event.target.value)} required>
            <option value="UA">Ukraine</option>
            <option value="PL">Poland</option>
            <option value="SK">Slovakia</option>
            <option value="HU">Hungary</option>
            <option value="RO">Romania</option>
          </select>
        </label>
        <label>
          Cadastral reference
          <input
            name="cadastralReference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            minLength={3}
            maxLength={180}
            required
          />
        </label>
      </div>
      <button
        className="secondary-button"
        type="button"
        onClick={resolveParcel}
        disabled={busy || reference.length < 3}
      >
        {busy ? "Resolving official parcel…" : "Resolve cadastral boundary"}
      </button>

      {result && (
        <div className={`resolver-result ${result.status}`}>
          <strong>{result.status === "resolved" ? "Boundary found" : "Manual verification required"}</strong>
          <p>{result.message}</p>
          {result.sourceUrl && (
            <a href={result.sourceUrl} target="_blank" rel="noreferrer">Open official source</a>
          )}
        </div>
      )}

      {result?.geometry && (
        <MarketplaceMap compact properties={[]} previewGeometry={result.geometry} />
      )}

      <label>
        Verified GeoJSON geometry
        <textarea
          name="geometry"
          rows={7}
          value={geometryText}
          onChange={(event) => {
            setGeometryText(event.target.value);
            try {
              const geometry = JSON.parse(event.target.value) as GeoJsonGeometry;
              setResult({
                status: "resolved",
                geometry,
                message: "Geometry pasted manually. Verify the source before publishing.",
              });
            } catch {
              setResult({
                status: "manual",
                message: "Paste a valid GeoJSON Polygon or MultiPolygon.",
              });
            }
          }}
          placeholder='{"type":"Polygon","coordinates":[[[lng,lat],...]]}'
          required
        />
      </label>
      <input type="hidden" name="cadastralSourceUrl" value={result?.sourceUrl ?? ""} />
      <input type="hidden" name="cadastralCheckedAt" value={result?.checkedAt ?? ""} />
    </section>
  );
}
