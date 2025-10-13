import React, { useEffect } from 'react';
import Mapbox, { MapView, Camera, ShapeSource, HeatmapLayer } from '@rnmapbox/maps';
import { View, StyleSheet } from 'react-native';
import type { MapProps } from './index';

Mapbox.setAccessToken(''); // Using MapLibre-compatible style without token if self-hosted; token optional

export default function MapNative({ points }: MapProps) {
  // Convert points to GeoJSON
  const features = points.map((p, i) => ({
    type: 'Feature' as const,
    id: i,
    properties: { weight: p.weight ?? 1 },
    geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] }
  }));

  const fc = { type: 'FeatureCollection' as const, features };

  useEffect(() => {
    // Optional: configure telemetry, etc.
    Mapbox.setTelemetryEnabled(false);
  }, []);

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFillObject} styleURL="https://demotiles.maplibre.org/style.json">
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
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
