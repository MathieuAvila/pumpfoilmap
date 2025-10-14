import React, { useEffect, useState } from 'react';
import { View, Text, Platform, ActivityIndicator, TextInput, Pressable, ScrollView } from 'react-native';
import Map from './components/Map';
import sampleData from './data/sample-spots.json';
import { fetchSpots, submitSpot, type SubmitSpotInput } from './services/api';
import type { HeatPoint } from './components/Map';

export default function App() {
  const [points, setPoints] = useState<HeatPoint[]>(sampleData.points as unknown as HeatPoint[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    type: 'ponton',
    name: '',
    lat: '',
    lng: '',
    submittedBy: '',
    heightM: '',
    lengthM: '',
    access: 'autorise',
    address: '',
    description: '',
    imageUrl: '',
    contactEmail: ''
  });

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
      {showForm ? (
        <ScrollView style={{ flex: 1, padding: 12 }} contentContainerStyle={{ paddingBottom: 60 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Soumettre un spot</Text>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {(['ponton', 'association'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setForm((f: any) => ({ ...f, type: t }))}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  backgroundColor: form.type === t ? '#0b3d91' : '#ddd',
                  marginRight: 8,
                  borderRadius: 4
                }}
              >
                <Text style={{ color: form.type === t ? 'white' : '#333' }}>{t}</Text>
              </Pressable>
            ))}
          </View>
          {[
            ['Nom', 'name'],
          // lat/lon now selected on map
            ['Soumis par', 'submittedBy'],
            form.type === 'ponton' && ['Hauteur (m)', 'heightM'],
            form.type === 'ponton' && ['Longueur (m)', 'lengthM'],
            form.type === 'ponton' && ['Adresse', 'address'],
            ['Description', 'description'],
            ['Image URL', 'imageUrl'],
            ['Email (facultatif)', 'contactEmail'],
            form.type === 'association' && ['Site (url)', 'url']
          ].filter(Boolean).map((row: any) => {
            const [label, key] = row;
            return (
              <View key={key} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{label}</Text>
                <TextInput
                  value={form[key]}
                  onChangeText={(v) => setForm((f: any) => ({ ...f, [key]: v }))}
                  style={{ borderWidth: 1, borderColor: '#bbb', borderRadius: 4, padding: 8 }}
                  placeholder={label}
                  autoCapitalize="none"
                />
              </View>
            );
          })}
          {form.type === 'ponton' && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Accès</Text>
              <View style={{ flexDirection: 'row' }}>
                {(['autorise', 'tolere'] as const).map((a) => (
                  <Pressable
                    key={a}
                    onPress={() => setForm((f: any) => ({ ...f, access: a }))}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      backgroundColor: form.access === a ? '#0b3d91' : '#ddd',
                      marginRight: 8,
                      borderRadius: 4
                    }}
                  >
                    <Text style={{ color: form.access === a ? 'white' : '#333' }}>{a}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <Pressable
            disabled={submitting}
            onPress={async () => {
              setSubmitMessage(null);
              setSubmitting(true);
              try {
                // Build payload
                const base: any = {
                  type: form.type,
                  name: form.name,
                  lat: Number(form.lat),
                  lng: Number(form.lng),
                  submittedBy: form.submittedBy,
                  description: form.description || undefined,
                  imageUrl: form.imageUrl || undefined,
                  contactEmail: form.contactEmail || undefined
                };
                let payload: SubmitSpotInput;
                if (form.type === 'ponton') {
                  payload = {
                    ...base,
                    type: 'ponton',
                    heightM: Number(form.heightM),
                    lengthM: Number(form.lengthM),
                    access: form.access,
                    address: form.address
                  } as any;
                } else {
                  payload = {
                    ...base,
                    type: 'association',
                    url: form.url || undefined
                  } as any;
                }
                await submitSpot(payload);
                setSubmitMessage('✅ Spot soumis. En attente de modération.');
                setForm((f: any) => ({ ...f, name: '', description: '' }));
              } catch (e: any) {
                setSubmitMessage('Erreur: ' + e.message);
              } finally {
                setSubmitting(false);
              }
            }}
            style={{ backgroundColor: '#0b3d91', padding: 12, borderRadius: 6, opacity: submitting ? 0.6 : 1 }}
          >
            <Text style={{ textAlign: 'center', color: 'white', fontWeight: '600' }}>
              {submitting ? 'Envoi…' : 'Soumettre'}
            </Text>
          </Pressable>
          {submitMessage && (
            <Text style={{ marginTop: 12, color: submitMessage.startsWith('✅') ? 'green' : 'tomato' }}>
              {submitMessage}
            </Text>
          )}
          <Pressable onPress={() => setShowForm(false)} style={{ marginTop: 24 }}>
            <Text style={{ color: '#0b3d91', textAlign: 'center' }}>← Retour à la carte</Text>
          </Pressable>
          <View style={{ marginTop: 16, padding: 8, backgroundColor: '#eef', borderRadius: 4 }}>
            <Text style={{ fontSize: 12, color: '#333' }}>
              Sélection des coordonnées: utilisez le bouton "Choisir sur la carte" puis cliquez/tapez sur la carte. Les valeurs seront remplies automatiquement.
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <Pressable
                onPress={() => setForm((f: any) => ({ ...f, picking: !f.picking }))}
                style={{ backgroundColor: form.picking ? '#d9534f' : '#0b3d91', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginRight: 12 }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {form.picking ? 'Terminer sélection' : 'Choisir sur la carte'}
                </Text>
              </Pressable>
              <Text style={{ alignSelf: 'center', color: '#555' }}>
                {form.lat && form.lng ? `Lat: ${form.lat}  Lon: ${form.lng}` : 'Aucune coordonnée choisie'}
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: '#666' }}>Chargement des spots…</Text>
        </View>
      ) : (
        <Map
          points={points}
          picking={!!form.picking && showForm}
          onPickLocation={(c: { lat: number; lon: number }) => setForm((f: any) => ({ ...f, lat: c.lat.toFixed(5), lng: c.lon.toFixed(5), picking: false }))}
        />
      )}
      {(!showForm && !loading) && (
        <View style={{ position: 'absolute', top: 12, right: 12 }}>
          <Pressable
            onPress={() => setShowForm(true)}
            style={{ backgroundColor: '#0b3d91', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>+ Spot</Text>
          </Pressable>
        </View>
      )}
      {!!error && !showForm && (
        <View style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: 'tomato' }}>{error}</Text>
        </View>
      )}
    </View>
  );
}
