import React, { useEffect, useState } from 'react';
import { View, Text, Platform, ActivityIndicator } from 'react-native';
import Map from './components/Map';
import sampleData from './data/sample-spots.json';
import { fetchSpots } from './services/api';
import type { HeatPoint } from './components/Map';

export default function App() {
  const [points, setPoints] = useState<HeatPoint[]>(sampleData.points as unknown as HeatPoint[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchSpots({ limit: 500 })
      .then((data) => {
        if (!mounted) return;
        const pts = data.items
          .filter((s: any) => typeof s.lat === 'number' && typeof s.lng === 'number')
          .map((s: any) => ({
            lat: s.lat,
            lon: s.lng,
            weight: 1,
            title: s.name ?? `Spot` ,
            description: s.description ?? '',
            type: s.type as 'ponton' | 'association' | undefined,
            url: s.url || s.website,
            address: s.address,
            submittedBy: s.submittedBy,
            createdAt: s.createdAt,
            heightM: s.heightM,
            lengthM: s.lengthM,
            access: s.access,
            imageUrl: s.imageUrl
          }));
        if (pts.length) setPoints(pts);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);


  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12, backgroundColor: '#0b3d91' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
          PumpfoilMap — Spots ({Platform.OS})
        </Text>
        <View style={{ height: 8 }} />
      </View>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: '#666' }}>Chargement des spots…</Text>
        </View>
      ) : (
        <Map points={points} />
      )}
      {!!error && (
        <View style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: 'tomato' }}>{error}</Text>
        </View>
      )}
    </View>
  );
}
