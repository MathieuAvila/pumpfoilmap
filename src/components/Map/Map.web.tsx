import React, { useEffect, useRef } from 'react';
import maplibregl, { Map as MapLibreMap, Popup } from 'maplibre-gl';
import type { MapProps } from './types';
// @ts-ignore - JSON style import
import roadsCitiesStyle from '../../map-styles/roads-cities-style.json';

function ensureCss() {
  const id = 'maplibre-css';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
  document.head.appendChild(link);
}

export default function MapWeb({ points, onPickLocation, picking }: MapProps) {
  const mapRef = useRef<MapLibreMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadedRef = useRef<boolean>(false);
  const pendingFCRef = useRef<any | null>(null);
  // minimal mode removed; always single style

  function toFeatureCollection(pts: MapProps['points']) {
    const features = pts.map((p, i) => ({
      type: 'Feature' as const,
      id: i,
      properties: {
        weight: p.weight ?? 1,
        title: p.title ?? `Spot #${i + 1}`,
        description: p.description ?? '',
        type: p.type,
        url: p.url,
        address: p.address,
        submittedBy: p.submittedBy,
        createdAt: p.createdAt
      },
      geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] }
    }));
    return { type: 'FeatureCollection' as const, features };
  }

  useEffect(() => {
    if (!containerRef.current) return;
    ensureCss();
    if (!mapRef.current) {
      const key = (process.env.EXPO_PUBLIC_MAPTILER_KEY || process.env.MAPTILER_KEY || '').trim();
      let styleObj: any = roadsCitiesStyle;
      if (key) {
        styleObj = JSON.parse(JSON.stringify(roadsCitiesStyle).replace(/\{\{MAPTILER_KEY\}\}/g, key));
      } else {
        styleObj = JSON.parse(JSON.stringify(roadsCitiesStyle).replace(/\?key=\{\{MAPTILER_KEY\}\}/g, ''));
      }
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: styleObj,
        center: [2.21, 46.22],
        zoom: 5
      });
      mapRef.current = map;
      map.on('load', () => {
        loadedRef.current = true;
        const initial = pendingFCRef.current ?? toFeatureCollection(points);
        // Try to find the first symbol (label) layer to keep labels above our overlays
        const style = map.getStyle();
        const firstSymbolLayerId = style && style.layers ? (style.layers.find((l: any) => l.type === 'symbol')?.id as string | undefined) : undefined;
        if (!map.getSource('spots')) {
          map.addSource('spots', {
            type: 'geojson',
            data: initial,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
          });
        }

        // World cities (optional): scaled black dots
        // world cities overlay removed

        // Clustered circles
        if (!map.getLayer('clusters')) {
          map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'spots',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': [
                'step', ['get', 'point_count'],
                '#9ed8ff', 20,
                '#55b2ff', 50,
                '#2282e0'
              ],
              'circle-radius': [
                'step', ['get', 'point_count'],
                18, 20, 24, 50, 30
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          }, firstSymbolLayerId);
        }

        // Cluster count labels
        if (!map.getLayer('cluster-count')) {
          map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'spots',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 12
            },
            paint: {
              'text-color': '#0a3b6b'
            }
          }, firstSymbolLayerId);
        }

        // Unclustered single points
        // Enhanced multi-ring spot styling: glow -> halo -> core
        if (!map.getLayer('unclustered-glow')) {
          map.addLayer({
            id: 'unclustered-glow',
            type: 'circle',
            source: 'spots',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                2, 12,
                6, 18,
                10, 26
              ],
              'circle-color': [
                'case',
                ['==', ['get', 'type'], 'ponton'], '#ff6b6b',
                ['==', ['get', 'type'], 'association'], '#2ecc71',
                '#1e90ff'
              ],
              'circle-opacity': 0.30,
              'circle-blur': 0.8
            }
          }, firstSymbolLayerId);
        }
        if (!map.getLayer('unclustered-halo')) {
          map.addLayer({
            id: 'unclustered-halo',
            type: 'circle',
            source: 'spots',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                2, 9,
                6, 13,
                10, 18
              ],
              'circle-color': '#ffffff'
            }
          }, firstSymbolLayerId);
        }
        if (!map.getLayer('unclustered-core')) {
          map.addLayer({
            id: 'unclustered-core',
            type: 'circle',
            source: 'spots',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                2, 5.5,
                6, 7.5,
                10, 10
              ],
              'circle-color': [
                'case',
                ['==', ['get', 'type'], 'ponton'], '#ff3b3b',
                ['==', ['get', 'type'], 'association'], '#1e9e55',
                '#144c9e'
              ],
              'circle-stroke-width': 1.6,
              'circle-stroke-color': '#0f0f0f'
            }
          }, firstSymbolLayerId);
        }

        // Overlay letter label as a simple "icon"
        if (!map.getLayer('unclustered-label')) {
          map.addLayer({
            id: 'unclustered-label',
            type: 'symbol',
            source: 'spots',
            filter: ['!', ['has', 'point_count']],
            layout: {
              'text-field': [
                'case',
                ['==', ['get', 'type'], 'ponton'], 'P',
                ['==', ['get', 'type'], 'association'], 'A',
                ''
              ],
              'text-font': ['Noto Sans Regular'],
              'text-size': 13,
              'text-offset': [0, 0.9],
              'text-allow-overlap': true
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 1.4
            }
          }, firstSymbolLayerId);
        }
        if (!map.getLayer('unclustered-title')) {
          map.addLayer({
            id: 'unclustered-title',
            type: 'symbol',
            source: 'spots',
            filter: ['!', ['has', 'point_count']],
            layout: {
              'text-field': ['get', 'title'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 11,
              'text-offset': [0, 1.4],
              'text-anchor': 'top',
              'text-optional': true,
              'text-max-width': 10
            },
            paint: {
              'text-color': '#1a1a1a',
              'text-halo-color': '#ffffff',
              'text-halo-width': 0.9
            }
          }, firstSymbolLayerId);
        }

        // Click handler: clusters -> zoom in, points -> popup
        map.on('click', 'clusters', (e) => {
          const feature = e.features && e.features[0];
          if (!feature) return;
          const clusterId = (feature.properties as any).cluster_id;
          const source: any = map.getSource('spots');
          if (source && source.getClusterExpansionZoom) {
            source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
              if (err) return;
              const coordinates = (feature.geometry as any).coordinates.slice();
              map.easeTo({ center: coordinates as any, zoom });
            });
          }
        });

        const onPointClick = (e: any) => {
          const feature = e.features && e.features[0];
          if (!feature) return;
          if (picking && onPickLocation) {
            const coords = (feature.geometry as any).coordinates.slice();
            onPickLocation({ lon: coords[0], lat: coords[1] });
            return;
          }
          const coordinates = (feature.geometry as any).coordinates.slice();
          const props: any = feature.properties || {};
          const isAssoc = props.type === 'association';
          const urlHtml = isAssoc && props.url
            ? `<div style=\"margin-top:8px\"><a style=\"color:#0a62c9;text-decoration:none;font-weight:500\" href=\"${props.url}\" target=\"_blank\" rel=\"noopener noreferrer\">Visiter le site ↗</a></div>`
            : '';
          const imageHtml = props.imageUrl ? `<div style=\"margin-top:8px\"><img src=\"${props.imageUrl}\" alt=\"image spot\" style=\"max-width:240px;width:100%;border-radius:4px;display:block;object-fit:cover\" /></div>` : '';
          const navUrl = props.type === 'ponton' ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}` : '';
          const navHtml = navUrl ? `<div style=\"margin-top:8px\"><a style=\"color:#0a62c9;text-decoration:none;font-weight:500\" href=\"${navUrl}\" target=\"_blank\" rel=\"noopener noreferrer\">Y aller ↗</a></div>` : '';
            const pontonFields = props.type === 'ponton'
              ? `<div style=\"margin-top:6px;color:#444\">Hauteur: ${props.heightM ?? '-'} m — Longueur: ${props.lengthM ?? '-'} m</div>
                 <div style=\"margin-top:2px;color:#444\">Accès: ${props.access ?? '-'}</div>`
              : '';
            const addressHtml = props.address ? `<div style=\"margin-top:6px;color:#444\">${props.address}</div>` : '';
          const metaHtml = `<div style=\"margin-top:6px;color:#777;font-size:12px\">${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}</div>`;
          const submittedHtml = props.submittedBy ? `<div style=\"margin-top:4px;color:#777;font-size:12px\">par ${props.submittedBy}${props.createdAt ? ` — ${new Date(props.createdAt).toLocaleDateString()}` : ''}</div>` : '';
            const html = `<div style=\"max-width:260px\">\n            <div style=\"font-weight:600;margin-bottom:4px\">${props.title || 'Spot'}</div>\n            ${props.description ? `<div style=\\\"color:#555\\\">${props.description}</div>` : ''}\n            ${pontonFields}\n            ${addressHtml}\n            ${imageHtml}\n            ${urlHtml}\n            ${navHtml}\n            ${metaHtml}\n            ${submittedHtml}\n          </div>`;
          new Popup({ closeButton: true })
            .setLngLat(coordinates as any)
            .setHTML(html)
            .addTo(map);
        };
        map.on('click', 'unclustered-point', onPointClick);
        map.on('click', 'unclustered-label', onPointClick);
        if (picking && onPickLocation) {
          map.getCanvas().style.cursor = 'crosshair';
          map.on('click', (e) => {
            if (!picking) return; // runtime check
            onPickLocation({ lon: e.lngLat.lng, lat: e.lngLat.lat });
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

    // no style switching logic needed
    return () => {
      // keep instance
    };
  }, []);

  // Update data when points change
  useEffect(() => {
    const map = mapRef.current;
  // still update spots even in minimal mode
    const fc = toFeatureCollection(points);
    if (map && loadedRef.current && map.getSource('spots')) {
      const src = map.getSource('spots') as any;
      if (src?.setData) src.setData(fc);
    } else {
      // queue until style is loaded
      pendingFCRef.current = fc;
    }
  }, [points]);

  // world cities overlay removed

  return <div ref={containerRef} style={{ flex: 1, minHeight: 400 }} />;
}
