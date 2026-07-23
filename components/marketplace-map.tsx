"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  immersive?: boolean;
  progress?: number;
  language?: "en" | "de";
};

const RAKHIV: [number, number] = [24.2099, 48.0524];

const DEMO_PARCELS = [
  {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [[[24.183, 48.071], [24.199, 48.073], [24.202, 48.064], [24.187, 48.061], [24.183, 48.071]]],
    },
    properties: { id: "preview-01", slug: "", title: "PREVIEW ZONE 01", country: "UA", status: "concept", demo: true },
  },
  {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [[[24.222, 48.064], [24.239, 48.063], [24.244, 48.053], [24.228, 48.050], [24.222, 48.064]]],
    },
    properties: { id: "preview-02", slug: "", title: "PREVIEW ZONE 02", country: "UA", status: "concept", demo: true },
  },
  {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [[[24.195, 48.042], [24.211, 48.045], [24.215, 48.035], [24.200, 48.031], [24.195, 48.042]]],
    },
    properties: { id: "preview-03", slug: "", title: "PREVIEW ZONE 03", country: "UA", status: "concept", demo: true },
  },
  {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [[[24.244, 48.040], [24.261, 48.043], [24.266, 48.033], [24.250, 48.029], [24.244, 48.040]]],
    },
    properties: { id: "preview-04", slug: "", title: "PREVIEW ZONE 04", country: "UA", status: "concept", demo: true },
  },
];

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

  const parcelFeatures = useMemo(() => {
    const verified = properties
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
          demo: false,
        },
      }));

    if (previewGeometry) {
      verified.push({
        type: "Feature" as const,
        geometry: previewGeometry,
        properties: {
          id: "preview",
          slug: "",
          title: "CADASTRAL PREVIEW",
          country: "PREVIEW",
          status: "review",
          demo: true,
        },
      });
    }

    return immersive && verified.length === 0 ? DEMO_PARCELS : verified;
  }, [immersive, previewGeometry, properties]);

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

    const map = new Map({
      container: containerRef.current,
      style:
        process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
        "https://tiles.openfreemap.org/styles/bright",
      center: immersive ? [18.6, 49.2] : [21.5, 48.8],
      zoom: immersive ? 2.55 : compact ? 5 : 4.2,
      minZoom: immersive ? 2.3 : 3,
      maxZoom: 18,
      pitch: immersive ? 14 : 0,
      bearing: immersive ? -7 : 0,
      canvasContextAttributes: { preserveDrawingBuffer: immersive },
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(
      new NavigationControl({ showCompass: immersive, visualizePitch: immersive }),
      "top-right",
    );
    if (immersive) {
      map.scrollZoom.disable();
      map.doubleClickZoom.disable();
      map.keyboard.disable();
    }

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
            "case",
            ["get", "demo"],
            "#f5f5ef",
            ["match", ["get", "status"], "available", "#f5f5ef", "reserved", "#8d8d88", "#c7c7c2"],
          ],
          "fill-opacity": immersive
            ? ["interpolate", ["linear"], ["zoom"], 8, 0, 11.5, 0.2, 15, 0.38]
            : 0.34,
        },
      });
      if (immersive) {
        map.addLayer({
          id: "parcel-halo",
          type: "line",
          source: "xportal-parcels",
          paint: {
            "line-color": "#090909",
            "line-width": ["interpolate", ["linear"], ["zoom"], 9, 2, 14, 8],
            "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0, 11, 0.75],
          },
        });
      }
      map.addLayer({
        id: "parcel-outline",
        type: "line",
        source: "xportal-parcels",
        paint: {
          "line-color": immersive ? "#ffffff" : "#070707",
          "line-width": immersive
            ? ["interpolate", ["linear"], ["zoom"], 9, 1, 14, 3]
            : 3,
          "line-opacity": immersive
            ? ["interpolate", ["linear"], ["zoom"], 8, 0, 11, 1]
            : 1,
        },
      });
      if (immersive) {
        map.addLayer({
          id: "parcel-labels",
          type: "symbol",
          source: "xportal-parcels",
          minzoom: 12,
          layout: {
            "text-field": ["get", "title"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 10,
            "text-letter-spacing": 0.14,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#080808",
            "text-halo-width": 2,
          },
        });
      }

      map.addSource("xportal-markets", {
        type: "geojson",
        data: { type: "FeatureCollection", features: marketFeatures },
      });
      map.addLayer({
        id: "market-points",
        type: "circle",
        source: "xportal-markets",
        maxzoom: 9,
        paint: {
          "circle-color": "#090909",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 4, 8, 9],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0],
        },
      });
      if (immersive) {
        map.addLayer({
          id: "market-labels",
          type: "symbol",
          source: "xportal-markets",
          maxzoom: 7.5,
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 10,
            "text-offset": [0, 1.5],
            "text-letter-spacing": 0.12,
          },
          paint: {
            "text-color": "#121212",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.5,
          },
        });
        map.addSource("rakhiv-origin", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "Point", coordinates: RAKHIV },
            properties: { name: "RAKHIV / EUROPEAN ORIGIN" },
          },
        });
        map.addLayer({
          id: "rakhiv-ring",
          type: "circle",
          source: "rakhiv-origin",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 5, 13, 16],
            "circle-color": "rgba(0,0,0,0)",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0, 5, 1, 12, 0.4],
          },
        });
        map.addLayer({
          id: "rakhiv-label",
          type: "symbol",
          source: "rakhiv-origin",
          minzoom: 5,
          maxzoom: 12,
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 10,
            "text-offset": [0, 2],
            "text-letter-spacing": 0.12,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#090909",
            "text-halo-width": 2,
          },
        });
      }

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
      const slug = event.features?.[0]?.properties?.slug;
      if (slug) window.location.assign(`/properties/${slug}`);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [compact, immersive, parcelFeatures]);

  useEffect(() => {
    const map = mapRef.current;
    if (!immersive || !map || !loaded) return;
    const eased = 1 - Math.pow(1 - progress, 2.15);
    const longitude = 18.6 + (RAKHIV[0] - 18.6) * eased;
    const latitude = 49.2 + (RAKHIV[1] - 49.2) * eased;
    map.jumpTo({
      center: [longitude, latitude],
      zoom: 2.55 + eased * 10.35,
      pitch: 14 + eased * 34,
      bearing: -7 + eased * 7,
    });
  }, [immersive, loaded, progress]);

  function filterCountry(country: string) {
    setActiveCountry(country);
    const map = mapRef.current;
    if (!map?.getLayer("parcel-fill")) return;
    const filter =
      country === "ALL"
        ? null
        : (["==", ["get", "country"], country] as FilterSpecification);
    map.setFilter("parcel-fill", filter);
    if (map.getLayer("parcel-halo")) map.setFilter("parcel-halo", filter);
    map.setFilter("parcel-outline", filter);
    if (country !== "ALL") {
      const market = MARKET_COUNTRIES.find((item) => item.code === country);
      if (market) map.flyTo({ center: market.center, zoom: 6, essential: true });
    } else {
      map.flyTo({ center: [21.5, 48.8], zoom: 4.2, essential: true });
    }
  }

  const hasDemoParcels = immersive && properties.every((property) => !property.geometry);

  return (
    <div
      className={[
        "map-shell",
        compact ? "map-shell-compact" : "",
        immersive ? "map-shell-immersive" : "",
      ].filter(Boolean).join(" ")}
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
            : "Interactive map of XPORTAL commercial property markets"
        }
      />
      {immersive && (
        <div className="immersive-map-legend">
          <span><i /> {hasDemoParcels ? "DESIGN PREVIEW / NOT A LISTING" : `${properties.length} VERIFIED PARCELS`}</span>
          <span>DRAG TO PAN / SCROLL CONTROLS ALTITUDE</span>
        </div>
      )}
      {!compact && !immersive && (
        <div className="map-legend">
          <span><i className="legend-available" /> Verified parcel</span>
          <span><i className="legend-market" /> Launch market</span>
          <span>{properties.length} verified public listings</span>
        </div>
      )}
    </div>
  );
}
