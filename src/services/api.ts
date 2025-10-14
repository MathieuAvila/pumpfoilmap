type FetchSpotsParams = { bbox?: string; limit?: number };

function getBaseUrl() {
  // Expo native/web: EXPO_PUBLIC_API_BASE_URL
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined;
  return envUrl || 'http://localhost:3000';
}

export async function fetchSpots(params: FetchSpotsParams = {}) {
  const base = getBaseUrl();
  const qs = new URLSearchParams();
  if (params.bbox) qs.set('bbox', params.bbox);
  if (params.limit) qs.set('limit', String(params.limit));
  const url = `${base}/spots${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { items: any[]; count: number };
}

export type SubmitSpotInput =
  | {
      type: 'ponton';
      name: string;
      lat: number;
      lng: number;
      submittedBy: string;
      heightM: number;
      lengthM: number;
      access: 'autorise' | 'tolere';
      address: string;
      description?: string;
      imageUrl?: string;
      contactEmail?: string;
    }
  | {
      type: 'association';
      name: string;
      lat: number;
      lng: number;
      submittedBy: string;
      url?: string;
      website?: string;
      description?: string;
      imageUrl?: string;
      contactEmail?: string;
    };

export async function submitSpot(input: SubmitSpotInput) {
  const base = getBaseUrl();
  const res = await fetch(`${base}/spots/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Submit failed (${res.status}): ${txt}`);
  }
  return (await res.json()) as { spotId: string; status: string; createdAt: string };
}
