"use client";

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
const WORLD: [number, number] = [12, 18];
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
      zoom: mix(0.62, 3.15, stage),
      pitch: mix(0, 9, stage),
      bearing: mix(0, -6, stage),
    };
  }
  if (progress <= 0.58) {
    const stage = smoothstep((progress - 0.3) / 0.28);
    return {
      center: [
        mix(EUROPE[0], UKRAINE[0], stage),
        mix(EUROPE[1], UKRAINE[1], stage),
      ] as [number, number],
      zoom: mix(3.15, 5.25, stage),
      pitch: mix(9, 20, stage),
      bearing: mix(-6, -3, stage),
    };
  }
  const stage = smoothstep((progress - 0.58) / 0.42);
  return {
    center: [
      mix(UKRAINE[0], RAKHIV[0], stage),
      mix(UKRAINE[1], RAKHIV[1], stage),
    ] as [number, number],
    zoom: mix(5.25, 13.1, stage),
    pitch: mix(20, 48, stage),
    bearing: mix(-3, 0, stage),
  };
}

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
        "https://tiles.openfreemap.org/styles/bright",
      center: immersive ? WORLD : [21.5, 48.8],
      zoom: immersive ? 0.62 : compact ? 5 : 4.2,
      minZoom: immersive ? 0.35 : 3,
      maxZoom: 18,
      pitch: 0,
      bearing: 0,
      renderWorldCopies: !immersive,
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
      if (immersive) {
        map.addSource("xportal-network", {
          type: "geojson",
          data: { type: "FeatureCollection", features: networkFeatures },
        });
        map.addLayer({
          id: "market-link-halo",
          type: "line",
          source: "xportal-network",
          maxzoom: 9,
          paint: {
            "line-color": "#ffffff",
            "line-width": ["interpolate", ["linear"], ["zoom"], 0.5, 3, 7, 5],
            "line-opacity": ["interpolate", ["linear"], ["zoom"], 0.5, 0.72, 8, 0.18],
          },
        });
        map.addLayer({
          id: "market-links",
          type: "line",
          source: "xportal-network",
          maxzoom: 9,
          paint: {
            "line-color": "#080808",
            "line-width": ["interpolate", ["linear"], ["zoom"], 0.5, 1, 7, 2],
            "line-dasharray": [2, 2],
            "line-opacity": ["interpolate", ["linear"], ["zoom"], 0.5, 0.9, 8, 0.3],
          },
        });
      }
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

  function routeWheelToCamera(event: ReactWheelEvent<HTMLDivElement>) {
    if (!immersive || event.deltaY === 0) return;
    event.preventDefault();
    window.scrollBy({ top: event.deltaY, behavior: "auto" });
  }

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
