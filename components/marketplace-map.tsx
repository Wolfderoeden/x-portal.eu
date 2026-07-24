"use client";

import Link from "next/link";
import {
  type WheelEvent as ReactWheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LngLatBounds,
  Map,
  NavigationControl,
  type FilterSpecification,
} from "maplibre-gl";
import { MARKET_COUNTRIES, type Property } from "../lib/domain";

type MapProperty = Pick<
  Property,
  | "id"
  | "slug"
  | "titleEn"
  | "country"
  | "region"
  | "municipality"
  | "status"
  | "geometry"
  | "areaSqm"
  | "cadastralReference"
  | "integrity"
>;

type MarketplaceMapProps = {
  properties: MapProperty[];
  compact?: boolean;
  previewGeometry?: Property["geometry"];
  immersive?: boolean;
  progress?: number;
  language?: "en" | "de";
};

const RAKHIV: [number, number] = [24.2099, 48.0524];
const WORLD: [number, number] = [18, 24];
const EUROPE: [number, number] = [18.8, 49.2];
const UKRAINE: [number, number] = [29.4, 49.1];

function smoothstep(value: number) {
  const normalized = Math.min(1, Math.max(0, value));
  return normalized * normalized * (3 - 2 * normalized);
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function immersiveCamera(progress: number) {
  if (progress <= 0.3) {
    const stage = smoothstep(progress / 0.3);
    return {
      center: [
        mix(WORLD[0], EUROPE[0], stage),
        mix(WORLD[1], EUROPE[1], stage),
      ] as [number, number],
      zoom: mix(0.72, 3.25, stage),
      pitch: mix(0, 18, stage),
      bearing: mix(-13, -6, stage),
    };
  }
  if (progress <= 0.6) {
    const stage = smoothstep((progress - 0.3) / 0.3);
    return {
      center: [
        mix(EUROPE[0], UKRAINE[0], stage),
        mix(EUROPE[1], UKRAINE[1], stage),
      ] as [number, number],
      zoom: mix(3.25, 5.8, stage),
      pitch: mix(18, 34, stage),
      bearing: mix(-6, -3, stage),
    };
  }
  const stage = smoothstep((progress - 0.6) / 0.4);
  return {
    center: [
      mix(UKRAINE[0], RAKHIV[0], stage),
      mix(UKRAINE[1], RAKHIV[1], stage),
    ] as [number, number],
    zoom: mix(5.8, 13.4, stage),
    pitch: mix(34, 54, stage),
    bearing: mix(-3, 8, stage),
  };
}

function shortFingerprint(fingerprint: string) {
  return `${fingerprint.slice(0, 10)}…${fingerprint.slice(-8)}`;
}

export default function MarketplaceMap({
  properties,
  compact = false,
  previewGeometry,
  immersive = false,
  progress = 0,
  language = "en",
}: MarketplaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [activeCountry, setActiveCountry] = useState("ALL");
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const parcelFeatures = useMemo(() => {
    const verified = properties
      .filter((property) => property.geometry)
      .map((property) => ({
        type: "Feature" as const,
        id: property.id,
        geometry: property.geometry!,
        properties: {
          id: property.id,
          slug: property.slug,
          title: property.titleEn,
          country: property.country,
          status: property.status,
        },
      }));

    if (previewGeometry) {
      verified.push({
        type: "Feature" as const,
        id: "cadastre-preview",
        geometry: previewGeometry,
        properties: {
          id: "cadastre-preview",
          slug: "",
          title: "CADASTRAL REVIEW",
          country: "PREVIEW",
          status: "review",
        },
      });
    }

    return verified;
  }, [previewGeometry, properties]);

  const selectedProperty =
    properties.find((property) => property.id === selectedId) ?? null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const marketFeatures = MARKET_COUNTRIES.map((country) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: country.center },
      properties: {
        code: country.code,
        name: country.name.toUpperCase(),
        pilot: country.pilot,
      },
    }));
    const networkFeatures = MARKET_COUNTRIES.map((country) => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: [country.center, RAKHIV],
      },
      properties: { country: country.code },
    }));

    const map = new Map({
      container: containerRef.current,
      style:
        process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
        "https://tiles.openfreemap.org/styles/dark",
      center: immersive ? WORLD : [21.5, 48.8],
      zoom: immersive ? 0.72 : compact ? 5 : 4.2,
      minZoom: immersive ? 0.45 : 3,
      maxZoom: 18,
      pitch: 0,
      bearing: immersive ? -13 : 0,
      renderWorldCopies: false,
      attributionControl: { compact: true },
      fadeDuration: 240,
    });
    mapRef.current = map;

    if (!immersive) {
      map.addControl(
        new NavigationControl({ showCompass: true, visualizePitch: true }),
        "top-right",
      );
    } else {
      map.scrollZoom.disable();
      map.doubleClickZoom.disable();
      map.keyboard.disable();
    }

    map.on("load", () => {
      map.setProjection({ type: "globe" });
      map.setSky({
        "sky-color": "#03060b",
        "horizon-color": "#0d1720",
        "fog-color": "#101a20",
        "sky-horizon-blend": 0.82,
        "horizon-fog-blend": 0.78,
        "fog-ground-blend": 0.68,
        "atmosphere-blend": 0.92,
      });

      map.addSource("xportal-parcels", {
        type: "geojson",
        data: { type: "FeatureCollection", features: parcelFeatures },
      });
      map.addLayer({
        id: "parcel-fill",
        type: "fill",
        source: "xportal-parcels",
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            "available",
            "#d8ff72",
            "reserved",
            "#88a8ff",
            "#e8edf0",
          ],
          "fill-opacity": immersive
            ? ["interpolate", ["linear"], ["zoom"], 8, 0, 11.2, 0.22, 15, 0.42]
            : 0.36,
        },
      });
      map.addLayer({
        id: "parcel-signal",
        type: "line",
        source: "xportal-parcels",
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "available",
            "#d8ff72",
            "reserved",
            "#88a8ff",
            "#ffffff",
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 2, 14, 8],
          "line-blur": ["interpolate", ["linear"], ["zoom"], 8, 2, 14, 7],
          "line-opacity": immersive
            ? ["interpolate", ["linear"], ["zoom"], 8, 0, 11, 0.7, 15, 0.35]
            : 0.35,
        },
      });
      map.addLayer({
        id: "parcel-outline",
        type: "line",
        source: "xportal-parcels",
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "available",
            "#e8ffac",
            "reserved",
            "#a9beff",
            "#ffffff",
          ],
          "line-width": immersive
            ? ["interpolate", ["linear"], ["zoom"], 8, 0.7, 14, 2.6]
            : 3,
          "line-opacity": immersive
            ? ["interpolate", ["linear"], ["zoom"], 8, 0, 10.5, 1]
            : 1,
        },
      });
      map.addLayer({
        id: "parcel-selected",
        type: "line",
        source: "xportal-parcels",
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "line-color": "#ffffff",
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 3, 15, 6],
          "line-dasharray": [1.2, 1.2],
        },
      });
      map.addLayer({
        id: "parcel-labels",
        type: "symbol",
        source: "xportal-parcels",
        minzoom: 11.5,
        layout: {
          "text-field": ["concat", "XPR / ", ["get", "title"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": 10,
          "text-letter-spacing": 0.14,
          "text-offset": [0, 1.4],
        },
        paint: {
          "text-color": "#f3f7f8",
          "text-halo-color": "#03070b",
          "text-halo-width": 2,
        },
      });

      map.addSource("xportal-markets", {
        type: "geojson",
        data: { type: "FeatureCollection", features: marketFeatures },
      });
      map.addSource("xportal-network", {
        type: "geojson",
        data: { type: "FeatureCollection", features: networkFeatures },
      });
      map.addLayer({
        id: "market-link-glow",
        type: "line",
        source: "xportal-network",
        maxzoom: 8.8,
        paint: {
          "line-color": "#7ce7e1",
          "line-width": ["interpolate", ["linear"], ["zoom"], 0.5, 2, 7, 4],
          "line-blur": 5,
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0.5, 0.3, 8, 0.05],
        },
      });
      map.addLayer({
        id: "market-links",
        type: "line",
        source: "xportal-network",
        maxzoom: 8.8,
        paint: {
          "line-color": "#90d8d4",
          "line-width": 1,
          "line-dasharray": [1.5, 2.5],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0.5, 0.72, 8, 0.12],
        },
      });
      map.addLayer({
        id: "market-points-glow",
        type: "circle",
        source: "xportal-markets",
        maxzoom: 9,
        paint: {
          "circle-color": "#7ce7e1",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 10, 8, 18],
          "circle-blur": 0.85,
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.42, 9, 0],
        },
      });
      map.addLayer({
        id: "market-points",
        type: "circle",
        source: "xportal-markets",
        maxzoom: 9,
        paint: {
          "circle-color": "#061014",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 3, 8, 7],
          "circle-stroke-color": "#b7fffa",
          "circle-stroke-width": 1.5,
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0],
        },
      });
      map.addLayer({
        id: "market-labels",
        type: "symbol",
        source: "xportal-markets",
        maxzoom: 7.7,
        layout: {
          "text-field": ["concat", ["get", "name"], " / JURISDICTION"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 9,
          "text-offset": [0, 1.6],
          "text-letter-spacing": 0.12,
        },
        paint: {
          "text-color": "#dff7f5",
          "text-halo-color": "#071015",
          "text-halo-width": 1.8,
        },
      });
      map.addSource("rakhiv-origin", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "Point", coordinates: RAKHIV },
          properties: { name: "RAKHIV / EUROPEAN OPERATIONS ORIGIN" },
        },
      });
      map.addLayer({
        id: "rakhiv-glow",
        type: "circle",
        source: "rakhiv-origin",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 15, 13, 35],
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-color": "#d8ff72",
          "circle-stroke-width": 8,
          "circle-blur": 1,
          "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.38, 13, 0.08],
        },
      });
      map.addLayer({
        id: "rakhiv-ring",
        type: "circle",
        source: "rakhiv-origin",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 13, 16],
          "circle-color": "#071015",
          "circle-stroke-color": "#d8ff72",
          "circle-stroke-width": 1.5,
          "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 3, 1, 13, 0.35],
        },
      });
      map.addLayer({
        id: "rakhiv-label",
        type: "symbol",
        source: "rakhiv-origin",
        minzoom: 4.5,
        maxzoom: 12,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 9,
          "text-offset": [0, 2.2],
          "text-letter-spacing": 0.12,
        },
        paint: {
          "text-color": "#eaffac",
          "text-halo-color": "#071015",
          "text-halo-width": 2,
        },
      });

      if (!immersive && parcelFeatures.length > 0) {
        const bounds = new LngLatBounds();
        const visit = (coordinates: unknown) => {
          if (
            Array.isArray(coordinates) &&
            typeof coordinates[0] === "number" &&
            typeof coordinates[1] === "number"
          ) {
            bounds.extend(coordinates as [number, number]);
            return;
          }
          if (Array.isArray(coordinates)) coordinates.forEach(visit);
        };
        parcelFeatures.forEach((feature) => visit(feature.geometry.coordinates));
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: compact ? 36 : 80, maxZoom: 15 });
        }
      }
      setLoaded(true);
    });

    map.on("mouseenter", "parcel-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "parcel-fill", () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("click", "parcel-fill", (event) => {
      const id = event.features?.[0]?.properties?.id;
      const slug = event.features?.[0]?.properties?.slug;
      if (!id || !slug) return;
      setSelectedId(String(id));
      map.setFilter("parcel-selected", [
        "==",
        ["get", "id"],
        String(id),
      ] as FilterSpecification);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [compact, immersive, parcelFeatures]);

  useEffect(() => {
    const map = mapRef.current;
    if (!immersive || !map || !loaded) return;
    map.jumpTo(immersiveCamera(progress));
  }, [immersive, loaded, progress]);

  function filterCountry(country: string) {
    setActiveCountry(country);
    const map = mapRef.current;
    if (!map?.getLayer("parcel-fill")) return;
    const filter =
      country === "ALL"
        ? null
        : (["==", ["get", "country"], country] as FilterSpecification);
    ["parcel-fill", "parcel-signal", "parcel-outline", "parcel-labels"].forEach(
      (layer) => map.getLayer(layer) && map.setFilter(layer, filter),
    );
    if (country !== "ALL") {
      const market = MARKET_COUNTRIES.find((item) => item.code === country);
      if (market) map.flyTo({ center: market.center, zoom: 6, essential: true });
    } else {
      map.flyTo({ center: [21.5, 48.8], zoom: 4.2, essential: true });
    }
  }

  function routeWheelToCamera(event: ReactWheelEvent<HTMLDivElement>) {
    if (!immersive || event.deltaY === 0) return;
    event.preventDefault();
    window.scrollBy({ top: event.deltaY, behavior: "auto" });
  }

  const anchoredCount = properties.filter(
    (property) => property.integrity.anchorStatus === "anchored-match",
  ).length;

  return (
    <div
      className={[
        "map-shell",
        compact ? "map-shell-compact" : "",
        immersive ? "map-shell-immersive" : "",
      ].filter(Boolean).join(" ")}
      onWheelCapture={immersive ? routeWheelToCamera : undefined}
    >
      {!compact && !immersive && (
        <div className="map-filters" aria-label="Filter map by country">
          <button
            type="button"
            className={activeCountry === "ALL" ? "is-active" : ""}
            onClick={() => filterCountry("ALL")}
          >
            All markets
          </button>
          {MARKET_COUNTRIES.map((country) => (
            <button
              type="button"
              key={country.code}
              className={activeCountry === country.code ? "is-active" : ""}
              onClick={() => filterCountry(country.code)}
            >
              {country.name}
            </button>
          ))}
        </div>
      )}
      <div
        ref={containerRef}
        className="map-canvas"
        role="region"
        aria-label={
          language === "de"
            ? "Interaktive Karte der XPORTAL-Gewerbegrundstücke"
            : "Interactive map of XPORTAL commercial properties"
        }
      />
      {immersive && (
        <>
          <div className="map-system-status">
            <span><i className="system-live" /> VERIFIED BACKEND FEED</span>
            <strong>{parcelFeatures.length.toString().padStart(2, "0")} LIVE PARCELS</strong>
            <span>{anchoredCount.toString().padStart(2, "0")} CARDANO ANCHORS</span>
          </div>

          {selectedProperty && (
            <aside className="parcel-intel-panel" aria-live="polite">
              <button
                type="button"
                aria-label="Close property details"
                onClick={() => {
                  setSelectedId(null);
                  mapRef.current?.setFilter("parcel-selected", [
                    "==",
                    ["get", "id"],
                    "__none__",
                  ]);
                }}
              >
                CLOSE / ESC
              </button>
              <span className="parcel-intel-kicker">
                XPR / {selectedProperty.country} / {selectedProperty.status}
              </span>
              <h3>{selectedProperty.titleEn}</h3>
              <dl>
                <div><dt>Municipality</dt><dd>{selectedProperty.municipality}</dd></div>
                <div><dt>Parcel area</dt><dd>{selectedProperty.areaSqm.toLocaleString()} m²</dd></div>
                <div><dt>Cadastre</dt><dd>{selectedProperty.cadastralReference}</dd></div>
                <div>
                  <dt>Data fingerprint</dt>
                  <dd><code>{shortFingerprint(selectedProperty.integrity.fingerprint)}</code></dd>
                </div>
                <div>
                  <dt>Cardano anchor</dt>
                  <dd className={`proof-${selectedProperty.integrity.anchorStatus}`}>
                    {selectedProperty.integrity.anchorStatus === "anchored-match"
                      ? "ON-CHAIN MATCH"
                      : selectedProperty.integrity.anchorStatus === "anchored-mismatch"
                        ? "MISMATCH / REVIEW"
                        : "NOT YET ANCHORED"}
                  </dd>
                </div>
              </dl>
              <p>
                The fingerprint detects record changes. Legal title and source
                accuracy remain subject to documented due diligence.
              </p>
              <Link href={`/properties/${selectedProperty.slug}`}>
                OPEN VERIFIED PROPERTY FILE →
              </Link>
            </aside>
          )}

          {parcelFeatures.length === 0 && (
            <div className="inventory-lock-panel">
              <span>INVENTORY GATE / ACTIVE</span>
              <strong>NO VERIFIED PARCELS LIVE</strong>
              <p>
                Synthetic outlines are disabled. A parcel appears here only
                after backend publication, cadastral geometry and legal review.
              </p>
            </div>
          )}

          <div className="immersive-map-legend">
            <span><i className="legend-parcel-live" /> VERIFIED BACKEND PARCEL</span>
            <span><i className="legend-jurisdiction-node" /> JURISDICTION NODE</span>
            <span>DRAG / PAN · SCROLL / ALTITUDE</span>
          </div>
        </>
      )}
      {!compact && !immersive && (
        <div className="map-legend">
          <span><i className="legend-available" /> Verified backend parcel</span>
          <span><i className="legend-market" /> Jurisdiction node</span>
          <span>{properties.length} verified public listings</span>
        </div>
      )}
    </div>
  );
}
