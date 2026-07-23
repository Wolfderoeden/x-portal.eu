"use client";

import { useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map,
  NavigationControl,
  type FilterSpecification,
} from "maplibre-gl";
import { MARKET_COUNTRIES, type Property } from "../lib/domain";

type MapProperty = Pick<
  Property,
  "id" | "slug" | "titleEn" | "country" | "status" | "geometry"
>;

type MarketplaceMapProps = {
  properties: MapProperty[];
  compact?: boolean;
  previewGeometry?: Property["geometry"];
};

export default function MarketplaceMap({
  properties,
  compact = false,
  previewGeometry,
}: MarketplaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [activeCountry, setActiveCountry] = useState("ALL");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const parcelFeatures = properties
      .filter((property) => property.geometry)
      .map((property) => ({
        type: "Feature" as const,
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
      parcelFeatures.push({
        type: "Feature" as const,
        geometry: previewGeometry,
        properties: {
          id: "preview",
          slug: "",
          title: "Cadastral preview",
          country: "PREVIEW",
          status: "review",
        },
      });
    }

    const marketFeatures = MARKET_COUNTRIES.map((country) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: country.center },
      properties: {
        code: country.code,
        name: country.name,
        pilot: country.pilot,
      },
    }));

    const map = new Map({
      container: containerRef.current,
      style:
        process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
        "https://tiles.openfreemap.org/styles/bright",
      center: [21.5, 48.8],
      zoom: compact ? 5 : 4.2,
      minZoom: 3,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
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
            "#0b0b0b",
            "reserved",
            "#767676",
            "#c7c7c2",
          ],
          "fill-opacity": 0.34,
        },
      });
      map.addLayer({
        id: "parcel-outline",
        type: "line",
        source: "xportal-parcels",
        paint: {
          "line-color": "#070707",
          "line-width": 3,
        },
      });
      map.addSource("xportal-markets", {
        type: "geojson",
        data: { type: "FeatureCollection", features: marketFeatures },
      });
      map.addLayer({
        id: "market-points",
        type: "circle",
        source: "xportal-markets",
        paint: {
          "circle-color": "#0a0a0a",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 8, 10],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      if (parcelFeatures.length > 0) {
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
    });

    map.on("mouseenter", "parcel-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "parcel-fill", () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("click", "parcel-fill", (event) => {
      const slug = event.features?.[0]?.properties?.slug;
      if (slug) window.location.assign(`/properties/${slug}`);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [compact, previewGeometry, properties]);

  function filterCountry(country: string) {
    setActiveCountry(country);
    const map = mapRef.current;
    if (!map?.getLayer("parcel-fill")) return;
    const filter =
      country === "ALL" ? null : (["==", ["get", "country"], country] as FilterSpecification);
    map.setFilter("parcel-fill", filter);
    map.setFilter("parcel-outline", filter);
    if (country !== "ALL") {
      const market = MARKET_COUNTRIES.find((item) => item.code === country);
      if (market) map.flyTo({ center: market.center, zoom: 6, essential: true });
    } else {
      map.flyTo({ center: [21.5, 48.8], zoom: 4.2, essential: true });
    }
  }

  return (
    <div className={compact ? "map-shell map-shell-compact" : "map-shell"}>
      {!compact && (
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
        aria-label="Interactive map of XPORTAL commercial property markets"
      />
      {!compact && (
        <div className="map-legend">
          <span><i className="legend-available" /> Verified parcel</span>
          <span><i className="legend-market" /> Launch market</span>
          <span>{properties.length} verified public listings</span>
        </div>
      )}
    </div>
  );
}
