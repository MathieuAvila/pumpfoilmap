import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, Alert, Linking, Platform } from 'react-native';
import type { MapProps } from './types';

// Load @rnmapbox/maps in a way that's friendly to TS typings across versions
// Using require is recommended by @rnmapbox/maps docs for RN to avoid bundling mismatch
const RNMapbox = require('@rnmapbox/maps');
const Mapbox: any = RNMapbox?.default ?? RNMapbox;
const MapView: any = RNMapbox?.MapView ?? Mapbox?.MapView;
const Camera: any = RNMapbox?.Camera ?? Mapbox?.Camera;
const ShapeSource: any = RNMapbox?.ShapeSource ?? Mapbox?.ShapeSource;
const SymbolLayer: any = RNMapbox?.SymbolLayer ?? Mapbox?.SymbolLayer;
const CircleLayer: any = RNMapbox?.CircleLayer ?? Mapbox?.CircleLayer;

Mapbox?.setAccessToken?.(''); // Using MapLibre-compatible style without token if self-hosted; token optional

export default function MapNative({ points, onPickLocation, picking }: MapProps) {
  const cameraRef = useRef<any>(null);
  // Convert points to GeoJSON
  const fc = useMemo(() => {
    const features = points.map((p, i) => ({
      type: 'Feature' as const,
      id: i,
      properties: {
        title: p.title ?? `Spot #${i + 1}`,
        description: p.description ?? ''
      },
      geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] }
    }));
    return { type: 'FeatureCollection' as const, features };
  }, [points]);

  return (
    <View style={styles.container}>
      <MapView styleURL="https://demotiles.maplibre.org/style.json" style={styles.map}>
        <Camera ref={cameraRef} zoomLevel={5} centerCoordinate={[2.21, 46.22]} />
        {/* world cities overlay removed */}
        <ShapeSource
          id="spots"
          shape={fc as any}
          cluster
          clusterRadius={50}
          clusterMaxZoom={14}
          onPress={(e: any) => {
            const { features } = e;
            const f = features && features[0];
            if (!f) return;
            if (picking && onPickLocation) {
              const coords = (f.geometry as any).coordinates;
              onPickLocation({ lon: coords[0], lat: coords[1] });
              return;
            }
            const isCluster = !!(f.properties && f.properties.cluster);
            if (isCluster) {
              // try to zoom in on cluster
              const coords = (f.geometry as any).coordinates;
              // No getClusterExpansionZoom API; approximate by zooming in and centering
              cameraRef.current?.setCamera?.({ centerCoordinate: coords, zoom: 7, duration: 300 });
            } else {
              const props = f.properties || {};
              const title = props.title || 'Spot';
              const descBase = props.description || '';
              const imageLine = props.imageUrl ? `\n[Image] ${props.imageUrl}` : '';
              const descPonton = props.type === 'ponton'
                ? `\nHauteur: ${props.heightCm ?? '-'} cm — Longueur: ${props.lengthM ?? '-'} m\nAccès: ${props.access ?? '-'}`
                : '';
              const desc = `${descBase}${descPonton}${imageLine}`;
              const isAssoc = props.type === 'association';
              const actions: { text: string; onPress: () => void }[] = [];
              if (isAssoc && props.url) {
                actions.push({ text: 'Site (external)', onPress: () => Linking.openURL(String(props.url)) });
              }
              if (props.type === 'ponton') {
                const lat = (f.geometry as any).coordinates[1];
                const lon = (f.geometry as any).coordinates[0];
                const dest = `${lat},${lon}`;
                const gmaps = Platform.select({ default: `https://www.google.com/maps/dir/?api=1&destination=${dest}` });
                const apple = `http://maps.apple.com/?daddr=${dest}`;
                const android = `google.navigation:q=${dest}`;
                const navUrl = Platform.select({ ios: apple, android, default: gmaps });
                actions.push({ text: 'Y aller', onPress: () => Linking.openURL(String(navUrl)) });
              }
              if (props.address) {
                const query = encodeURIComponent(String(props.address));
                const mapsUrl = Platform.select({ ios: `http://maps.apple.com/?q=${query}`, android: `geo:0,0?q=${query}`, default: `https://www.google.com/maps/search/?api=1&query=${query}` });
                actions.push({ text: 'Ouvrir le lieu', onPress: () => Linking.openURL(String(mapsUrl)) });
              }
              actions.push({ text: 'Fermer', onPress: () => {} });
              Alert.alert(title, desc, actions, { cancelable: true });
            }
          }}
        >
          {/* Clustered circles */}
          <CircleLayer
            id="clusters"
            filter={["has", "point_count"]}
            style={{
              circleColor: [
                'step',
                ['get', 'point_count'],
                '#91c9ff',
                20,
                '#52a5ff',
                50,
                '#1e90ff'
              ],
              circleRadius: [
                'step',
                ['get', 'point_count'],
                14,
                20,
                18,
                50,
                22
              ],
              circleStrokeColor: '#ffffff',
              circleStrokeWidth: 1.5
            }}
          />

          {/* Cluster count labels */}
          <SymbolLayer
            id="cluster-count"
            filter={["has", "point_count"]}
            style={{
              textField: ['get', 'point_count'],
              textSize: 12,
              textColor: '#0a3b6b'
            }}
          />

          {/* Unclustered single points */}
          <CircleLayer
            id="unclustered-point"
            filter={["!", ["has", "point_count"]]}
            style={{
              circleColor: [
                'case',
                ['==', ['get', 'type'], 'ponton'], '#1e90ff',
                ['==', ['get', 'type'], 'association'], '#2ecc71',
                '#1e90ff'
              ],
              circleRadius: 6,
              circleStrokeColor: '#ffffff',
              circleStrokeWidth: 1.5
            }}
          />
          <SymbolLayer
            id="unclustered-label"
            filter={["!", ["has", "point_count"]]}
            style={{
              textField: [
                'case',
                ['==', ['get', 'type'], 'ponton'], 'P',
                ['==', ['get', 'type'], 'association'], 'A',
                ''
              ],
              textSize: 11,
              textColor: '#ffffff',
              textHaloColor: '#000000',
              textHaloWidth: 0.8,
              textAllowOverlap: true
            }}
          />
        </ShapeSource>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 }
});
