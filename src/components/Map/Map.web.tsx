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

  useEffect(() => {
  if (!containerRef.current) return;
  ensureCss();
    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [2.21, 46.22],
        zoom: 5
      });
    }

    const map = mapRef.current;
    if (!map.getSource('spots')) {
      const features = points.map((p, i) => ({
        type: 'Feature' as const,
        id: i,
        properties: { weight: p.weight ?? 1 },
        geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] }
      }));
      const fc = { type: 'FeatureCollection' as const, features };
      map.addSource('spots', { type: 'geojson', data: fc });
    } else {
      const src = map.getSource('spots') as any;
      const features = points.map((p, i) => ({
        type: 'Feature' as const,
        id: i,
        properties: { weight: p.weight ?? 1 },
        geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] }
      }));
      src.setData({ type: 'FeatureCollection', features });
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

    return () => {
      // keep map instance for HMR; no cleanup
    };
  }, [points]);

  return <div ref={containerRef} style={{ flex: 1, minHeight: 400 }} />;
}
