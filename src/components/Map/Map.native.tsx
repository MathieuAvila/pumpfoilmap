import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { MapProps, HeatPoint } from './types';
import { WebView } from 'react-native-webview';

function toGeoJSON(points: HeatPoint[]) {
  return {
    type: 'FeatureCollection',
    features: points.map((p, i) => ({
      type: 'Feature',
      id: i,
      properties: { ...p },
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] }
    }))
  };
}

export default function MapNative({ points, onPickLocation, picking }: MapProps) {
  const webRef = useRef<WebView>(null);
  const initialHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    html, body, #map { margin:0; padding:0; height:100%; width:100%; }
    .ml-popup { font-family: -apple-system, Roboto, Segoe UI, Arial; font-size: 12px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
  <script>
    const RN = window.ReactNativeWebView;
    const state = { picking: ${picking ? 'true' : 'false'}, data: ${JSON.stringify(toGeoJSON(points))} };
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://demotiles.maplibre.org/style.json',
      center: [2.21, 46.22],
      zoom: 5
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    function addLayers() {
      if (map.getSource('spots')) return;
      map.addSource('spots', { type: 'geojson', data: state.data, cluster: true, clusterRadius: 50, clusterMaxZoom: 14 });
      map.addLayer({ id: 'clusters', type: 'circle', source: 'spots', filter: ['has','point_count'], paint: {
        'circle-color': ['step', ['get','point_count'], '#91c9ff', 20, '#52a5ff', 50, '#1e90ff'],
        'circle-radius': ['step', ['get','point_count'], 14, 20, 18, 50, 22],
        'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.2
      }});
      map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'spots', filter: ['has','point_count'], layout: {
        'text-field': ['get','point_count'], 'text-size': 12
      }, paint: { 'text-color': '#0a3b6b' }});
      map.addLayer({ id: 'unclustered-point', type: 'circle', source: 'spots', filter: ['!',['has','point_count']], paint: {
        'circle-color': ['case', ['==',['get','type'],'ponton'], '#1e90ff', ['==',['get','type'],'association'], '#2ecc71', '#1e90ff'],
        'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.2
      }});

      map.on('click', 'clusters', (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
        if (!f) return;
        const coords = f.geometry.coordinates;
        map.easeTo({ center: coords, zoom: Math.min(map.getZoom()+2, 14) });
      });

      map.on('click', (e) => {
        if (state.picking && RN) {
          RN.postMessage(JSON.stringify({ type: 'pick', lat: e.lngLat.lat, lon: e.lngLat.lng }));
          return;
        }
        const feats = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
        const f = feats && feats[0];
        if (!f || !maplibregl.Popup) return;
        const p = f.properties || {};
        const content = '<div class="ml-popup"><div style="font-weight:600;margin-bottom:4px;">' + (p.title||'Spot') + '</div>' + (p.description||'') + '</div>';
        new maplibregl.Popup({ closeButton: true }).setLngLat(e.lngLat).setHTML(content).addTo(map);
      });
    }

    map.on('load', addLayers);

    window.PFM_UPDATE = function(payload) {
      try {
        if (typeof payload.picking !== 'undefined') state.picking = !!payload.picking;
        if (payload.data) {
          state.data = payload.data;
          const src = map.getSource('spots');
          if (src) src.setData(state.data);
        }
      } catch (e) { /* noop */ }
    };
  </script>
</body>
</html>`;
  }, []);

  useEffect(() => {
    const data = toGeoJSON(points);
    const msg = { picking: !!picking, data };
    // Post an update message to the webview
    webRef.current?.postMessage(JSON.stringify({ type: 'update', payload: msg }));
  }, [points, picking]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ html: initialHtml }}
        originWhitelist={["*"]}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data?.type === 'pick' && onPickLocation) {
              onPickLocation({ lat: data.lat, lon: data.lon });
            } else if (data?.type === 'ready') {
              // Optionally send first update on ready
            } else if (data?.type === 'log') {
              // debug logs from webview
            }
          } catch {}
        }}
        injectedJavaScript={"window.addEventListener('message', function(ev){ try { var m=JSON.parse(ev.data); if(m.type==='update' && window.PFM_UPDATE){ window.PFM_UPDATE(m.payload); } } catch(e){} }); true;"}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, map: { flex: 1 } });
