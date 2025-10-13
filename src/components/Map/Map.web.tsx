import React, { useEffect, useRef } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import type { MapProps } from './index';

function ensureCss() {
  const id = 'maplibre-css';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
  document.head.appendChild(link);
}

export default function MapWeb({ points }: MapProps) {
  const mapRef = useRef<MapLibreMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadedRef = useRef<boolean>(false);
  const pendingFCRef = useRef<any | null>(null);

  function toFeatureCollection(pts: MapProps['points']) {
    const features = pts.map((p, i) => ({
      type: 'Feature' as const,
      id: i,
      properties: { weight: p.weight ?? 1 },
      geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] }
    }));
    return { type: 'FeatureCollection' as const, features };
  }

  useEffect(() => {
    if (!containerRef.current) return;
    ensureCss();
    if (!mapRef.current) {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [2.21, 46.22],
        zoom: 5
      });
      mapRef.current = map;
      map.on('load', () => {
        loadedRef.current = true;
        const initial = pendingFCRef.current ?? toFeatureCollection(points);
        if (!map.getSource('spots')) {
          map.addSource('spots', { type: 'geojson', data: initial });
        }
        if (!map.getLayer('heat')) {
          map.addLayer({
            id: 'heat',
            type: 'heatmap',
            source: 'spots',
            paint: {
              'heatmap-weight': ['get', 'weight'],
              'heatmap-intensity': 1.2,
              'heatmap-radius': 20,
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(0,0,255,0)',
                0.2, 'rgba(65,105,225,0.6)',
                0.4, 'rgba(0,191,255,0.7)',
                0.6, 'rgba(0,255,127,0.8)',
                0.8, 'rgba(255,215,0,0.9)',
                1, 'rgba(255,69,0,1)'
              ]
            }
          });
        }
        // If future updates were queued before load, apply latest now
        const latest = pendingFCRef.current;
        if (latest) {
          const src = map.getSource('spots') as any;
          if (src?.setData) src.setData(latest);
          pendingFCRef.current = null;
        }
      });
    }

    return () => {
      // keep map instance for HMR; no cleanup
    };
  }, []);

  // Update data when points change
  useEffect(() => {
    const map = mapRef.current;
    const fc = toFeatureCollection(points);
    if (map && loadedRef.current && map.getSource('spots')) {
      const src = map.getSource('spots') as any;
      if (src?.setData) src.setData(fc);
    } else {
      // queue until style is loaded
      pendingFCRef.current = fc;
    }
  }, [points]);

  return <div ref={containerRef} style={{ flex: 1, minHeight: 400 }} />;
}
