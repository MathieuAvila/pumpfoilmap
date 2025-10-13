import React from 'react';
import { View, Text, Platform } from 'react-native';
import Map from './components/Map';
import sampleData from './data/sample-spots.json';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12, backgroundColor: '#0b3d91' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
          PumpfoilMap — Heatmap des spots ({Platform.OS})
        </Text>
      </View>
      <Map points={sampleData.points} />
    </View>
  );
}
