import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { MapProps } from './index';

// Load @rnmapbox/maps in a way that's friendly to TS typings across versions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RNMapbox = require('@rnmapbox/maps');
const Mapbox: any = RNMapbox?.default ?? RNMapbox;
const MapView: any = RNMapbox?.MapView ?? Mapbox?.MapView;
const Camera: any = RNMapbox?.Camera ?? Mapbox?.Camera;
const ShapeSource: any = RNMapbox?.ShapeSource ?? Mapbox?.ShapeSource;
const HeatmapLayer: any = RNMapbox?.HeatmapLayer ?? Mapbox?.HeatmapLayer;

Mapbox?.setAccessToken?.(''); // Using MapLibre-compatible style without token if self-hosted; token optional

export default function MapNative({ points }: MapProps) {
  // Convert points to GeoJSON
  const features = points.map((p, i) => ({
    type: 'Feature' as const,
    id: i,
    properties: { weight: p.weight ?? 1 },
    geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] }
  }));

  const fc = { type: 'FeatureCollection' as const, features };

  // Optional: Mapbox telemetry config could go here if available in current SDK

  return (
    <View style={styles.container}>
      <MapView styleURL="https://demotiles.maplibre.org/style.json">
        <>
          <Camera zoomLevel={5} centerCoordinate={[2.21, 46.22]} />
          <ShapeSource id="spots" shape={fc}>
            <HeatmapLayer id="heat" sourceID="spots" style={{
            heatmapColor: [
              'interpolate', ['linear'], ['heatmapDensity'],
              0, 'rgba(0,0,255,0)',
              0.2, 'rgba(65,105,225,0.6)',
              0.4, 'rgba(0,191,255,0.7)',
              0.6, 'rgba(0,255,127,0.8)',
              0.8, 'rgba(255,215,0,0.9)',
              1, 'rgba(255,69,0,1)'
            ],
            heatmapIntensity: 1.2,
            heatmapRadius: 20,
            heatmapWeight: ['get', 'weight']
            }} />
          </ShapeSource>
        </>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
