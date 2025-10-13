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
